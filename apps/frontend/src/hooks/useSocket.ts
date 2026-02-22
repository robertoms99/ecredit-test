import { useEffect, useState, useRef, useCallback } from 'react';
import { CreditRequestUpdateEvent } from '../types';
import {
  createRealtimeClient,
  getRealtimeApiUrl,
  type RealtimeClient,
  type ConnectionState,
  REALTIME_EVENTS
} from '../lib/realtime';
import { useAuth } from './useAuth';

/**
 * Hook for managing the realtime connection.
 *
 * Automatically selects Socket.IO or Phoenix Channels based on the
 * VITE_REALTIME_PROVIDER environment variable.
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const clientRef = useRef<RealtimeClient | null>(null);
  const {token } = useAuth()

  useEffect(() => {
    const apiUrl = getRealtimeApiUrl();
    console.log(`🔌 Connecting to realtime server at: ${apiUrl}`);

    const client = createRealtimeClient({
      url: apiUrl,
      token,
      reconnect: {
        enabled: true,
        maxAttempts: 5,
        delay: 1000,
      },
    });

    clientRef.current = client;

    // Subscribe to state changes
    const unsubscribeState = client.onStateChange((state) => {
      setConnectionState(state);
      setIsConnected(state === 'connected');
    });

    // Connect to the server
    client.connect().catch((error) => {
      console.error('Failed to connect to realtime server:', error);
    });

    return () => {
      unsubscribeState();
      client.disconnect();
      clientRef.current = null;
    };
  }, []);

  return {
    client: clientRef.current,
    isConnected,
    connectionState,
  };
}

/**
 * Hook for subscribing to credit request updates.
 *
 * Works with both Socket.IO and Phoenix Channels backends.
 *
 * @param onUpdate - Callback function when a credit request is updated
 */
export function useCreditRequestUpdates(
  onUpdate: (event: CreditRequestUpdateEvent) => void
) {
  const { client, isConnected, connectionState } = useSocket();

  // Memoize the callback to prevent unnecessary re-subscriptions
  const stableOnUpdate = useCallback(onUpdate, [onUpdate]);

  useEffect(() => {
    if (!client) return;

    const unsubscribe = client.on<CreditRequestUpdateEvent>(
      REALTIME_EVENTS.CREDIT_REQUEST_UPDATED,
      stableOnUpdate
    );

    return () => {
      unsubscribe();
    };
  }, [client, stableOnUpdate]);

  return { isConnected, connectionState };
}

/**
 * Hook for joining a specific channel/room.
 *
 * For Phoenix, this joins a channel. For Socket.IO, this is a no-op
 * (Socket.IO handles rooms server-side).
 *
 * @param channelName - Name of the channel to join
 */
export function useChannel(channelName: string) {
  const { client, isConnected, connectionState } = useSocket();
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!client || !isConnected) {
      setJoined(false);
      return;
    }

    client.join(channelName)
      .then(() => setJoined(true))
      .catch((error) => {
        console.error(`Failed to join channel ${channelName}:`, error);
        setJoined(false);
      });

    return () => {
      client.leave(channelName);
      setJoined(false);
    };
  }, [client, isConnected, channelName]);

  return { joined, isConnected, connectionState };
}
