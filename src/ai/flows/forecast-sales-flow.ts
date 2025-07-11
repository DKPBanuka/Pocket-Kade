
'use server';
/**
 * @fileOverview An AI flow to forecast sales based on historical data.
 *
 * - forecastSales - A function that provides a sales forecast.
 * - SalesDataInput - The input type for the forecastSales function.
 * - SalesForecastOutput - The return type for the forecastSales function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SalesDataItemSchema = z.object({
  date: z.string().describe('The date of the sales data point (e.g., YYYY-MM-DD).'),
  total: z.number().describe('The total sales revenue received on that day.'),
});

const SalesDataInputSchema = z.object({
  salesData: z.array(SalesDataItemSchema).describe('An array of historical daily revenue data based on payments received.'),
  locale: z.enum(['en', 'si']).describe('The language for the forecast response.'),
});
export type SalesDataInput = z.infer<typeof SalesDataInputSchema>;

const SalesForecastOutputSchema = z.object({
  forecast: z
    .string()
    .describe('A comprehensive, easy-to-read sales forecast and analysis based on the provided daily revenue data. It should identify trends, patterns, and provide a realistic potential revenue range for the next 30 days. The tone should be like a helpful business advisor.'),
});
export type SalesForecastOutput = z.infer<typeof SalesForecastOutputSchema>;


export async function forecastSales(input: SalesDataInput): Promise<SalesForecastOutput> {
  return forecastSalesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'salesForecastPrompt',
  input: {schema: z.object({
      salesData: z.array(SalesDataItemSchema),
      isSinhala: z.boolean(),
  })},
  output: {schema: SalesForecastOutputSchema},
  prompt: `You are a business analytics expert. Your task is to analyze the following daily revenue data (based on actual payments received) and provide a sales forecast for the next 30 days.
The response must be in {{#if isSinhala}}Sinhala{{else}}English{{/if}}.

Provide a detailed analysis. Look for trends (upward, downward, stable), weekly patterns (e.g., higher sales on weekends), or any other notable observations.
Based on your analysis, generate a clear, concise, and insightful forecast. Mention a potential revenue range (e.g., Rs. 100,000 - Rs. 120,000) for the next month.
The forecast should be written in a friendly, advisory tone.

Historical Daily Revenue Data:
{{#each salesData}}
- Date: {{{date}}}, Revenue: {{{total}}}
{{/each}}
`,
});

const forecastSalesFlow = ai.defineFlow(
  {
    name: 'forecastSalesFlow',
    inputSchema: SalesDataInputSchema,
    outputSchema: SalesForecastOutputSchema,
  },
  async input => {
    // In a real-world scenario, you might add more complex logic here,
    // like fetching more data or calling other services.
    if (input.salesData.length < 7) {
        return { forecast: "There is not enough historical data to generate a meaningful forecast. Please accumulate at least 7 days of sales." };
    }
    
    const isSinhala = input.locale === 'si';
    const {output} = await prompt({ salesData: input.salesData, isSinhala });
    return output!;
  }
);
