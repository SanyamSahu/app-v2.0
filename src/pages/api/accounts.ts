// src/pages/api/accounts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const accounts = await query<any[]>(`SELECT * FROM accounts`);
      const transactions = await query<any[]>(`SELECT * FROM transactions`);

      // Group transactions by accountId
      const transactionsMap: Record<string, any[]> = {};
      for (const tx of transactions) {
        if (!transactionsMap[tx.accountId]) transactionsMap[tx.accountId] = [];
        transactionsMap[tx.accountId].push(tx);
      }

      // Attach transactions to each account
      const enrichedAccounts = accounts.map(acc => ({
        ...acc,
        balance: parseFloat(acc.balance),
        transactions: transactionsMap[acc.id] || [],
      }));

      res.status(200).json(enrichedAccounts);
    } catch (error) {
      console.error('Error fetching accounts and transactions:', error);
      res.status(500).json({ message: 'Failed to fetch accounts and transactions', error });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
