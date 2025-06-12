import { query, getOne } from './db';
import type { UserLoginCredential, UserDetail, User } from '@/types';

export async function getUserByUsername(username: string): Promise<User | null> {
  const sql = `
    SELECT 
      c.id,
      c.username,
      c.role,
      d.name,
      d.email,
      d.contact,
      d.address,
      d.accounts
    FROM user_login_credentials c
    JOIN user_details d ON c.id = d.id
    WHERE c.username = ?
  `;

  try {
    const user = await getOne<User>(sql, [username]);
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function validateUserCredentials(
  username: string,
  password: string
): Promise<UserLoginCredential | null> {
  const sql = `
    SELECT id, username, role
    FROM user_login_credentials
    WHERE username = ? AND password = ?
  `;

  try {
    const credentials = await getOne<UserLoginCredential>(sql, [username, password]);
    return credentials;
  } catch (error) {
    console.error('Error validating credentials:', error);
    return null;
  }
}

export async function getUserDetails(userId: string): Promise<UserDetail | null> {
  const sql = `
    SELECT id, name, email, contact, address, accounts
    FROM user_details
    WHERE id = ?
  `;

  try {
    const details = await getOne<UserDetail>(sql, [userId]);
    return details;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
}

export async function updateUserPassword(
  userId: string,
  newPassword: string
): Promise<boolean> {
  const sql = `
    UPDATE user_login_credentials
    SET password = ?
    WHERE id = ?
  `;

  try {
    await query(sql, [newPassword, userId]);
    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
} 