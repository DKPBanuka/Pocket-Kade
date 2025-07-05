
import * as z from 'zod';

// Schema for data going into the database (server-side)
export const customerServerSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(2, { message: "Customer name must be at least 2 characters." }),
  phone: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  address: z.string().optional(),
});

export const supplierServerSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(2, { message: "Supplier name must be at least 2 characters." }),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  address: z.string().optional(),
});

// Used for both add and update, quantity check is separate
export const inventoryItemServerSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(2, { message: "Item name must be at least 2 characters." }),
  category: z.string().min(2, { message: "Category is required." }),
  brand: z.string().optional(),
  price: z.number().min(0, { message: "Price must be a positive number." }),
  costPrice: z.number().min(0, { message: "Cost price must be a positive number." }),
  reorderPoint: z.number().int({ message: "Reorder point must be a whole number." }),
  status: z.enum(['Available', 'Awaiting Inspection', 'Damaged', 'For Repair']),
  warrantyPeriod: z.string().min(1, { message: "Warranty period is required." }),
});

export const returnServerSchema = z.object({
    tenantId: z.string().min(1),
    type: z.enum(['Customer Return', 'Supplier Return']),
    inventoryItemId: z.string().min(1),
    quantity: z.number().min(1),
    reason: z.string().min(5),
    originalInvoiceId: z.string().optional(),
    customerName: z.string(),
    customerPhone: z.string().optional(),
}).refine(data => data.type === 'Supplier Return' || (data.type === 'Customer Return' && data.customerName.length > 0), {
    message: 'Customer name is required for customer returns.',
    path: ['customerName'],
});

export const updateReturnServerSchema = z.object({
    status: z.enum(['Awaiting Inspection', 'Under Repair', 'Ready for Pickup', 'To be Replaced', 'To be Refunded', 'Return to Supplier', 'Completed / Closed']).optional(),
    notes: z.string().max(1000, "Notes cannot exceed 1000 characters.").optional(),
});


export const lineItemServerSchema = z.object({
    id: z.string().optional(),
    type: z.enum(['product', 'service']),
    inventoryItemId: z.string().optional(),
    description: z.string().min(1, { message: "Line item description cannot be empty." }),
    quantity: z.number().min(1, { message: "Quantity must be at least 1." }),
    price: z.number().min(0, { message: "Price cannot be negative." }),
    warrantyPeriod: z.string().min(1, { message: "Warranty period is required." }),
});

export const invoiceServerObjectSchema = z.object({
    tenantId: z.string().min(1),
    customerId: z.string().optional(),
    customerName: z.string().min(1, { message: "Customer name is required." }),
    customerPhone: z.string().optional(),
    discountType: z.enum(['percentage', 'fixed']).default('percentage'),
    discountValue: z.coerce.number().min(0, "Discount value can't be negative").default(0),
    lineItems: z.array(lineItemServerSchema).min(1, { message: "An invoice must have at least one line item." }),
});

export const invoiceServerSchema = invoiceServerObjectSchema.superRefine((data, ctx) => {
    if (data.discountType === 'percentage' && data.discountValue > 100) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Percentage discount cannot be over 100%",
            path: ['discountValue'],
        });
    }
    const subtotal = data.lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
    if (data.discountType === 'fixed' && data.discountValue > subtotal) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Fixed discount cannot be more than subtotal of Rs.${subtotal.toFixed(2)}`,
            path: ['discountValue'],
        });
    }
});

export const paymentServerSchema = z.object({
    amount: z.number().positive("Payment amount must be positive."),
    method: z.enum(['Cash', 'Card', 'Bank Transfer', 'Other']),
    notes: z.string().optional(),
});


export const stockMovementServerSchema = z.object({
    tenantId: z.string().min(1),
    inventoryItemId: z.string().min(1),
    type: z.enum(['addition', 'sale', 'cancellation', 'return', 'adjustment']),
    quantity: z.number(),
    referenceId: z.string().optional(),
    createdByName: z.string(),
});
