import type { NextApiRequest, NextApiResponse } from 'next';
import { validateUserCredentials } from '../../../lib/user-db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  try {
    const credentials = await validateUserCredentials(username, password);
    if (!credentials) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    res.status(200).json({ success: true, credentials });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}