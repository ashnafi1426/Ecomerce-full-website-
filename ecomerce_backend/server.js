/**
 * SERVER ENTRY POINT
 * 
 * This file starts the Express server, handles graceful shutdown,
 * and manages unhandled errors.
 */

require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/supabase');
const net = require('net');

// Port availability checking function
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, (err) => {
      if (err) {
        server.close();
        resolve(false);
      } else {
        server.close(() => resolve(true));
      }
    });
    server.on('error', () => resolve(false));
  });
}

// Port fallback strategy: PORT env → 4000 → 3000 → 8000 → random available
async function findAvailablePort() {
  const preferredPort = process.env.PORT ? parseInt(process.env.PORT) : 4000;
  const fallbackPorts = [preferredPort, 4000, 3000, 8000];
  
  console.log(`🔍 Checking port availability, preferred: ${preferredPort}`);
  
  // Try preferred and fallback ports
  for (const port of fallbackPorts) {
    if (await isPortAvailable(port)) {
      console.log(`✅ Port ${port} is available`);
      return port;
    } else {
      console.log(`❌ Port ${port} is not available`);
    }
  }
  
  // Find random available port
  for (let i = 8001; i < 9000; i++) {
    if (await isPortAvailable(i)) {
      console.log(`✅ Found available port: ${i}`);
      return i;
    }
  }
  
  throw new Error('No available ports found');
}

let PORT;

// ============================================
// DATABASE CONNECTION TEST
// ============================================

// Test Supabase connection before starting server
testConnection()
  .then((connected) => {
    if (!connected && process.env.NODE_ENV === 'production') {
      console.error('❌ Cannot start server without database connection in production');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Database connection test failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// ============================================
// START SERVER
// ============================================

async function startServer() {
  try {
    // Find available port
    PORT = await findAvailablePort();
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`💚 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`🗄️  Database: Supabase`);
      console.log('='.repeat(60));
    });

    // ============================================
    // SOCKET.IO INITIALIZATION
    // ============================================

    const { initializeSocketServer } = require('./socket/socket.config');
    const { initializeChatHandlers } = require('./socket/chat.handler');

    // Initialize Socket.IO server
    const io = initializeSocketServer(server);

    // Initialize chat event handlers
    initializeChatHandlers(io);

    console.log('💬 Socket.IO chat system initialized');

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    
    if (error.code === 'EACCES') {
      console.error('💡 Port permission denied. Try running with different port or as administrator.');
      console.error('💡 You can set PORT environment variable to use a different port.');
    } else if (error.code === 'EADDRINUSE') {
      console.error('💡 Port is already in use. The server will try alternative ports automatically.');
    }
    
    process.exit(1);
  }
}

// Start server with error handling
startServer().then((server) => {
  // ============================================
  // GRACEFUL SHUTDOWN
  // ============================================

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
    // Close server & exit process
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('⚠️  Uncaught Exception:', error);
    // Close server & exit process
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(1);
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('⚠️  SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('⚠️  SIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });
}).catch((error) => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});
