
"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Trash2, HelpCircle } from 'lucide-react';
import { useInventory } from '@/hooks/use-inventory';
import { inventoryShipmentSchema } from '@/lib/schemas';
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from './ui/separator';
import { useLanguage } from '@/contexts/language-context';

type ShipmentFormData = z.infer<typeof inventoryShipmentSchema>;

const formatCurrency = (amount: number | undefined | null) => `Rs.${(amount || 0).toFixed(2)}`;

export default function InventoryShipmentForm() {
  const { addInventoryShipment } = useInventory();
  const { t } = useLanguage();
  const [summary, setSummary] = useState({
    totalPurchaseValue: 0,
    totalLandedCost: 0,
    totalRequiredRevenue: 0
  });

  const form = useForm<ShipmentFormData>({
    resolver: zodResolver(inventoryShipmentSchema),
    defaultValues: {
      lineItems: [{ name: '', quantity: 1, unitCostPrice: 0 }],
      transportCost: 0,
      otherExpenses: 0,
      targetProfit: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    const { lineItems, transportCost, otherExpenses, targetProfit } = watchedValues;
    
    const numTransportCost = Number(transportCost) || 0;
    const numOtherExpenses = Number(otherExpenses) || 0;
    const numTargetProfit = Number(targetProfit) || 0;

    const totalPurchaseValue = lineItems?.reduce((acc, item) => {
        const qty = Number(item?.quantity) || 0;
        const cost = Number(item?.unitCostPrice) || 0;
        return acc + qty * cost;
    }, 0) || 0;
    
    const totalAdditionalExpenses = numTransportCost + numOtherExpenses;
    const totalLandedCost = totalPurchaseValue + totalAdditionalExpenses;
    const totalRequiredRevenue = totalLandedCost + numTargetProfit;
    
    setSummary({ totalPurchaseValue, totalLandedCost, totalRequiredRevenue });

    if (lineItems) {
        lineItems.forEach((item, index) => {
            if (!item) return;
            const qty = Number(item.quantity) || 0;
            const cost = Number(item.unitCostPrice) || 0;
            
            let landedCost = cost;
            if (totalPurchaseValue > 0 && qty > 0) {
                const itemTotalValue = qty * cost;
                landedCost += ((itemTotalValue / totalPurchaseValue) * totalAdditionalExpenses) / qty;
            }
            
            if (form.getValues(`lineItems.${index}.landedCost`) !== landedCost) {
                form.setValue(`lineItems.${index}.landedCost`, landedCost, { shouldValidate: false });
            }

            let suggestedPrice = landedCost;
            if (numTargetProfit > 0 && totalLandedCost > 0) {
                const rawSuggestedPrice = landedCost * (totalRequiredRevenue / totalLandedCost);
                suggestedPrice = Math.round(rawSuggestedPrice / 10) * 10;
            }

            if (form.getValues(`lineItems.${index}.suggestedPrice`) !== suggestedPrice) {
                form.setValue(`lineItems.${index}.suggestedPrice`, suggestedPrice, { shouldValidate: false });
            }
        });
    }
  }, [watchedValues, form]);


  const onSubmit = (data: ShipmentFormData) => {
    addInventoryShipment(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>{t('inventory.shipment_form.shipment_items')}</CardTitle>
                <CardDescription>{t('inventory.shipment_form.shipment_items_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Desktop Only Headers */}
                    <div className="hidden md:grid md:grid-cols-12 items-center gap-4 px-1 pb-2 border-b">
                        <div className="col-span-3 text-sm font-medium text-muted-foreground">{t('inventory.shipment_form.item_name')}</div>
                        <div className="col-span-2 text-sm font-medium text-muted-foreground">{t('inventory.shipment_form.quantity')}</div>
                        <div className="col-span-2 text-sm font-medium text-muted-foreground">{t('inventory.shipment_form.unit_cost')}</div>
                        <div className="col-span-2 text-sm font-medium text-muted-foreground">{t('inventory.shipment_form.landed_cost')}</div>
                        <div className="col-span-2 text-sm font-medium text-muted-foreground">{t('inventory.shipment_form.suggested_price')}</div>
                        <div className="col-span-1"></div>
                    </div>

                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-2 md:grid-cols-12 gap-x-4 gap-y-2 items-end p-2 md:p-0 border md:border-0 rounded-md">
                            {/* Item Name */}
                            <div className="col-span-2 md:col-span-3">
                                <FormLabel className="text-xs font-normal md:hidden">{t('inventory.shipment_form.item_name')}</FormLabel>
                                <FormField control={form.control} name={`lineItems.${index}.name`} render={({ field }) => <Input placeholder="e.g. Wireless Mouse G502" {...field} />} />
                            </div>
                            
                            {/* Quantity */}
                            <div className="col-span-1 md:col-span-2">
                                <FormLabel className="text-xs font-normal md:hidden">{t('inventory.shipment_form.quantity')}</FormLabel>
                                <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => <Input type="number" {...field} onFocus={(e) => e.target.select()} />} />
                            </div>

                            {/* Unit Cost */}
                            <div className="col-span-1 md:col-span-2">
                                <FormLabel className="text-xs font-normal md:hidden">{t('inventory.shipment_form.unit_cost')}</FormLabel>
                                <FormField control={form.control} name={`lineItems.${index}.unitCostPrice`} render={({ field }) => <Input type="number" step="0.01" {...field} onFocus={(e) => e.target.select()} />} />
                            </div>

                            {/* Landed Cost */}
                            <div className="col-span-1 md:col-span-2">
                                <FormLabel className="text-xs font-normal md:hidden">{t('inventory.shipment_form.landed_cost')}</FormLabel>
                                <Input value={formatCurrency(form.getValues(`lineItems.${index}.landedCost`))} readOnly disabled />
                            </div>

                            {/* Suggested Price */}
                            <div className="col-span-1 md:col-span-2">
                                <FormLabel className="text-xs font-normal md:hidden">{t('inventory.shipment_form.suggested_price')}</FormLabel>
                                <Input value={formatCurrency(form.getValues(`lineItems.${index}.suggestedPrice`))} readOnly disabled className="text-primary font-bold" />
                            </div>

                            {/* Delete Button */}
                            <div className="col-span-2 md:col-span-1 md:self-end">
                                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length === 1} className="w-full md:w-auto">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Remove Item</span>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', quantity: 1, unitCostPrice: 0 })} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> {t('inventory.shipment_form.add_item')}
                </Button>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('inventory.shipment_form.shared_expenses')}</CardTitle>
                    <CardDescription>{t('inventory.shipment_form.shared_expenses_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField control={form.control} name="transportCost" render={({ field }) => (
                        <FormItem><FormLabel>{t('inventory.shipment_form.transport_cost')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="otherExpenses" render={({ field }) => (
                        <FormItem><FormLabel>{t('inventory.shipment_form.other_expenses')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('inventory.shipment_form.pricing_engine')}</CardTitle>
                    <CardDescription>{t('inventory.shipment_form.pricing_engine_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField control={form.control} name="targetProfit" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2">{t('inventory.shipment_form.target_profit')}
                                 <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild><button type="button" onClick={(e) => e.preventDefault()}><HelpCircle className="h-4 w-4 text-muted-foreground"/></button></TooltipTrigger>
                                        <TooltipContent><p>{t('inventory.shipment_form.target_profit_tooltip')}</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </FormLabel>
                            <FormControl><Input type="number" placeholder="e.g. 10000" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </CardContent>
            </Card>
        </div>
        
        <Card>
            <CardHeader><CardTitle>{t('inventory.shipment_form.summary')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><p className="text-muted-foreground">{t('inventory.shipment_form.purchase_value')}</p><p>{formatCurrency(summary.totalPurchaseValue)}</p></div>
                <div className="flex justify-between text-sm"><p className="text-muted-foreground">{t('inventory.shipment_form.additional_expenses')}</p><p>{formatCurrency((Number(watchedValues.transportCost) || 0) + (Number(watchedValues.otherExpenses) || 0))}</p></div>
                <Separator/>
                <div className="flex justify-between font-bold"><p>{t('inventory.shipment_form.total_landed_cost')}</p><p>{formatCurrency(summary.totalLandedCost)}</p></div>
                <div className="flex justify-between text-sm"><p className="text-muted-foreground">{t('inventory.shipment_form.target_profit_summary')}</p><p>{formatCurrency(Number(watchedValues.targetProfit) || 0)}</p></div>
                <Separator/>
                <div className="flex justify-between font-bold text-primary"><p>{t('inventory.shipment_form.required_revenue')}</p><p>{formatCurrency(summary.totalRequiredRevenue)}</p></div>
            </CardContent>
             <CardFooter className="flex justify-end">
                 <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('inventory.shipment_form.submitting')} </>
                    ) : t('inventory.shipment_form.submit')}
                 </Button>
            </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
