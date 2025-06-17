import { ReactNode } from "react";

export interface Transaction {
  id: string;
  date: string; 
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  currency: string;
}

// Represents table 3: Accounts table
export interface Account {
  id: string;
  accountNumber: string;
  holderName: string; // Should be consistent with UserDetail.name
  balance: number;
  currency: string;
  type: string; 
  transactions: Transaction[];
  userId: string; // Links to UserLoginCredential.id and UserDetail.id
}

// Represents table 1: User Login credentials with role
export interface UserLoginCredential {
  id: string; // Primary key, links to UserDetail.id
  username: string;
  password?: string; // Mock password for login
  role: 'user' | 'admin';
}

// Represents table 2: User Details
export interface UserDetail {
  username: string;
  id: string; // Primary key, same as UserLoginCredential.id
  name: string; 
  contact?: string; 
  email: string; 
  address?: string; 
  accounts?: string[]; // Array of account IDs this user owns (links to Account.id)
}

// Combined type representing the authenticated user's profile, used by the app.
// This is what AuthContext will manage and provide.
export interface User extends UserLoginCredential, Omit<UserDetail, 'id' /* id is already in UserLoginCredential */> {
  // This type merges UserLoginCredential and the fields from UserDetail (except UserDetail.id to avoid conflict)
}
