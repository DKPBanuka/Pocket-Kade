
'use server';

import { suggestLineItem } from '@/ai/flows/suggest-line-item';
import type { SuggestLineItemInput, SuggestLineItemOutput } from '@/ai/flows/suggest-line-item';
import { forecastSales } from '@/ai/flows/forecast-sales-flow';
import type { SalesDataInput, SalesForecastOutput } from '@/ai/flows/forecast-sales-flow';


export async function suggestLineItemAction(
  input: SuggestLineItemInput
): Promise<SuggestLineItemOutput> {
  // Add any server-side validation or logic here
  return await suggestLineItem(input);
}

export async function forecastSalesAction(
  input: SalesDataInput
): Promise<SalesForecastOutput> {
  return await forecastSales(input);
}
