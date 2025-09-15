import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced connection configuration with pooling and error handling
const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({ 
  connectionString,
  max: 20, // Maximum number of connections in the pool
  min: 1,  // Minimum number of connections
  idleTimeoutMillis: 30000, // Close connections after 30 seconds of inactivity
  connectionTimeoutMillis: 10000, // 10 second connection timeout
});

// Add error handling for pool events
pool.on('error', (err) => {
  console.error('🔥 Database pool error:', err);
});

pool.on('connect', () => {
  console.log('✅ Database connection established');
});

export const db = drizzle({ client: pool, schema });