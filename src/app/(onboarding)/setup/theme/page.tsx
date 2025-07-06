
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Monitor, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const themes = [
  { name: 'Light', class: 'light', icon: Sun },
  { name: 'Dark', class: 'dark', icon: Moon },
  { name: 'Default', class: 'system', icon: Monitor },
];

export default function ThemePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState('system');
  const [isLoading, setIsLoading] = useState(false);

  const handleFinish = async () => {
    if (!user || !user.activeTenantId) {
      toast({ title: 'Error', description: 'Could not find your organization.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      // Use a batch to update both documents atomically
      const batch = writeBatch(db);

      // 1. Update organization document
      const orgDocRef = doc(db, 'organizations', user.activeTenantId);
      batch.update(orgDocRef, {
        selectedTheme: selectedTheme,
        onboardingCompleted: true,
      });

      // 2. Update user document
      const userDocRef = doc(db, 'users', user.uid);
      batch.update(userDocRef, {
        onboardingCompleted: true,
      });
      
      // Commit the batch
      await batch.commit();

      // The auth provider will redirect automatically after a state update.
      // A hard reload is a robust way to ensure all contexts are refreshed.
      window.location.href = '/';
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({ title: 'Error', description: 'Could not save settings. Please try again.', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Choose a Look & Feel</CardTitle>
        <CardDescription>Select a theme for your workspace. You can change this later.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {themes.map((theme) => {
          const Icon = theme.icon;
          return (
            <div key={theme.class} onClick={() => setSelectedTheme(theme.class)} className="cursor-pointer">
              <div
                className={cn(
                  'rounded-lg border-2 p-4 transition-all',
                  selectedTheme === theme.class ? 'border-primary' : 'border-muted'
                )}
              >
                <div className={cn('space-y-2 rounded-sm bg-background p-2 shadow-sm', theme.class === 'system' ? '' : theme.class)}>
                  <div className="space-y-2 rounded-md bg-card p-2 shadow-sm">
                    <div className="h-4 w-4/5 rounded-lg bg-primary" />
                    <div className="h-2 w-full rounded-lg bg-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 rounded-md bg-card p-2 shadow-sm">
                    <div className="h-4 w-4 rounded-full bg-primary" />
                    <div className="h-2 w-4/5 rounded-lg bg-muted-foreground" />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{theme.name}</span>
                    </div>
                  {selectedTheme === theme.class && <Check className="h-5 w-5 text-primary" />}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
      <CardFooter>
        <Button onClick={handleFinish} disabled={isLoading} className="w-full">
          Finish Setup
        </Button>
      </CardFooter>
    </Card>
  );
}
