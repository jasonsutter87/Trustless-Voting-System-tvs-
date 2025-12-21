/**
 * PostgreSQL Database Connection
 */

import postgres from 'postgres';

const DATABASE_URL = process.env['DATABASE_URL'] || 'postgres://tvs:tvs_dev_password@localhost:5432/tvs';

export const sql = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
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
