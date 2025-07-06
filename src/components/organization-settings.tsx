
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/contexts/auth-context';
import { organizationSettingsSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { updateOrganizationAction } from '@/app/actions';

type FormData = z.infer<typeof organizationSettingsSchema>;

export function OrganizationSettings() {
  const { user, organization } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      name: organization?.name || '',
      address: organization?.address || '',
      phone: organization?.phone || '',
      brn: organization?.brn || '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user || !user.activeTenantId) {
      toast({ title: t('general.error'), description: t('settings.organization.error_not_found'), variant: 'destructive' });
      return;
    }
    
    const result = await updateOrganizationAction(user.activeTenantId, data);
    if (result.success) {
      toast({ title: t('settings.organization.success_title'), description: t('settings.organization.success_desc') });
    } else {
      toast({ title: t('general.error'), description: result.error || t('settings.organization.error_generic'), variant: 'destructive' });
    }
  };

  if (!organization) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.organization.title')}</CardTitle>
        <CardDescription>{t('settings.organization.desc')}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.organization.name_label')}</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.organization.address_label')}</FormLabel>
                  <FormControl><Textarea placeholder={t('settings.organization.address_placeholder')} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('settings.organization.phone_label')}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="brn"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('settings.organization.brn_label')}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
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
