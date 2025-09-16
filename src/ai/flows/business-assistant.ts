"use server";
/**
 * Business Assistant AI flow: answers questions about sales, expenses, profit, and inventory
 * based on recent app data for a tenant.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InvoiceItem = z.object({
  id: z.string().optional(),
  date: z.string().optional(),
  status: z.string().optional(),
  total: z.number().optional(),
  lineItems: z.any().optional(),
});

const ExpenseItem = z.object({
  id: z.string().optional(),
  date: z.string().optional(),
  category: z.string().optional(),
  amount: z.number().optional(),
});

const InventoryItem = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().optional(),
  price: z.number().optional(),
  costPrice: z.number().optional(),
});

const AssistantInputSchema = z.object({
  locale: z.enum(['en', 'si']).default('si'),
  question: z.string().describe('The user question in natural language.'),
  invoices: z.array(InvoiceItem).describe('Recent invoices.'),
  expenses: z.array(ExpenseItem).describe('Recent expenses.'),
  inventory: z.array(InventoryItem).describe('Current inventory snapshot.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  answer: z.string().describe('Clear, friendly analysis answering the question with concrete numbers.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

const assistantPrompt = ai.definePrompt({
  name: 'businessAssistantPrompt',
  input: {
    schema: z.object({
      locale: z.enum(['en', 'si']),
      question: z.string(),
      invoices: z.array(InvoiceItem),
      expenses: z.array(ExpenseItem),
      inventory: z.array(InventoryItem),
    }),
  },
  output: { schema: AssistantOutputSchema },
  prompt: `You are a helpful retail business analyst. Answer the user's question using ONLY the provided data.
Respond in {{#if (eq locale "si")}}Sinhala{{else}}English{{/if}}.

When possible, compute and state:
- Top selling products (by quantity and revenue)
- Total revenue, total expenses, estimated gross profit (revenue - cost)
- Recent trend (last 7 vs previous 7 days)
- Inventory notes (low stock, overstock)

Format rules:
- Use short headings and bullet points
- Include small tables where helpful
- Keep it practical and friendly; avoid jargon

User question:
{{question}}

Invoices (recent):
{{#each invoices}}
- {{date}} | total: {{total}} | status: {{status}}
{{/each}}

Expenses (recent):
{{#each expenses}}
- {{date}} | {{category}} | amount: {{amount}}
{{/each}}

Inventory snapshot:
{{#each inventory}}
- {{name}} | qty: {{quantity}} | price: {{price}} | cost: {{costPrice}}
{{/each}}
`,
});

export async function businessAssistant(input: AssistantInput): Promise<AssistantOutput> {
  const { output } = await assistantPrompt(input);
  return output!;
}


