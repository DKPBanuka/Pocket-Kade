'use server';
/**
 * @fileOverview An AI flow that acts as a business analyst, answering questions about the organization's data.
 * 
 * - businessAnalyst - A function that takes a user's question and organization data to provide an answer.
 * - BusinessAnalystInput - The input type for the businessAnalyst function.
 * - BusinessAnalystOutput - The return type for the businessAnalyst function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Customer, Expense, InventoryItem, Invoice, ReturnItem, Supplier } from '@/lib/types';

// Define Zod schemas that match the data types from '@/lib/types'
// This helps ensure data consistency and provides type safety.
const CustomerSchema = z.custom<Customer>();
const InventoryItemSchema = z.custom<InventoryItem>();
const InvoiceSchema = z.custom<Invoice>();
const ExpenseSchema = z.custom<Expense>();
const ReturnItemSchema = z.custom<ReturnItem>();
const SupplierSchema = z.custom<Supplier>();


const BusinessAnalystInputSchema = z.object({
  question: z.string().describe("The user's question about their business data."),
  customers: z.array(CustomerSchema).describe("List of all customers."),
  inventory: z.array(InventoryItemSchema).describe("List of all inventory items, including cost and selling price."),
  invoices: z.array(InvoiceSchema).describe("List of all invoices, including line items and payments."),
  expenses: z.array(ExpenseSchema).describe("List of all business expenses."),
  returns: z.array(ReturnItemSchema).describe("List of all product returns."),
  suppliers: z.array(SupplierSchema).describe("List of all suppliers."),
  locale: z.enum(['en', 'si']).describe('The language for the response.'),
});
export type BusinessAnalystInput = z.infer<typeof BusinessAnalystInputSchema>;

const BusinessAnalystOutputSchema = z.object({
  answer: z.string().describe("A comprehensive, data-driven answer to the user's question."),
});
export type BusinessAnalystOutput = z.infer<typeof BusinessAnalystOutputSchema>;

export async function businessAnalyst(input: BusinessAnalystInput): Promise<BusinessAnalystOutput> {
  return businessAnalystFlow(input);
}

const prompt = ai.definePrompt({
  name: 'businessAnalystPrompt',
  input: { schema: z.object({
    ...BusinessAnalystInputSchema.shape,
    isSinhala: z.boolean(),
  }) },
  output: { schema: BusinessAnalystOutputSchema },
  prompt: `You are a helpful and highly accurate business analyst for a company called "Pocket කඩේ".
Your task is to answer the user's question based ONLY on the data provided below.
Provide clear, concise, and 100% accurate answers based on calculations from the data.
Do not expose internal identifiers like inventoryId, customerId, etc., in your answer.
If the data is insufficient to answer the question, state that clearly.
The response must be in {{#if isSinhala}}Sinhala{{else}}English{{/if}}.

User's Question: {{{question}}}

DATA:
- Customers: {{{json customers}}}
- Inventory: {{{json inventory}}}
- Invoices: {{{json invoices}}}
- Expenses: {{{json expenses}}}
- Returns: {{{json returns}}}
- Suppliers: {{{json suppliers}}}
`,
});

const businessAnalystFlow = ai.defineFlow(
  {
    name: 'businessAnalystFlow',
    inputSchema: BusinessAnalystInputSchema,
    outputSchema: BusinessAnalystOutputSchema,
  },
  async (input) => {
    const isSinhala = input.locale === 'si';
    const { output } = await prompt({ ...input, isSinhala });
    return output!;
  }
);
