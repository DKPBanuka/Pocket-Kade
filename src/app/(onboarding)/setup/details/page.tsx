
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { doc, updateDoc } from 'firebase/firestore';

import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { organizationDetailsSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type FormData = z.infer<typeof organizationDetailsSchema>;

export default function DetailsPage() {
  const { user, organization } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Redirect staff members away from this page as it's for admins/owners only.
    if (user && user.activeRole === 'staff') {
      router.push('/setup/language');
    }
  }, [user, router]);


  const form = useForm<FormData>({
    resolver: zodResolver(organizationDetailsSchema),
    defaultValues: {
      name: organization?.name || '',
      address: organization?.address || '',
      phone: organization?.phone || '',
      brn: organization?.brn || '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user || !user.activeTenantId) {
      toast({ title: 'Error', description: 'Could not find your organization.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const orgDocRef = doc(db, 'organizations', user.activeTenantId);
      await updateDoc(orgDocRef, { ...data });
      router.push('/setup/language');
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({ title: 'Error', description: 'Could not save details. Please try again.', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  if (!user || user.activeRole === 'staff') {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="text-2xl">Tell us about your Business</CardTitle>
            <CardDescription>This information will appear on your invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
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
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="123 Main St, Colombo" {...field} /></FormControl>
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
                        <FormLabel>Phone Number (Optional)</FormLabel>
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
                        <FormLabel>Business Registration No. (Optional)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
          </CardContent>
          <CardFooter className="gap-2">
             <Button type="button" variant="ghost" onClick={() => router.push('/setup/language')}>Skip</Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Continue'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
