import type { ExportSettings } from '@/components/ExportOptions';
import { toast } from 'sonner';

// Backend API URL (update this based on your deployment)
const API_URL = 'http://localhost:5000';

/**
 * Handles the export process for logo files by sending to backend
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
    
    // Create form data for the API request
    const formData = new FormData();
    formData.append('logo', logoFile);
    formData.append('settings', JSON.stringify(settings));
    
    // Send request to backend API
    const response = await fetch(`${API_URL}/api/process-logo`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = 'Server error processing logo';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If we can't parse the error, use the default message
      }
      throw new Error(errorMessage);
    }
    
    // Get the blob from the response
    const blob = await response.blob();
    
    // Create a download link and trigger it
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${settings.brandName}_logo_package.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('Download initiated');
    return;
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
};

// These functions are now moved to the backend
// Keeping empty stubs for backward compatibility
export const convertToBlack = (imageData: ImageData): ImageData => {
  console.warn('convertToBlack is deprecated - moved to backend');
  return imageData;
};

export const convertToWhite = (imageData: ImageData): ImageData => {
  console.warn('convertToWhite is deprecated - moved to backend');
  return imageData;
};

export const createZipFile = async (files: { name: string; data: Blob }[]): Promise<Blob> => {
  console.warn('createZipFile is deprecated - moved to backend');
  return new Blob(['Placeholder ZIP data'], { type: 'application/zip' });
};

export const downloadFile = (blob: Blob, filename: string): void => {
  console.warn('downloadFile is deprecated - moved to backend');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
