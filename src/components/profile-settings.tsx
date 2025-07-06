
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { updateUserProfileSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { updateUserProfileAction } from '@/app/actions';

type FormData = z.infer<typeof updateUserProfileSchema>;

export function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<FormData>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      username: user?.username || '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({ title: t('general.error'), description: t('settings.profile.error_not_logged_in'), variant: 'destructive' });
      return;
    }
    const result = await updateUserProfileAction(user.uid, data);
    if (result.success) {
      toast({ title: t('settings.profile.success_title'), description: t('settings.profile.success_desc') });
    } else {
      toast({ title: t('general.error'), description: result.error || t('settings.profile.error_generic'), variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.profile.title')}</CardTitle>
        <CardDescription>{t('settings.profile.desc')}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.profile.username_label')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>{t('users.invite.email_label')}</FormLabel>
              <Input value={user?.email || ''} readOnly disabled />
            </FormItem>
          </CardContent>
          <CardContent>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('settings.profile.save_btn')}
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
