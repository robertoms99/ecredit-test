import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { CreditRequestUpdateEvent } from '../types';

// Use environment variable for Socket.IO URL
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log(`🔌 Connecting to Socket.IO server at: ${SOCKET_URL}`);
    
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket.IO connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
}

export function useCreditRequestUpdates(
  onUpdate: (event: CreditRequestUpdateEvent) => void
) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('credit-request-updated', onUpdate);

    return () => {
      socket.off('credit-request-updated', onUpdate);
    };
  }, [socket, onUpdate]);

  return { isConnected };
}
