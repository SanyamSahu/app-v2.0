// app/api/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getOne, query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId, currentPassword, newPassword } = await req.json();

    // Check if the user exists with current password
    const user = await getOne<any>(
      'SELECT * FROM user_login_credentials WHERE id = ? AND password = ?',
      [userId, currentPassword]
    );

    if (!user) {
      return NextResponse.json({ success: false, message: 'Incorrect current password.' }, { status: 401 });
    }

    // Update the password
    await query(
      'UPDATE user_login_credentials SET password = ? WHERE id = ?',
      [newPassword, userId]
    );

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('[CHANGE_PASSWORD]', error);
    return NextResponse.json({ success: false, message: 'Failed to change password.' }, { status: 500 });
  }
}
