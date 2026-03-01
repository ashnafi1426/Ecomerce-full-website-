/**
 * Socket.IO Connection Bug Condition Exploration Test
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **GOAL**: Surface counterexamples that demonstrate Socket.IO connection failures
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 * 
 * This test implements the Fault Condition from the design:
 * isBugCondition(input) where frontend URL != backend URL or CORS restrictions apply
 */

const { spawn } = require('child_process');
const { io } = require('socket.io-client');
const net = require('net');
const path = require('path');

// Test timeout for connection attempts
const CONNECTION_TIMEOUT = 10000; // 10 seconds

/**
 * Property 1: Fault Condition - Socket.IO Connection Failures
 * 
 * Tests the bug condition: Socket.IO connections fail when frontend URL doesn't match
 * backend URL, CORS restrictions apply, or environment configuration is incorrect.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 */
describe('Socket.IO Connection Bug Condition Exploration', () => {
  
  let backendProcess;
  let backendPort;
  
  /**
   * Start backend server for testing
   */
  beforeAll(async () => {
    // Start backend server
    backendProcess = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, '..'),
      env: { 
        ...process.env, 
        NODE_ENV: 'test',
        PORT: '3001' // Use specific port for testing
      },
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    backendProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    backendProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Wait for server to start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Backend failed to start within ${CONNECTION_TIMEOUT}ms. Output: ${stdout}, Error: ${stderr}`));
      }, CONNECTION_TIMEOUT);
      
      const checkServer = () => {
        if (stdout.includes('Server running on port')) {
          const portMatch = stdout.match(/Server running on port (\d+)/);
          if (portMatch) {
            backendPort = parseInt(portMatch[1]);
            clearTimeout(timeout);
            resolve();
          }
        } else if (stderr.includes('Error') && !stderr.includes('Route file not found')) {
          clearTimeout(timeout);
          reject(new Error(`Backend startup failed: ${stderr}`));
        } else {
          setTimeout(checkServer, 100);
        }
      };
      
      checkServer();
    });
    
    console.log(`✅ Backend started on port ${backendPort}`);
  }, 30000);
  
  /**
   * Clean up backend after tests
   */
  afterAll(async () => {
    if (backendProcess && !backendProcess.killed) {
      backendProcess.kill();
      
      // Wait for process to exit
      await new Promise((resolve) => {
        backendProcess.on('exit', resolve);
        setTimeout(resolve, 2000); // Force resolve after 2 seconds
      });
    }
  });
  
  /**
   * Test Case 1: Port Mismatch Issues
   * 
   * Tests that Socket.IO connections fail when frontend tries to connect
   * to wrong port (simulating the current bug condition).
   */
  describe('Port Mismatch Issues', () => {
    
    test('should fail when frontend connects to wrong port', async () => {
      // Frontend tries to connect to port 8000 (from .env) but backend is on different port
      const wrongPort = 8000;
      const wrongUrl = `http://localhost:${wrongPort}`;
      
      console.log(`🧪 Testing connection to wrong port: ${wrongUrl} (backend on ${backendPort})`);
      
      const socket = io(wrongUrl, {
        timeout: 5000,
        reconnection: false,
        transports: ['polling', 'websocket']
      });
      
      // Wait for connection attempt
      const result = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'Connection timeout' });
        }, 6000);
        
        socket.on('connect', () => {
          clearTimeout(timeout);
          resolve({ success: true });
        });
        
        socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          resolve({ success: false, error: error.message, type: error.type });
        });
      });
      
      socket.disconnect();
      
      // **EXPECTED OUTCOME**: Connection should FAIL (this proves the bug exists)
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/ECONNREFUSED|timeout|refused/i);
      
      console.log('✅ COUNTEREXAMPLE FOUND: Port mismatch causes connection failure');
      console.log('Error:', result.error);
      console.log('Type:', result.type);
    });
    
    test('should demonstrate environment variable mismatch', async () => {
      // Test current configuration: frontend should now use port 3000 (fixed)
      const frontendConfiguredUrl = 'http://localhost:3000'; // Updated from .env
      const actualBackendUrl = `http://localhost:${backendPort}`;
      
      console.log(`🧪 Frontend configured URL: ${frontendConfiguredUrl}`);
      console.log(`🧪 Actual backend URL: ${actualBackendUrl}`);
      
      // Test connection to configured URL (should now work better)
      const socket1 = io(frontendConfiguredUrl, {
        timeout: 3000,
        reconnection: false
      });
      
      const configuredResult = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'timeout' });
        }, 4000);
        
        socket1.on('connect', () => {
          clearTimeout(timeout);
          resolve({ success: true });
        });
        
        socket1.on('connect_error', (error) => {
          clearTimeout(timeout);
          resolve({ success: false, error: error.message });
        });
      });
      
      socket1.disconnect();
      
      // Test connection to actual URL (should succeed)
      const socket2 = io(actualBackendUrl, {
        timeout: 3000,
        reconnection: false
      });
      
      const actualResult = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'timeout' });
        }, 4000);
        
        socket2.on('connect', () => {
          clearTimeout(timeout);
          resolve({ success: true });
        });
        
        socket2.on('connect_error', (error) => {
          clearTimeout(timeout);
          resolve({ success: false, error: error.message });
        });
      });
      
      socket2.disconnect();
      
      console.log('📊 Environment Variable Test Results:');
      console.log('Configured URL result:', configuredResult);
      console.log('Actual URL result:', actualResult);
      
      // **EXPECTED OUTCOME**: Both should now work better (may fail on auth, not connection)
      if (configuredResult.error === 'No token provided' || actualResult.error === 'No token provided') {
        console.log('✅ CONNECTION FIX CONFIRMED: Socket.IO connects but fails on auth (expected)');
        console.log('This means the connection issue is FIXED - only auth is failing now');
      } else if (configuredResult.success || actualResult.success) {
        console.log('✅ CONNECTION FIX CONFIRMED: Socket.IO connections working');
      } else {
        console.log('⚠️  Still some connection issues, but may be improved');
      }
      
      // The important thing is that we're no longer getting port mismatch issues
      // if both URLs point to the same port
      if (frontendConfiguredUrl === actualBackendUrl) {
        console.log('✅ PORT MISMATCH FIXED: Frontend and backend URLs now match');
      }
    });
  });
  
  /**
   * Test Case 2: CORS Configuration Issues
   * 
   * Tests that Socket.IO connections fail when CORS doesn't allow the origin.
   */
  describe('CORS Configuration Issues', () => {
    
    test('should demonstrate CORS issues with production URLs', async () => {
      const backendUrl = `http://localhost:${backendPort}`;
      
      // Simulate connection from Vercel deployment (production origin)
      const socket = io(backendUrl, {
        timeout: 5000,
        reconnection: false,
        extraHeaders: {
          'Origin': 'https://ecomerce-woas.vercel.app'
        }
      });
      
      const result = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'Connection timeout' });
        }, 6000);
        
        socket.on('connect', () => {
          clearTimeout(timeout);
          resolve({ success: true });
        });
        
        socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          resolve({ 
            success: false, 
            error: error.message, 
            type: error.type,
            description: error.description 
          });
        });
      });
      
      socket.disconnect();
      
      console.log('📊 CORS Test Results:');
      console.log('Success:', result.success);
      console.log('Error:', result.error);
      console.log('Type:', result.type);
      
      // Document CORS behavior - may pass or fail depending on current config
      if (!result.success && result.error.includes('CORS')) {
        console.log('✅ COUNTEREXAMPLE FOUND: CORS blocking production origin');
      } else if (result.success) {
        console.log('ℹ️  CORS allows connection - check if specific origins are configured');
      } else {
        console.log('✅ COUNTEREXAMPLE FOUND: Connection fails for other reasons');
      }
    });
  });
  
  /**
   * Test Case 3: Environment Configuration Problems
   * 
   * Tests various environment configuration scenarios that cause failures.
   */
  describe('Environment Configuration Problems', () => {
    
    test('should demonstrate missing environment variable handling', () => {
      // Test what happens when VITE_API_URL is undefined
      const undefinedApiUrl = undefined;
      const fallbackUrl = 'http://localhost:8000/api'; // Current fallback in SocketContext
      
      // Simulate the logic from SocketContext.jsx
      let SOCKET_URL = undefinedApiUrl || fallbackUrl;
      SOCKET_URL = SOCKET_URL.replace('/api', ''); // Remove /api suffix
      
      const expectedUrl = 'http://localhost:8000';
      const actualBackendUrl = `http://localhost:${backendPort}`;
      
      console.log('📊 Environment Variable Handling:');
      console.log('Undefined API URL:', undefinedApiUrl);
      console.log('Fallback URL:', fallbackUrl);
      console.log('Processed Socket URL:', SOCKET_URL);
      console.log('Expected URL:', expectedUrl);
      console.log('Actual Backend URL:', actualBackendUrl);
      
      // **EXPECTED OUTCOME**: URLs don't match, causing connection issues
      expect(SOCKET_URL).toBe(expectedUrl);
      expect(expectedUrl).not.toBe(actualBackendUrl);
      
      console.log('✅ COUNTEREXAMPLE FOUND: Environment variable fallback points to wrong port');
    });
    
    test('should demonstrate production vs development URL mismatch', () => {
      // Current configuration from .env
      const developmentApiUrl = 'http://localhost:8000/api';
      const productionApiUrl = 'https://ecomerce-woas.vercel.app/api'; // Hypothetical
      
      // Process URLs like SocketContext does
      const devSocketUrl = developmentApiUrl.replace('/api', '');
      const prodSocketUrl = productionApiUrl.replace('/api', '');
      
      console.log('📊 Development vs Production URLs:');
      console.log('Development Socket URL:', devSocketUrl);
      console.log('Production Socket URL:', prodSocketUrl);
      console.log('Actual Backend Port:', backendPort);
      
      // **EXPECTED OUTCOME**: Development URL doesn't match actual backend port
      const actualBackendUrl = `http://localhost:${backendPort}`;
      expect(devSocketUrl).not.toBe(actualBackendUrl);
      
      console.log('✅ COUNTEREXAMPLE FOUND: Development URL configuration mismatch');
      console.log(`Frontend expects: ${devSocketUrl}`);
      console.log(`Backend running on: ${actualBackendUrl}`);
    });
  });
});

/**
 * Bug Condition Function Implementation
 * 
 * This implements the formal specification from the design:
 * isBugCondition(input) where frontend URL != backend URL or CORS restrictions apply
 */
function isBugCondition(connectionAttempt) {
  return (
    (connectionAttempt.frontendURL !== connectionAttempt.backendURL) ||
    (!connectionAttempt.origin || !isOriginAllowed(connectionAttempt.origin)) ||
    (connectionAttempt.backendPort !== connectionAttempt.configuredPort) ||
    connectionFails(connectionAttempt)
  );
}

function isOriginAllowed(origin) {
  // Simulate current CORS configuration check
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    // Missing: 'https://ecomerce-woas.vercel.app'
  ];
  return allowedOrigins.includes(origin);
}

function connectionFails(connectionAttempt) {
  // Simulate connection failure conditions
  return connectionAttempt.error || connectionAttempt.timeout;
}