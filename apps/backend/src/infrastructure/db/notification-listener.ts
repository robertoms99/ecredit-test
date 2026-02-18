import { Client } from 'pg';
import type { IJobManager } from '../../domain/ports/jobs';
import type { RequestStatusCodes } from '../../domain/entities';
import type { WebSocketServer } from '../websocket/websocket-server';

interface StatusTransitionPayload {
  credit_request_id: string;
  status_transition_id: string;
  from_status_id: string;
  to_status_id: string;
  status_code: RequestStatusCodes;
  status_name: string;
  reason: string | null;
  changed_by_user_id: string;
  created_at: string;
}

export class DatabaseNotificationListener {
  private client: Client;
  private isListening: boolean = false;

  constructor(
    private readonly connectionString: string,
    private readonly jobManager: IJobManager,
    private readonly wsServer?: WebSocketServer
  ) {
    this.client = new Client({ connectionString: this.connectionString });
  }

  async start(): Promise<void> {
    if (this.isListening) {
      console.log('[DB Listener] Already listening to database notifications');
      return;
    }

    try {
      await this.client.connect();
      console.log('[DB Listener] Connected to database for notifications');

      await this.client.query('LISTEN status_transition');
      console.log('[DB Listener] Listening to status_transition channel');

      this.client.on('notification', async (msg) => {
        if (msg.channel === 'status_transition' && msg.payload) {
          try {

            const payload: StatusTransitionPayload = JSON.parse(msg.payload);

            console.log(
              `[DB Listener] Received status transition: credit_request_id=${payload.credit_request_id}, status=${payload.status_code}, reason=${payload.reason || 'N/A'}`
            );

            await this.jobManager.emit('credit_request_status_change', {
              credit_request_id: payload.credit_request_id,
              request_status_id: payload.to_status_id,
              request_status_code: payload.status_code,
              request_status_name: payload.status_name,
              updated_at: payload.created_at
            });

            console.log(
              `[DB Listener] Emitted job for credit request ${payload.credit_request_id}`
            );

            if (this.wsServer) {
              this.wsServer.emitCreditRequestUpdate({
                creditRequestId: payload.credit_request_id,
                statusId: payload.to_status_id,
                statusName: payload.status_name,
                statusCode: payload.status_code,
                updatedAt: payload.created_at,
                reason: payload.reason,
                statusTransitionId: payload.status_transition_id,
                fromStatusId: payload.from_status_id
              });
              console.log(
                `[DB Listener] Emitted WebSocket event for credit request ${payload.credit_request_id}`
              );
            }
          } catch (error: any) {
            console.error('[DB Listener] Error processing notification:', error.message);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('[DB Listener] Database connection error:', err.message);
      });

      this.client.on('end', () => {
        console.log('[DB Listener] Database connection closed');
        this.isListening = false;
      });

      this.isListening = true;
    } catch (error: any) {
      console.error('[DB Listener] Failed to start listener:', error.message);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      await this.client.query('UNLISTEN status_transition');
      await this.client.end();
      this.isListening = false;
      console.log('[DB Listener] Stopped listening to database notifications');
    } catch (error: any) {
      console.error('[DB Listener] Error stopping listener:', error.message);
    }
  }
}
