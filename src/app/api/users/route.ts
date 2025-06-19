// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const users = await query<any[]>(`
      SELECT 
        c.id, c.username, c.role,
        d.name, d.email, d.contact, d.address, d.accounts
      FROM user_login_credentials c
      LEFT JOIN user_details d ON c.id = d.id
    `);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { id, username, password, role, name, email, contact, address } = await req.json();

  try {
    await query(`
      INSERT INTO user_login_credentials (id, username, password, role)
      VALUES (?, ?, ?, ?)
    `, [id, username, password, role]);

    await query(`
      INSERT INTO user_details (id, name, email, contact, address, accounts)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, name, email, contact || null, address || null, JSON.stringify([])]);

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch (err) {
    console.error('User creation error:', err);
    return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
  }
}
