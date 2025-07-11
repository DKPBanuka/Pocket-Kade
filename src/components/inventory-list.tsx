
"use client";

import Link from 'next/link';
import type { InventoryItem, ItemStatus } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

interface InventoryListProps {
  inventory: InventoryItem[];
}

const statusStyles: { [key in ItemStatus]: string } = {
    Available: 'bg-accent text-accent-foreground border-transparent',
    'Awaiting Inspection': 'bg-yellow-100 text-yellow-800 border-transparent dark:bg-yellow-900/50 dark:text-yellow-300',
    Damaged: 'bg-destructive/80 text-destructive-foreground border-transparent',
    'For Repair': 'bg-blue-200 text-blue-800 border-transparent dark:bg-blue-900/50 dark:text-blue-300',
};

export default function InventoryList({ inventory }: InventoryListProps) {
  const { user } = useAuth();

  if (inventory.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>No items match your search.</p>
      </div>
    );
  }

  const isLowStock = (item: InventoryItem) => item.quantity <= item.reorderPoint;
  const isPrivilegedUser = user?.activeRole === 'admin' || user?.activeRole === 'owner';
  const isStaff = user?.activeRole === 'staff';

  const RowContent = ({ item }: { item: InventoryItem }) => {
    const isSellingAtLoss = isPrivilegedUser && item.price < item.costPrice;
    
    const LossIndicator = () => (
        isSellingAtLoss ? (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Selling price is lower than cost price.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        ) : null
    );

    return (
    <>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <span>{item.name}</span>
          <LossIndicator />
        </div>
      </TableCell>
      <TableCell>{item.brand}</TableCell>
      <TableCell>{item.category}</TableCell>
      <TableCell>
        <Badge className={cn('text-xs', statusStyles[item.status])}>{item.status}</Badge>
      </TableCell>
      <TableCell className="text-right">Rs.{item.price.toFixed(2)}</TableCell>
      {isPrivilegedUser && <TableCell className="text-right">Rs.{item.costPrice.toFixed(2)}</TableCell>}
      <TableCell className="text-right">
          <Badge variant={isLowStock(item) ? "destructive" : "secondary"}>
              {item.quantity} in stock
          </Badge>
      </TableCell>
      {isPrivilegedUser && <TableCell className="text-right">Rs.{(item.costPrice * item.quantity).toFixed(2)}</TableCell>}
      <TableCell className="text-right">
         {!isStaff && (
           <Link href={`/inventory/${item.id}`} passHref>
                <Button variant="outline" size="sm">
                    View <ChevronRight className="h-4 w-4 -mr-1" />
                </Button>
            </Link>
         )}
      </TableCell>
    </>
    );
  };

  return (
    <>
      {/* Desktop View: Table */}
      <div className="hidden md:block rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              {isPrivilegedUser && <TableHead className="text-right">Cost Price</TableHead>}
              <TableHead className="text-right">Stock</TableHead>
              {isPrivilegedUser && <TableHead className="text-right">Stock Value (Cost)</TableHead>}
              <TableHead className="w-[100px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id} data-tour-id={item.name === 'Sample Product' ? 'sample-product-row' : undefined} className={isStaff ? '' : 'cursor-pointer'} onClick={() => !isStaff && (window.location.href = `/inventory/${item.id}`)}>
                <RowContent item={item} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View: Cards */}
       <div className="md:hidden space-y-4">
        {inventory.map((item) => {
            const isSellingAtLoss = isPrivilegedUser && item.price < item.costPrice;
            const cardContent = (
                <Card className="transition-shadow duration-200 group-hover:shadow-md">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl font-bold font-headline flex items-center gap-2">
                                  <span>{item.name}</span>
                                   {isSellingAtLoss && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Selling price is lower than cost price.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </CardTitle>
                                <CardDescription>{item.brand} / {item.category}</CardDescription>
                            </div>
                            <Badge className={cn('text-xs', statusStyles[item.status])}>{item.status}</Badge>
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Selling Price</span>
                                <span className="font-medium">Rs.{item.price.toFixed(2)}</span>
                            </div>
                             {isPrivilegedUser && (
                              <div className="flex justify-between">
                                  <span className="text-muted-foreground">Cost Price</span>
                                  <span className="font-medium">Rs.{item.costPrice.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Stock</span>
                                <Badge variant={isLowStock(item) ? "destructive" : "secondary"}>
                                    {item.quantity} in stock
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
            
            const commonProps = {
                className: "group block",
                "data-tour-id": item.name === 'Sample Product' ? 'sample-product-card' : undefined
            };

            return isStaff ? (
                <div key={item.id} {...commonProps}>{cardContent}</div>
            ) : (
                <Link key={item.id} href={`/inventory/${item.id}`} {...commonProps}>
                    {cardContent}
                </Link>
            );
        })}
      </div>
    </>
  );
}
