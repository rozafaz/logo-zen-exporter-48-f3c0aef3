import { applyBlackFilter, applyWhiteFilter, applyGrayscaleFilter, applyInvertedFilter } from './colorUtils';
import type { ProcessedFile } from './types';

/**
 * Processes raster formats (PNG) with different color variations and resolutions
 */
export const processRasterFormats = async (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  originalLogo: HTMLImageElement,
  format: string,
  color: string,
  resolutions: string[],
  brandName: string,
  colors: string[]
): Promise<ProcessedFile[]> => {
  const files: ProcessedFile[] = [];
  const baseWidth = originalLogo.width || 300;
  const baseHeight = originalLogo.height || 300;
  
  console.log(`Generating ${format} files for ${color}`);
  
  for (const resolution of resolutions) {
    try {
      // Set DPI-based scaling
      let scaleFactor = 1;
      if (resolution === '300dpi') {
        scaleFactor = 300 / 72; // Scale up for 300dpi
      } else if (resolution === '150dpi') {
        scaleFactor = 150 / 72; // Scale up for 150dpi
      }
      
      // Scale canvas according to DPI
      const scaledWidth = Math.round(baseWidth * scaleFactor);
      const scaledHeight = Math.round(baseHeight * scaleFactor);
      
      console.log(`Creating ${resolution} image at ${scaledWidth}x${scaledHeight} pixels`);
      
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      
      // Clear canvas and draw image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(originalLogo, 0, 0, canvas.width, canvas.height);
      
      // Apply color variations
      applyColorFilter(ctx, canvas.width, canvas.height, color, colors);
      
      // Convert to blob (only PNG now)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error(`Failed to create PNG blob`));
            }
          }, 
          'image/png'
        );
      });
      
      console.log(`Created PNG blob of size ${blob.size} bytes for ${resolution}`);
      
      const formatFolder = 'PNG';
      files.push({
        folder: formatFolder,
        filename: `${brandName}_${color}_${resolution}.png`,
        data: blob
      });
    } catch (error) {
      console.error(`Error processing PNG in ${resolution}:`, error);
    }
  }
  
  return files;
};

/**
 * Processes ICO format (favicon) with different color variations
 */
export const processIcoFormat = async (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  originalLogo: HTMLImageElement,
  color: string,
  brandName: string,
  colors: string[]
): Promise<ProcessedFile[]> => {
  const files: ProcessedFile[] = [];
  
  try {
    console.log('Generating ICO for', color);
    
    // Set canvas to standard favicon sizes (32x32 for simplicity)
    canvas.width = 32;
    canvas.height = 32;
    
    // Clear canvas and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalLogo, 0, 0, canvas.width, canvas.height);
    
    // Apply color variations
    applyColorFilter(ctx, canvas.width, canvas.height, color, colors);
    
    // Convert to PNG for ICO (browser can't generate ICO directly)
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error(`Failed to create ICO blob`));
          }
        }, 
        'image/png'
      );
    });
    
    console.log(`Created ICO (as PNG) of size ${pngBlob.size} bytes`);
    
    const formatFolder = 'ICO';
    files.push({
      folder: formatFolder,
      filename: `${brandName}_favicon_${color}.ico`,
      data: pngBlob
    });
  } catch (error) {
    console.error('Error creating ICO:', error);
  }
  
  return files;
};

/**
 * Helper function to apply the appropriate color filter
 */
export const applyColorFilter = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  color: string,
  colors: string[]
): void => {
  if (color === 'Black') {
    applyBlackFilter(ctx, width, height);
  } else if (color === 'White') {
    applyWhiteFilter(ctx, width, height);
  } else if (color === 'Grayscale' && colors.includes('Grayscale')) {
    applyGrayscaleFilter(ctx, width, height);
  } else if (color === 'Inverted' && colors.includes('Inverted')) {
    applyInvertedFilter(ctx, width, height);
  }
};
