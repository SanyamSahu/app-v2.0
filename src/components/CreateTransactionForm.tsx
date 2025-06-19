'use client';

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

export default function CreateTransactionForm() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [form, setForm] = useState({
    accountId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    amount: '',
    currency: '',
    type: 'credit',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/accounts');
        const data = await res.json();
        setAccounts(data);
      } catch (err) {
        console.error('Error loading accounts:', err);
        toast({ title: 'Error', description: 'Could not load accounts.', variant: 'destructive' });
      }
    }
    fetchAccounts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const { accountId, date, description, amount, currency, type } = form;
    if (!accountId || !date || !amount || !currency || !type) {
      toast({ title: 'Missing Fields', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uuidv4(),
          accountId,
          date,
          description,
          amount: parseFloat(amount),
          currency,
          type,
        }),
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Transaction added successfully.' });
        setForm({ accountId: '', date: format(new Date(), 'yyyy-MM-dd'), description: '', amount: '', currency: '', type: 'credit' });
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.message || 'Failed to add transaction.', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to add transaction.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto mt-8 shadow-lg">
      <CardHeader>
        <CardTitle>Add New Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Select Account</Label>
            <Select
              value={form.accountId}
              onValueChange={(value) => setForm({ ...form, accountId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an account..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.holderName} ({acc.accountNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date</Label>
            <Input name="date" type="date" value={form.date} onChange={handleChange} required />
          </div>

          <div>
            <Label>Description</Label>
            <Input name="description" value={form.description} onChange={handleChange} />
          </div>

          <div>
            <Label>Amount</Label>
            <Input name="amount" type="number" step="0.01" value={form.amount} onChange={handleChange} required />
          </div>

          <div>
            <Label>Currency</Label>
            <Input name="currency" value={form.currency} onChange={handleChange} required />
          </div>

          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(val) => setForm({ ...form, type: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="debit">Debit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
