
"use client";

import { useRouter } from 'next/navigation';
import CustomerForm from '@/components/customer-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

export default function NewCustomerPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            {t('customers.new.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('customers.new.desc')}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('general.back')}
        </Button>
      </div>
      <CustomerForm />
    </div>
  );
}
