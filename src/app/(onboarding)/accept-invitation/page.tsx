
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getInvitationDetailsAction, finalizeInvitationAction } from '@/app/actions';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { acceptInvitationSchema } from '@/lib/schemas';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/logo';
import { useLanguage } from '@/contexts/language-context';

type FormData = z.infer<typeof acceptInvitationSchema>;

function AcceptInvitationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { t } = useLanguage();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError(t('users.accept.error_missing_token'));
            setIsLoading(false);
            return;
        }

        const verifyToken = async () => {
            const result = await getInvitationDetailsAction(token);
            if (result.success && result.invitation) {
                setEmail(result.invitation.email);
            } else {
                setError(result.error || t('users.accept.error_verify_failed'));
            }
            setIsLoading(false);
        };

        verifyToken();
    }, [token, t]);

    const form = useForm<FormData>({
        resolver: zodResolver(acceptInvitationSchema),
        defaultValues: { username: '', password: '' },
    });

    const onSubmit = async (data: FormData) => {
        if (!token || !email) {
             toast({ title: t('general.error'), description: t('users.accept.error_generic'), variant: "destructive" });
             return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, data.password);
            const uid = userCredential.user.uid;

            const finalizationResult = await finalizeInvitationAction(uid, data.username, token);

            if (finalizationResult.success) {
                // Sign out the user immediately after creation to prevent race conditions
                // with the AuthProvider. This forces a clean login where their data will exist.
                await signOut(auth);
                toast({ title: t('users.accept.success_title'), description: t('users.accept.success_desc') });
                router.push('/login');
            } else {
                setError(finalizationResult.error || t('users.accept.error_finalize_failed'));
            }

        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError(t('users.accept.error_email_exists'));
            } else {
                setError(t('users.accept.error_create_failed'));
                console.error(err);
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) {
        return <Loader2 className="h-8 w-8 animate-spin" />;
    }

    if (error) {
        return <p className="text-center text-destructive">{error}</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('users.accept.title')}</CardTitle>
                <CardDescription>{t('users.accept.desc')}</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <FormItem>
                            <FormLabel>{t('users.invite.email_label')}</FormLabel>
                            <FormControl><Input value={email || ''} readOnly disabled /></FormControl>
                        </FormItem>
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('users.accept.username_label')}</FormLabel>
                                    <FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('users.accept.password_label')}</FormLabel>
                                    <FormControl><Input type="password" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         {error && <p className="text-sm text-destructive">{error}</p>}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                             {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('users.accept.create_btn')}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}

export default function AcceptInvitationPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="flex justify-center">
                    <Logo />
                </div>
                 <Suspense fallback={<div className="flex justify-center pt-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                    <AcceptInvitationContent />
                </Suspense>
            </div>
        </div>
    );
}
