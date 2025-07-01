import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file: File | null = formData.get('file') as File;

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  const text = await file.text();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const headers = lines[0].split(',').map(h => h.trim());
  const expectedFields = ['id', 'username', 'password', 'role', 'name', 'email', 'contact', 'address'];

  // Check for missing/extra headers
  if (headers.length !== expectedFields.length || !expectedFields.every(f => headers.includes(f))) {
    return NextResponse.json({ error: 'Invalid CSV headers' }, { status: 400 });
  }

  const users = lines.slice(1).map((line, index) => {
    const values = line.split(',').map(v => v.trim());
    return { lineNumber: index + 2, data: Object.fromEntries(headers.map((h, i) => [h, values[i]])) };
  });

  const malformed: number[] = [];
  let inserted = 0;

  for (const { lineNumber, data } of users) {
    const hasMissingRequired = ['id', 'username', 'password', 'role', 'name', 'email'].some(key => !data[key]);

    if (hasMissingRequired) {
      malformed.push(lineNumber);
      continue;
    }

    try {
      await query(`
        INSERT INTO user_login_credentials (id, username, password, role)
        VALUES (?, ?, ?, ?)
      `, [data.id, data.username, data.password, data.role]);

      await query(`
        INSERT INTO user_details (id, name, email, contact, address, accounts)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [data.id, data.name, data.email, data.contact, data.address, JSON.stringify([])]);

      inserted++;
    } catch (err) {
      malformed.push(lineNumber); // duplicate ID or SQL error
    }
  }

  return NextResponse.json({
    success: true,
    inserted,
    skipped: malformed.length,
    malformedLines: malformed
  });
}
