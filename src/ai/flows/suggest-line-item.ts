// src/ai/flows/suggest-line-item.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting line items based on user input.
 *
 * - suggestLineItem - A function that suggests line items for invoice creation.
 * - SuggestLineItemInput - The input type for the suggestLineItem function.
 * - SuggestLineItemOutput - The output type for the suggestLineItem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestLineItemInputSchema = z.object({
  partialDescription: z
    .string()
    .describe('A partial description of the line item to be suggested.'),
});
export type SuggestLineItemInput = z.infer<typeof SuggestLineItemInputSchema>;

const SuggestLineItemOutputSchema = z.object({
  suggestion: z
    .string()
    .describe(
      'A suggested line item description, or an empty string if no suggestion is relevant.'
    ),
});
export type SuggestLineItemOutput = z.infer<typeof SuggestLineItemOutputSchema>;

export async function suggestLineItem(input: SuggestLineItemInput): Promise<SuggestLineItemOutput> {
  return suggestLineItemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLineItemPrompt',
  input: {schema: SuggestLineItemInputSchema},
  output: {schema: SuggestLineItemOutputSchema},
  prompt: `You are an intelligent invoicing assistant for a small electronics and repair shop called "Pocket කඩේ".
Your goal is to help the user write clear and professional line item descriptions for services.

The user will provide a partial description of a service. Based on this, you should suggest a complete, common service description.
Keep the suggestion concise and professional.

Examples:
- User input: "screen rep" -> Suggestion: "Screen Replacement Service"
- User input: "battery" -> Suggestion: "Battery Replacement"
- User input: "data rec" -> Suggestion: "Data Recovery Service"
- User input: "softw" -> Suggestion: "Software Installation"
- User input: "sams" -> Suggestion: "Samsung Phone Repair"

If the input is too vague or you cannot generate a relevant suggestion, return an empty string in the suggestion field.

Partial Description: {{{partialDescription}}}`,
});

const suggestLineItemFlow = ai.defineFlow(
  {
    name: 'suggestLineItemFlow',
    inputSchema: SuggestLineItemInputSchema,
    outputSchema: SuggestLineItemOutputSchema,
  },
  async (input) => {
    const MAX_RETRIES = 3;
    const INITIAL_DELAY_MS = 1000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { output } = await prompt(input);
        return output!;
      } catch (error: any) {
        // Check if it's a 503 error (service unavailable) and not the last attempt
        if (error.message && error.message.includes('503') && attempt < MAX_RETRIES) {
          console.warn(`AI suggestion failed (attempt ${attempt}): Model overloaded. Retrying in ${INITIAL_DELAY_MS * attempt}ms...`);
          await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY_MS * attempt));
        } else {
          // Final attempt failed or it's a different, non-retryable error
          console.error(`AI suggestion failed on final attempt or due to a non-retryable error:`, error);
          // Fail gracefully by returning an empty suggestion
          return { suggestion: '' };
        }
      }
    }

    // This part should not be reached if the loop is correct, but as a fallback
    return { suggestion: '' };
  }
);
