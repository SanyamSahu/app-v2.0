'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function UploadUsersForm() {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload-users', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      toast({ title: 'Success', description: 'Users uploaded successfully!' });
    } else {
      const data = await res.json();
      toast({ title: 'Error', description: data.error || 'Failed to upload users', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <Input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} />
      <Button onClick={handleUpload}>Upload Users CSV</Button>
    </div>
  );
}
