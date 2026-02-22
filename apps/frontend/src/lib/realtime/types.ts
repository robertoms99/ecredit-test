/**
 * WebSocket Client Abstraction
 * 
 * This module provides a unified interface for real-time communication
 * that can use either Socket.IO (Bun backend) or Phoenix Channels (Elixir backend).
 * 
 * The implementation is selected based on the VITE_REALTIME_PROVIDER environment variable:
 * - "socketio" (default): Uses Socket.IO client
 * - "phoenix": Uses Phoenix Channels client
 */

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export type EventCallback<T = unknown> = (data: T) => void;

export interface RealtimeClientConfig {
  /** WebSocket server URL */
  url: string;
  /** JWT token for authentication (required for Phoenix) */
  token?: string;
  /** Reconnection settings */
  reconnect?: {
    enabled: boolean;
    maxAttempts?: number;
    delay?: number;
  };
}

/**
 * Abstract interface for real-time clients.
 * Both Socket.IO and Phoenix implementations must conform to this interface.
 */
export interface RealtimeClient {
  /** Current connection state */
  readonly state: ConnectionState;

  /**
   * Connect to the WebSocket server.
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect(): void;

  /**
   * Subscribe to an event/topic.
   * @param event - Event name to listen for
   * @param callback - Callback function when event is received
   * @returns Unsubscribe function
   */
  on<T = unknown>(event: string, callback: EventCallback<T>): () => void;

  /**
   * Unsubscribe from an event/topic.
   * @param event - Event name to stop listening
   * @param callback - Optional specific callback to remove
   */
  off(event: string, callback?: EventCallback): void;

  /**
   * Listen for connection state changes.
   * @param callback - Callback when state changes
   * @returns Unsubscribe function
   */
  onStateChange(callback: (state: ConnectionState) => void): () => void;

  /**
   * Join a channel/room (for scoped subscriptions).
   * @param channel - Channel name (e.g., "credit_requests:lobby")
   */
  join(channel: string): Promise<void>;

  /**
   * Leave a channel/room.
   * @param channel - Channel name
   */
  leave(channel: string): void;
}

/**
 * Events emitted by the credit request system.
 * These are the same for both Socket.IO and Phoenix implementations.
 */
export const REALTIME_EVENTS = {
  /** Credit request status was updated */
  CREDIT_REQUEST_UPDATED: 'credit-request-updated',
  /** Connection established */
  CONNECTED: 'connected',
  /** Connection lost */
  DISCONNECTED: 'disconnected',
  /** Connection error */
  ERROR: 'error',
} as const;

export type RealtimeEvent = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];
