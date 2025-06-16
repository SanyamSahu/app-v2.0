// src/pages/api/accounts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const accounts = await query<any[]>(`SELECT * FROM accounts`);
      res.status(200).json(accounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({ message: 'Failed to fetch accounts', error });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
