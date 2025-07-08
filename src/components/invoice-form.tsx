
"use client";

import { useForm, useFieldArray, useWatch, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Loader2, ChevronsUpDown, Package, Wrench } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoices } from '@/hooks/use-invoices';
import { cn } from '@/lib/utils';
import type { Invoice, InventoryItem } from '@/lib/types';
import { useInventory } from '@/hooks/use-inventory';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from './ui/badge';
import CustomerSelector from './customer-selector';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { suggestLineItemAction } from '@/app/actions';
import { useLanguage } from '@/contexts/language-context';


function ProductSelector({ form, index, availableInventory }: { form: any; index: number; availableInventory: InventoryItem[] }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();

  const selectedDescription = form.watch(`lineItems.${index}.description`);

  const handleSelect = (item: InventoryItem) => {
    form.setValue(`lineItems.${index}.inventoryItemId`, item.id, { shouldValidate: true });
    form.setValue(`lineItems.${index}.description`, item.name, { shouldValidate: true });
    form.setValue(`lineItems.${index}.price`, item.price, { shouldValidate: true });
    form.setValue(`lineItems.${index}.warrantyPeriod`, item.warrantyPeriod || 'N/A', { shouldValidate: true });
    form.setValue(`lineItems.${index}.quantity`, 1, { shouldValidate: true });
    setOpen(false);
    setSearchTerm('');
  };

  const filteredInventory = useMemo(() => {
    if (!searchTerm) return availableInventory;
    return availableInventory.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableInventory, searchTerm]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between",
              !selectedDescription && "text-muted-foreground"
            )}
          >
            {selectedDescription || t('invoice.form.select_product')}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <div className="p-2">
            <Input 
                placeholder={t('invoice.form.search_products')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
            />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filteredInventory.length > 0 ? (
            filteredInventory.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start font-normal h-auto py-2"
                onClick={() => handleSelect(item)}
              >
                <div className="flex flex-col items-start text-left">
                  <span>{item.name}</span>
                  <span className="text-xs text-muted-foreground">{t('invoice.form.in_stock', { count: item.quantity })}</span>
                </div>
              </Button>
            ))
          ) : (
            <div className="p-4 text-sm text-center text-muted-foreground">
              {t('invoice.form.no_match')}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface InvoiceFormProps {
    invoice?: Invoice;
}

export default function InvoiceForm({ invoice }: InvoiceFormProps) {
  const { addInvoice, updateInvoice } = useInvoices();
  const { inventory } = useInventory();
  const { user } = useAuth();
  const { t } = useLanguage();
  const isEditMode = !!invoice;
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const formSchema = useMemo(() => {
    return z.object({
      customerId: z.string().optional(),
      customerName: z.string().min(1, 'Customer name is required'),
      customerPhone: z.string().optional(),
      status: z.enum(['Paid', 'Unpaid', 'Partially Paid']),
      discountType: z.enum(['percentage', 'fixed']).default('percentage'),
      discountValue: z.coerce.number().min(0, "Discount value can't be negative").default(0),
      initialPayment: z.coerce.number().optional(),
      lineItems: z
        .array(
          z.object({
            id: z.string().optional(),
            type: z.enum(['product', 'service']).default('product'),
            inventoryItemId: z.string().optional(),
            description: z.string(),
            quantity: z.coerce.number().min(1, 'Must be at least 1'),
            price: z.coerce.number().min(0, 'Price cannot be negative'),
            warrantyPeriod: z.string().min(1, 'Warranty period is required'),
          })
        )
        .min(1, 'At least one line item is required')
        .superRefine((lineItems, ctx) => {
          lineItems.forEach((lineItem, index) => {
             if (lineItem.description.trim() === '') {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Description is required`,
                path: [index, 'description'],
              });
            }
            if (lineItem.type === 'product') {
              const stockItem = inventory.find(i => i.id === lineItem.inventoryItemId);
              if (stockItem) {
                let originalQuantity = 0;
                if (isEditMode && invoice && lineItem.id) {
                  const originalLineItem = invoice.lineItems.find(
                    orig => orig.id === lineItem.id
                  );
                  if (originalLineItem) {
                    originalQuantity = originalLineItem.quantity;
                  }
                }
                
                const availableStock = stockItem.quantity + originalQuantity;

                if (lineItem.quantity > availableStock) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Only ${availableStock} in stock`,
                    path: [index, 'quantity'],
                  });
                }
              }
            }
          });
        }),
    }).superRefine((data, ctx) => {
        if (data.discountType === 'percentage' && data.discountValue > 100) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Percentage discount cannot be over 100%",
                path: ['discountValue'],
            });
        }
        
        const subtotal = data.lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
        let discountAmount = 0;
        if (data.discountType === 'percentage') {
            discountAmount = subtotal * (data.discountValue / 100);
        } else {
            discountAmount = data.discountValue;
        }

        if (data.discountType === 'fixed' && data.discountValue > subtotal) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Fixed discount cannot be more than subtotal of Rs.${subtotal.toFixed(2)}`,
                path: ['discountValue'],
            });
        }
        
        const totalAmount = subtotal - discountAmount;

        if (!isEditMode && data.status === 'Partially Paid') {
            if (!data.initialPayment || data.initialPayment <= 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Payment amount is required for partially paid status.",
                    path: ['initialPayment'],
                });
            } else if (data.initialPayment >= totalAmount) {
                 ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Payment must be less than the total of Rs.${totalAmount.toFixed(2)}.`,
                    path: ['initialPayment'],
                });
            }
        }
    });
  }, [inventory, isEditMode, invoice]);
  
  type InvoiceFormData = z.infer<typeof formSchema>;


  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode
        ? {
            ...invoice,
            customerPhone: invoice.customerPhone || '',
            discountType: invoice.discountType || 'percentage',
            discountValue: invoice.discountValue || 0,
            initialPayment: 0
          }
        : {
            customerName: '',
            customerPhone: '',
            status: 'Paid',
            lineItems: [{ type: 'product', description: '', quantity: 1, price: 0, warrantyPeriod: 'N/A' }],
            discountType: 'percentage',
            discountValue: 0,
            initialPayment: 0,
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });

  const uniqueCategories = useMemo(() => {
    const categories = new Set(inventory.map(item => item.category).filter(Boolean));
    return ['All', ...Array.from(categories).sort()];
  }, [inventory]);

  const availableInventory = useMemo(() => {
    const availableItems = inventory.filter(i => i.status === 'Available');
    if (categoryFilter === 'All') {
        return availableItems;
    }
    return availableItems.filter(i => i.category === categoryFilter);
  }, [inventory, categoryFilter]);

  const watchLineItems = useWatch({ control: form.control, name: 'lineItems' });
  const watchDiscountType = useWatch({ control: form.control, name: 'discountType' });
  const watchDiscountValue = useWatch({ control: form.control, name: 'discountValue' });
  const watchStatus = useWatch({ control: form.control, name: 'status' });
  
  const { subtotal, discountAmount, totalAmount } = useMemo(() => {
    const sub = watchLineItems.reduce(
        (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0),
        0
    );

    let discAmt = 0;
    if (watchDiscountType === 'percentage') {
        discAmt = sub * ((Number(watchDiscountValue) || 0) / 100);
    } else if (watchDiscountType === 'fixed') {
        discAmt = Number(watchDiscountValue) || 0;
    }

    const total = sub - discAmt;
    return { subtotal: sub, discountAmount: discAmt, totalAmount: total };
  }, [watchLineItems, watchDiscountType, watchDiscountValue]);

  function onSubmit(values: InvoiceFormData) {
    if (isEditMode && invoice) {
        const { status, initialPayment, ...updateData} = values; // Status is recalculated in the hook, so we don't pass it.
        updateInvoice(invoice.id, updateData);
    } else {
        addInvoice(values);
    }
  }

  const onInvalid = (errors: FieldErrors<InvoiceFormData>) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
        let elementToScrollTo: HTMLElement | null = null;
        const firstErrorKey = errorKeys[0];

        if (firstErrorKey === 'customerName' || firstErrorKey === 'customerId') {
            elementToScrollTo = document.querySelector('[role="combobox"]');
        } else if (firstErrorKey === 'lineItems' && errors.lineItems) {
            const firstErrorIndex = Object.keys(errors.lineItems)[0];
            if (firstErrorIndex) {
               elementToScrollTo = document.querySelector(`[data-line-item-index="${firstErrorIndex}"]`);
            }
        }
        
        if (elementToScrollTo) {
            elementToScrollTo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  };

  const isPrivilegedUser = user?.activeRole === 'admin' || user?.activeRole === 'owner';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('invoice.form.customer_info')}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
             <CustomerSelector form={form}/>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>{t('invoice.form.line_items')}</CardTitle>
                 <div className="w-full sm:w-auto sm:max-w-xs">
                     <Select onValueChange={setCategoryFilter} defaultValue={categoryFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('invoice.form.filter_category')} />
                        </SelectTrigger>
                        <SelectContent>
                            {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-6">
              {fields.map((field, index) => {
                const lineItemType = form.watch(`lineItems.${index}.type`);
                return (
                <div
                  key={field.id}
                  data-line-item-index={index}
                  className="grid grid-cols-1 gap-y-4 rounded-md border p-4 md:grid-cols-12 md:gap-x-4 md:items-end"
                >
                  <div className="md:col-span-12">
                     <FormField
                      control={form.control}
                      name={`lineItems.${index}.type`}
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>{t('invoice.form.item_type')}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => {
                                form.setValue(`lineItems.${index}.inventoryItemId`, undefined);
                                form.setValue(`lineItems.${index}.description`, '');
                                form.setValue(`lineItems.${index}.price`, 0);
                                form.setValue(`lineItems.${index}.warrantyPeriod`, 'N/A');
                                field.onChange(value);
                              }}
                              value={field.value}
                              className="flex items-center space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="product" />
                                </FormControl>
                                <FormLabel className="font-normal flex items-center gap-2"><Package className="h-4 w-4" /> {t('invoice.form.product')}</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="service" />
                                </FormControl>
                                <FormLabel className="font-normal flex items-center gap-2"><Wrench className="h-4 w-4" /> {t('invoice.form.service')}</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="col-span-12 md:col-span-4">
                      <FormLabel>{t('invoice.form.description')}</FormLabel>
                       {lineItemType === 'product' ? (
                        <ProductSelector form={form} index={index} availableInventory={availableInventory} />
                      ) : (
                        <FormField
                          control={form.control}
                          name={`lineItems.${index}.description`}
                          render={({ field }) => (
                            <FormControl>
                              <Input placeholder={t('invoice.form.service_placeholder')} {...field} />
                            </FormControl>
                          )}
                        />
                      )}
                      <FormMessage className="mt-1">{form.formState.errors.lineItems?.[index]?.description?.message}</FormMessage>
                  </div>

                  <div className="col-span-6 md:col-span-2">
                        <FormLabel>{t('invoice.form.qty')}</FormLabel>
                        <FormField
                        control={form.control}
                        name={`lineItems.${index}.quantity`}
                        render={({ field }) => (
                            <FormControl>
                                <Input type="number" placeholder="1" {...field} onFocus={(e) => e.target.select()}/>
                            </FormControl>
                        )}
                        />
                        <FormMessage className="mt-1">{form.formState.errors.lineItems?.[index]?.quantity?.message}</FormMessage>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                        <FormLabel>{t('invoice.form.price')}</FormLabel>
                        <FormField
                        control={form.control}
                        name={`lineItems.${index}.price`}
                        render={({ field }) => (
                            <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} onFocus={(e) => e.target.select()} />
                            </FormControl>
                        )}
                        />
                        <FormMessage className="mt-1">{form.formState.errors.lineItems?.[index]?.price?.message}</FormMessage>
                    </div>
                    <div className="col-span-12 md:col-span-3">
                        <FormLabel>{t('invoice.form.warranty')}</FormLabel>
                        <FormField
                            control={form.control}
                            name={`lineItems.${index}.warrantyPeriod`}
                            render={({ field }) => (
                            <FormItem>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('invoice.form.warranty_placeholder')} />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="N/A">N/A</SelectItem>
                                        <SelectItem value="1 Week">1 Week</SelectItem>
                                        <SelectItem value="1 Month">1 Month</SelectItem>
                                        <SelectItem value="2 Months">2 Months</SelectItem>
                                        <SelectItem value="3 Months">3 Months</SelectItem>
                                        <SelectItem value="6 Months">6 Months</SelectItem>
                                        <SelectItem value="1 Year">1 Year</SelectItem>
                                        <SelectItem value="2 Years">2 Years</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage className="mt-1">{form.formState.errors.lineItems?.[index]?.warrantyPeriod?.message}</FormMessage>
                            </FormItem>
                            )}
                        />
                    </div>
                    <div className="col-span-12 md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                </div>
              )})}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ type: 'product', description: '', quantity: 1, price: 0, warrantyPeriod: 'N/A' })}
              className="mt-6"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('invoice.form.add_item')}
            </Button>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <Card className="h-full">
                    <CardHeader>
                      <CardTitle>{t('invoice.form.discount_title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 space-y-4">
                        <FormField
                            control={form.control}
                            name="discountType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('invoice.form.discount_type')}</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex space-x-4"
                                            disabled={!isPrivilegedUser}
                                        >
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="percentage" id="percentage" /></FormControl>
                                                <Label htmlFor="percentage" className="font-normal">{t('invoice.form.percentage')}</Label>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="fixed" id="fixed" /></FormControl>
                                                <Label htmlFor="fixed" className="font-normal">{t('invoice.form.fixed')}</Label>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="discountValue"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('invoice.form.discount_value')}</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            step="0.01"
                                            placeholder="0" 
                                            {...field} 
                                            disabled={!isPrivilegedUser}
                                        />
                                    </FormControl>
                                    {!isPrivilegedUser && <p className="text-xs text-muted-foreground mt-2">{t('invoice.form.discount_permission')}</p>}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-card p-6 shadow-sm md:flex-col md:items-end md:justify-center">
            <p className="text-lg font-semibold font-headline">{t('invoice.form.total_amount')}</p>
            <p className="text-2xl font-bold font-headline text-primary">
                Rs.{totalAmount.toFixed(2)}
            </p>
            </div>
        </div>

        {isEditMode && invoice ? (
            <Card>
                <CardHeader>
                    <CardTitle>{t('invoice.form.status_title')}</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center h-10">
                        <Badge>{invoice.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{t('invoice.form.status_desc')}</p>
                </CardContent>
            </Card>
        ) : (
             <Card>
                <CardHeader>
                    <CardTitle>{t('invoice.form.initial_payment_title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                     <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>{t('invoice.form.initial_status_label')}</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                                    >
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="Unpaid" id="unpaid" className="sr-only peer" />
                                            </FormControl>
                                            <Label htmlFor="unpaid" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                {t('invoices.status.unpaid')}
                                            </Label>
                                        </FormItem>
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="Paid" id="paid" className="sr-only peer" />
                                            </FormControl>
                                            <Label htmlFor="paid" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                {t('invoice.form.paid_full')}
                                            </Label>
                                        </FormItem>
                                        <FormItem>
                                            <FormControl>
                                                <RadioGroupItem value="Partially Paid" id="partial" className="sr-only peer" />
                                            </FormControl>
                                            <Label htmlFor="partial" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                {t('invoices.status.partially_paid')}
                                            </Label>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    {watchStatus === 'Partially Paid' && (
                        <FormField
                            control={form.control}
                            name="initialPayment"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('invoice.form.initial_payment_amount')}</FormLabel>
                                <FormControl>
                                <Input type="number" step="0.01" placeholder={t('invoice.form.initial_payment_placeholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}
                </CardContent>
            </Card>
        )}


        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isEditMode ? t('invoice.form.updating') : t('invoice.form.creating')}
              </>
            ) : (
                isEditMode ? t('invoice.form.update_btn') : t('invoice.form.create_btn')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
