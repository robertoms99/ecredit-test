/**
 * Socket.IO Client Adapter
 * 
 * Implements the RealtimeClient interface using Socket.IO.
 * Used when connecting to the Bun/Node.js backend.
 */

import { io, Socket } from 'socket.io-client';
import type { 
  RealtimeClient, 
  RealtimeClientConfig, 
  ConnectionState, 
  EventCallback 
} from './types';

export class SocketIOClient implements RealtimeClient {
  private socket: Socket | null = null;
  private config: RealtimeClientConfig;
  private _state: ConnectionState = 'disconnected';
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();

  constructor(config: RealtimeClientConfig) {
    this.config = config;
  }

  get state(): ConnectionState {
    return this._state;
  }

  private setState(newState: ConnectionState): void {
    this._state = newState;
    this.stateListeners.forEach(listener => listener(newState));
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.setState('connecting');

      this.socket = io(this.config.url, {
        transports: ['websocket', 'polling'],
        auth: this.config.token ? { token: this.config.token } : undefined,
        reconnection: this.config.reconnect?.enabled ?? true,
        reconnectionAttempts: this.config.reconnect?.maxAttempts ?? 5,
        reconnectionDelay: this.config.reconnect?.delay ?? 1000,
      });

      this.socket.on('connect', () => {
        console.log('✅ [Socket.IO] Connected');
        this.setState('connected');
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ [Socket.IO] Disconnected:', reason);
        this.setState('disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔴 [Socket.IO] Connection error:', error.message);
        this.setState('error');
        reject(error);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 [Socket.IO] Reconnected after ${attemptNumber} attempts`);
        this.setState('connected');
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 [Socket.IO] Reconnection attempt ${attemptNumber}`);
        this.setState('connecting');
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.setState('disconnected');
    }
  }

  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.socket) {
      console.warn('[Socket.IO] Cannot subscribe: not connected');
      return () => {};
    }

    this.socket.on(event, callback as EventCallback);
    
    // Return unsubscribe function
    return () => {
      this.socket?.off(event, callback as EventCallback);
    };
  }

  off(event: string, callback?: EventCallback): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  onStateChange(callback: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(callback);
    // Immediately call with current state
    callback(this._state);
    
    return () => {
      this.stateListeners.delete(callback);
    };
  }

  /**
   * Socket.IO doesn't use channels in the same way as Phoenix.
   * This is a no-op for Socket.IO compatibility.
   */
  async join(_channel: string): Promise<void> {
    // Socket.IO handles rooms server-side, client just subscribes to events
    // No action needed
    return Promise.resolve();
  }

  /**
   * Socket.IO doesn't use channels in the same way as Phoenix.
   * This is a no-op for Socket.IO compatibility.
   */
  leave(_channel: string): void {
    // No action needed for Socket.IO
  }
}
