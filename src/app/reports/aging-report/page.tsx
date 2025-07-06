
"use client";

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoices } from '@/hooks/use-invoices';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { differenceInDays, startOfDay } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { Invoice } from '@/lib/types';

const formatCurrency = (amount: number) => `Rs.${amount.toFixed(2)}`;

const calculateDueAmount = (invoice: Invoice): number => {
    const total = invoice.lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    let discountAmount = 0;
    if (invoice.discountType === 'percentage') {
        discountAmount = total * ((invoice.discountValue || 0) / 100);
    } else {
        discountAmount = invoice.discountValue || 0;
    }
    const finalTotal = total - discountAmount;
    const paid = invoice.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
    return finalTotal - paid;
};

interface AgingData {
    current: number;
    '1-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
    invoices: InvoiceWithDue[];
}
interface InvoiceWithDue extends Invoice {
    dueAmount: number;
    daysOverdue: number;
}

function AgingReport({ invoices }: { invoices: Invoice[] }) {
    const { t } = useLanguage();
    const today = startOfDay(new Date());

    const agingData: AgingData = useMemo(() => {
        const data: AgingData = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0, invoices: [] };

        invoices
            .filter(inv => (inv.status === 'Unpaid' || inv.status === 'Partially Paid'))
            .forEach(inv => {
                const dueAmount = calculateDueAmount(inv);
                if (dueAmount <= 0) return;

                const invoiceDate = new Date(inv.createdAt);
                const daysOverdue = differenceInDays(today, invoiceDate);
                
                data.invoices.push({ ...inv, dueAmount, daysOverdue });

                if (daysOverdue <= 0) data.current += dueAmount;
                else if (daysOverdue <= 30) data['1-30'] += dueAmount;
                else if (daysOverdue <= 60) data['31-60'] += dueAmount;
                else if (daysOverdue <= 90) data['61-90'] += dueAmount;
                else data['90+'] += dueAmount;
            });
        
        data.invoices.sort((a,b) => b.daysOverdue - a.daysOverdue);
        return data;

    }, [invoices, today]);

    const chartData = [
        { name: t('analysis.aging.current'), total: agingData.current },
        { name: t('analysis.aging.days_1_30'), total: agingData['1-30'] },
        { name: t('analysis.aging.days_31_60'), total: agingData['31-60'] },
        { name: t('analysis.aging.days_61_90'), total: agingData['61-90'] },
        { name: t('analysis.aging.days_90_plus'), total: agingData['90+'] },
    ];
    
    const chartConfig = { total: { label: t('analysis.aging.due_amount'), color: "hsl(var(--primary))" } };

    const totalDue = chartData.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('analysis.aging.summary_chart_title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-80 w-full">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickFormatter={(value) => `Rs.${Number(value) / 1000}k`} />
                            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
                            <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('analysis.aging.details_table_title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('analysis.aging.table.invoice_id')}</TableHead>
                                    <TableHead>{t('analysis.aging.table.customer')}</TableHead>
                                    <TableHead>{t('analysis.aging.table.invoice_date')}</TableHead>
                                    <TableHead className="text-right">{t('analysis.aging.table.days_overdue')}</TableHead>
                                    <TableHead className="text-right">{t('analysis.aging.table.due_amount')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agingData.invoices.length > 0 ? agingData.invoices.map(inv => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-medium text-primary">{inv.id}</TableCell>
                                        <TableCell>{inv.customerName}</TableCell>
                                        <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">{inv.daysOverdue > 0 ? inv.daysOverdue : 0}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(inv.dueAmount)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">{t('analysis.aging.no_overdue_invoices')}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={4} className="text-right font-bold text-lg">{t('analysis.aging.table.total_due')}</TableCell>
                                    <TableCell className="text-right font-bold text-lg">{formatCurrency(totalDue)}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AgingReportPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { invoices, isLoading: invoicesLoading } = useInvoices();
    const { t } = useLanguage();
    const isLoading = authLoading || invoicesLoading;

    useEffect(() => {
        if (!authLoading && user?.activeRole === 'staff') {
            router.push('/');
        }
    }, [user, authLoading, router]);

    if (isLoading || !user || user.activeRole === 'staff') {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    return (
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline tracking-tight">
                        {t('analysis.aging.title')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('analysis.aging.desc_page')}
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('general.back')}
                </Button>
            </div>
            <AgingReport invoices={invoices} />
        </div>
    );
}
