
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { changePasswordSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';

type FormData = z.infer<typeof changePasswordSchema>;

export function PasswordSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<FormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user || !user.email) {
      toast({ title: t('general.error'), description: t('settings.password.error_no_user'), variant: 'destructive' });
      return;
    }
    
    if (!auth.currentUser) return;

    const credential = EmailAuthProvider.credential(user.email, data.currentPassword);

    try {
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, data.newPassword);
      toast({ title: t('settings.password.success_title'), description: t('settings.password.success_desc') });
      form.reset();
    } catch (error: any) {
        if (error.code === 'auth/wrong-password') {
             toast({ title: t('general.error'), description: t('settings.password.error_wrong_password'), variant: 'destructive' });
        } else {
            console.error(error);
            toast({ title: t('general.error'), description: t('settings.password.error_generic'), variant: 'destructive' });
        }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.password.title')}</CardTitle>
        <CardDescription>{t('settings.password.desc')}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.password.current_label')}</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.password.new_label')}</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardContent>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('settings.password.save_btn')}
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
