// components/UploadTransactionsForm.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

export default function UploadTransactionsForm() {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "No file selected", description: "Please select a CSV file.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const lines = content.split(/\r?\n/).filter(line => line.trim() !== "");
      const headers = lines[0].split(',').map(h => h.trim());
      const expected = ['id','date','description','amount','type','currency','accountId'];
      const missing = expected.filter(col => !headers.includes(col));
      if (missing.length > 0) {
        toast({ title: "Invalid CSV", description: `Missing columns: ${missing.join(", ")}`, variant: "destructive" });
        return;
      }

      const transactions = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const tx: any = {};
        headers.forEach((h, i) => tx[h] = values[i]);
        tx.amount = parseFloat(tx.amount);
        tx.id = tx.id || uuidv4(); // auto generate if missing
        return tx;
      });

      try {
        const res = await fetch('/api/upload-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({transactions})
        });

        const data = await res.json();
        if (res.ok) {
          toast({ title: "Success", description: data.message || "Transactions uploaded successfully." });
        } else {
          toast({ title: "Upload Failed", description: data.message || "Something went wrong.", variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to upload transactions.", variant: "destructive" });
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3">
      <Input type="file" accept=".csv" onChange={handleFileChange} />
      <Button onClick={handleUpload}>Upload Transactions</Button>
    </div>
  );
}
