
export interface ProcessedFile {
  folder: string;
  filename: string;
  data: Blob;
}

export interface ExportSettings {
  formats: string[];
  colors: string[];
  resolutions: string[];
  brandName: string;
  customColor?: string;
}
