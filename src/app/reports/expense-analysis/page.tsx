
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useExpenses } from '@/hooks/use-expenses';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useLanguage } from '@/contexts/language-context';
import type { ExpenseCategory, Expense } from '@/lib/types';
import { DateRangePicker } from '@/components/date-range-picker';
import { endOfMonth, startOfMonth } from 'date-fns';

const formatCurrency = (amount: number) => `Rs.${amount.toFixed(2)}`;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff4d4d'];

interface ExpenseAnalysisReportProps {
    expenses: Expense[];
}

function ExpenseAnalysisReport({ expenses }: ExpenseAnalysisReportProps) {
    const { t } = useLanguage();
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const filteredExpenses = useMemo(() => {
        if (!dateRange.from || !dateRange.to) return expenses;
        return expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= dateRange.from && expenseDate <= dateRange.to;
        });
    }, [expenses, dateRange]);
    
    const expenseByCategory = useMemo(() => {
        const data = filteredExpenses.reduce((acc, expense) => {
            if (!acc[expense.category]) {
                acc[expense.category] = 0;
            }
            acc[expense.category] += expense.amount;
            return acc;
        }, {} as Record<ExpenseCategory, number>);

        return Object.entries(data)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredExpenses]);

    const totalExpenses = useMemo(() => {
        return expenseByCategory.reduce((sum, item) => sum + item.value, 0);
    }, [expenseByCategory]);

    const chartConfig = expenseByCategory.reduce((acc, entry, index) => {
        acc[entry.name] = {
            label: t(`expenses.category.${entry.name.toLowerCase()}`),
            color: COLORS[index % COLORS.length]
        };
        return acc;
    }, {} as any);

    return (
         <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Date Range</CardTitle>
                    <CardDescription>Select a period to analyze expenses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DateRangePicker 
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        storageKey="expense-analysis-date-range"
                    />
                </CardContent>
            </Card>

            {filteredExpenses.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('analysis.expense.no_data_title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">No expenses found for the selected period.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('analysis.expense.chart_title')}</CardTitle>
                        <CardDescription>{t('analysis.expense.chart_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="h-64 w-full relative">
                            <ChartContainer config={chartConfig} className="w-full h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted))' }}
                                            content={<ChartTooltipContent 
                                                formatter={(value, name) => [formatCurrency(value as number), t(`expenses.category.${name.toLowerCase()}`)]} 
                                                nameKey="name" 
                                            />}
                                        />
                                        <Pie
                                            data={expenseByCategory}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            fill="#8884d8"
                                        >
                                            {expenseByCategory.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-sm text-muted-foreground">{t('analysis.expense.total_expenses')}</span>
                                <span className="text-2xl font-bold">{formatCurrency(totalExpenses)}</span>
                            </div>
                        </div>
                        <div>
                            <ul className="space-y-2 text-sm">
                                {expenseByCategory.map((entry, index) => (
                                    <li key={entry.name} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span>{t(`expenses.category.${entry.name.toLowerCase()}`)}</span>
                                        </div>
                                        <span className="font-medium">{formatCurrency(entry.value)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default function ExpenseAnalysisPage() {
    const router = useRouter();
    const { expenses, isLoading: expensesLoading } = useExpenses();
    const { user, isLoading: authLoading } = useAuth();
    const { t } = useLanguage();

    const isLoading = expensesLoading || authLoading;

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
                        {t('analysis.expense.title')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('analysis.expense.desc')}
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('general.back')}
                </Button>
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <ExpenseAnalysisReport expenses={expenses} />
            )}
        </div>
    );
}
