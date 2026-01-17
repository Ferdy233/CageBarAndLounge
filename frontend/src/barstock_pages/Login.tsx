"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wine, Lock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LoginPage() {
  const router = useRouter();
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const resolvedUser = await login(staffId, password);

    if (resolvedUser) {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      router.push(resolvedUser.role === 'admin' ? '/barstock/dashboard' : '/barstock/dashboard/inventory');
    } else {
      toast({
        title: 'Login failed',
        description: 'Invalid Staff ID or password. Please try again.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md glass-card relative z-10 animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full gradient-gold flex items-center justify-center glow-primary">
            <Wine className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display text-gradient-gold">
              Cage Bar and Lounge
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your credentials to access the system
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staffId" className="text-foreground">
                Staff ID
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="staffId"
                  type="text"
                  placeholder="Enter your Staff ID"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="pl-10 bg-input border-border focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-input border-border focus:ring-primary"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gradient-gold text-primary-foreground font-semibold glow-primary hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
