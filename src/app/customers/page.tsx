
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Users, Download, Contact } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomers } from '@/hooks/use-customers';
import CustomerList from '@/components/customer-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { exportToCsv } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';

export default function CustomersPage() {
  const { customers, isLoading } = useCustomers();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleExport = () => {
    const dataToExport = filteredCustomers.map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      createdAt: format(new Date(customer.createdAt), 'yyyy-MM-dd'),
    }));

    const headers = {
      id: 'Customer ID',
      name: 'Name',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      createdAt: 'Date Added',
    };

    exportToCsv(dataToExport, `customers-${new Date().toISOString().split('T')[0]}`, headers);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            {t('customers.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('customers.desc')}
          </p>
        </div>
        {user && (
          <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  {t('customers.export')}
              </Button>
              <Link href="/customers/new" passHref>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('customers.new')}
                </Button>
              </Link>
          </div>
        )}
      </div>

       {(user && customers.length > 0) || (user && searchTerm) ? (
        <>
          <div className="mb-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                type="text"
                placeholder={t('customers.search_placeholder')}
                className="w-full py-3 pl-10 pr-4 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
          <CustomerList customers={filteredCustomers} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-card/50 p-12 text-center">
          <Contact className="mx-auto h-12 w-12 text-muted-foreground" />
            {user ? (
              <>
                <h3 className="mt-4 text-xl font-semibold font-headline">{t('customers.no_customers_title')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t('customers.no_customers_desc')}</p>
                <Link href="/customers/new" passHref>
                  <Button className="mt-6">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('customers.add_customer_btn')}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-xl font-semibold font-headline">Showcasing Customer Management</h3>
                <p className="mt-2 text-sm text-muted-foreground">This is where your customers would appear. Create a free account to start managing your own customer data.</p>
                <Link href="/signup" passHref>
                  <Button className="mt-6">Sign Up Free</Button>
                </Link>
              </>
            )}
        </div>
      )}
    </div>
  );
}
