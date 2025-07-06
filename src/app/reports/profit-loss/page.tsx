
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoices } from '@/hooks/use-invoices';
import { useExpenses } from '@/hooks/use-expenses';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, Calendar as CalendarIcon, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import type { Invoice, Expense } from '@/lib/types';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const formatCurrency = (amount: number) => `Rs.${amount.toFixed(2)}`;

function ProfitLossChart({ invoices, expenses, dateRange }: { invoices: Invoice[], expenses: Expense[], dateRange: { from: Date; to: Date } }) {
    const { t } = useLanguage();

    const chartData = useMemo(() => {
        const { from, to } = dateRange;
        if (!from || !to) return [];

        const dataByDate = new Map<string, { revenue: number, expenses: number }>();
        const interval = eachDayOfInterval({ start: from, end: to });

        interval.forEach(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            dataByDate.set(dateKey, { revenue: 0, expenses: 0 });
        });

        invoices.forEach(invoice => {
            (invoice.payments || []).forEach(payment => {
                const paymentDate = new Date(payment.date);
                if (paymentDate >= from && paymentDate <= to) {
                    const dateKey = format(paymentDate, 'yyyy-MM-dd');
                    if (dataByDate.has(dateKey)) {
                        dataByDate.get(dateKey)!.revenue += payment.amount;
                    }
                }
            });
        });

        expenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            if (expenseDate >= from && expenseDate <= to) {
                const dateKey = format(expenseDate, 'yyyy-MM-dd');
                if (dataByDate.has(dateKey)) {
                    dataByDate.get(dateKey)!.expenses += expense.amount;
                }
            }
        });
        
        return Array.from(dataByDate.entries()).map(([date, values]) => ({
            date: format(new Date(date), 'MMM d'),
            ...values
        }));

    }, [invoices, expenses, dateRange]);

    const chartConfig = {
        revenue: { label: t('analysis.pl.revenue'), color: "hsl(var(--chart-2))" },
        expenses: { label: t('analysis.pl.expenses'), color: "hsl(var(--muted-foreground))" },
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('analysis.pl_chart.title')}</CardTitle>
                <CardDescription>{t('analysis.pl_chart.desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-80 w-full">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                        <YAxis tickFormatter={(value) => `Rs.${Number(value) / 1000}k`} />
                        <Tooltip content={<ChartTooltipContent formatter={(value, name) => [formatCurrency(value as number), t(`analysis.pl.${name}`)]} />} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" strokeWidth={2} dot={false} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}


function ProfitLossReport({ invoices, expenses }: { invoices: Invoice[], expenses: Expense[] }) {
    const { t } = useLanguage();
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const { totalRevenue, totalExpenses, netProfit } = useMemo(() => {
        const start = dateRange.from;
        const end = dateRange.to;

        const revenue = invoices
            .flatMap(i => i.payments || [])
            .filter(p => {
                const pDate = new Date(p.date);
                return pDate >= start && pDate <= end;
            })
            .reduce((sum, p) => sum + p.amount, 0);

        const expenseTotal = expenses
            .filter(e => {
                const eDate = new Date(e.date);
                return eDate >= start && eDate <= end;
            })
            .reduce((sum, e) => sum + e.amount, 0);

        return {
            totalRevenue: revenue,
            totalExpenses: expenseTotal,
            netProfit: revenue - expenseTotal
        };
    }, [invoices, expenses, dateRange]);
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('analysis.pl_page.date_range_title')}</CardTitle>
                    <CardDescription>{t('analysis.pl_page.date_range_desc')}</CardDescription>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange.from ? `${t('analysis.pl.from')}: ${format(dateRange.from, "PPP")}` : <span>{t('analysis.pl.from')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={dateRange.from} onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange.to ? `${t('analysis.pl.to')}: ${format(dateRange.to, "PPP")}` : <span>{t('analysis.pl.to')}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={dateRange.to} onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
            </Card>

            <ProfitLossChart invoices={invoices} expenses={expenses} dateRange={dateRange} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-green-500/10 border-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">{t('analysis.pl.revenue')}</CardTitle>
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400"/>
                    </CardHeader>
                    <CardContent>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-200">{formatCurrency(totalRevenue)}</p>
                    </CardContent>
                </Card>
                    <Card className="bg-red-500/10 border-red-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-800 dark:text-red-300">{t('analysis.pl.expenses')}</CardTitle>
                        <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400"/>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-200">{formatCurrency(totalExpenses)}</p>
                    </CardContent>
                </Card>
                    <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">{t('analysis.pl.net_profit')}</CardTitle>
                        <Scale className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-700 dark:text-blue-200' : 'text-red-700 dark:text-red-200'}`}>{formatCurrency(netProfit)}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function ProfitLossPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { invoices, isLoading: invoicesLoading } = useInvoices();
    const { expenses, isLoading: expensesLoading } = useExpenses();
    const { t } = useLanguage();
    const isLoading = authLoading || invoicesLoading || expensesLoading;

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
                        {t('analysis.pl_page.title')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('analysis.pl_page.desc')}
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('general.back')}
                </Button>
            </div>
            <ProfitLossReport invoices={invoices} expenses={expenses} />
        </div>
    );
}
