import { query } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { id, accountId, date, description, amount, currency, type } = await req.json();

  try {
    await query(`
      INSERT INTO transactions (id, accountId, date, description, amount, currency, type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, accountId, date, description, amount, currency, type]);

    return NextResponse.json({ message: 'Transaction added successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('Transaction insert error:', err);
    return NextResponse.json({ message: err.message || 'DB error' }, { status: 500 });
  }
}
