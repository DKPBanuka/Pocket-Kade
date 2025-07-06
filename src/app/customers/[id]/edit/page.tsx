
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCustomers } from '@/hooks/use-customers';
import CustomerForm from '@/components/customer-form';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import type { Customer } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useLanguage } from '@/contexts/language-context';

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const { getCustomer, isLoading, deleteCustomer } = useCustomers();
  const [customer, setCustomer] = useState<Customer | undefined>(undefined);
  const { t } = useLanguage();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  useEffect(() => {
    if (!isLoading && id) {
      const foundCustomer = getCustomer(id);
      if (foundCustomer) {
        setCustomer(foundCustomer);
      } else {
        router.push('/customers');
      }
    }
  }, [id, getCustomer, isLoading, router]);

  const handleDelete = () => {
    if (id) {
        deleteCustomer(id);
        router.push('/customers');
    }
  };

  if (isLoading || !customer) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
       <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">
              {t('customers.edit.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('customers.edit.desc', { customerName: customer.name })}
            </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('general.back')}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> {t('customers.edit.delete')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('customers.edit.delete_confirm_title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('customers.edit.delete_confirm_desc', { customerName: customer.name })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('invoice.view.go_back')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    {t('customers.edit.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
      <CustomerForm customer={customer} />
    </div>
  );
}
