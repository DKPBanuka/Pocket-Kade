
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock } from 'lucide-react';
import Logo from '@/components/logo';

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

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: t('login.success.title'), description: t('login.success.desc') });
      // The AuthProvider will handle redirection upon successful login
    } catch (err: any) {
      setError(t('login.error.invalid'));
      toast({ title: t('login.error.title'), description: t('login.error.invalid'), variant: "destructive" });
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
      // The auth context will handle new user creation/redirect
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

  const handleGuestLogin = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('isGuest', 'true');
      sessionStorage.removeItem('tourClosed'); // Reset tour state for new guest sessions
    }
    router.push('/');
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center">
                <Logo />
            </div>
            <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-headline">{t('login.title')}</CardTitle>
                <CardDescription>{t('login.desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                        {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                        Sign in with Google
                    </Button>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                            {t('login.or_continue')}
                            </span>
                        </div>
                    </div>
                </div>
                <form onSubmit={handleLogin} className="space-y-6 mt-4">
                <div className="space-y-2">
                    <Label htmlFor="email">{t('login.email_label')}</Label>
                    <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                    />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">{t('login.password_label')}</Label>
                        <Link
                            href="/forgot-password"
                            className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        />
                    </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('login.login_btn')}
                </Button>
                </form>
                <div className="mt-4 text-center text-sm">
                    {t('login.no_account')}{" "}
                    <Link href="/signup" className="underline">
                        {t('login.signup_link')}
                    </Link>
                </div>
                <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    or
                    </span>
                </div>
                </div>

                <Button
                variant="outline"
                className="w-full"
                onClick={handleGuestLogin}
                >
                {t('login.guest_btn')}
                </Button>
            </CardContent>
            </Card>
        </div>
    </main>
  );
}
