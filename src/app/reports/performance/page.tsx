
"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Package, Tag, Truck } from 'lucide-react';
import { useInventory } from '@/hooks/use-inventory';
import { useInvoices } from '@/hooks/use-invoices';
import { useSuppliers } from '@/hooks/use-suppliers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { InventoryItem, Invoice, Supplier } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { DateRangePicker } from '@/components/date-range-picker';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const formatCurrency = (amount: number) => `Rs.${amount.toFixed(2)}`;

// --- Product Performance ---
interface ProductPerformanceData {
    id: string; name: string; unitsSold: number; revenue: number; cost: number; profit: number; profitMargin: number;
}
function ProductPerformanceReport({ inventory, invoices }: { inventory: InventoryItem[], invoices: Invoice[] }) {
    const { t } = useLanguage();
    const productPerformanceData: ProductPerformanceData[] = useMemo(() => {
        const performanceMap: { [key: string]: ProductPerformanceData } = {};
        inventory.forEach(item => {
            performanceMap[item.id] = { id: item.id, name: item.name, unitsSold: 0, revenue: 0, cost: 0, profit: 0, profitMargin: 0 };
        });
        invoices.flatMap(i => i.lineItems).filter(li => li.type === 'product' && li.inventoryItemId).forEach(lineItem => {
            const item = performanceMap[lineItem.inventoryItemId!];
            if (item) {
                const lineItemRevenue = lineItem.quantity * lineItem.price;
                const lineItemCost = lineItem.quantity * (lineItem.costPriceAtSale || 0);
                item.unitsSold += lineItem.quantity;
                item.revenue += lineItemRevenue;
                item.cost += lineItemCost;
                item.profit += (lineItemRevenue - lineItemCost);
            }
        });
        return Object.values(performanceMap).map(item => {
            item.profitMargin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
            return item;
        }).sort((a, b) => b.profit - a.profit);
    }, [inventory, invoices]);
    return (
        <Card>
            <CardHeader><CardTitle>{t('analysis.performance.product_breakdown_title')}</CardTitle></CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader><TableRow><TableHead>{t('analysis.performance.table.product')}</TableHead><TableHead className="text-right">{t('analysis.performance.table.units_sold')}</TableHead><TableHead className="text-right">{t('analysis.performance.table.revenue')}</TableHead><TableHead className="text-right">{t('analysis.performance.table.cost')}</TableHead><TableHead className="text-right">{t('analysis.performance.table.profit')}</TableHead><TableHead className="text-right">{t('analysis.performance.table.profit_margin')}</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {productPerformanceData.length > 0 ? productPerformanceData.map(product => (
                                <TableRow key={product.id}><TableCell className="font-medium">{product.name}</TableCell><TableCell className="text-right">{product.unitsSold}</TableCell><TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell><TableCell className="text-right">{formatCurrency(product.cost)}</TableCell><TableCell className="text-right font-semibold text-green-600">{formatCurrency(product.profit)}</TableCell><TableCell className="text-right"><span className={`font-semibold ${product.profitMargin >= 0 ? 'text-foreground' : 'text-destructive'}`}>{product.profitMargin.toFixed(1)}%</span></TableCell></TableRow>
                            )) : (<TableRow><TableCell colSpan={6} className="h-24 text-center">{t('analysis.performance.no_sales_data')}</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

// --- Category Performance ---
interface CategoryPerformanceData { name: string; revenue: number; cost: number; profit: number; }
function CategoryPerformanceReport({ inventory, invoices }: { inventory: InventoryItem[], invoices: Invoice[] }) {
    const { t } = useLanguage();
    const categoryPerformanceData: CategoryPerformanceData[] = useMemo(() => {
        const performanceMap: { [key: string]: CategoryPerformanceData } = {};
        [...new Set(inventory.map(item => item.category))].forEach(category => {
            performanceMap[category] = { name: category, revenue: 0, cost: 0, profit: 0 };
        });
        invoices.flatMap(i => i.lineItems).filter(li => li.type === 'product' && li.inventoryItemId).forEach(lineItem => {
            const inventoryItem = inventory.find(i => i.id === lineItem.inventoryItemId);
            if (inventoryItem) {
                const category = inventoryItem.category;
                const item = performanceMap[category];
                if (item) {
                    const lineItemRevenue = lineItem.quantity * lineItem.price;
                    const lineItemCost = lineItem.quantity * (lineItem.costPriceAtSale || 0);
                    item.revenue += lineItemRevenue;
                    item.cost += lineItemCost;
                    item.profit += (lineItemRevenue - lineItemCost);
                }
            }
        });
        return Object.values(performanceMap).sort((a, b) => b.profit - a.profit);
    }, [inventory, invoices]);
    return (
        <Card>
            <CardHeader><CardTitle>{t('analysis.performance.category_breakdown_title')}</CardTitle></CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader><TableRow><TableHead>{t('analysis.performance.table.category')}</TableHead><TableHead className="text-right">{t('analysis.performance.table.revenue')}</TableHead><TableHead className="text-right">{t('analysis.performance.table.cost')}</TableHead><TableHead className="text-right">{t('analysis.performance.table.profit')}</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {categoryPerformanceData.length > 0 ? categoryPerformanceData.map(category => (
                                <TableRow key={category.name}><TableCell className="font-medium">{category.name}</TableCell><TableCell className="text-right">{formatCurrency(category.revenue)}</TableCell><TableCell className="text-right">{formatCurrency(category.cost)}</TableCell><TableCell className="text-right font-semibold text-green-600">{formatCurrency(category.profit)}</TableCell></TableRow>
                            )) : (<TableRow><TableCell colSpan={4} className="h-24 text-center">{t('analysis.performance.no_category_data')}</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

// --- Supplier Performance ---
interface SupplierPerformanceData { id: string; name: string; revenue: number; profit: number; }
function SupplierPerformanceReport({ inventory, invoices, suppliers }: { inventory: InventoryItem[], invoices: Invoice[], suppliers: Supplier[] }) {
    const { t } = useLanguage();
    const supplierPerformanceData: SupplierPerformanceData[] = useMemo(() => {
        const performanceMap: { [key: string]: SupplierPerformanceData } = {};
        suppliers.forEach(supplier => {
            performanceMap[supplier.id] = { id: supplier.id, name: supplier.name, revenue: 0, profit: 0 };
        });
        invoices.flatMap(i => i.lineItems).filter(li => li.type === 'product' && li.inventoryItemId).forEach(lineItem => {
            const inventoryItem = inventory.find(i => i.id === lineItem.inventoryItemId);
            if (inventoryItem && inventoryItem.supplierId) {
                const supplier = performanceMap[inventoryItem.supplierId];
                if (supplier) {
                    const lineItemRevenue = lineItem.quantity * lineItem.price;
                    const lineItemCost = lineItem.quantity * (lineItem.costPriceAtSale || 0);
                    supplier.revenue += lineItemRevenue;
                    supplier.profit += (lineItemRevenue - lineItemCost);
                }
            }
        });
        return Object.values(performanceMap).sort((a, b) => b.profit - a.profit);
    }, [inventory, invoices, suppliers]);
    return (
        <Card>
            <CardHeader><CardTitle>{t('analysis.performance.supplier_breakdown_title')}</CardTitle></CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader><TableRow><TableHead>{t('analysis.performance.table.supplier')}</TableHead><TableHead className="text-right">{t('analysis.performance.table.revenue_generated')}</TableHead><TableHead className="text-right">{t('analysis.performance.table.profit_generated')}</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {supplierPerformanceData.length > 0 ? supplierPerformanceData.map(supplier => (
                                <TableRow key={supplier.id}><TableCell className="font-medium">{supplier.name}</TableCell><TableCell className="text-right">{formatCurrency(supplier.revenue)}</TableCell><TableCell className="text-right font-semibold text-green-600">{formatCurrency(supplier.profit)}</TableCell></TableRow>
                            )) : (<TableRow><TableCell colSpan={3} className="h-24 text-center">{t('analysis.performance.no_supplier_data')}</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

// --- Main Page Component ---
export default function PerformancePage() {
    const router = useRouter();
    const { inventory, isLoading: inventoryLoading } = useInventory();
    const { suppliers, isLoading: suppliersLoading } = useSuppliers();
    const { user, isLoading: authLoading } = useAuth();
    const { invoices, isLoading: invoicesLoading } = useInvoices();
    const { t } = useLanguage();
    
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const isLoading = inventoryLoading || authLoading || invoicesLoading || suppliersLoading;

    useEffect(() => {
        if (!authLoading && user?.activeRole === 'staff') {
            router.push('/');
        }
    }, [user, authLoading, router]);

    const filteredInvoices = useMemo(() => {
        if (!dateRange.from || !dateRange.to) return [];
        return invoices.filter(invoice => {
            if (invoice.status === 'Cancelled') return false;
            const invoiceDate = new Date(invoice.createdAt);
            return invoiceDate >= dateRange.from && invoiceDate <= dateRange.to;
        });
    }, [invoices, dateRange]);

    if (isLoading || !user || user.activeRole === 'staff') {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">{t('analysis.performance.title')}</h1>
                <p className="text-muted-foreground">{t('analysis.performance.desc')}</p>
                </div>
                <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />{t('general.back')}</Button>
            </div>
            
            <Card>
                <CardHeader><CardTitle>{t('analysis.pl_page.date_range_title')}</CardTitle></CardHeader>
                <CardContent><DateRangePicker dateRange={dateRange} setDateRange={setDateRange} storageKey="performance-date-range" /></CardContent>
            </Card>

            <Tabs defaultValue="product">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="product"><Package className="mr-2 h-4 w-4" />{t('analysis.performance.by_product')}</TabsTrigger>
                    <TabsTrigger value="category"><Tag className="mr-2 h-4 w-4" />{t('analysis.performance.by_category')}</TabsTrigger>
                    <TabsTrigger value="supplier"><Truck className="mr-2 h-4 w-4" />{t('analysis.performance.by_supplier')}</TabsTrigger>
                </TabsList>
                <TabsContent value="product">
                    <ProductPerformanceReport inventory={inventory} invoices={filteredInvoices} />
                </TabsContent>
                <TabsContent value="category">
                    <CategoryPerformanceReport inventory={inventory} invoices={filteredInvoices} />
                </TabsContent>
                <TabsContent value="supplier">
                    <SupplierPerformanceReport inventory={inventory} invoices={filteredInvoices} suppliers={suppliers} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
