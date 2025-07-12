'use server';

/**
 * @fileOverview Redacts Personally Identifiable Information (PII) from metadata.
 *
 * - redactPii - A function that handles the PII redaction process.
 * - RedactPiiInput - The input type for the redactPii function.
 * - RedactPiiOutput - The return type for the redactPii function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RedactPiiInputSchema = z.object({
  metadata: z.string().describe('A JSON string of the metadata to redact PII from.'),
});
export type RedactPiiInput = z.infer<typeof RedactPiiInputSchema>;

const RedactPiiOutputSchema = z
  .any()
  .describe(
    'The metadata with PII redacted, returned as a JSON object. All values should be strings.'
  );

export type RedactPiiOutput = Record<string, any>;

export async function redactPii(input: RedactPiiInput): Promise<RedactPiiOutput> {
  return redactPiiFlow(input);
}

const redactPiiPrompt = ai.definePrompt({
  name: 'redactPiiPrompt',
  input: {schema: RedactPiiInputSchema},
  output: {
    format: 'json',
    schema: RedactPiiOutputSchema
  },
  prompt: `You are an AI assistant that redacts personally identifiable information (PII) from metadata.

  Given the following metadata JSON string, please redact any PII, such as names, addresses, phone numbers, email addresses, GPS coordinates, and other sensitive information.

  The values in the returned JSON object should all be strings.

  Metadata: {{{metadata}}}

  Return the redacted metadata as a valid JSON object.
  If a value does not appear to be PII, leave it unredacted.
`,
});

const redactPiiFlow = ai.defineFlow(
  {
    name: 'redactPiiFlow',
    inputSchema: RedactPiiInputSchema,
    outputSchema: RedactPiiOutputSchema,
  },
  async input => {
    const {output} = await redactPiiPrompt(input);
    return output!;
  }
);
