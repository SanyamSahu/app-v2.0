import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export default function CreateAccountForm() {
  const [form, setForm] = useState({
    userId: '',
    accountNumber: '',
    holderName: '',
    balance: '',
    currency: '',
    type: ''
  });
  const [userDetails, setUserDetails] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    contact: '',
    address: ''
  });
  const [showUserForm, setShowUserForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
  };

  const checkUserExists = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      return res.ok;
    } catch {
      return false;
    }
  };

  const createUser = async () => {
    const { username, password, name, email, contact, address } = userDetails;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.userId,
          username,
          password,
          role: 'user',
          name,
          email,
          contact,
          address
        })
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const { userId, accountNumber, holderName, balance, currency, type } = form;
    if (!userId || !accountNumber || !holderName || !balance || !currency || !type) {
      toast({ title: 'Missing Fields', description: 'Please fill all the fields.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const exists = await checkUserExists(userId);
      if (!exists && !showUserForm) {
        setShowUserForm(true);
        toast({ title: 'User Not Found', description: 'Please provide user details to create a new user.' });
        setIsSubmitting(false);
        return;
      }

      if (!exists && showUserForm) {
        const created = await createUser();
        if (!created) {
          toast({ title: 'User Creation Failed', description: 'Unable to create user.', variant: 'destructive' });
          setIsSubmitting(false);
          return;
        }
      }

      const res = await fetch('/api/upload-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          {
            id: uuidv4(),
            userId,
            accountNumber,
            holderName,
            balance: parseFloat(balance),
            currency,
            type,
            transactions: []
          }
        ])
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Success', description: data.message });
        setForm({ userId: '', accountNumber: '', holderName: '', balance: '', currency: '', type: '' });
        setUserDetails({ username: '', password: '', name: '', email: '', contact: '', address: '' });
        setShowUserForm(false);
      } else {
        toast({ title: 'Error', description: data.message || 'Something went wrong.', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to create account.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto mt-8 shadow-lg">
      <CardHeader>
        <CardTitle>Create New Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>User ID</Label>
            <Input name="userId" value={form.userId} onChange={handleChange} required />
          </div>
          <div>
            <Label>Account Number</Label>
            <Input name="accountNumber" value={form.accountNumber} onChange={handleChange} required />
          </div>
          <div>
            <Label>Holder Name</Label>
            <Input name="holderName" value={form.holderName} onChange={handleChange} required />
          </div>
          <div>
            <Label>Balance</Label>
            <Input name="balance" type="number" step="0.01" value={form.balance} onChange={handleChange} required />
          </div>
          <div>
            <Label>Currency</Label>
            <Input name="currency" value={form.currency} onChange={handleChange} required />
          </div>
          <div>
            <Label>Type</Label>
            <Input name="type" value={form.type} onChange={handleChange} required />
          </div>

          {showUserForm && (
            <>
              <hr className="my-4" />
              <h3 className="font-semibold text-primary">Create New User</h3>
              <div>
                <Label>Username</Label>
                <Input name="username" value={userDetails.username} onChange={handleUserChange} required />
              </div>
              <div>
                <Label>Password</Label>
                <Input name="password" type="password" value={userDetails.password} onChange={handleUserChange} required />
              </div>
              <div>
                <Label>Name</Label>
                <Input name="name" value={userDetails.name} onChange={handleUserChange} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" value={userDetails.email} onChange={handleUserChange} required />
              </div>
              <div>
                <Label>Contact</Label>
                <Input name="contact" value={userDetails.contact} onChange={handleUserChange} />
              </div>
              <div>
                <Label>Address</Label>
                <Input name="address" value={userDetails.address} onChange={handleUserChange} />
              </div>
            </>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
