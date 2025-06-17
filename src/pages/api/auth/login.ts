import { NextApiRequest, NextApiResponse } from 'next';
import { getOne } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const user = await getOne<{
      id: string;
      username: string;
      password: string;
      role: 'user' | 'admin';
    }>(
      `SELECT * FROM user_login_credentials WHERE username = ?`,
      [username]
    );

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const details = await getOne<{
      name: string;
      email: string;
      contact?: string;
      address?: string;
      accounts?: string;
    }>(
      `SELECT name, email, contact, address, accounts FROM user_details WHERE id = ?`,
      [user.id]
    );

    return res.status(200).json({
      id: user.id,
      username: user.username,
      role: user.role,
      ...details,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
