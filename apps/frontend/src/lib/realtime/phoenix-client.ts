/**
 * Phoenix Channels Client Adapter
 *
 * Implements the RealtimeClient interface using Phoenix Channels.
 * Used when connecting to the Elixir/Phoenix backend.
 */

import { Socket, Channel } from 'phoenix';
import type {
  RealtimeClient,
  RealtimeClientConfig,
  ConnectionState,
  EventCallback
} from './types';

export class PhoenixClient implements RealtimeClient {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();
  private config: RealtimeClientConfig;
  private _state: ConnectionState = 'disconnected';
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private defaultChannel: Channel | null = null;

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
      if (this.socket?.isConnected()) {
        resolve();
        return;
      }

      this.setState('connecting');

      // Phoenix expects WebSocket URL (ws:// or wss://)
      // Convert http(s) URL to ws(s) if needed
      let wsUrl = this.config.url;
      if (wsUrl.startsWith('http://')) {
        wsUrl = wsUrl.replace('http://', 'ws://');
      } else if (wsUrl.startsWith('https://')) {
        wsUrl = wsUrl.replace('https://', 'wss://');
      }

      // Ensure we're connecting to the /socket endpoint
      if (!wsUrl.endsWith('/ws')) {
        wsUrl = `${wsUrl}/ws`;
      }

      this.socket = new Socket(wsUrl, {
        params: this.config.token ? { token: this.config.token } : {},
        reconnectAfterMs: (tries: number) => {
          // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
          const delay = this.config.reconnect?.delay ?? 1000;
          return Math.min(delay * Math.pow(2, tries - 1), 10000);
        },
      });

      this.socket.onOpen(() => {
        console.log('✅ [Phoenix] Socket connected');
        this.setState('connected');
        resolve();
      });

      this.socket.onClose(() => {
        console.log('❌ [Phoenix] Socket disconnected');
        this.setState('disconnected');
      });

      this.socket.onError((error: unknown) => {
        console.error('🔴 [Phoenix] Socket error:', error);
        this.setState('error');
        reject(error);
      });

      this.socket.connect();

      // Join the default lobby channel for receiving broadcast events
      this.joinDefaultChannel();
    });
  }

  private joinDefaultChannel(): void {
    if (!this.socket) return;

    // Join the credit_requests:lobby channel by default
    // This is where broadcast events are sent
    const channel = this.socket.channel('credit_requests:lobby', {});

    channel.join()
      .receive('ok', () => {
        console.log('✅ [Phoenix] Joined credit_requests:lobby channel');
        this.defaultChannel = channel;
      })
      .receive('error', (resp: unknown) => {
        console.error('🔴 [Phoenix] Failed to join lobby:', resp);
      })
      .receive('timeout', () => {
        console.warn('⚠️ [Phoenix] Lobby join timeout, retrying...');
      });

    // Set up event forwarding from the channel
    channel.on('credit-request-updated', (payload: unknown) => {
      this.emitEvent('credit-request-updated', payload);
    });
  }

  private emitEvent(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  disconnect(): void {
    // Leave all channels
    this.channels.forEach(channel => {
      channel.leave();
    });
    this.channels.clear();

    if (this.defaultChannel) {
      this.defaultChannel.leave();
      this.defaultChannel = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.setState('disconnected');
    }

    this.eventListeners.clear();
  }

  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback as EventCallback);
    };
  }

  off(event: string, callback?: EventCallback): void {
    if (callback) {
      this.eventListeners.get(event)?.delete(callback);
    } else {
      this.eventListeners.delete(event);
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
   * Join a Phoenix channel.
   * @param channelName - Channel topic (e.g., "credit_requests:user:123")
   */
  async join(channelName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('[Phoenix] Cannot join channel: socket not connected'));
        return;
      }

      if (this.channels.has(channelName)) {
        // Already joined
        resolve();
        return;
      }

      const channel = this.socket.channel(channelName, {});

      channel.join()
        .receive('ok', () => {
          console.log(`✅ [Phoenix] Joined channel: ${channelName}`);
          this.channels.set(channelName, channel);

          // Set up event listener for credit request updates on this channel
          channel.on('credit-request-updated', (payload: unknown) => {
            this.emitEvent('credit-request-updated', payload);
          });

          resolve();
        })
        .receive('error', (resp: unknown) => {
          console.error(`🔴 [Phoenix] Failed to join ${channelName}:`, resp);
          reject(new Error(`Failed to join channel: ${JSON.stringify(resp)}`));
        })
        .receive('timeout', () => {
          console.warn(`⚠️ [Phoenix] Join timeout for ${channelName}`);
          reject(new Error('Channel join timeout'));
        });
    });
  }

  /**
   * Leave a Phoenix channel.
   * @param channelName - Channel topic
   */
  leave(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.leave();
      this.channels.delete(channelName);
      console.log(`👋 [Phoenix] Left channel: ${channelName}`);
    }
  }
}
