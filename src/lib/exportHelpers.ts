
import type { ExportSettings } from '@/components/ExportOptions';
import { processLogo, createZipPackage, downloadZip } from './logoProcessor';

/**
 * Handles the export process for logo files
 */
export const exportLogoPackage = async (logoFile: File, settings: ExportSettings): Promise<void> => {
  console.log('Starting export process:', logoFile.name, logoFile.type);
  
  try {
    // Validate formats
    if (settings.formats.length === 0) {
      throw new Error('Please select at least one export format');
    }
    
    // Validate resolutions for raster formats
    if ((settings.formats.includes('PNG') || settings.formats.includes('JPG')) && settings.resolutions.length === 0) {
      throw new Error('Please select at least one resolution for raster formats');
    }
    
    // Validate colors
    if (settings.colors.length === 0) {
      throw new Error('Please select at least one color variation');
    }
    
    // Process the logo into multiple formats
    const processedFiles = await processLogo(logoFile, settings);
    console.log(`Generated ${processedFiles.length} processed files`);
    
    if (processedFiles.length === 0) {
      throw new Error('No files were generated during processing. Please check file format and try again.');
    }
    
    // Create and download ZIP package
    const zipBlob = await createZipPackage(processedFiles);
    console.log(`ZIP package created, size: ${zipBlob.size} bytes`);
    
    // Trigger the download
    downloadZip(zipBlob, settings.brandName);
    console.log('Download initiated');
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

// These functions are now implemented in logoProcessor module
export const convertToBlack = (imageData: ImageData): ImageData => {
  // This is a placeholder - now implemented in logoProcessor/colorUtils.ts
  return imageData;
};

export const convertToWhite = (imageData: ImageData): ImageData => {
  // This is a placeholder - now implemented in logoProcessor/colorUtils.ts
  return imageData;
};

export const createZipFile = async (files: { name: string; data: Blob }[]): Promise<Blob> => {
  // This is a placeholder - now implemented in logoProcessor/zipUtils.ts
  return new Blob(['Placeholder ZIP data'], { type: 'application/zip' });
};

export const downloadFile = (blob: Blob, filename: string): void => {
  // This is a placeholder - now implemented in logoProcessor/zipUtils.ts
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
