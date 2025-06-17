
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/protected-route';
import { useAuth } from '@/contexts/auth-context';
import type { Account, Transaction } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/date-picker-with-range';
import type { DateRange } from 'react-day-picker';
import { Download, FileSpreadsheet, FileText, DollarSign, ListFilter, Wallet } from 'lucide-react';
import { format as formatDateFns } from 'date-fns'; // Renamed to avoid conflict with format prop
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user } = useAuth();
  const [userAccounts, setUserAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/accounts');
        if (!res.ok) throw new Error('Failed to fetch accounts');
        const allAccountsRaw: any[] = await res.json();

        const allAccounts: Account[] = allAccountsRaw.map((acc) => ({
          ...acc,
          balance: parseFloat(acc.balance), // Ensure balance is a number
          transactions: acc.transactions || [], // Ensure transactions is at least an empty array
        }));

  
        if (user && Array.isArray(user.accounts)) {
          const userAccountIds = user.accounts; // ✅ Now TypeScript knows it's defined
          const accounts = allAccounts.filter(acc => userAccountIds.includes(acc.id));
          setUserAccounts(accounts);
          if (accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id);
          }
        } else {
          setUserAccounts([]);
          setSelectedAccountId(undefined);
        }
        
      } catch (error) {
        console.error('Error loading user accounts:', error);
        toast({
          title: "Error",
          description: "Unable to load your accounts from the server.",
          variant: "destructive",
        });
      }
    };
  
    if (user?.role === 'user') {
      fetchAccounts();
    }
  }, [user]);
  

  const selectedAccount = useMemo(() => {
    return userAccounts.find(acc => acc.id === selectedAccountId);
  }, [userAccounts, selectedAccountId]);

  const filteredTransactions = useMemo(() => {
    if (!selectedAccount || !Array.isArray(selectedAccount.transactions)) return [];
  
    let transactions = selectedAccount.transactions;
  
    if (dateRange?.from) {
      transactions = transactions.filter(t => new Date(t.date) >= dateRange.from!);
    }
    if (dateRange?.to) {
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const toDate = new Date(dateRange.to!);
        toDate.setHours(23, 59, 59, 999);
        return transactionDate <= toDate;
      });
    }
  
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedAccount, dateRange]);
  

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

  const handleDownload = (formatType: 'csv' | 'txt') => {
    if (!selectedAccount) return;

    if (formatType === 'csv') {
      const headers = ["Date", "Description", "Amount", "Currency", "Type"];
      const csvContent = [
        headers.join(','),
        ...filteredTransactions.map(tx => 
          [
            formatDateFns(new Date(tx.date), 'yyyy-MM-dd'), 
            `"${tx.description.replace(/"/g, '""')}"`, // Escape double quotes in description
            tx.amount.toFixed(2), 
            tx.currency, 
            tx.type
          ].join(',')
        )
      ].join('\n');
      downloadFile(csvContent, `transactions_${selectedAccount.accountNumber}.csv`, 'text/csv;charset=utf-8;');
    } else if (formatType === 'txt') {
      let content = `Account Report: ${selectedAccount.holderName} (${selectedAccount.accountNumber})\n`;
      content += `Type: ${selectedAccount.type}\n`;
      content += `Current Balance: ${selectedAccount.balance.toFixed(2)} ${selectedAccount.currency}\n`;
      content += `Report Generated on: ${new Date().toLocaleDateString()}\n\n`;
      content += `Transactions (${dateRange?.from ? formatDateFns(dateRange.from, 'MMM dd, yyyy') : 'Start'} - ${dateRange?.to ? formatDateFns(dateRange.to, 'MMM dd, yyyy') : 'End'}):\n`;
      content += "Date,Description,Amount,Currency,Type\n";
      filteredTransactions.forEach(tx => {
        content += `${formatDateFns(new Date(tx.date), 'yyyy-MM-dd')},"${tx.description.replace(/"/g, '""')}",${tx.amount.toFixed(2)},${tx.currency},${tx.type}\n`;
      });
      content += "\n\n--- End of Report ---";
      downloadFile(content, `account_report_${selectedAccount.accountNumber}.txt`, 'text/plain;charset=utf-8;');
    }
  };

  return (
    <ProtectedRoute requiredRole="user">
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary flex items-center">
              <Wallet className="mr-3 h-7 w-7" /> Your Accounts
            </CardTitle>
            <CardDescription>Select an account to view its details and transaction history.</CardDescription>
          </CardHeader>
          <CardContent>
            {userAccounts.length > 0 ? (
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-full md:w-1/2 lg:w-1/3 text-base">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {userAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id} className="text-base">
                      {acc.holderName} - {acc.type} ({acc.accountNumber.slice(-4)}) - Balance: {acc.balance.toFixed(2)} {acc.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-muted-foreground">No accounts found for your profile.</p>
            )}
          </CardContent>
        </Card>

        {selectedAccount && (
          <>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-primary flex items-center">
                  <DollarSign className="mr-2 h-6 w-6" /> Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <p><strong>Account Number:</strong> {selectedAccount.accountNumber}</p>
                <p><strong>Holder Name:</strong> {selectedAccount.holderName}</p>
                <p><strong>Account Type:</strong> {selectedAccount.type}</p>
                <p><strong>Current Balance:</strong> <span className="font-bold text-lg text-primary">{selectedAccount.balance.toFixed(2)} {selectedAccount.currency}</span></p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold text-primary flex items-center">
                        <ListFilter className="mr-2 h-6 w-6" /> Transaction History
                    </CardTitle>
                    <CardDescription>Filter transactions by date range.</CardDescription>
                  </div>
                  <div className="w-full md:w-auto md:min-w-[300px]">
                    <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell>{formatDateFns(new Date(tx.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{tx.description}</TableCell>
                          <TableCell className={`text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount.toFixed(2)} {tx.currency}
                          </TableCell>
                          <TableCell className="text-right">
                             <span className={`px-2 py-1 text-xs rounded-full ${tx.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                             </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No transactions found for the selected criteria.</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => handleDownload('csv')}>
                  <FileSpreadsheet className="mr-2 h-5 w-5" /> Download CSV
                </Button>
                <Button variant="outline" onClick={() => handleDownload('txt')}>
                  <FileText className="mr-2 h-5 w-5" /> Download Report (TXT)
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}


    