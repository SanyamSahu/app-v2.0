import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // expecting JSON array of transactions
    const transactions = body.transactions;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ success: false, message: 'No transaction data received.' }, { status: 400 });
    }

    for (const tx of transactions) {
      const id = tx.id || uuidv4();
      await query(
        `INSERT INTO transactions (id, date, description, amount, type, currency, accountId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, tx.date, tx.description, tx.amount, tx.type, tx.currency, tx.accountId]
      );
    }

    return NextResponse.json({ success: true, message: `Uploaded ${transactions.length} transactions.` });

  } catch (err) {
    console.error('Transaction upload error:', err);
    return NextResponse.json({ success: false, message: 'Server error while uploading transactions.' }, { status: 500 });
  }
}
