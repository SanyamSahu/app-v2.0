// src/app/api/users/[id]/route.ts
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = params.id;
  try {
    const users = await query('SELECT id FROM user_login_credentials WHERE id = ?', [userId]);
    if ((users as any[]).length > 0) {
      return NextResponse.json({ exists: true });
    } else {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
  } catch (err) {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
