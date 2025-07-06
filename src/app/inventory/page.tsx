
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Archive, Search, LineChart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/hooks/use-inventory';
import InventoryList from '@/components/inventory-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ItemStatus } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';
import { exportToCsv } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

export default function InventoryPage() {
  const { inventory, isLoading: inventoryLoading, deleteInventoryItem } = useInventory();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [brandFilter, setBrandFilter] = useState<string>('All');

  const isLoading = inventoryLoading || authLoading;

  const { totalItemTypes, totalStockQuantity, uniqueCategories, uniqueBrands } = useMemo(() => {
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const categories = new Set(inventory.map(item => item.category).filter(Boolean));
    const brands = new Set(inventory.map(item => item.brand).filter(Boolean));
    return { 
      totalItemTypes: inventory.length, 
      totalStockQuantity: totalStock,
      uniqueCategories: ['All', ...Array.from(categories).sort()],
      uniqueBrands: ['All', ...Array.from(brands).sort()],
    };
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(
      (item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              item.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        const matchesBrand = brandFilter === 'All' || item.brand === brandFilter;
        return matchesSearch && matchesStatus && matchesCategory && matchesBrand;
      }
    );
  }, [inventory, searchTerm, statusFilter, categoryFilter, brandFilter]);

  const handleExport = () => {
    const isPrivilegedUser = user?.activeRole === 'admin' || user?.activeRole === 'owner';
    const dataToExport = filteredInventory.map(item => {
        const baseData: any = {
            id: item.id,
            name: item.name,
            category: item.category,
            brand: item.brand,
            status: item.status,
            price: item.price.toFixed(2),
            quantity: item.quantity,
            reorderPoint: item.reorderPoint,
            createdAt: format(new Date(item.createdAt), 'yyyy-MM-dd')
        };
        if (isPrivilegedUser) {
            baseData.costPrice = item.costPrice.toFixed(2);
            baseData.stockValue = (item.costPrice * item.quantity).toFixed(2);
        }
        return baseData;
    });

    const headers: any = {
        id: 'Item ID',
        name: 'Item Name',
        category: 'Category',
        brand: 'Brand',
        status: 'Status',
        price: 'Selling Price (Rs.)',
        quantity: 'Stock Quantity',
        reorderPoint: 'Reorder Point',
        createdAt: 'Created Date'
    };

    if (isPrivilegedUser) {
        headers.costPrice = 'Cost Price (Rs.)';
        headers.stockValue = 'Stock Value (Cost) (Rs.)';
    }

    exportToCsv(dataToExport, `inventory-${new Date().toISOString().split('T')[0]}`, headers);
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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            {t('inventory.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('inventory.desc', { itemCount: totalItemTypes, unitCount: totalStockQuantity })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                {t('inventory.export')}
            </Button>
            {isPrivilegedUser && (
                <Link href="/reports" passHref>
                    <Button variant="outline">
                        <LineChart className="mr-2 h-4 w-4" />
                        {t('inventory.analysis')}
                    </Button>
                </Link>
            )}
            {isPrivilegedUser && (
                <Link href="/inventory/new" passHref>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('inventory.new_item')}
                </Button>
                </Link>
            )}
        </div>
      </div>

      {inventory.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                type="text"
                placeholder={t('inventory.search_placeholder')}
                className="w-full py-3 pl-10 pr-4 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <Select onValueChange={(value) => setBrandFilter(value)} defaultValue="All">
                <SelectTrigger className="shadow-sm">
                    <SelectValue placeholder={t('inventory.filter_brand')} />
                </SelectTrigger>
                <SelectContent>
                    {uniqueBrands.map(brand => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
                </SelectContent>
            </Select>
             <Select onValueChange={(value) => setCategoryFilter(value)} defaultValue="All">
                <SelectTrigger className="shadow-sm">
                    <SelectValue placeholder={t('inventory.filter_category')} />
                </SelectTrigger>
                <SelectContent>
                    {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
            </Select>
             <Select onValueChange={(value) => setStatusFilter(value as ItemStatus | 'All')} defaultValue="All">
                <SelectTrigger className="shadow-sm">
                    <SelectValue placeholder={t('inventory.filter_status')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">{t('inventory.status.all')}</SelectItem>
                    <SelectItem value="Available">{t('inventory.status.available')}</SelectItem>
                    <SelectItem value="Awaiting Inspection">{t('inventory.status.awaiting_inspection')}</SelectItem>
                    <SelectItem value="Damaged">{t('inventory.status.damaged')}</SelectItem>
                    <SelectItem value="For Repair">{t('inventory.status.for_repair')}</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <InventoryList inventory={filteredInventory} deleteInventoryItem={deleteInventoryItem} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-card/50 p-12 text-center">
          <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold font-headline">{t('inventory.no_items_title')}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPrivilegedUser ? t('inventory.no_items_desc_privileged') : t('inventory.no_items_desc_staff')}
          </p>
          {isPrivilegedUser && (
            <Link href="/inventory/new" passHref>
                <Button className="mt-6">
                <Plus className="mr-2 h-4 w-4" />
                {t('inventory.add_item_btn')}
                </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
