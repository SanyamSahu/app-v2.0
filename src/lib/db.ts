
if (typeof window !== "undefined") {
  throw new Error("src/lib/db.ts cannot be imported from client-side code!");
}

import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'AccountDB',
};

// Create a connection pool
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Utility function to execute queries
export async function query<T>(sql: string, params?: any[]): Promise<T> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Utility function to get a single row
export async function getOne<T>(sql: string, params?: any[]): Promise<T | null> {
  try {
    const rows = await query<T[]>(sql, params);
    return rows[0] || null;
  } catch (error) {
    console.error('Database getOne error:', error);
    throw error;
  }
}

// Test the database connection
export async function testConnection(): Promise<boolean> {
  try {
    await pool.getConnection();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}