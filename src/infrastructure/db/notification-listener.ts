import { Client } from 'pg';
import type { IJobManager } from '../../domain/ports/jobs';
import type { RequestStatusCodes } from '../../domain/entities';

interface CreditRequestStatusChangePayload {
  credit_request_id: string;
  request_status_id: string;
  request_status_code: RequestStatusCodes;
}

export class DatabaseNotificationListener {
  private client: Client;
  private isListening: boolean = false;

  constructor(
    private readonly connectionString: string,
    private readonly jobManager: IJobManager
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

      await this.client.query('LISTEN credit_request_status_change');
      console.log('[DB Listener] Listening to credit_request_status_change channel');

      this.client.on('notification', async (msg) => {
        if (msg.channel === 'credit_request_status_change' && msg.payload) {
          try {
            const payload: CreditRequestStatusChangePayload = JSON.parse(msg.payload);

            console.log(
              `[DB Listener] Received notification: credit_request_id=${payload.credit_request_id}, status=${payload.request_status_code}`
            );

            await this.jobManager.emit('credit_request_status_change', payload);

            console.log(
              `[DB Listener] Emitted job for credit request ${payload.credit_request_id}`
            );
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
      await this.client.query('UNLISTEN credit_request_status_change');
      await this.client.end();
      this.isListening = false;
      console.log('[DB Listener] Stopped listening to database notifications');
    } catch (error: any) {
      console.error('[DB Listener] Error stopping listener:', error.message);
    }
  }
}
