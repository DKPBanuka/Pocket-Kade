
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, addDoc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Logo from '@/components/logo';

const signupSchema = z.object({
  organizationName: z.string().min(3, 'Organization name must be at least 3 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const batch = writeBatch(db);

      // 2. Create new organization (tenant)
      const orgRef = doc(collection(db, 'organizations'));
      batch.set(orgRef, {
        name: data.organizationName,
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
        onboardingCompleted: false,
        selectedTheme: 'default',
      });
      const tenantId = orgRef.id;

      // 3. Create user document and link to tenant
      const userDocRef = doc(db, 'users', user.uid);
      batch.set(userDocRef, {
        username: data.username,
        email: data.email,
        onboardingCompleted: false,
        tenants: {
          [tenantId]: 'owner',
        },
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      toast({ title: "Account Created!", description: "Welcome to Pocket Kade. Please log in." });
      router.push('/login');

    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already in use.');
      } else {
        setError('An unexpected error occurred. Please try again.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
            <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Create Your Account</CardTitle>
            <CardDescription>Get started with your own workspace in seconds.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleSignup)} className="space-y-4">
              <div>
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input id="organizationName" type="text" {...register('organizationName')} />
                {errors.organizationName && <p className="text-sm text-destructive mt-1">{errors.organizationName.message}</p>}
              </div>
               <div>
                <Label htmlFor="username">Your Name / Username</Label>
                <Input id="username" type="text" {...register('username')} />
                {errors.username && <p className="text-sm text-destructive mt-1">{errors.username.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
              </div>
              
              {error && <p className="text-sm text-destructive">{error}</p>}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                    Log in
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
