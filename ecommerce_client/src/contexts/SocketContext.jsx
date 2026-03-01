/**
 * SOCKET CONTEXT
 * 
 * Manages Socket.IO connection and provides socket instance to components
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!token || !user) {
      // Disconnect if socket exists
      if (socket) {
        console.log('[Socket] Disconnecting - no auth');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Environment-aware Socket.IO URL configuration
    let SOCKET_URL;
    
    // Use VITE_SOCKET_URL if available, otherwise derive from VITE_API_URL
    if (import.meta.env.VITE_SOCKET_URL) {
      SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
    } else if (import.meta.env.VITE_API_URL) {
      // Remove /api suffix from API URL to get base URL
      SOCKET_URL = import.meta.env.VITE_API_URL.replace('/api', '');
    } else {
      // Fallback for development
      SOCKET_URL = import.meta.env.MODE === 'production' 
        ? 'https://your-backend-domain.com' 
        : 'http://localhost:3000';
    }
    
    console.log('[Socket] Environment:', import.meta.env.MODE);
    console.log('[Socket] Connecting to:', SOCKET_URL);
    console.log('[Socket] Token present:', !!token);
    console.log('[Socket] User:', user?.email);
    
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      path: '/socket.io/', // Explicitly set the Socket.IO path
      transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000, // Connection timeout
      autoConnect: true,
      forceNew: false, // Don't force new connection
      upgrade: true, // Allow transport upgrade
      rememberUpgrade: true
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      console.error('[Socket] Error type:', error.type);
      console.error('[Socket] Error description:', error.description);
      setIsConnected(false);
      
      // If authentication error, might need to refresh token
      if (error.message.includes('Authentication')) {
        console.warn('[Socket] Authentication failed - token might be invalid');
      }
    });

    newSocket.on('chat:error', (data) => {
      console.error('[Socket] Chat error:', data.message);
    });

    // Handle transport errors
    newSocket.io.on('error', (error) => {
      console.error('[Socket] Transport error:', error);
    });

    // Handle reconnection attempts
    newSocket.io.on('reconnect_attempt', (attempt) => {
      console.log('[Socket] Reconnection attempt:', attempt);
    });

    newSocket.io.on('reconnect_failed', () => {
      console.error('[Socket] Reconnection failed after all attempts');
    });

    setSocket(newSocket);

    // Cleanup on unmount or token change
    return () => {
      console.log('[Socket] Cleaning up connection');
      newSocket.disconnect();
    };
  }, [token, user?.id]); // Reconnect when token or user changes

  const value = {
    socket,
    isConnected
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
