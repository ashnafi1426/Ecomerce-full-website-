
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`);
  });
  console.error('\n💡 Please check your .env file');
  process.exit(1);
}

// Export configuration object
const envConfig = {
  // Server Configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  
  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  
  // CORS Configuration
  cors: {
    allowedOrigins: process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:5173']
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },
  
  // Stripe Configuration
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
  },
  
  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@ecommerce.com'
  },
  
  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp']
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

// Validate configuration
const validateConfig = () => {
  // Validate port
  if (isNaN(envConfig.port) || envConfig.port < 1 || envConfig.port > 65535) {
    throw new Error('Invalid PORT value');
  }
  
  // Validate JWT secret length
  if (envConfig.jwt.secret.length < 32) {
    console.warn('⚠️  Warning: JWT_SECRET should be at least 32 characters long');
  }
  
  // Validate Supabase URL format
  if (!envConfig.supabase.url.startsWith('https://')) {
    throw new Error('SUPABASE_URL must start with https://');
  }
  
  return true;
};

try {
  validateConfig();
  console.log('✅ Environment configuration validated');
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message);
  process.exit(1);
}

module.exports = { envConfig };
