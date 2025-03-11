
import type { ExportSettings } from '@/components/ExportOptions';

export interface ProcessedFile {
  folder: string;
  filename: string;
  data: Blob;
}

export type { ExportSettings };
