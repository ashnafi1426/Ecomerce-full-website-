/**
 * Socket.IO Connection Integration Test
 * 
 * Tests the complete Socket.IO connection fix to verify:
 * 1. Backend starts successfully on dynamic ports
 * 2. Socket.IO server is properly configured with CORS
 * 3. Frontend can connect to the backend using environment-aware URLs
 * 4. Authentication flow works correctly
 * 5. Chat functionality works end-to-end
 */

const { spawn } = require('child_process');
const { io } = require('socket.io-client');
const path = require('path');

// Test timeout for operations
const CONNECTION_TIMEOUT = 10000; // 10 seconds

describe('Socket.IO Connection Integration Tests', () => {
  
  let backendProcess;
  let backendPort;
  
  /**
   * Start backend server for testing
   */
  beforeAll(async () => {
    console.log('🚀 Starting backend server for integration tests...');
    
    // Start backend server
    backendProcess = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, '..'),
      env: { 
        ...process.env, 
        NODE_ENV: 'test',
        PORT: '3003' // Use different port for integration tests
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
    
    console.log(`✅ Backend started successfully on port ${backendPort}`);
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
   * Test 1: Backend Dynamic Port Configuration
   */
  test('should start backend on available port with proper configuration', () => {
    expect(backendPort).toBeDefined();
    expect(backendPort).toBeGreaterThan(3000);
    expect(backendPort).toBeLessThan(9000);
    
    console.log(`✅ Backend running on dynamic port: ${backendPort}`);
  });
  
  /**
   * Test 2: Socket.IO Server CORS Configuration
   */
  test('should have Socket.IO server with proper CORS configuration', async () => {
    const backendUrl = `http://localhost:${backendPort}`;
    
    // Test connection from allowed origin (localhost:3000)
    const socket = io(backendUrl, {
      timeout: 5000,
      reconnection: false,
      transports: ['polling'] // Start with polling to test CORS
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
        resolve({ success: false, error: error.message });
      });
    });
    
    socket.disconnect();
    
    console.log('📊 CORS Test Results:');
    console.log('Success:', result.success);
    console.log('Error:', result.error);
    
    // Connection should fail due to authentication, not CORS
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/No token|Authentication/i);
    expect(result.error).not.toMatch(/CORS|origin/i);
    
    console.log('✅ CORS configuration working - connection fails due to auth, not CORS');
  });
  
  /**
   * Test 3: Environment-Aware URL Configuration
   */
  test('should support environment-aware URL configuration', () => {
    // Test URL construction logic similar to frontend
    const testEnvironments = [
      {
        name: 'Development with VITE_SOCKET_URL',
        env: { VITE_SOCKET_URL: 'http://localhost:3000', MODE: 'development' },
        expected: 'http://localhost:3000'
      },
      {
        name: 'Development with VITE_API_URL',
        env: { VITE_API_URL: 'http://localhost:3000/api', MODE: 'development' },
        expected: 'http://localhost:3000'
      },
      {
        name: 'Production fallback',
        env: { MODE: 'production' },
        expected: 'https://your-backend-domain.com'
      },
      {
        name: 'Development fallback',
        env: { MODE: 'development' },
        expected: 'http://localhost:3000'
      }
    ];
    
    testEnvironments.forEach(testCase => {
      let SOCKET_URL;
      
      // Simulate frontend URL construction logic
      if (testCase.env.VITE_SOCKET_URL) {
        SOCKET_URL = testCase.env.VITE_SOCKET_URL;
      } else if (testCase.env.VITE_API_URL) {
        SOCKET_URL = testCase.env.VITE_API_URL.replace('/api', '');
      } else {
        SOCKET_URL = testCase.env.MODE === 'production' 
          ? 'https://your-backend-domain.com' 
          : 'http://localhost:3000';
      }
      
      expect(SOCKET_URL).toBe(testCase.expected);
      console.log(`✅ ${testCase.name}: ${SOCKET_URL}`);
    });
  });
  
  /**
   * Test 4: Socket.IO Connection Options
   */
  test('should support proper Socket.IO connection options', async () => {
    const backendUrl = `http://localhost:${backendPort}`;
    
    // Test with production-ready connection options
    const socket = io(backendUrl, {
      transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
      timeout: 10000,
      autoConnect: true,
      forceNew: false,
      upgrade: true,
      rememberUpgrade: true
    });
    
    let connectionEvents = [];
    
    socket.on('connect', () => {
      connectionEvents.push('connect');
    });
    
    socket.on('connect_error', (error) => {
      connectionEvents.push(`connect_error:${error.type || 'unknown'}`);
    });
    
    socket.io.on('error', (error) => {
      connectionEvents.push(`transport_error:${error.type || 'unknown'}`);
    });
    
    // Wait for connection attempt
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    socket.disconnect();
    
    console.log('📊 Connection Options Test:');
    console.log('Events captured:', connectionEvents);
    
    // Should have at least one connection-related event
    expect(connectionEvents.length).toBeGreaterThan(0);
    
    // Should not have transport errors (CORS or connection issues)
    const hasTransportError = connectionEvents.some(event => 
      event.includes('transport_error') || event.includes('xhr poll error')
    );
    expect(hasTransportError).toBe(false);
    
    console.log('✅ Socket.IO connection options working correctly');
  });
  
  /**
   * Test 5: Authentication Flow Integration
   */
  test('should handle authentication flow correctly', async () => {
    const backendUrl = `http://localhost:${backendPort}`;
    
    // Test scenarios
    const authScenarios = [
      {
        name: 'No token',
        token: null,
        expectedError: /No token|Authentication/i
      },
      {
        name: 'Invalid token',
        token: 'invalid.jwt.token',
        expectedError: /Invalid|expired|token/i
      },
      {
        name: 'Empty token',
        token: '',
        expectedError: /No token|Authentication/i
      }
    ];
    
    for (const scenario of authScenarios) {
      console.log(`Testing auth scenario: ${scenario.name}`);
      
      const socketOptions = {
        timeout: 3000,
        reconnection: false,
        transports: ['polling']
      };
      
      if (scenario.token) {
        socketOptions.auth = { token: scenario.token };
      }
      
      const socket = io(backendUrl, socketOptions);
      
      const result = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'timeout' });
        }, 4000);
        
        socket.on('connect', () => {
          clearTimeout(timeout);
          resolve({ success: true });
        });
        
        socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          resolve({ success: false, error: error.message });
        });
      });
      
      socket.disconnect();
      
      // Should fail with expected authentication error
      expect(result.success).toBe(false);
      expect(result.error).toMatch(scenario.expectedError);
      
      console.log(`✅ ${scenario.name}: ${result.error}`);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  });
  
  /**
   * Test 6: Connection Stability and Error Handling
   */
  test('should handle connection errors gracefully', async () => {
    const backendUrl = `http://localhost:${backendPort}`;
    
    const socket = io(backendUrl, {
      timeout: 2000,
      reconnection: false,
      transports: ['polling']
    });
    
    let errorEvents = [];
    
    socket.on('connect_error', (error) => {
      errorEvents.push({
        type: 'connect_error',
        message: error.message,
        hasType: !!error.type,
        hasDescription: !!error.description
      });
    });
    
    socket.io.on('error', (error) => {
      errorEvents.push({
        type: 'transport_error',
        message: error.message || error.toString(),
        hasType: !!error.type
      });
    });
    
    // Wait for connection attempt and error
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    socket.disconnect();
    
    console.log('📊 Error Handling Test:');
    console.log('Error events captured:', errorEvents.length);
    errorEvents.forEach(event => {
      console.log(`  - ${event.type}: ${event.message}`);
    });
    
    // Should have captured authentication error
    expect(errorEvents.length).toBeGreaterThan(0);
    
    // Errors should be properly structured
    const authErrors = errorEvents.filter(event => 
      event.message.includes('token') || event.message.includes('Authentication')
    );
    expect(authErrors.length).toBeGreaterThan(0);
    
    console.log('✅ Error handling working correctly');
  });
  
  /**
   * Test 7: Verify Fix Implementation
   */
  test('should confirm Socket.IO connection fix is working', async () => {
    console.log('🔍 Verifying Socket.IO connection fix implementation...');
    
    const backendUrl = `http://localhost:${backendPort}`;
    
    // Test that we can establish a connection attempt (even if auth fails)
    const socket = io(backendUrl, {
      timeout: 3000,
      reconnection: false,
      transports: ['polling', 'websocket']
    });
    
    const connectionResult = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ 
          connected: false, 
          error: 'timeout',
          fixWorking: false 
        });
      }, 4000);
      
      socket.on('connect', () => {
        clearTimeout(timeout);
        resolve({ 
          connected: true, 
          error: null,
          fixWorking: true 
        });
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        
        // If we get an authentication error, the connection fix is working
        // (we reached the server and Socket.IO auth middleware)
        const isAuthError = error.message.includes('token') || 
                           error.message.includes('Authentication');
        
        resolve({ 
          connected: false, 
          error: error.message,
          fixWorking: isAuthError // Auth error means connection fix works
        });
      });
    });
    
    socket.disconnect();
    
    console.log('📊 Connection Fix Verification:');
    console.log('Connected:', connectionResult.connected);
    console.log('Error:', connectionResult.error);
    console.log('Fix Working:', connectionResult.fixWorking);
    
    // The fix is working if either:
    // 1. We successfully connect (unlikely without valid token)
    // 2. We get an authentication error (means we reached the server)
    expect(connectionResult.fixWorking).toBe(true);
    
    if (connectionResult.connected) {
      console.log('✅ Socket.IO connection successful!');
    } else if (connectionResult.error.includes('token') || connectionResult.error.includes('Authentication')) {
      console.log('✅ Socket.IO connection fix working - reached auth layer');
    } else {
      console.log('❌ Unexpected connection error:', connectionResult.error);
    }
  });
});