import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// HTTP-based connection for better stability during autoscaling
const connectionString = process.env.DATABASE_URL;
const sql = neon(connectionString);

export const db = drizzle({ client: sql, schema });

// Database retry utility for handling transient errors
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 1000,
  backoffFactor: 2,
};

// Transient error codes that should trigger retries
const TRANSIENT_ERROR_CODES = new Set([
  '57P01', // admin_shutdown
  '57P03', // cannot_connect_now
  '53300', // too_many_connections
  '53400', // configuration_limit_exceeded
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ECONNREFUSED',
]);

function isTransientError(error: any): boolean {
  if (!error) return false;
  
  const code = error.code || error.sqlState;
  if (code && TRANSIENT_ERROR_CODES.has(code)) {
    return true;
  }
  
  const message = error.message?.toLowerCase() || '';
  return message.includes('connection') || 
         message.includes('timeout') || 
         message.includes('network') ||
         message.includes('temporary');
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
  context = 'database operation'
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry non-transient errors
      if (!isTransientError(error)) {
        console.error(`❌ Non-transient error in ${context} (attempt ${attempt}):`, error.message);
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === opts.maxAttempts) {
        console.error(`💥 Final retry failed for ${context} after ${opts.maxAttempts} attempts:`, error.message);
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffFactor, attempt - 1),
        opts.maxDelay
      );
      
      console.warn(`🔄 Retrying ${context} (attempt ${attempt}/${opts.maxAttempts}) after ${delay}ms. Error: ${error.message}`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

console.log('✅ Database configured with HTTP client and retry logic');