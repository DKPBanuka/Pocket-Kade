
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { updateOrganizationInvoiceSettingsAction } from "@/app/actions";
import type { Invoice, Organization } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Eye } from "lucide-react";
import ClassicTemplate from "@/components/templates/classic";
import ModernTemplate from "@/components/templates/modern";
import CorporateTemplate from "@/components/templates/corporate";
import CreativeTemplate from "@/components/templates/creative";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

// Sample data to generate realistic previews
const sampleInvoice: Invoice = {
  id: 'INV-2024-PREVIEW',
  tenantId: 'preview-tenant',
  customerName: 'John Doe',
  customerPhone: '555-1234',
  status: 'Paid',
  createdAt: new Date().toISOString(),
  lineItems: [
    { id: 'li1', type: 'product', description: 'Wireless Mouse', quantity: 2, price: 2500, warrantyPeriod: '1 Year' },
    { id: 'li2', type: 'product', description: 'USB-C Cable (3ft)', quantity: 1, price: 1200, warrantyPeriod: '6 Months' },
    { id: 'li3', type: 'service', description: 'Laptop Cleaning Service', quantity: 1, price: 3000, warrantyPeriod: 'N/A' },
  ],
  payments: [{ id: 'p1', amount: 11200, date: new Date().toISOString(), method: 'Cash', createdBy: 'user', createdByName: 'Admin' }],
  discountType: 'fixed',
  discountValue: 1000,
  createdBy: 'user',
  createdByName: 'Admin',
};

const sampleOrganization: Organization = {
  id: 'preview-org',
  name: 'Your Company Name',
  ownerUid: 'preview-owner',
  createdAt: new Date().toISOString(),
  onboardingCompleted: true,
  address: '123 Main Street\nCityville, 10100',
  phone: '011-234-5678',
  brn: 'PV12345',
};

const templates = [
  { name: 'classic', label: 'Classic' },
  { name: 'modern', label: 'Modern' },
  { name: 'corporate', label: 'Corporate' },
  { name: 'creative', label: 'Creative' },
];

const PRESET_COLORS = [
  '#0ea5e9', // sky-500
  '#ef4444', // red-500
  '#22c55e', // green-500
  '#8b5cf6', // violet-500
  '#f97316', // orange-500
  '#3b82f6', // blue-500
];

interface InvoiceSettingsDialogProps {
    children: React.ReactNode;
}

export function InvoiceSettingsDialog({ children }: InvoiceSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { organization, user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [selectedTemplate, setSelectedTemplate] = useState(organization?.invoiceTemplate || 'classic');
  const [selectedColor, setSelectedColor] = useState(organization?.invoiceColor || PRESET_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [templateToPreview, setTemplateToPreview] = useState<string | null>(null);

  useEffect(() => {
    if (organization && isOpen) {
      setSelectedTemplate(organization.invoiceTemplate || 'classic');
      setSelectedColor(organization.invoiceColor || PRESET_COLORS[0]);
    }
  }, [organization, isOpen]);

  const handleSave = async () => {
    if (!user?.activeTenantId) {
      toast({ title: "Error", description: "Could not find organization.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const result = await updateOrganizationInvoiceSettingsAction(user.activeTenantId, {
      invoiceTemplate: selectedTemplate,
      invoiceColor: selectedColor,
    });
    setIsSaving(false);

    if (result.success) {
      toast({ title: "Settings Saved", description: "Your invoice appearance has been updated." });
      setIsOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "Failed to save settings.", variant: "destructive" });
    }
  };

  const renderTemplateThumbnail = (templateName: string) => {
    switch(templateName) {
      case 'classic': return <ClassicTemplate invoice={sampleInvoice} organization={sampleOrganization} invoiceColor={selectedColor} />;
      case 'modern': return <ModernTemplate invoice={sampleInvoice} organization={sampleOrganization} invoiceColor={selectedColor} />;
      case 'corporate': return <CorporateTemplate invoice={sampleInvoice} organization={sampleOrganization} invoiceColor={selectedColor} />;
      case 'creative': return <CreativeTemplate invoice={sampleInvoice} organization={sampleOrganization} invoiceColor={selectedColor} />;
      default: return null;
    }
  }

  const getTemplateLabel = (templateName: string) => {
    switch(templateName) {
      case 'classic': return 'Classic';
      case 'modern': return 'Modern';
      case 'corporate': return t('settings.invoice.template.corporate');
      case 'creative': return t('settings.invoice.template.creative');
      default: return 'Template';
    }
  }
  
  const recentColors = organization?.recentInvoiceColors || [];
  const colorsToDisplay = recentColors.length > 0 ? recentColors : PRESET_COLORS;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-4xl p-0">
          <div className="flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 pb-4 flex-shrink-0">
                <DialogTitle>Customize Invoice</DialogTitle>
                <DialogDescription>
                Choose a template and brand color to match your business.
                </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-6">
                <div className="py-4 space-y-6">
                <div>
                    <Label className="text-base font-semibold">Template</Label>
                    <RadioGroup
                    value={selectedTemplate}
                    onValueChange={setSelectedTemplate}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2"
                    >
                    {templates.map((template) => (
                        <div key={template.name}>
                            <RadioGroupItem value={template.name} id={template.name} className="peer sr-only" />
                             <div className="relative group peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary rounded-md border-2 border-muted hover:border-primary/50 transition-all">
                                <div className="flex justify-between items-center p-2 pb-0">
                                    <Label htmlFor={template.name} className="font-semibold cursor-pointer">{getTemplateLabel(template.name)}</Label>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 z-10"
                                        onClick={(e) => { e.preventDefault(); setTemplateToPreview(template.name); }}
                                        aria-label={`Preview ${template.label} template`}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Label htmlFor={template.name} className="cursor-pointer">
                                    <div className="px-2 pb-2">
                                        <div className="w-full aspect-[8.5/11] border rounded-sm overflow-hidden bg-gray-100 dark:bg-gray-800">
                                            <div className="transform scale-[0.3] sm:scale-[0.25] md:scale-[0.3] origin-top-left bg-white">
                                                <div className="w-[800px] h-auto">
                                                    {renderTemplateThumbnail(template.name)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Label>
                            </div>
                        </div>
                    ))}
                    </RadioGroup>
                </div>
                <div>
                    <Label htmlFor="color-picker" className="text-base font-semibold">Brand Color</Label>
                    <div className="flex items-center gap-2 mt-2">
                        <input
                            id="color-picker"
                            type="color"
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="h-10 w-14 p-1 bg-white border border-input rounded-md cursor-pointer"
                        />
                        <div className="px-3 py-2 rounded-md border border-input bg-background w-full">
                            {selectedColor}
                        </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {colorsToDisplay.map((color) => (
                            <button
                            key={color}
                            type="button"
                            className={cn(
                                "h-8 w-8 rounded-full border-2 transition-all",
                                selectedColor.toLowerCase() === color.toLowerCase() ? 'border-primary' : 'border-transparent hover:border-muted-foreground/50'
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                            aria-label={`Select color ${color}`}
                            />
                        ))}
                    </div>
                </div>
                </div>
            </div>
            <DialogFooter className="p-6 pt-4 border-t flex-shrink-0">
                <DialogClose asChild>
                <Button type="button" variant="outline">
                    Cancel
                </Button>
                </DialogClose>
                <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
                </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!templateToPreview} onOpenChange={(open) => !open && setTemplateToPreview(null)}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 sm:p-0">
            <DialogHeader className="sr-only">
                <DialogTitle>{templateToPreview} Template Preview</DialogTitle>
                <DialogDescription>
                A preview of the selected invoice template. You can scroll and zoom.
                </DialogDescription>
            </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/50 p-4 sm:p-8">
            <div className="mx-auto my-auto w-[800px] bg-white shadow-lg">
              {renderTemplateThumbnail(templateToPreview || '')}
            </div>
          </div>
          <DialogFooter className="p-4 border-t bg-background rounded-b-lg sm:justify-center">
            <Button onClick={() => setTemplateToPreview(null)}>Close Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
