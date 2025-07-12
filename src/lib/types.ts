import type { RedactPiiOutput } from "@/ai/flows/redact-pii";

export interface ProcessedFile {
  id: string;
  file: File;
  status: 'queued' | 'processing' | 'done' | 'error';
  progress: number;
  metadata?: Record<string, any>;
  redactedMetadata?: RedactPiiOutput;
  error?: string;
}
