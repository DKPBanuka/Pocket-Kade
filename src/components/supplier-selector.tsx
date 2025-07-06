
"use client";

import { useState } from 'react';
import { Check, ChevronsUpDown, UserPlus, Loader2 } from 'lucide-react';
import { useSuppliers } from '@/hooks/use-suppliers';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FormLabel, FormMessage } from '@/components/ui/form';
import type { Supplier } from '@/lib/types';
import SupplierForm from './supplier-form';

interface SupplierSelectorProps {
  form: any; // react-hook-form's form object
}

export default function SupplierSelector({ form }: SupplierSelectorProps) {
  const { suppliers, isLoading } = useSuppliers();
  const [openPopover, setOpenPopover] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedSupplierId = form.watch('supplierId');
  const selectedSupplierName = form.watch('supplierName');

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectSupplier = (supplier: Supplier) => {
    form.setValue('supplierId', supplier.id, { shouldValidate: true });
    form.setValue('supplierName', supplier.name, { shouldValidate: true });
    setOpenPopover(false);
  };
  
  return (
    <>
      <div className="space-y-2">
        <FormLabel>Supplier (Optional)</FormLabel>
        <Popover open={openPopover} onOpenChange={setOpenPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openPopover}
              className="w-full justify-between font-normal"
            >
              {selectedSupplierName
                ? selectedSupplierName
                : "Select a supplier..."}
              {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin"/> : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-[--radix-popover-trigger-width] p-0">
            <div className="p-2">
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ScrollArea className="h-72">
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <Button
                    variant="ghost"
                    key={supplier.id}
                    onClick={() => handleSelectSupplier(supplier)}
                    className="w-full justify-start font-normal"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selectedSupplierId === supplier.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <div>
                        <p>{supplier.name}</p>
                    </div>
                  </Button>
                ))
              ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No suppliers found.
                </p>
              )}
            </ScrollArea>
             <div className="p-2 border-t">
                <Button variant="outline" className="w-full" onClick={() => setOpenDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4"/>
                    Add New Supplier
                </Button>
            </div>
          </PopoverContent>
        </Popover>
        <FormMessage>{form.formState.errors.supplierName?.message}</FormMessage>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Supplier</DialogTitle>
                <DialogDescription>
                    Add a new supplier to your database.
                </DialogDescription>
            </DialogHeader>
            <SupplierForm onFinished={() => setOpenDialog(false)}/>
        </DialogContent>
      </Dialog>
    </>
  );
}
