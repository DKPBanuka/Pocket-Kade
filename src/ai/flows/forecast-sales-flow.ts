
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
  prompt: `You are a business analytics expert. Analyze the following daily revenue data (based on actual payments received) and produce a 30‑day sales projection.
The response must be in {{#if isSinhala}}Sinhala{{else}}English{{/if}} and easy for a busy shop owner to skim.

Output requirements (use clear headings and bullet points):

1) KPI Snapshot
- Show 7/14/28‑day averages, total revenue, median, best day, worst day
- Show average daily growth rate and volatility (stability indicator)

2) Trends & Patterns
- Identify trend direction (up/down/flat) and weekly seasonality (weekends vs weekdays)
- Point out outliers and any recent momentum shift

3) Forecast Method (brief)
- Use a simple, explainable approach (e.g., moving averages + recent trend/exponential smoothing)
- State assumptions and uncertainty in plain language

4) 30‑Day Projection
- Give a realistic revenue range for the next 30 days (e.g., Rs. 100,000 – Rs. 120,000)
- Provide a compact table:
  Date Range | Expected Daily Avg | Expected Total | Confidence
  Summarize by weeks (Week 1..Week 4/5) instead of 30 lines

5) What To Do Next (Actionable Tips)
- Pricing/discount ideas for slow days, marketing suggestions for peak days
- Inventory guidance (stock more of fast movers, reduce slow movers)
- Cash‑flow notes (e.g., keep buffer if volatility is high)

6) Friendly Summary
- One short paragraph that a shop owner can read in 10 seconds

Style guide:
- {{#if isSinhala}}Use simple Sinhala words, keep it friendly and practical{{else}}Be concise, friendly, and practical{{/if}}
- Prefer short sentences, bullet points, and small tables
- Avoid technical jargon; explain any metric in everyday terms

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
