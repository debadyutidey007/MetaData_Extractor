'use server';

import { redactPii } from '@/ai/flows/redact-pii';

export async function processFile(
  metadata: Record<string, any>
): Promise<{ original: Record<string, any>; redacted: Record<string, any> }> {
  try {
    const redacted = await redactPii({ metadata: JSON.stringify(metadata) });

    return { original: metadata, redacted };
  } catch (error) {
    console.error('Error processing file:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred during processing.";
    const errorResult = { fileName: metadata.fileName, error: errorMessage };
    return {
      original: errorResult,
      redacted: errorResult,
    };
  }
}
