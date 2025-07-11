
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText, Download, Settings, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInvoices } from '@/hooks/use-invoices';
import { useInventory } from '@/hooks/use-inventory';
import InvoiceList from '@/components/invoice-list';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Invoice, InvoiceStatus } from '@/lib/types';
import { format } from 'date-fns';
import { exportToCsv } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';
import { InvoiceSettingsDialog } from '@/components/invoice-settings-dialog';

const calculateTotal = (invoice: Invoice): number => {
  const subtotal = invoice.lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
  let discountAmount = 0;
  if (invoice.discountType === 'percentage') {
      discountAmount = subtotal * ((invoice.discountValue || 0) / 100);
  } else if (invoice.discountType === 'fixed') {
      discountAmount = invoice.discountValue || 0;
  }
  return subtotal - discountAmount;
};

const calculatePaid = (invoice: Invoice): number => {
    return invoice.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
};

export default function InvoicesPage() {
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { inventory, isLoading: inventoryLoading } = useInventory();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const isLoading = invoicesLoading || authLoading || inventoryLoading;

  const uniqueCategories = useMemo(() => {
    const categories = new Set(inventory.map(item => item.category).filter(Boolean));
    return ['All', ...Array.from(categories).sort()];
  }, [inventory]);

  const activeInvoices = useMemo(() => {
    return invoices.filter(invoice => invoice.status !== 'Cancelled');
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return activeInvoices.filter(
      (invoice) => {
        const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
        const matchesSearch = 
            invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = categoryFilter === 'All' || invoice.lineItems.some(lineItem => {
            const item = inventory.find(i => i.name === lineItem.description);
            return item && item.category === categoryFilter;
        });
        
        return matchesSearch && matchesStatus && matchesCategory;
      }
    );
  }, [activeInvoices, searchTerm, statusFilter, categoryFilter, inventory]);

  const handleExport = () => {
    const dataToExport = filteredInvoices.map(invoice => {
        const total = calculateTotal(invoice);
        const paid = calculatePaid(invoice);

        return {
            id: invoice.id,
            customerName: invoice.customerName,
            customerPhone: invoice.customerPhone || '',
            status: invoice.status,
            createdAt: format(new Date(invoice.createdAt), 'yyyy-MM-dd'),
            total: total.toFixed(2),
            paid: paid.toFixed(2),
            due: (total - paid).toFixed(2),
        };
    });

    const headers = {
        id: 'Invoice #',
        customerName: 'Customer Name',
        customerPhone: 'Customer Phone',
        status: 'Status',
        createdAt: 'Date',
        total: 'Total Amount (Rs.)',
        paid: 'Amount Paid (Rs.)',
        due: 'Amount Due (Rs.)'
    };

    exportToCsv(dataToExport, `invoices-${new Date().toISOString().split('T')[0]}`, headers);
  };

  const isPrivilegedUser = user?.activeRole === 'admin' || user?.activeRole === 'owner';

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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
       <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">
              {t('invoices.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('invoices.desc')}
            </p>
          </div>
          {user && (
            <div className="flex items-center gap-2">
                {isPrivilegedUser && (
                  <InvoiceSettingsDialog>
                      <Button variant="outline" size="sm" className="w-9 px-0 sm:w-auto sm:px-3">
                          <Settings className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only sm:ml-2">Customize</span>
                      </Button>
                  </InvoiceSettingsDialog>
                )}
                <Button variant="outline" onClick={handleExport} size="sm" className="w-9 px-0 sm:w-auto sm:px-3">
                    <Download className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:ml-2">{t('invoices.export')}</span>
                </Button>
                <Link href="/invoice/new" passHref>
                  <Button id="new-invoice-button">
                    <Plus className="h-5 w-5" />
                    <span className="sm:ml-2">{t('invoices.new')}</span>
                  </Button>
                </Link>
            </div>
          )}
      </div>

      {(user && invoices.length > 0) || (!user && !isLoading) ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                type="text"
                placeholder={t('invoices.search_placeholder')}
                className="w-full py-3 pl-10 pr-4 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select onValueChange={(value) => setStatusFilter(value as InvoiceStatus | 'All')} defaultValue="All">
                <SelectTrigger className="shadow-sm">
                    <SelectValue placeholder={t('invoices.filter_status')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">{t('invoices.status.all')}</SelectItem>
                    <SelectItem value="Paid">{t('invoices.status.paid')}</SelectItem>
                    <SelectItem value="Partially Paid">{t('invoices.status.partially_paid')}</SelectItem>
                    <SelectItem value="Unpaid">{t('invoices.status.unpaid')}</SelectItem>
                </SelectContent>
            </Select>
            <Select onValueChange={(value) => setCategoryFilter(value)} defaultValue="All">
                <SelectTrigger className="shadow-sm">
                    <SelectValue placeholder={t('invoices.filter_category')} />
                </SelectTrigger>
                <SelectContent>
                     {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <InvoiceList invoices={filteredInvoices} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-card/50 p-12 text-center">
            <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
            {user ? (
              <>
                <h3 className="mt-4 text-xl font-semibold font-headline">{t('invoices.no_invoices_title')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t('invoices.no_invoices_desc')}</p>
                <Link href="/invoice/new" passHref>
                  <Button className="mt-6">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('invoices.create_invoice_btn')}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-xl font-semibold font-headline">Manage Invoices with Ease</h3>
                <p className="mt-2 text-sm text-muted-foreground">This is where your invoices will appear. Create, track, and manage all your billing in one place.</p>
                <Link href="/signup" passHref>
                  <Button className="mt-6">Sign Up to Get Started</Button>
                </Link>
              </>
            )}
        </div>
      )}
    </div>
  );
}
