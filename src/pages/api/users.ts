// src/pages/api/users.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const users = await query<any[]>(`
      SELECT 
        c.id,
        c.username,
        c.role,
        d.name,
        d.email,
        d.contact,
        d.address,
        d.accounts
      FROM user_login_credentials c
      LEFT JOIN user_details d ON c.id = d.id
    `);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Database error' });
  }
}
