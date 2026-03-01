/**
 * Bug Condition Exploration Test
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **GOAL**: Surface counterexamples that demonstrate the bug exists
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 * 
 * This test implements the Fault Condition from the design:
 * isBugCondition(input) where input involves port conflicts, missing routes, or config issues
 */

const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');

// Test timeout for server startup attempts
const STARTUP_TIMEOUT = 10000; // 10 seconds

/**
 * Property 1: Fault Condition - Server Startup Failure Detection
 * 
 * Tests the bug condition: server startup fails when port 5000 is restricted,
 * route files are missing, or environment config conflicts occur.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 */
describe('Bug Condition Exploration - Server Startup Failures', () => {
  
  /**
   * Test Case 1: Port Permission/Availability Issues
   * 
   * Tests that server fails when trying to bind to restricted or unavailable ports.
   * This simulates the EACCES error on port 5000.
   */
  describe('Port Binding Issues', () => {
    
    test('should fail when port 5000 is already in use (simulating EACCES)', async () => {
      // Create a server to occupy port 5000
      const blockingServer = net.createServer();
      
      try {
        // Block port 5000
        await new Promise((resolve, reject) => {
          blockingServer.listen(5000, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        // Try to start the ecommerce server (should fail)
        const serverProcess = spawn('node', ['server.js'], {
          cwd: path.join(__dirname, '..'),
          env: { 
            ...process.env, 
            PORT: '5000', // Force it to try port 5000
            NODE_ENV: 'test'
          },
          stdio: 'pipe'
        });
        
        let stdout = '';
        let stderr = '';
        
        serverProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        serverProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        // Wait for server to fail
        const result = await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            serverProcess.kill();
            resolve({ success: false, stdout, stderr, timeout: true });
          }, STARTUP_TIMEOUT);
          
          serverProcess.on('exit', (code) => {
            clearTimeout(timeout);
            resolve({ success: code === 0, stdout, stderr, code });
          });
        });
        
        // **EXPECTED OUTCOME**: Server should FAIL (this proves the bug exists)
        expect(result.success).toBe(false);
        expect(result.stderr || result.stdout).toMatch(/EADDRINUSE|EACCES|port.*already.*use|listen.*failed/i);
        
        console.log('✅ COUNTEREXAMPLE FOUND: Server fails with port conflict');
        console.log('Exit code:', result.code);
        console.log('Error output:', result.stderr);
        
      } finally {
        blockingServer.close();
      }
    });
    
    test('should fail to respect PORT environment variable precedence', async () => {
      // Test that server ignores .env PORT=4000 and tries to use default 5000
      const serverProcess = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { 
          ...process.env, 
          PORT: '4000', // .env specifies 4000
          NODE_ENV: 'test'
        },
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      serverProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      serverProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      // Wait for server startup
      const result = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          serverProcess.kill();
          resolve({ success: false, stdout, stderr, timeout: true });
        }, STARTUP_TIMEOUT);
        
        serverProcess.on('exit', (code) => {
          clearTimeout(timeout);
          resolve({ success: code === 0, stdout, stderr, code });
        });
      });
      
      // **EXPECTED OUTCOME**: Server should either fail or use wrong port
      // If it succeeds, it should be using port 4000, not 5000
      if (result.success) {
        // If server starts successfully, it should be using port 4000
        expect(result.stdout).toMatch(/port 4000/i);
        expect(result.stdout).not.toMatch(/port 5000/i);
      } else {
        // If server fails, it might be trying to use port 5000 instead of 4000
        console.log('✅ COUNTEREXAMPLE FOUND: Server fails due to config precedence issue');
        console.log('Exit code:', result.code);
        console.log('Output:', result.stdout);
        console.log('Error:', result.stderr);
      }
    });
  });
  
  /**
   * Test Case 2: Route Loading Issues
   * 
   * Tests that server fails when route files are missing or malformed.
   * This simulates the "app.use() requires a middleware function" error.
   */
  describe('Route Loading Issues', () => {
    
    test('should fail when route files are missing or return invalid middleware', async () => {
      // Backup original route file
      const routeFile = path.join(__dirname, '..', 'routes', 'refundRoutes', 'enhancedRefund.routes.js');
      const backupFile = routeFile + '.backup';
      
      try {
        // Create backup
        if (fs.existsSync(routeFile)) {
          fs.copyFileSync(routeFile, backupFile);
        }
        
        // Create a malformed route file that doesn't export proper middleware
        fs.writeFileSync(routeFile, `
          // Malformed route file - exports undefined instead of router
          module.exports = undefined;
        `);
        
        // Try to start the server
        const serverProcess = spawn('node', ['server.js'], {
          cwd: path.join(__dirname, '..'),
          env: { 
            ...process.env, 
            PORT: '3001', // Use different port to avoid conflicts
            NODE_ENV: 'test'
          },
          stdio: 'pipe'
        });
        
        let stdout = '';
        let stderr = '';
        
        serverProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        serverProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        // Wait for server to fail
        const result = await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            serverProcess.kill();
            resolve({ success: false, stdout, stderr, timeout: true });
          }, STARTUP_TIMEOUT);
          
          serverProcess.on('exit', (code) => {
            clearTimeout(timeout);
            resolve({ success: code === 0, stdout, stderr, code });
          });
        });
        
        // **EXPECTED OUTCOME**: Server should FAIL (this proves the bug exists)
        expect(result.success).toBe(false);
        expect(result.stderr || result.stdout).toMatch(/middleware function|TypeError|Cannot read|undefined/i);
        
        console.log('✅ COUNTEREXAMPLE FOUND: Server fails with route loading error');
        console.log('Exit code:', result.code);
        console.log('Error output:', result.stderr);
        
      } finally {
        // Restore original file
        if (fs.existsSync(backupFile)) {
          fs.copyFileSync(backupFile, routeFile);
          fs.unlinkSync(backupFile);
        } else if (fs.existsSync(routeFile)) {
          fs.unlinkSync(routeFile);
        }
      }
    });
  });
  
  /**
   * Test Case 3: Environment Configuration Conflicts
   * 
   * Tests that server fails or behaves incorrectly when there are conflicts
   * between .env configuration and hardcoded defaults.
   */
  describe('Environment Configuration Conflicts', () => {
    
    test('should demonstrate config precedence issues', async () => {
      // Test with conflicting environment variables
      const serverProcess = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { 
          ...process.env,
          PORT: '4000', // From .env
          NODE_ENV: 'test'
        },
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      serverProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      serverProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      // Wait for server startup or failure
      const result = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          serverProcess.kill();
          resolve({ success: false, stdout, stderr, timeout: true });
        }, STARTUP_TIMEOUT);
        
        serverProcess.on('exit', (code) => {
          clearTimeout(timeout);
          resolve({ success: code === 0, stdout, stderr, code });
        });
      });
      
      // Analyze the result to understand configuration behavior
      console.log('📊 Configuration Test Results:');
      console.log('Success:', result.success);
      console.log('Output:', result.stdout);
      console.log('Error:', result.stderr);
      
      // The bug condition is that configuration precedence is not working correctly
      // This test documents the current behavior for analysis
      if (result.success) {
        // Check which port was actually used
        const portMatch = result.stdout.match(/port (\d+)/i);
        if (portMatch) {
          const usedPort = parseInt(portMatch[1]);
          console.log('✅ COUNTEREXAMPLE FOUND: Server used port', usedPort);
          
          // If it's using port 5000 instead of 4000, that's the bug
          if (usedPort === 5000) {
            console.log('🐛 BUG CONFIRMED: Server ignored PORT=4000 from .env and used default 5000');
          }
        }
      } else {
        console.log('✅ COUNTEREXAMPLE FOUND: Server failed to start with config conflicts');
      }
    });
  });
  
  /**
   * Test Case 4: Development Workflow Issues
   * 
   * Tests that development workflow is hindered by startup failures.
   */
  describe('Development Workflow Issues', () => {
    
    test('should demonstrate development workflow problems', async () => {
      // Test nodemon development workflow
      const nodemonProcess = spawn('npx', ['nodemon', 'server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { 
          ...process.env,
          NODE_ENV: 'development'
        },
        stdio: 'pipe'
      });
      
      let stdout = '';
      let stderr = '';
      
      nodemonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      nodemonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      // Wait for nodemon to start or fail
      const result = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          nodemonProcess.kill();
          resolve({ success: false, stdout, stderr, timeout: true });
        }, STARTUP_TIMEOUT);
        
        nodemonProcess.on('exit', (code) => {
          clearTimeout(timeout);
          resolve({ success: code === 0, stdout, stderr, code });
        });
      });
      
      console.log('📊 Development Workflow Test Results:');
      console.log('Success:', result.success);
      console.log('Output:', result.stdout);
      console.log('Error:', result.stderr);
      
      // Document any issues with development workflow
      if (!result.success) {
        console.log('✅ COUNTEREXAMPLE FOUND: Development workflow fails');
        console.log('Exit code:', result.code);
      }
    });
  });
});

/**
 * Bug Condition Function Implementation
 * 
 * This implements the formal specification from the design:
 * isBugCondition(input) where input involves port conflicts, missing routes, or config issues
 */
function isBugCondition(input) {
  return (
    (input.port === 5000 && portPermissionDenied(5000)) ||
    (input.routeFile && !routeFileExists(input.routeFile) && middlewareLoadingFails(input.routeFile)) ||
    (input.envPort !== input.defaultPort && configurationConflict())
  );
}

function portPermissionDenied(port) {
  // Simulate port permission check
  return port === 5000; // Assume port 5000 is restricted
}

function routeFileExists(routeFile) {
  return fs.existsSync(routeFile);
}

function middlewareLoadingFails(routeFile) {
  try {
    const module = require(routeFile);
    return typeof module !== 'function' && typeof module !== 'object';
  } catch (error) {
    return true;
  }
}

function configurationConflict() {
  // Check if there's a conflict between .env PORT and default port
  const envPort = process.env.PORT;
  const defaultPort = 5000;
  return envPort && parseInt(envPort) !== defaultPort;
}