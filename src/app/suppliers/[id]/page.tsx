
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { useSuppliers } from '@/hooks/use-suppliers';
import { useInventory } from '@/hooks/use-inventory';
import { useAuth } from '@/contexts/auth-context';
import type { Supplier, InventoryItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Edit, Phone, Mail, MapPin, Package, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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

export default function ViewSupplierPage() {
    const router = useRouter();
    const params = useParams();
    const { getSupplier, isLoading: suppliersLoading } = useSuppliers();
    const { inventory, isLoading: inventoryLoading } = useInventory();
    const { user, isLoading: authLoading } = useAuth();
    const { t } = useLanguage();

    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [supplier, setSupplier] = useState<Supplier | null>(null);

    const isLoading = suppliersLoading || inventoryLoading || authLoading;

    useEffect(() => {
        if (!suppliersLoading && id) {
            setSupplier(getSupplier(id) || null);
        }
    }, [id, getSupplier, suppliersLoading]);

    const suppliedItems = useMemo(() => {
        return inventory.filter(item => item.supplierId === id);
    }, [inventory, id]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!supplier) {
        return (
            <div className="container mx-auto max-w-2xl p-4 sm:p-6 lg:p-8 text-center">
                <h1 className="text-2xl font-bold">Supplier Not Found</h1>
                <p className="text-muted-foreground mt-2">The requested supplier could not be found.</p>
                <Button onClick={() => router.push('/suppliers')} className="mt-6">Go to Suppliers</Button>
            </div>
        );
    }

    const isPrivilegedUser = user?.activeRole === 'admin' || user?.activeRole === 'owner';

    return (
        <div className="container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline tracking-tight">{supplier.name}</h1>
                    <p className="text-muted-foreground">Supplier Details</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> {t('general.back')}
                    </Button>
                    {isPrivilegedUser && (
                        <Link href={`/suppliers/${supplier.id}/edit`} passHref>
                            <Button><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InfoItem icon={User} label="Contact Person" value={supplier.contactPerson} />
                            <InfoItem icon={Phone} label="Phone" value={supplier.phone} />
                            <InfoItem icon={Mail} label="Email" value={supplier.email} />
                            <InfoItem icon={MapPin} label="Address" value={supplier.address} />
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" /> Items from this Supplier
                            </CardTitle>
                            <CardDescription>
                                A list of all inventory items sourced from {supplier.name}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {suppliedItems.length > 0 ? (
                                <div className="max-h-[500px] overflow-y-auto rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item Name</TableHead>
                                                <TableHead className="text-right">Stock</TableHead>
                                                <TableHead className="text-right">Selling Price</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {suppliedItems.map((item) => (
                                                <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/inventory/${item.id}`)}>
                                                    <TableCell className="font-medium">{item.name}</TableCell>
                                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">Rs.{item.price.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <p className="text-sm text-center text-muted-foreground py-8">
                                    No items have been assigned to this supplier yet.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
