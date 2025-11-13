/**
 * Environment variable validation
 * Ensures all required environment variables are present
 */

export function validateEnv() {
  const required = ['DATABASE_URL'];
  const missing: string[] = [];

  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n📝 Please check .env.example for reference');
    process.exit(1);
  }

  // Warnings for optional but recommended variables
  const recommended = ['ALLOWED_ORIGINS', 'SESSION_SECRET'];
  const missingRecommended: string[] = [];

  for (const varName of recommended) {
    if (!process.env[varName]) {
      missingRecommended.push(varName);
    }
  }

  if (missingRecommended.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Missing recommended environment variables for production:');
    missingRecommended.forEach(varName => console.warn(`   - ${varName}`));
    console.warn('   Consider setting these for better security\n');
  }

  console.log('✅ Environment variables validated');
}

export const config = {
  database: {
    url: process.env.DATABASE_URL!,
  },
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  security: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  },
};
