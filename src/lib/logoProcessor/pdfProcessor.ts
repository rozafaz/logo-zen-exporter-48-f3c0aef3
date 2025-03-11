
import { createPdfFromSvg, createPdfFromImage } from './pdf';
import { applyColorToSvg, createSimpleSvgFromRaster, getSvgDimensions } from './svgUtils';
import { applyColorFilter } from './rasterUtils';
import type { ProcessedFile } from './types';

/**
 * Processes PDF format from SVG input with true vector preservation
 */
export const processPdfFromSvg = async (
  svgText: string,
  color: string,
  brandName: string,
  colors: string[]
): Promise<ProcessedFile[]> => {
  const files: ProcessedFile[] = [];
  
  try {
    console.log('Generating vector PDF from SVG for', color);
    
    // Apply color modifications if needed
    let modifiedSvg = applyColorToSvg(svgText, color, colors);
    
    // Extract dimensions for better positioning
    const dimensions = getSvgDimensions(modifiedSvg);
    console.log('SVG dimensions:', dimensions);
    
    // Create PDF with embedded SVG as vector
    const pdfBlob = await createPdfFromSvg(modifiedSvg);
    
    const formatFolder = 'PDF';
    files.push({
      folder: formatFolder,
      filename: `${brandName}_${color}.pdf`,
      data: pdfBlob
    });
    
    console.log(`Created vector PDF from SVG for ${color}, size: ${pdfBlob.size} bytes`);
  } catch (error) {
    console.error('Error creating PDF from SVG:', error);
  }
  
  return files;
};

/**
 * Processes PDF format from raster input
 */
export const processPdfFromRaster = async (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  originalLogo: HTMLImageElement,
  color: string,
  brandName: string,
  colors: string[]
): Promise<ProcessedFile[]> => {
  const files: ProcessedFile[] = [];
  const baseWidth = originalLogo.width || 300;
  const baseHeight = originalLogo.height || 300;
  
  try {
    console.log('Generating PDF from raster for', color);
    
    // Create a canvas with the logo
    canvas.width = baseWidth;
    canvas.height = baseHeight;
    
    // Clear canvas and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalLogo, 0, 0, canvas.width, canvas.height);
    
    // Apply color variations
    applyColorFilter(ctx, canvas.width, canvas.height, color, colors);
    
    // Convert canvas to PNG for embedding in PDF
    const pngDataUrl = canvas.toDataURL('image/png');
    
    // Create PDF with embedded PNG
    const pdfBlob = await createPdfFromImage(pngDataUrl);
    
    const formatFolder = 'PDF';
    files.push({
      folder: formatFolder,
      filename: `${brandName}_${color}.pdf`,
      data: pdfBlob
    });
    
    console.log(`Created PDF from raster for ${color}, size: ${pdfBlob.size} bytes`);
  } catch (error) {
    console.error('Error creating PDF from raster:', error);
  }
  
  return files;
};
