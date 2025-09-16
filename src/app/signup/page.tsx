
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '@/contexts/language-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, User, Mail, Lock } from 'lucide-react';
import Logo from '@/components/logo';

const signupSchema = z.object({
  organizationName: z.string().min(3, 'Organization name must be at least 3 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormData = z.infer<typeof signupSchema>;

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.655-3.397-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.988,35.091,44,30.022,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
    )
}

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const batch = writeBatch(db);
      const orgRef = doc(collection(db, 'organizations'));
      batch.set(orgRef, {
        name: data.organizationName,
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
        onboardingCompleted: false,
        selectedTheme: 'system',
      });
      const tenantId = orgRef.id;

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
      
      toast({ 
          title: t('signup.success.title'), 
          description: t('signup.success.desc'),
      });
      router.push('/login');

    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError(t('signup.error.email_in_use'));
      } else {
        setError(t('signup.error.generic'));
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The auth context will handle new user creation & redirect
      toast({ title: "Signed In with Google!", description: "Welcome to Pocket Kade." });
      router.push('/');
    } catch(err: any) {
       console.error("Google Sign-in error", err);
       setError("Failed to sign in with Google.");
       toast({ title: "Google Sign-in Failed", description: err.message, variant: "destructive" });
    } finally {
        setIsGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
            <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">{t('signup.title')}</CardTitle>
            <CardDescription>{t('signup.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                    {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                    Sign up with Google
                </Button>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                            Or with email
                        </span>
                    </div>
                </div>
            </div>
            <form onSubmit={handleSubmit(handleSignup)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">{t('signup.org_name_label')}</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input suppressHydrationWarning id="organizationName" type="text" {...register('organizationName')} className="pl-10"/>
                </div>
                {errors.organizationName && <p className="text-sm text-destructive mt-1">{errors.organizationName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">{t('signup.username_label')}</Label>
                 <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input suppressHydrationWarning id="username" type="text" {...register('username')} className="pl-10"/>
                </div>
                {errors.username && <p className="text-sm text-destructive mt-1">{errors.username.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('signup.email_label')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input suppressHydrationWarning id="email" type="email" {...register('email')} className="pl-10"/>
                </div>
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('signup.password_label')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input suppressHydrationWarning id="password" type="password" {...register('password')} className="pl-10"/>
                </div>
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
              </div>
              
              {error && <p className="text-sm text-destructive">{error}</p>}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('signup.create_btn')}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
                {t('signup.have_account')}{" "}
                <Link href="/login" className="underline">
                    {t('signup.login_link')}
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
