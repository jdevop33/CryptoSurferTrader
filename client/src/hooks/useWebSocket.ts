import { useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
      
      // Implement exponential backoff for reconnection
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
        setTimeout(() => {
          reconnectAttemptsRef.current++;
          newSocket.connect();
        }, delay);
      }
    });

    newSocket.on('subscription_confirmed', (data) => {
      console.log('Subscription confirmed for user:', data.userId);
    });

    newSocket.on('portfolio_update', (data) => {
      console.log('Portfolio update received:', data);
      // Trigger React Query cache invalidation
      window.dispatchEvent(new CustomEvent('portfolio_update', { detail: data }));
    });

    newSocket.on('position_update', (data) => {
      console.log('Position update received:', data);
      // Trigger React Query cache invalidation
      window.dispatchEvent(new CustomEvent('position_update', { detail: data }));
    });

    newSocket.on('sentiment_update', (data) => {
      console.log('Sentiment update received:', data);
      // Trigger React Query cache invalidation
      window.dispatchEvent(new CustomEvent('sentiment_update', { detail: data }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, isConnected };
}
