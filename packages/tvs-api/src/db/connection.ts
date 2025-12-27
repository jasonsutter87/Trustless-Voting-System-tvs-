/**
 * PostgreSQL Database Connection
 *
 * Pool configuration optimized for high-throughput vote processing:
 * - max: 50 connections (up from 10) to handle batch operations
 * - idle_timeout: 60s to keep connections warm during voting
 * - connect_timeout: 10s for initial connection
 */

import postgres from 'postgres';

const DATABASE_URL = process.env['DATABASE_URL'] || 'postgres://tvs:tvs_dev_password@localhost:5432/tvs';

// Pool size configurable via environment
const POOL_SIZE = parseInt(process.env['DB_POOL_SIZE'] || '50', 10);
const IDLE_TIMEOUT = parseInt(process.env['DB_IDLE_TIMEOUT'] || '60', 10);

export const sql = postgres(DATABASE_URL, {
  max: POOL_SIZE,
  idle_timeout: IDLE_TIMEOUT,
  connect_timeout: 10,
});

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
  await sql.end();
}
