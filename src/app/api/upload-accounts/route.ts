import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const accounts = await req.json();
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json({ success: false, message: 'No account data received.' }, { status: 400 });
    }

    for (const acc of accounts) {
      await query(
        `INSERT INTO accounts (id, accountNumber, holderName, balance, currency, type, userId)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           accountNumber = VALUES(accountNumber),
           holderName = VALUES(holderName),
           balance = VALUES(balance),
           currency = VALUES(currency),
           type = VALUES(type),
           userId = VALUES(userId)`,
        [acc.id, acc.accountNumber, acc.holderName, acc.balance, acc.currency, acc.type, acc.userId]
      );
    }

    return NextResponse.json({ success: true, message: `Uploaded ${accounts.length} accounts.` });
  } catch (err) {
    console.error('Account upload error:', err);
    return NextResponse.json({ success: false, message: 'Server error while uploading accounts.' }, { status: 500 });
  }
}
