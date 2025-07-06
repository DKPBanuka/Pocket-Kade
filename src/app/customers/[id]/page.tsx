
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { useCustomers } from '@/hooks/use-customers';
import { useInvoices } from '@/hooks/use-invoices';
import { useAuth } from '@/contexts/auth-context';
import type { Customer, Invoice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Edit, Phone, Mail, MapPin, FileText } from 'lucide-react';
import InvoiceList from '@/components/invoice-list';
import { useLanguage } from '@/contexts/language-context';

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | null }) {
    if (!value) return null;
    return (
        <div className="flex items-start text-sm">
            <Icon className="h-4 w-4 text-muted-foreground mr-3 mt-1 flex-shrink-0" />
            <div>
                <p className="text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    );
}

export default function ViewCustomerPage() {
    const router = useRouter();
    const params = useParams();
    const { getCustomer, isLoading: customersLoading } = useCustomers();
    const { invoices, isLoading: invoicesLoading } = useInvoices();
    const { user, isLoading: authLoading } = useAuth();
    const { t } = useLanguage();

    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [customer, setCustomer] = useState<Customer | null>(null);

    const isLoading = customersLoading || invoicesLoading || authLoading;

    useEffect(() => {
        if (!customersLoading && id) {
            setCustomer(getCustomer(id) || null);
        }
    }, [id, getCustomer, customersLoading]);

    const customerInvoices = useMemo(() => {
        return invoices.filter(invoice => invoice.customerId === id && invoice.status !== 'Cancelled');
    }, [invoices, id]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!customer) {
        return (
            <div className="container mx-auto max-w-2xl p-4 sm:p-6 lg:p-8 text-center">
                <h1 className="text-2xl font-bold">{t('customer.view.not_found_title')}</h1>
                <p className="text-muted-foreground mt-2">{t('customer.view.not_found_desc')}</p>
                <Button onClick={() => router.push('/customers')} className="mt-6">{t('customer.view.go_to_customers')}</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline tracking-tight">{customer.name}</h1>
                    <p className="text-muted-foreground">{t('customer.view.title')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> {t('general.back')}
                    </Button>
                    <Link href={`/customers/${customer.id}/edit`} passHref>
                        <Button><Edit className="mr-2 h-4 w-4" /> {t('customer.view.edit')}</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('customer.view.contact_info')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoItem icon={Phone} label={t('customer.view.phone')} value={customer.phone} />
                            <InfoItem icon={Mail} label={t('customer.view.email')} value={customer.email} />
                            <InfoItem icon={MapPin} label={t('customer.view.address')} value={customer.address} />
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" /> {t('customer.view.invoice_history')}
                            </CardTitle>
                            <CardDescription>
                               {t('customer.view.invoice_history_desc', { customerName: customer.name })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {customerInvoices.length > 0 ? (
                                <InvoiceList invoices={customerInvoices} />
                            ) : (
                                <p className="text-sm text-center text-muted-foreground py-8">
                                    {t('customer.view.no_invoices')}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
