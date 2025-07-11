
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInvoices } from '@/hooks/use-invoices';
import { useExpenses } from '@/hooks/use-expenses';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, TrendingUp, TrendingDown, Calendar as CalendarIcon, Scale, Building, Boxes, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import type { Invoice, Expense } from '@/lib/types';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const formatCurrency = (amount: number) => `Rs.${amount.toFixed(2)}`;

interface BreakdownDialogProps {
    title: string;
    description: string;
    items: { label: string; amount: number; date?: string; reference?: string }[];
    total: number;
    children: React.ReactNode;
}

function BreakdownDialog({ title, description, items, total, children }: BreakdownDialogProps) {
    const { t } = useLanguage();
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {items[0]?.date && <TableHead>{t('analysis.pl.dialog.date')}</TableHead>}
                                <TableHead>{t('analysis.pl.dialog.description')}</TableHead>
                                {items[0]?.reference && <TableHead>{t('analysis.pl.dialog.reference')}</TableHead>}
                                <TableHead className="text-right">{t('analysis.pl.dialog.amount')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length > 0 ? items.map((item, index) => (
                                <TableRow key={index}>
                                    {item.date && <TableCell>{format(new Date(item.date), 'PPP')}</TableCell>}
                                    <TableCell>{item.label}</TableCell>
                                    {item.reference && <TableCell>{item.reference}</TableCell>}
                                    <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={items[0]?.date ? 3 : 2} className="h-24 text-center">{t('analysis.pl.dialog.no_items')}</TableCell></TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={items[0]?.date ? 2 : 1} className="text-right font-bold">{t('analysis.pl.dialog.total')}</TableCell>
                                {items[0]?.reference && <TableCell></TableCell>}
                                <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ProfitLossReport({ invoices, expenses }: { invoices: Invoice[], expenses: Expense[] }) {
    const { t } = useLanguage();
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const { 
        totalRevenue,
        totalCogs,
        totalOperatingExpenses,
        grossProfit,
        netProfit,
        cogsItems,
        operatingExpenseItems,
        chartData
     } = useMemo(() => {
        const start = dateRange.from;
        const end = dateRange.to;

        const dailyData: { [key: string]: { revenue: number; costs: number } } = {};
        const days = eachDayOfInterval({ start, end });
        days.forEach(day => {
            dailyData[format(day, 'yyyy-MM-dd')] = { revenue: 0, costs: 0 };
        });


        const revenue = invoices
            .flatMap(i => i.payments || [])
            .filter(p => {
                const pDate = new Date(p.date);
                return pDate >= start && pDate <= end;
            })
            .reduce((sum, p) => {
                const pDate = new Date(p.date);
                const dateKey = format(pDate, 'yyyy-MM-dd');
                if (dailyData[dateKey]) {
                    dailyData[dateKey].revenue += p.amount;
                }
                return sum + p.amount;
            }, 0);

        const cogsData = invoices
            .filter(i => i.status !== 'Cancelled' && new Date(i.createdAt) >= start && new Date(i.createdAt) <= end)
            .flatMap(i => i.lineItems.map(li => ({ ...li, invoiceCreatedAt: i.createdAt, invoiceId: i.id })))
            .filter(li => li.type === 'product' && li.costPriceAtSale !== undefined)
            .reduce((acc, li) => {
                const cost = (li.costPriceAtSale || 0) * li.quantity;
                const dateKey = format(new Date(li.invoiceCreatedAt), 'yyyy-MM-dd');
                 if (dailyData[dateKey]) {
                    dailyData[dateKey].costs += cost;
                }
                acc.total += cost;
                acc.items.push({ 
                    label: `${li.description} (x${li.quantity})`, 
                    amount: cost, 
                    date: li.invoiceCreatedAt,
                    reference: li.invoiceId,
                });
                return acc;
            }, { total: 0, items: [] as {label: string; amount: number; date?: string; reference?: string}[] });


        const operatingExpensesData = expenses
            .filter(e => {
                const eDate = new Date(e.date);
                return eDate >= start && eDate <= end;
            })
            .reduce((acc, e) => {
                const dateKey = format(new Date(e.date), 'yyyy-MM-dd');
                if (dailyData[dateKey]) {
                    dailyData[dateKey].costs += e.amount;
                }
                acc.total += e.amount;
                acc.items.push({ label: e.description, amount: e.amount, date: e.date });
                return acc;
            }, { total: 0, items: [] as {label: string; amount: number; date?: string}[] });
            
        const grossProfit = revenue - cogsData.total;
        const netProfit = grossProfit - operatingExpensesData.total;
        
        const finalChartData = Object.entries(dailyData).map(([date, data]) => ({
            date: format(new Date(date), 'MMM d'),
            Revenue: data.revenue,
            Costs: data.costs
        }));

        return {
            totalRevenue: revenue,
            totalCogs: cogsData.total,
            operatingExpenseItems: operatingExpensesData.items,
            cogsItems: cogsData.items,
            totalOperatingExpenses: operatingExpensesData.total,
            grossProfit,
            netProfit,
            chartData: finalChartData
        };
    }, [invoices, expenses, dateRange]);
    
    const chartConfig = {
      Revenue: { label: t('analysis.pl.revenue'), color: "hsl(var(--chart-2))" },
      Costs: { label: t('analysis.pl.total_costs'), color: "hsl(var(--chart-5))" },
    };
    
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
                                <Calendar mode="single" selected={dateRange.from} onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: prev.to, from: date }))} initialFocus />
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
                                <Calendar mode="single" selected={dateRange.to} onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: prev.from, to: date }))} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('analysis.pl_chart.title')}</CardTitle>
                    <CardDescription>{t('analysis.pl_chart.desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfig} className="h-80 w-full">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickFormatter={(value) => `Rs.${Number(value) / 1000}k`} />
                            <Tooltip content={<ChartTooltipContent indicator="dot" formatter={(value) => formatCurrency(value as number)} />} />
                            <Legend />
                            <Line dataKey="Revenue" type="monotone" stroke="var(--color-Revenue)" strokeWidth={2} dot={false} />
                            <Line dataKey="Costs" type="monotone" stroke="var(--color-Costs)" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <Card className="col-span-1 md:col-span-2 lg:col-span-2 bg-green-500/10 border-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-800 dark:text-green-300">{t('analysis.pl.total_revenue')}</CardTitle>
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400"/>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-200">{formatCurrency(totalRevenue)}</p>
                    </CardContent>
                </Card>
                <BreakdownDialog title={t('analysis.pl.cogs_title')} description={t('analysis.pl.cogs_desc')} items={cogsItems} total={totalCogs}>
                    <Card className="bg-orange-500/10 border-orange-500/20 cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-300">{t('analysis.pl.cogs_title')}</CardTitle>
                            <Boxes className="h-5 w-5 text-orange-600 dark:text-orange-400"/>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-orange-700 dark:text-orange-200">{formatCurrency(totalCogs)}</p>
                        </CardContent>
                    </Card>
                </BreakdownDialog>
                <Card className="bg-lime-500/10 border-lime-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-lime-800 dark:text-lime-300">{t('analysis.pl.gross_profit')}</CardTitle>
                        <FileText className="h-5 w-5 text-lime-600 dark:text-lime-400"/>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-lime-700 dark:text-lime-200">{formatCurrency(grossProfit)}</p>
                    </CardContent>
                </Card>
                <BreakdownDialog title={t('analysis.pl.op_expenses_title')} description={t('analysis.pl.op_expenses_desc')} items={operatingExpenseItems} total={totalOperatingExpenses}>
                    <Card className="bg-red-500/10 border-red-500/20 cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-300">{t('analysis.pl.op_expenses_title')}</CardTitle>
                            <Building className="h-5 w-5 text-red-600 dark:text-red-400"/>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-red-700 dark:text-red-200">{formatCurrency(totalOperatingExpenses)}</p>
                        </CardContent>
                    </Card>
                </BreakdownDialog>
                <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">{t('analysis.pl.net_profit_title')}</CardTitle>
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
        <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
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

