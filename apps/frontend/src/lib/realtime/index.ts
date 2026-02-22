/**
 * Realtime Client Factory
 *
 * Creates the appropriate realtime client based on the VITE_REALTIME_PROVIDER
 * environment variable.
 */

export * from './types';
export { SocketIOClient } from './socketio-client';
export { PhoenixClient } from './phoenix-client';

import type { RealtimeClient, RealtimeClientConfig } from './types';
import { SocketIOClient } from './socketio-client';
import { PhoenixClient } from './phoenix-client';

export type RealtimeProvider = 'socketio' | 'phoenix';

/**
 * Get the configured realtime provider from environment variables.
 * Defaults to 'socketio' if not specified.
 */
export function getRealtimeProvider(): RealtimeProvider {
  const provider = import.meta.env.VITE_REALTIME_PROVIDER as string | undefined;

  if (provider === 'phoenix') {
    return 'phoenix';
  }

  return 'socketio';
}

/**
 * Create a realtime client based on the configured provider.
 *
 * @param config - Client configuration
 * @param provider - Optional provider override (defaults to env variable)
 * @returns RealtimeClient instance
 *
 * @example
 * ```ts
 * // Uses VITE_REALTIME_PROVIDER environment variable
 * const client = createRealtimeClient({ url: 'http://localhost:3000' });
 *
 * // Or explicitly specify the provider
 * const socketClient = createRealtimeClient({ url: 'http://localhost:3000' }, 'socketio');
 * const phoenixClient = createRealtimeClient({ url: 'http://localhost:3000' }, 'phoenix');
 * ```
 */
export function createRealtimeClient(
  config: RealtimeClientConfig,
  provider?: RealtimeProvider
): RealtimeClient {
  const selectedProvider = provider ?? getRealtimeProvider();

  console.log(`📡 Creating ${selectedProvider} realtime client`);

  switch (selectedProvider) {
    case 'phoenix':
      return new PhoenixClient(config);
    case 'socketio':
    default:
      return new SocketIOClient(config);
  }
}

/**
 * Get the API URL based on the configured provider.
 *
 * For Phoenix, defaults to port 3000.
 * For Socket.IO (Bun), defaults to port 3000 or window.location.origin.
 */
export function getRealtimeApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;

  if (envUrl) {
    return envUrl;
  }

  const provider = getRealtimeProvider();

  if (provider === 'phoenix') {
    // Default Phoenix port
    return typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : 'http://localhost:3000';
  }

  // Default Socket.IO/Bun backend
  return typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:3000';
}
