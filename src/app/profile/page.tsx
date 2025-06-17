
"use client";

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import ProtectedRoute from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserIcon, Mail, Phone, Home, Shield, UserSquare2 } from 'lucide-react'; // Renamed User to UserIcon to avoid conflict with User type

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <p>Loading user profile...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary flex items-center">
            <UserSquare2 className="mr-3 h-8 w-8" /> User Profile
          </h1>
          <p className="text-muted-foreground">View your personal information and account details.</p>
        </header>

        <Card className="shadow-lg w-full max-w-2xl mx-auto">
          <CardHeader className="items-center text-center">
            <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-background">
              <AvatarImage 
                src={`https://placehold.co/100x100.png?text=${user.username.charAt(0).toUpperCase() || '?'}`} 
                alt={user.username} 
                data-ai-hint="user avatar large"
              />
              <AvatarFallback className="text-3xl">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <CardDescription>@{user.username} - <span className="capitalize">{user.role}</span></CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-start p-3 border-b">
              <Mail className="h-5 w-5 mr-4 mt-1 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Email Address</p>
                <p className="font-medium text-base">{user.email}</p>
              </div>
            </div>

            {user.contact && (
              <div className="flex items-start p-3 border-b">
                <Phone className="h-5 w-5 mr-4 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact Number</p>
                  <p className="font-medium text-base">{user.contact}</p>
                </div>
              </div>
            )}

            {user.address && (
              <div className="flex items-start p-3">
                <Home className="h-5 w-5 mr-4 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium text-base whitespace-pre-line">{user.address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
