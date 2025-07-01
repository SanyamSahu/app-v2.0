
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import ProtectedRoute from '@/components/protected-route';
import CreateAccountForm from '@/components/CreateAccountForm';
import type { Account, UserDetail, Transaction } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/date-picker-with-range';
import type { DateRange } from 'react-day-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, FileText, Upload, Users, Filter, ShieldAlert, Loader2, User, Mail, Phone, Home as HomeIcon, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import CreateTransactionForm from '@/components/CreateTransactionForm';
import { useToast } from "@/hooks/use-toast";
import UploadTransactionForm from '@/components/UploadTransactionForm';
import { useAuth } from '@/contexts/auth-context';
import UploadUsersForm from '@/components/UploadUsersForm';




export default function AdminPage() {
 
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [allUsers, setAllUsers] = useState<UserDetail[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const { user } = useAuth();
  const [confirmChange, setConfirmChange] = useState(false);

const fetchAccounts = async () => {
  try {
    const res = await fetch('/api/accounts');
    const rawData = await res.json();

    const parsedData = rawData.map((acc: any) => ({
      ...acc,
      balance: parseFloat(acc.balance),
      transactions: (acc.transactions || []).map((tx: any) => ({
        id: tx.id || tx.transactionId,
        date: tx.date,
        description: tx.description,
        amount: parseFloat(tx.amount),
        type: tx.type || tx.transactionType,
        currency: tx.currency || tx.transactionCurrency,
      })),
    }));

    setAllAccounts(parsedData);
  } catch (err) {
    console.error('Error loading accounts:', err);
    toast({
      title: "Error",
      description: "Unable to load accounts from server.",
      variant: "destructive",
    });
  }
};

useEffect(() => {
  fetchAccounts();
}, []);


  

const fetchUsers = async () => {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json();
    setAllUsers(data);
  } catch (err) {
    console.error('Error loading users:', err);
    toast({
      title: "Error",
      description: "Unable to load users from server.",
      variant: "destructive",
    });
  }
};

useEffect(() => {
  fetchUsers();
}, []);

  
  
  const [dateRangeGlobal, setDateRangeGlobal] = useState<DateRange | undefined>(undefined); // For global account view (if used for filtering creation date)
  const [searchTerm, setSearchTerm] = useState('');
  
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [dateRangeForSelectedUser, setDateRangeForSelectedUser] = useState<DateRange | undefined>(undefined);

  const { toast } = useToast();

  // Memoized data for global accounts view
  const filteredGlobalAccounts = useMemo(() => {
    let accounts = allAccounts;
    if (searchTerm) {
      accounts = accounts.filter(acc => 
        acc.holderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.accountNumber.includes(searchTerm) ||
        acc.userId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // dateRangeGlobal could be applied here if accounts have a creation date field
    return accounts;
  }, [allAccounts, searchTerm]);

  // Memoized data for selected user view
  const selectedUserDetail = useMemo(() => {
    return allUsers.find(u => u.id === selectedUserId);
  }, [allUsers, selectedUserId]);

  const selectedUserAccounts = useMemo(() => {
    if (!selectedUserId) return [];
    return allAccounts.filter(acc => acc.userId === selectedUserId);
  }, [allAccounts, selectedUserId]);

  const filteredTransactionsForSelectedUser = useMemo(() => {
    if (!selectedUserAccounts || selectedUserAccounts.length === 0) return [];
    
    let transactions: Transaction[] = [];
    selectedUserAccounts.forEach(account => {
      transactions = transactions.concat(account.transactions.map(tx => ({...tx, accountId: account.id, accountNumber: account.accountNumber}))); // Add account info to tx
    });

    if (dateRangeForSelectedUser?.from) {
      transactions = transactions.filter(t => new Date(t.date) >= dateRangeForSelectedUser.from!);
    }
    if (dateRangeForSelectedUser?.to) {
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const toDate = new Date(dateRangeForSelectedUser.to!);
        toDate.setHours(23, 59, 59, 999); // Include full end day
        return transactionDate <= toDate;
      });
    }
    return transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedUserAccounts, dateRangeForSelectedUser]);


  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: "Download Started", description: `${fileName} is downloading.` });
  };

  const handleGlobalDownload = (formatType: 'csv' | 'txt') => {
    if (filteredGlobalAccounts.length === 0) {
      toast({ title: "No Data", description: "No accounts to download.", variant: "default" });
      return;
    }
    if (formatType === 'csv') {
      const headers = ["User ID", "Account Number", "Holder Name", "Type", "Balance", "Currency", "Account ID"];
      const csvContent = [
        headers.join(','),
        ...filteredGlobalAccounts.map(acc => 
          [acc.userId, acc.accountNumber, acc.holderName, acc.type, acc.balance.toFixed(2), acc.currency, acc.id].join(',')
        )
      ].join('\n');
      downloadFile(csvContent, 'all_user_accounts_data.csv', 'text/csv;charset=utf-8;');
    } else if (formatType === 'txt') {
      let content = `Admin Report - All User Accounts\nGenerated on: ${new Date().toLocaleDateString()}\n\n`;
      content += "User ID,Account Number,Holder Name,Type,Balance,Currency,Account ID\n";
      filteredGlobalAccounts.forEach(acc => {
        content += `${acc.userId},${acc.accountNumber},${acc.holderName},${acc.type},${acc.balance.toFixed(2)},${acc.currency},${acc.id}\n`;
      });
      content += "\n\n--- End of Report ---";
      downloadFile(content, 'all_user_accounts_report.txt', 'text/plain;charset=utf-8;');
    }
  };

  const handleDownloadForSelectedUser = (formatType: 'csv' | 'txt') => {
    if (!selectedUserDetail || !selectedUserAccounts) {
      toast({ title: "No User Selected", description: "Please select a user to download their data.", variant: "default" });
      return;
    }
    if (filteredTransactionsForSelectedUser.length === 0 && formatType === 'csv') {
        toast({ title: "No Transactions", description: `No transactions found for ${selectedUserDetail.name} within the selected date range to include in CSV.`, variant: "default" });
        // Allow TXT report even with no transactions
    }


    const userNameSafe = selectedUserDetail.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (formatType === 'csv') {
      if (filteredTransactionsForSelectedUser.length === 0) return; // Already toasted
      const headers = ["Transaction ID", "Date", "Description", "Amount", "Currency", "Type", "Account ID", "Account Number"];
      const csvContent = [
        headers.join(','),
        ...filteredTransactionsForSelectedUser.map(tx => 
          [
            tx.id,
            format(new Date(tx.date), 'yyyy-MM-dd'), 
            `"${(tx.description || '').replace(/"/g, '""')}"`,
            tx.amount.toFixed(2), 
            tx.currency, 
            tx.type,
            (tx as any).accountId, // Assuming accountId was added
            (tx as any).accountNumber // Assuming accountNumber was added
          ].join(',')
        )
      ].join('\n');
      downloadFile(csvContent, `user_${userNameSafe}_transactions.csv`, 'text/csv;charset=utf-8;');
    } else if (formatType === 'txt') {
      let content = `User Report: ${selectedUserDetail.name} (ID: ${selectedUserDetail.id})\n`;
      content += `Email: ${selectedUserDetail.email}\n`;
      if (selectedUserDetail.contact) content += `Contact: ${selectedUserDetail.contact}\n`;
      if (selectedUserDetail.address) content += `Address: ${selectedUserDetail.address}\n`;
      content += `Report Generated on: ${new Date().toLocaleDateString()}\n\n`;

      content += "Associated Accounts:\n";
      if (selectedUserAccounts.length > 0) {
        selectedUserAccounts.forEach(acc => {
          content += `  - Account Number: ${acc.accountNumber}\n`;
          content += `    Type: ${acc.type}\n`;
          content += `    Balance: ${acc.balance.toFixed(2)} ${acc.currency}\n`;
          content += `    Account ID: ${acc.id}\n\n`;
        });
      } else {
        content += "  No accounts found for this user.\n\n";
      }
      
      content += `Transactions Report (${dateRangeForSelectedUser?.from ? format(dateRangeForSelectedUser.from, 'MMM dd, yyyy') : 'Start'} - ${dateRangeForSelectedUser?.to ? format(dateRangeForSelectedUser.to, 'MMM dd, yyyy') : 'End'}):\n`;
      if (filteredTransactionsForSelectedUser.length > 0) {
        content += "Date,Description,Amount,Currency,Type,Account Number\n";
        filteredTransactionsForSelectedUser.forEach(tx => {
          content += `${format(new Date(tx.date), 'yyyy-MM-dd')},"${(tx.description || '').replace(/"/g, '""')}",${tx.amount.toFixed(2)},${tx.currency},${tx.type},${(tx as any).accountNumber}\n`;
        });
      } else {
        content += "No transactions found for the selected criteria.\n";
      }
      content += "\n\n--- End of Report ---";
      downloadFile(content, `user_${userNameSafe}_detailed_report.txt`, 'text/plain;charset=utf-8;');
    }
  };


  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: "No file selected", description: "Please select a CSV file to upload.", variant: "destructive" });
      return;
    }
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target?.result as string;
      if (!csvData) {
        toast({ title: "Error reading file", description: "Could not read file content.", variant: "destructive" });
        setIsUploading(false);
        return;
      }

      try {
        const lines = csvData.split(/\r\n|\n/).filter(line => line.trim() !== ''); 
        if (lines.length < 2) {
          toast({ title: "Invalid CSV", description: "CSV file must have a header and at least one data row.", variant: "destructive" });
          setIsUploading(false);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const requiredHeaders = ['id', 'accountNumber', 'holderName', 'balance', 'currency', 'type', 'userId'];
        const missingHeaders = requiredHeaders.filter(rh => !headers.includes(rh));
        
        if (missingHeaders.length > 0) {
            toast({ title: "Invalid CSV Header", description: `Missing columns: ${missingHeaders.join(', ')}. Expected: ${requiredHeaders.join(', ')}`, variant: "destructive" });
            setIsUploading(false);
            return;
        }

        const newAccountsFromCsv: Account[] = [];
        let parsingErrors = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length !== headers.length) {
            console.warn(`Skipping malformed row ${i+1}: ${lines[i]}`);
            parsingErrors++;
            continue;
          }
          
          const accountDataRow: Record<string, string> = {};
          headers.forEach((header, index) => {
            accountDataRow[header] = values[index];
          });

          const balance = parseFloat(accountDataRow.balance);
          if (isNaN(balance)) {
            console.warn(`Skipping row ${i+1} due to invalid balance: ${lines[i]}`);
            toast({ title: "Parsing Warning", description: `Invalid balance for account ${accountDataRow.accountNumber || `in row ${i+1}`} in CSV. Row skipped.`, variant:  "default" });
            parsingErrors++;
            continue;
          }

          if (!accountDataRow.id || !accountDataRow.accountNumber || !accountDataRow.holderName || !accountDataRow.currency || !accountDataRow.type || !accountDataRow.userId) {
            console.warn(`Skipping row ${i+1} due to missing required fields: ${lines[i]}`);
            toast({ title: "Parsing Warning", description: `Missing required fields for an account in row ${i+1} of CSV. Row skipped.`, variant: "default" });
            parsingErrors++;
            continue;
          }

          const newAccount: Account = {
            id: accountDataRow.id,
            accountNumber: accountDataRow.accountNumber,
            holderName: accountDataRow.holderName,
            balance: balance,
            currency: accountDataRow.currency,
            type: accountDataRow.type,
            userId: accountDataRow.userId,
            transactions: [], 
          };
          newAccountsFromCsv.push(newAccount);
        }

                await fetch('/api/upload-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAccountsFromCsv),
        });

        
        if (newAccountsFromCsv.length === 0 && lines.length > 1 && parsingErrors === (lines.length -1) ) {
            toast({ title: "No Valid Data", description: "No valid account data found in the CSV after the header, or all rows had errors.", variant: "destructive" });
            setIsUploading(false);
            return;
        }
        
        let toastQueue: { title: string; description: string; variant?: "default" | "destructive"; duration?: number }[] = [];

setAllAccounts((prevAccounts: Account[]) => {
  const accountsMap = new Map<string, Account>(prevAccounts.map(acc => [acc.id, acc]));
  let updatedMatchingDataCount = 0;
  let skippedMismatchDataCount = 0;
  let newAccountsAddedCount = 0;

  newAccountsFromCsv.forEach(csvAcc => {
    const existingAccount = accountsMap.get(csvAcc.id);

    if (existingAccount) {
      const coreFieldsMatch =
        existingAccount.accountNumber === csvAcc.accountNumber &&
        existingAccount.holderName === csvAcc.holderName &&
        existingAccount.balance === csvAcc.balance &&
        existingAccount.currency === csvAcc.currency &&
        existingAccount.type === csvAcc.type &&
        existingAccount.userId === csvAcc.userId;

      if (coreFieldsMatch) {
        accountsMap.set(csvAcc.id, csvAcc); // reset
        updatedMatchingDataCount++;
      } else {
        skippedMismatchDataCount++;
      }
    } else {
      accountsMap.set(csvAcc.id, csvAcc);
      newAccountsAddedCount++;
    }
  });

  const messageParts: string[] = [];
  if (newAccountsAddedCount > 0) messageParts.push(`${newAccountsAddedCount} new accounts added`);
  if (updatedMatchingDataCount > 0) messageParts.push(`${updatedMatchingDataCount} updated`);
  if (skippedMismatchDataCount > 0) messageParts.push(`${skippedMismatchDataCount} skipped`);

  toastQueue.push({
    title: "CSV Upload Processed",
    description: `Processed ${newAccountsFromCsv.length} rows. ${messageParts.join(', ')}`,
    duration: 8000
  });

  return Array.from(accountsMap.values());
});

// ✅ Flush toasts after state update
setTimeout(() => {
  toastQueue.forEach(t => toast(t));
}, 0);


      } catch (error) {
        console.error("Error processing CSV:", error);
        toast({ title: "Processing Error", description: `Failed to process the CSV file. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
      } finally {
        setIsUploading(false);
        setFile(null);
        const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    };
    reader.onerror = () => {
        toast({ title: "File Read Error", description: "Could not read the selected file.", variant: "destructive" });
        setIsUploading(false);
    };
    reader.readAsText(file);
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary flex items-center">
              <ShieldAlert className="mr-3 h-7 w-7" /> Admin Dashboard
            </CardTitle>
            <CardDescription>Manage user accounts, view user details, download reports, and upload data.</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                    <CardTitle className="text-xl font-semibold text-primary flex items-center">
                        <Users className="mr-2 h-6 w-6" /> All User Accounts (Global View)
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="ml-auto mt-2" onClick={fetchAccounts}>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refresh Accounts
                    </Button>

                    <CardDescription>View and filter account data across all users. Download aggregated reports.</CardDescription>
                </div>
                <div className="w-full md:w-auto md:min-w-[300px]">
                    <Input 
                        type="text"
                        placeholder="Search by name, account #, user ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="text-sm"
                    />
                </div>
            </div>
            
          </CardHeader>
          <CardContent>
            {filteredGlobalAccounts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Holder Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGlobalAccounts.map(acc => (
                    <TableRow key={acc.id}>
                      <TableCell>{acc.userId}</TableCell>
                      <TableCell>{acc.accountNumber}</TableCell>
                      <TableCell>{acc.holderName}</TableCell>
                      <TableCell>{acc.type}</TableCell>
                      <TableCell className="text-right font-medium">{acc.balance.toFixed(2)} {acc.currency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            ) : (
                 <p className="text-muted-foreground text-center py-4">No accounts found matching your criteria.</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => handleGlobalDownload('csv')} disabled={filteredGlobalAccounts.length === 0}>
              <FileSpreadsheet className="mr-2 h-5 w-5" /> Download All Accounts (CSV)
            </Button>
            <Button variant="outline" onClick={() => handleGlobalDownload('txt')} disabled={filteredGlobalAccounts.length === 0}>
              <FileText className="mr-2 h-5 w-5" /> Download All Accounts (TXT)
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg">
  <CardHeader>
    <CardTitle className="text-xl font-semibold text-primary flex items-center">
      <ListChecks className="mr-2 h-6 w-6" /> All Transactions (Global View)
    <Button variant="ghost" size="sm" onClick={fetchAccounts}>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refresh Transactions
    </Button>
    </CardTitle>
    <CardDescription>Browse all transactions across all users and accounts.</CardDescription>
  </CardHeader>
  <CardContent>
    {allAccounts.length > 0 ? (
      <div className="overflow-x-auto max-h-[400px] border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Account Number</TableHead>
              <TableHead>Holder Name</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allAccounts.flatMap(account =>
              account.transactions?.map((tx, i) => (
                <TableRow key={tx.id + i}>
                  <TableCell>{format(new Date(tx.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell>{account.accountNumber}</TableCell>
                  <TableCell>{account.holderName}</TableCell>
                  <TableCell className={`text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount.toFixed(2)} {tx.currency}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${tx.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {tx.type}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    ) : (
      <p className="text-muted-foreground text-center py-4">No transactions found.</p>
    )}
  </CardContent>
</Card>


        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center">
                <User className="mr-2 h-6 w-6" /> View & Download Specific User Data
            </CardTitle>
            

            <CardDescription>Select a user to view their profile, accounts, and download their specific data reports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="select-user" className="text-sm font-medium">Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="select-user" className="w-full md:w-1/2 mt-1">
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} (@{user.username}) - ID: {user.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUserDetail && (
              <div className="space-y-6 pt-4 border-t">
                <section>
                  <h3 className="text-lg font-semibold text-primary mb-2 flex items-center"><User className="mr-2 h-5 w-5"/>Profile Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <p><strong className="text-muted-foreground">Name:</strong> {selectedUserDetail.name}</p>
                    <p><strong className="text-muted-foreground">Username:</strong> @{selectedUserDetail.username}</p>
                    <p><Mail className="inline mr-1 h-4 w-4 text-muted-foreground" /> <strong className="text-muted-foreground">Email:</strong> {selectedUserDetail.email}</p>
                    {selectedUserDetail.contact && <p><Phone className="inline mr-1 h-4 w-4 text-muted-foreground" /> <strong className="text-muted-foreground">Contact:</strong> {selectedUserDetail.contact}</p>}
                    {selectedUserDetail.address && <p className="md:col-span-2"><HomeIcon className="inline mr-1 h-4 w-4 text-muted-foreground" /> <strong className="text-muted-foreground">Address:</strong> {selectedUserDetail.address}</p>}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-primary mb-2 flex items-center"><ListChecks className="mr-2 h-5 w-5"/>User Accounts</h3>
                  {selectedUserAccounts.length > 0 ? (
                    <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account ID</TableHead>
                          <TableHead>Account Number</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUserAccounts.map(acc => (
                          <TableRow key={acc.id}>
                            <TableCell>{acc.id}</TableCell>
                            <TableCell>{acc.accountNumber}</TableCell>
                            <TableCell>{acc.type}</TableCell>
                            <TableCell className="text-right font-medium">{acc.balance.toFixed(2)} {acc.currency}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No accounts found for this user.</p>
                  )}

                        {selectedUserDetail && (
                          <section className="border-t pt-4">
                          <h3 className="text-lg font-semibold text-primary mb-2">🔐 Change Password for This User</h3>
                          <div className="space-y-4">
                            <Input
                              type="password"
                              placeholder="Enter new password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              disabled={!selectedUserDetail}
                            />
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={confirmChange}
                                onChange={(e) => setConfirmChange(e.target.checked)}
                              />
                              <span className="text-sm text-muted-foreground">I confirm I want to change this user's password.</span>
                            </label>
                            <Button
                              variant="destructive"
                              disabled={!newPassword || !confirmChange || !selectedUserDetail}
                              onClick={async () => {
                                const confirm = window.confirm(
                                  `Are you sure you want to change the password for "${selectedUserDetail?.name}"?`
                                );
                                if (!confirm) return;
                              
                                const res = await fetch('/api/admin/change-user-password', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    adminId: user?.id,
                                    targetUserId: selectedUserId,
                                    newPassword,
                                  }),
                                });
                              
                                const data = await res.json();
                                toast({
                                  title: data.success ? "Success" : "Error",
                                  description: data.message,
                                  variant: data.success ? "default" : "destructive",
                                });
                              
                                if (data.success) {
                                  setNewPassword('');
                                  setConfirmChange(false);
                                }
                              }}
                            >
                              Update Password
                            </Button>
                          </div>
                        </section>
                        )}                        
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-primary mb-2 flex items-center"><Filter className="mr-2 h-5 w-5"/>Filter Transactions for Report</h3>
                  <DatePickerWithRange date={dateRangeForSelectedUser} setDate={setDateRangeForSelectedUser} />
                </section>
                
                <section>
                     <h3 className="text-lg font-semibold text-primary mb-3 flex items-center"><Download className="mr-2 h-5 w-5"/>Download User Data</h3>
                     {filteredTransactionsForSelectedUser.length > 0 ? (
                        <div className="overflow-x-auto max-h-96 border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Account</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Type</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTransactionsForSelectedUser.map(tx => (
                                        <TableRow key={tx.id + (tx as any).accountId}>
                                            <TableCell>{format(new Date(tx.date), 'MMM dd, yyyy')}</TableCell>
                                            <TableCell>{tx.description}</TableCell>
                                            <TableCell>{(tx as any).accountNumber?.slice(-4)}</TableCell>
                                            <TableCell className={`text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.amount.toFixed(2)} {tx.currency}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 text-xs rounded-full ${tx.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {tx.type}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                     ) : (
                        <p className="text-muted-foreground text-center py-4">
                            {selectedUserAccounts.length > 0 ? "No transactions found for the selected user and date range." : "User has no accounts to show transactions for."}
                        </p>
                     )}
                </section>
              </div>
            )}
          </CardContent>
          {selectedUserDetail && (
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => handleDownloadForSelectedUser('csv')} disabled={filteredTransactionsForSelectedUser.length === 0}>
                <FileSpreadsheet className="mr-2 h-5 w-5" /> Download User Transactions (CSV)
              </Button>
              <Button variant="outline" onClick={() => handleDownloadForSelectedUser('txt')}>
                <FileText className="mr-2 h-5 w-5" /> Download User Report (TXT)
              </Button>
            </CardFooter>
          )}
        </Card>
          
          <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center">
              <Upload className="mr-2 h-6 w-6" /> Add Manual Transaction
            </CardTitle>
            <CardDescription>Use the form below to manually add a transaction to any account.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTransactionForm />
          </CardContent>
        </Card>


        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center">
              <Upload className="mr-2 h-6 w-6" /> Upload Transactions from CSV
            </CardTitle>
            <CardDescription>Upload a CSV file with multiple transactions for bulk entry.</CardDescription>
          </CardHeader>
          <CardContent>
            <UploadTransactionForm />
          </CardContent>
        </Card>


        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-primary flex items-center">
                <Upload className="mr-2 h-6 w-6" /> Create New Account
            </CardTitle>
            <CardDescription>Fill the form to add a new account for an existing user.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateAccountForm />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Bulk Upload Users</CardTitle></CardHeader>
          <CardContent><UploadUsersForm /></CardContent>
        </Card>




      </div>



    </ProtectedRoute>
  );
}
    
