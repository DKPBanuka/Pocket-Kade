
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Invoice, Organization } from '@/lib/types';

import { useInvoices } from '@/hooks/use-invoices';
import ClassicTemplate from '@/components/templates/classic';
import ModernTemplate from '@/components/templates/modern';
import CorporateTemplate from '@/components/templates/corporate';
import CreativeTemplate from '@/components/templates/creative';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Edit, MoreHorizontal, FileX2, Printer, Eye, CreditCard } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/auth-context';
import { AddPaymentDialog } from '@/components/add-payment-dialog';
import { useLanguage } from '@/contexts/language-context';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { getInvoice, isLoading: invoicesLoading, cancelInvoice, addPaymentToInvoice } = useInvoices();
  const { user, organization, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isLoading = invoicesLoading || authLoading;

  useEffect(() => {
    if (!isLoading && id) {
      const foundInvoice = getInvoice(id);
      if (foundInvoice) {
        setInvoice(foundInvoice);
      } else {
        router.push('/');
      }
    }
  }, [id, getInvoice, isLoading, router]);
  
  const getTemplateComponent = () => {
    switch (organization?.invoiceTemplate) {
        case 'modern':
            return ModernTemplate;
        case 'corporate':
            return CorporateTemplate;
        case 'creative':
            return CreativeTemplate;
        case 'classic':
        default:
            return ClassicTemplate;
    }
  };
  
  const handlePrint = () => {
    document.body.classList.add('printing-preview');
    requestAnimationFrame(() => {
      window.print();
      document.body.classList.remove('printing-preview');
    });
  };

  if (isLoading || !invoice) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const TemplateToRender = getTemplateComponent();
  const isActionable = invoice.status !== 'Cancelled' && invoice.status !== 'Paid';
  const isPrivilegedUser = user?.activeRole === 'admin' || user?.activeRole === 'owner';

  return (
    <div className="bg-muted/30 min-h-screen">
        <div className="container max-w-4xl py-6 sm:py-10 pb-24 md:pb-10">
            <div className="mb-6 flex items-center justify-between gap-4">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('general.back')}
                </Button>
                <div className="hidden sm:flex items-center gap-2">
                    {isActionable && (
                        <AddPaymentDialog invoice={invoice} addPaymentToInvoice={addPaymentToInvoice}>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                {t('invoice.view.add_payment')}
                            </Button>
                        </AddPaymentDialog>
                    )}
                    
                    {isPrivilegedUser && invoice.status !== 'Cancelled' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">{t('invoice.view.more_actions')}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => router.push(`/invoice/${id}/edit`)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>{t('invoice.view.edit')}</span>
                                </DropdownMenuItem>
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                        <FileX2 className="mr-2 h-4 w-4" />
                                        <span>{t('invoice.view.cancel')}</span>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>{t('invoice.view.cancel_confirm_title')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('invoice.view.cancel_confirm_desc', { invoiceId: invoice.id })}
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>{t('invoice.view.go_back')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => cancelInvoice(invoice.id)} className="bg-destructive hover:bg-destructive/90">
                                        {t('invoice.view.confirm_cancellation')}
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Eye className="mr-2 h-4 w-4"/> {t('invoice.view.preview')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 sm:p-0 print-dialog-content">
                            <DialogHeader className="p-4 border-b print-hide-in-dialog">
                                <DialogTitle>Invoice Preview</DialogTitle>
                                <DialogDescription>
                                    This is how your invoice will look when printed.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-auto bg-muted/50 p-4 sm:p-8 print-scroll-wrapper">
                                <div className="print-this-invoice mx-auto my-auto w-[800px] bg-white shadow-lg light">
                                    <TemplateToRender
                                        invoice={invoice}
                                        organization={organization}
                                        invoiceColor={organization?.invoiceColor}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="p-4 border-t bg-background rounded-b-lg sm:justify-between print-hide-in-dialog">
                                <span className="text-xs text-muted-foreground">Tip: Use your browser's print options to save as PDF.</span>
                                <Button onClick={handlePrint}>
                                    <Printer className="mr-2 h-4 w-4" /> {t('invoice.view.print')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            
            <div>
                <TemplateToRender
                    invoice={invoice}
                    organization={organization}
                    invoiceColor={organization?.invoiceColor}
                />
            </div>
        </div>

        {/* Mobile Action Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-2 flex items-center justify-around gap-1">
             {isActionable && (
                <AddPaymentDialog invoice={invoice} addPaymentToInvoice={addPaymentToInvoice}>
                    <Button variant="ghost" className="flex-1 flex-col h-auto p-1 text-green-600 hover:text-green-600">
                        <CreditCard className="h-5 w-5 mb-1" />
                        <span className="text-xs font-semibold">{t('invoice.view.add_payment')}</span>
                    </Button>
                </AddPaymentDialog>
            )}

            {isPrivilegedUser && invoice.status !== 'Cancelled' && (
                <Button variant="ghost" className="flex-1 flex-col h-auto p-1" onClick={() => router.push(`/invoice/${id}/edit`)}>
                    <Edit className="h-5 w-5 mb-1" />
                    <span className="text-xs">{t('invoice.view.edit')}</span>
                </Button>
            )}
            
            <Dialog>
                <DialogTrigger asChild>
                     <Button variant="ghost" className="flex-1 flex-col h-auto p-1">
                        <Printer className="h-5 w-5 mb-1" />
                        <span className="text-xs">{t('invoice.view.print')}</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 sm:p-0 print-dialog-content">
                    <DialogHeader className="p-4 border-b print-hide-in-dialog">
                        <DialogTitle>Invoice Preview</DialogTitle>
                        <DialogDescription>This is how your invoice will look when printed.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto bg-muted/50 p-4 sm:p-8 print-scroll-wrapper">
                        <div className="print-this-invoice mx-auto my-auto w-[800px] bg-white shadow-lg light">
                            <TemplateToRender invoice={invoice} organization={organization} invoiceColor={organization?.invoiceColor} />
                        </div>
                    </div>
                    <DialogFooter className="p-4 border-t bg-background rounded-b-lg sm:justify-between print-hide-in-dialog">
                        <span className="text-xs text-muted-foreground">Tip: Use your browser's print options to save as PDF.</span>
                        <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> {t('invoice.view.print')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isPrivilegedUser && invoice.status !== 'Cancelled' && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="flex-1 flex-col h-auto p-1 text-destructive hover:text-destructive">
                            <FileX2 className="h-5 w-5 mb-1" />
                            <span className="text-xs">{t('invoice.view.cancel')}</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('invoice.view.cancel_confirm_title')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('invoice.view.cancel_confirm_desc', { invoiceId: invoice.id })}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('invoice.view.go_back')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => cancelInvoice(invoice.id)} className="bg-destructive hover:bg-destructive/90">{t('invoice.view.confirm_cancellation')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    </div>
  );
}
