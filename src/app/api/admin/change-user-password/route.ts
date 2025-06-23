import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { adminId, targetUserId, newPassword } = await req.json();

    const [admin] = await query<any[]>('SELECT role FROM user_login_credentials WHERE id = ?', [adminId]);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await query(
      'UPDATE user_login_credentials SET password = ? WHERE id = ?',
      [newPassword, targetUserId]
    );

    return NextResponse.json({ success: true, message: 'Password changed successfully for the user.' });
  } catch (error) {
    console.error('[ADMIN_CHANGE_PASSWORD]', error);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
