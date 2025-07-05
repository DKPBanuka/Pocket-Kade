
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'owner' | 'admin' | 'staff';

export interface AuthUser {
  uid: string;
  email: string | null;
  username: string;
  tenants: { [key: string]: UserRole };
  activeTenantId: string | null;
  activeRole: UserRole | null;
}

export interface Organization {
  id: string;
  name: string;
  ownerUid: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string; // ISO string
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string; // ISO string
}

export type ItemStatus = 'Available' | 'Awaiting Inspection' | 'Damaged' | 'For Repair';

export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  brand: string;
  quantity: number;
  price: number; // Selling price
  costPrice: number;
  reorderPoint: number;
  status: ItemStatus;
  warrantyPeriod: string;
  createdAt: string; // Storing as ISO string on client, but can be Timestamp from server
}

export interface LineItem {
  id: string;
  type: 'product' | 'service';
  inventoryItemId?: string;
  description: string;
  quantity: number;
  price: number;
  warrantyPeriod: string;
}

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Partially Paid' | 'Cancelled';

export interface Payment {
  id: string;
  amount: number;
  date: string; // ISO string
  method: 'Cash' | 'Card' | 'Bank Transfer' | 'Other';
  notes?: string;
  createdBy: string; // user uid
  createdByName: string;
}

export interface Invoice {
  id:string; // The invoice number, e.g., "INV-2024-0001"
  tenantId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  status: InvoiceStatus;
  createdAt: string; // ISO string
  lineItems: LineItem[];
  payments?: Payment[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  createdBy: string; // User UID
  createdByName: string;
}

export type ReturnStatus = 'Awaiting Inspection' | 'Under Repair' | 'Ready for Pickup' | 'To be Replaced' | 'To be Refunded' | 'Return to Supplier' | 'Completed / Closed';
export type ReturnType = 'Customer Return' | 'Supplier Return';

export interface ReturnItem {
  id: string; // internal UUID
  tenantId: string;
  returnId: string; // e.g. RTN-2024-0001
  type: ReturnType;
  status: ReturnStatus;
  customerName: string;
  customerPhone?: string;
  inventoryItemId: string;
  inventoryItemName: string;
  originalInvoiceId?: string;
  quantity: number;
  reason: string;
  notes?: string;
  createdAt: string; // ISO string
  resolutionDate?: string; // ISO string
  createdBy: string; // User UID
  createdByName: string;
}

export interface AppNotification {
  id: string;
  message: string;
  link: string;
  read: boolean;
  recipientUid: string;
  createdAt: string; // ISO string
  senderName: string;
  type: 'invoice' | 'inventory' | 'return' | 'general' | 'low-stock';
}

export interface Conversation {
  id: string;
  tenantId: string;
  participants: string[]; // array of user uids
  participantUsernames: { [key: string]: string };
  lastMessage?: string;
  lastMessageTimestamp?: any; // server timestamp
  lastMessageSenderId?: string;
  unreadCounts: { [key: string]: number };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any; // server timestamp
}

export type StockMovementType = 'addition' | 'sale' | 'cancellation' | 'return' | 'adjustment';

export interface StockMovement {
  id: string;
  tenantId: string;
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number;
  createdAt: string; // ISO string
  referenceId?: string; // e.g., Invoice ID, Return ID, or a note like "Initial Stock"
  createdByName: string;
}
