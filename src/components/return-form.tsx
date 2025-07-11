
"use client";

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { useReturns } from '@/hooks/use-returns';
import { useInventory } from '@/hooks/use-inventory';
import { useInvoices } from '@/hooks/use-invoices';
import { useSuppliers } from '@/hooks/use-suppliers';
import CustomerSelector from './customer-selector';
import SupplierSelector from './supplier-selector';
import { useEffect, useMemo, useState } from 'react';
import type { Invoice, LineItem, InventoryItem } from '@/lib/types';


const formSchema = z.object({
  type: z.enum(['Customer Return', 'Supplier Return']),
  inventoryItemId: z.string().min(1, 'Please select an item'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(5, 'Please provide a reason for the return.'),
  originalInvoiceId: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  supplierId: z.string().optional(),
  supplierName: z.string().optional(),
}).refine(data => {
    if (data.type === 'Customer Return') {
        return !!data.customerId && !!data.customerName;
    }
    if (data.type === 'Supplier Return') {
        return !!data.supplierId && !!data.supplierName;
    }
    return false;
}, {
    message: 'A customer or supplier must be selected for the return type.',
    path: ['customerId'], // Apply error to a relevant field
});

type ReturnFormData = z.infer<typeof formSchema>;


export default function ReturnForm() {
  const { addReturn } = useReturns();
  const { inventory } = useInventory();
  const { invoices } = useInvoices();
  const { suppliers } = useSuppliers();

  const form = useForm<ReturnFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        type: 'Customer Return',
        inventoryItemId: '',
        quantity: 1,
        reason: '',
        originalInvoiceId: '',
        customerId: '',
        customerName: '',
        customerPhone: '',
        supplierId: '',
        supplierName: '',
    },
  });

  const watchType = useWatch({ control: form.control, name: 'type' });
  const watchCustomerId = useWatch({ control: form.control, name: 'customerId'});
  const watchInvoiceId = useWatch({ control: form.control, name: 'originalInvoiceId'});
  const watchSupplierId = useWatch({ control: form.control, name: 'supplierId'});
  
  useEffect(() => {
    form.resetField("inventoryItemId", { defaultValue: '' });
    form.resetField("originalInvoiceId", { defaultValue: '' });
    form.resetField("quantity", { defaultValue: 1 });
  }, [watchCustomerId, watchSupplierId, watchType, form]);

  const customerInvoices = useMemo(() => {
      if (!watchCustomerId) return [];
      return invoices.filter(inv => inv.customerId === watchCustomerId && inv.status !== 'Cancelled');
  }, [invoices, watchCustomerId]);

  const invoiceLineItems = useMemo(() => {
    if (!watchInvoiceId) return [];
    const selectedInvoice = invoices.find(inv => inv.id === watchInvoiceId);
    return selectedInvoice?.lineItems.filter(li => li.type === 'product') || [];
  }, [invoices, watchInvoiceId]);
  
  const supplierItems = useMemo(() => {
      if (!watchSupplierId) return [];
      return inventory.filter(item => item.supplierId === watchSupplierId);
  }, [inventory, watchSupplierId]);


  function onSubmit(values: ReturnFormData) {
    addReturn(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="p-6 grid gap-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Type of Return</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.reset();
                        form.setValue('type', value as 'Customer Return' | 'Supplier Return');
                      }}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="Customer Return" /></FormControl>
                        <FormLabel className="font-normal">Customer Return</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="Supplier Return" /></FormControl>
                        <FormLabel className="font-normal">Return to Supplier</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchType === 'Customer Return' ? (
                <div className="space-y-6">
                    <CustomerSelector form={form} />
                    {watchCustomerId && (
                         <FormField
                            control={form.control}
                            name="originalInvoiceId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Original Invoice (Optional)</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} 
                                  value={field.value || 'none'}
                                >
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select an invoice to see items" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {customerInvoices.map(inv => (
                                            <SelectItem key={inv.id} value={inv.id}>{inv.id} - {new Date(inv.createdAt).toLocaleDateString()}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}
                </div>
            ) : (
                <SupplierSelector form={form} />
            )}

            <FormField
                control={form.control}
                name="inventoryItemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item being returned</FormLabel>
                    <Select 
                        onValueChange={(value) => {
                            field.onChange(value);
                            const selectedItem = inventory.find(i => i.id === value);
                            if (selectedItem && watchType === 'Supplier Return') {
                                form.setValue('quantity', selectedItem.quantity);
                            } else {
                                const selectedLineItem = invoiceLineItems.find(li => li.inventoryItemId === value);
                                form.setValue('quantity', selectedLineItem?.quantity || 1);
                            }
                        }} 
                        value={field.value}
                        disabled={
                            (watchType === 'Customer Return' && !watchCustomerId) ||
                            (watchType === 'Supplier Return' && !watchSupplierId)
                        }
                    >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer/supplier first" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                             {(
                                (watchType === 'Customer Return' && watchInvoiceId) ? invoiceLineItems :
                                (watchType === 'Supplier Return') ? supplierItems :
                                []
                            ).map((item: LineItem | InventoryItem) => (
                                <SelectItem key={(item as LineItem).inventoryItemId || item.id} value={(item as LineItem).inventoryItemId || item.id}>
                                    {(item as LineItem).description || (item as InventoryItem).name} (Qty: {item.quantity})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <FormMessage />
                  </FormItem>
                )}
              />

             <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} onFocus={(e) => e.target.select()} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

             <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Return</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Item was faulty, wrong item received..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging...
              </>
            ) : (
                'Log Return'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
