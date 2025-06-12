
import type { UserLoginCredential, UserDetail, Account, Transaction } from '@/types';

const commonTransactions: Transaction[] = [
  { id: 't1', date: '2024-07-01', description: 'Salary Deposit', amount: 5000, type: 'credit', currency: 'USD' },
  { id: 't2', date: '2024-07-02', description: 'Grocery Shopping', amount: 150, type: 'debit', currency: 'USD' },
  { id: 't3', date: '2024-07-05', description: 'Online Purchase - Amazon', amount: 75.99, type: 'debit', currency: 'USD' },
  { id: 't4', date: '2024-07-10', description: 'Utility Bill - Electricity', amount: 120, type: 'debit', currency: 'USD' },
  { id: 't5', date: '2024-07-15', description: 'Restaurant Dinner', amount: 60, type: 'debit', currency: 'USD' },
  { id: 't6', date: '2024-06-20', description: 'Rent Payment', amount: 1200, type: 'debit', currency: 'USD' },
  { id: 't7', date: '2024-06-25', description: 'Stock Dividend', amount: 200, type: 'credit', currency: 'USD' },
];

// Table 1: User Login Credentials & Role
export const MOCK_USER_LOGIN_CREDENTIALS: UserLoginCredential[] = [
  { 
    id: 'user1', 
    username: 'alice', 
    password: 'password_alice', 
    role: 'user' 
  },
  { 
    id: 'user2', 
    username: 'bob', 
    password: 'password_bob', 
    role: 'user' 
  },
  { 
    id: 'admin1', 
    username: 'admin', 
    password: 'password_admin', 
    role: 'admin' 
  },
];

// Table 2: User Details
export const MOCK_USER_DETAILS: UserDetail[] = [
  { 
    id: 'user1', 
    name: 'Alice Wonderland',
    email: 'alice@example.com', 
    contact: '555-0101',
    address: '123 Wonderland Lane, Fantasy City, FC 12345',
    accounts: ['acc1', 'acc2'] 
  },
  { 
    id: 'user2', 
    name: 'Bob The Builder',
    email: 'bob@example.com', 
    contact: '555-0202',
    address: '456 Construction Avenue, Toolsville, TS 67890',
    accounts: ['acc3'] 
  },
  { 
    id: 'admin1', 
    name: 'Administrator',
    email: 'admin@example.com', 
    contact: '555-0000',
    address: '1 Admin Plaza, Control City, CC 11223'
    // No accounts array for admin by default, can be empty or undefined
  },
];

// Table 3: Account Data
export const MOCK_ACCOUNTS: Account[] = [
  {
    id: 'acc1',
    accountNumber: 'xxxx-xxxx-xxxx-1234',
    holderName: 'Alice Wonderland', // Corresponds to UserDetail.name for userId 'user1'
    balance: 10500.75,
    currency: 'USD',
    type: 'Checking',
    userId: 'user1', // Links to UserLoginCredential.id and UserDetail.id
    transactions: [...commonTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  },
  {
    id: 'acc2',
    accountNumber: 'xxxx-xxxx-xxxx-5678',
    holderName: 'Alice Wonderland', // Corresponds to UserDetail.name for userId 'user1'
    balance: 25000.00,
    currency: 'USD',
    type: 'Savings',
    userId: 'user1', 
    transactions: [
      { id: 't8', date: '2024-07-01', description: 'Initial Deposit', amount: 20000, type: 'credit', currency: 'USD' },
      { id: 't9', date: '2024-07-10', description: 'Interest Earned', amount: 50, type: 'credit', currency: 'USD' },
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  },
  {
    id: 'acc3',
    accountNumber: 'xxxx-xxxx-xxxx-9012',
    holderName: 'Bob The Builder', // Corresponds to UserDetail.name for userId 'user2'
    balance: 7800.50,
    currency: 'USD',
    type: 'Checking',
    userId: 'user2', 
    transactions: [
      { id: 't10', date: '2024-07-03', description: 'Project Payment', amount: 2500, type: 'credit', currency: 'USD' },
      { id: 't11', date: '2024-07-06', description: 'Hardware Store', amount: 350, type: 'debit', currency: 'USD' },
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  },
];
