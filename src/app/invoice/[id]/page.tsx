
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { useInvoices } from '@/hooks/use-invoices';
import ClassicTemplate from '@/components/templates/classic';
import ModernTemplate from '@/components/templates/modern';
import CorporateTemplate from '@/components/templates/corporate';
import CreativeTemplate from '@/components/templates/creative';
import { Button } from '@/components/ui/button';
import { Printer, Edit, ArrowLeft, Loader2, FileX2, HandCoins, MoreHorizontal, Eye } from 'lucide-react';
import type { Invoice } from '@/lib/types';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/auth-context';
import { AddPaymentDialog } from '@/components/add-payment-dialog';
import { useLanguage } from '@/contexts/language-context';
import InvoiceView from '@/components/invoice-view';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { getInvoice, isLoading: invoicesLoading, cancelInvoice, addPaymentToInvoice } = useInvoices();
  const { user, organization, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);
  const [isPreview, setIsPreview] = useState(false);

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
  
  const handlePrint = () => {
    window.print();
  };


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
    <div className="bg-muted/30 min-h-screen print-page-container">
        <div className="container max-w-4xl py-6 sm:py-10">
            <div className="mb-6 flex items-center justify-between gap-4 no-print">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('general.back')}
                </Button>
                <div className="flex items-center gap-2">
                    {isActionable && (
                        <AddPaymentDialog invoice={invoice} addPaymentToInvoice={addPaymentToInvoice}>
                            <Button size="sm" className="hidden sm:inline-flex">
                                <HandCoins className="mr-2 h-4 w-4" />
                                {t('invoice.view.add_payment')}
                            </Button>
                        </AddPaymentDialog>
                    )}
                    <Button onClick={handlePrint} variant="outline" size="sm" className="hidden sm:inline-flex">
                        <Printer className="mr-2 h-4 w-4" />
                        {t('invoice.view.print')}
                    </Button>
                    <Button onClick={() => setIsPreview(true)} variant="outline" size="sm" className="hidden sm:inline-flex">
                        <Eye className="mr-2 h-4 w-4" />
                        {t('invoice.view.preview')}
                    </Button>
                    
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
                                <DropdownMenuItem onSelect={() => setIsPreview(true)} className="sm:hidden">
                                     <Eye className="mr-2 h-4 w-4" />
                                     <span>{t('invoice.view.preview')}</span>
                                 </DropdownMenuItem>
                                <DropdownMenuItem onSelect={handlePrint} className="sm:hidden">
                                    <Printer className="mr-2 h-4 w-4" />
                                    <span>{t('invoice.view.print')}</span>
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
                </div>
            </div>
            
            <div className="print-main-view">
              <InvoiceView invoice={invoice} organization={organization} />
            </div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={isPreview} onOpenChange={setIsPreview}>
            <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 sm:p-0 no-print">
                <DialogHeader className="sr-only">
                    <DialogTitle>Invoice Preview</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto bg-muted/50 p-4 sm:p-8">
                    <div className="mx-auto my-auto w-[800px] bg-white shadow-lg">
                        <TemplateToRender
                            invoice={invoice}
                            organization={organization}
                            invoiceColor={organization?.invoiceColor}
                        />
                    </div>
                </div>
                <DialogFooter className="p-4 border-t bg-background rounded-b-lg sm:justify-center">
                    <Button type="button" variant="outline" onClick={() => setIsPreview(false)}>
                        {t('invoice.view.close_preview')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
