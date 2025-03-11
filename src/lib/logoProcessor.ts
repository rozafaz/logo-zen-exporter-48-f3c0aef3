
import JSZip from 'jszip';
import type { ExportSettings } from '@/components/ExportOptions';

interface ProcessedFile {
  folder: string;
  filename: string;
  data: Blob;
}

export const processLogo = async (
  logoFile: File, 
  settings: ExportSettings
): Promise<ProcessedFile[]> => {
  const files: ProcessedFile[] = [];
  const { brandName, formats, colors, resolutions } = settings;
  
  // Create a temporary canvas for image processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');
  
  // Load the original logo
  const originalLogo = new Image();
  const logoUrl = URL.createObjectURL(logoFile);
  
  await new Promise((resolve, reject) => {
    originalLogo.onload = resolve;
    originalLogo.onerror = reject;
    originalLogo.src = logoUrl;
  });
  
  // Set canvas size based on the original logo
  canvas.width = originalLogo.width;
  canvas.height = originalLogo.height;
  
  // Process each color variation
  for (const color of colors) {
    for (const format of formats) {
      if (['PNG', 'JPG'].includes(format)) {
        for (const resolution of resolutions) {
          // Draw and process the image
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(originalLogo, 0, 0);
          
          // Apply color variations
          if (color === 'Black') {
            applyBlackFilter(ctx, canvas.width, canvas.height);
          } else if (color === 'White') {
            applyWhiteFilter(ctx, canvas.width, canvas.height);
          }
          
          // Convert to blob
          const mimeType = format === 'PNG' ? 'image/png' : 'image/jpeg';
          const blob = await new Promise<Blob>(resolve => {
            canvas.toBlob(blob => resolve(blob!), mimeType, 0.9);
          });
          
          files.push({
            folder: getFolderName(color),
            filename: `${brandName}_${color}_${format}_${resolution}.${format.toLowerCase()}`,
            data: blob
          });
        }
      } else if (format === 'SVG' && logoFile.type === 'image/svg+xml') {
        // For SVG files, we can include the original
        files.push({
          folder: getFolderName(color),
          filename: `${brandName}_${color}_${format}.svg`,
          data: logoFile
        });
      }
    }
  }
  
  // Clean up
  URL.revokeObjectURL(logoUrl);
  
  return files;
};

const getFolderName = (color: string): string => {
  switch (color) {
    case 'Original':
      return 'Primary Logo';
    case 'Black':
    case 'White':
      return 'Black & White Versions';
    default:
      return 'Variations';
  }
};

const applyBlackFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 0) {
      data[i] = 0;     // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

const applyWhiteFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 0) {
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

export const createZipPackage = async (files: ProcessedFile[]): Promise<Blob> => {
  const zip = new JSZip();
  
  // Add files to their respective folders
  files.forEach(file => {
    const folder = zip.folder(file.folder);
    if (folder) {
      folder.file(file.filename, file.data);
    }
  });
  
  // Generate ZIP file
  return await zip.generateAsync({ type: 'blob' });
};

export const downloadZip = (blob: Blob, brandName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${brandName}_Logo_Package.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
