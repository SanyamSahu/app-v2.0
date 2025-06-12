import type { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root@123',
    port: 3306,
    database: 'DATABASE', 
  });

  try {
    const [rows] = await connection.execute('SELECT * FROM users');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  } finally {
    await connection.end();
  }
}