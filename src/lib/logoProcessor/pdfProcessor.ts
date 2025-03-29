
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
    console.log('SVG input length:', svgText.length);
    
    if (!svgText || svgText.length < 10) {
      console.error('SVG input is too short or empty');
      throw new Error('Invalid SVG input');
    }
    
    // Apply color modifications based on the requested color variation
    let modifiedSvg = svgText;
    
    // For specific color variations, apply special color handling
    if (color === 'Black') {
      // Convert all elements to black
      modifiedSvg = applyColorToSvg(svgText, '#000000', colors);
      console.log('Applied black color to SVG');
    } else if (color === 'White') {
      // Convert all elements to white
      modifiedSvg = applyColorToSvg(svgText, '#FFFFFF', colors);
      console.log('Applied white color to SVG');
    } else if (color === 'original') {
      // Keep original colors from the SVG
      modifiedSvg = svgText;
      console.log('Keeping original SVG colors');
    } else {
      // Apply specific color as requested
      modifiedSvg = applyColorToSvg(svgText, color, colors);
      console.log(`Applied custom color ${color} to SVG`);
    }
    
    // Extract dimensions for better positioning
    const dimensions = getSvgDimensions(modifiedSvg);
    console.log('SVG dimensions:', dimensions);
    
    // Create PDF with embedded SVG as vector
    console.log('Starting PDF creation from SVG');
    const pdfBlob = await createPdfFromSvg(modifiedSvg);
    console.log('PDF creation completed, blob size:', pdfBlob.size);
    
    if (!pdfBlob || pdfBlob.size < 100) {
      console.error('PDF blob is too small or empty');
      throw new Error('PDF generation failed');
    }
    
    const formatFolder = 'PDF';
    files.push({
      folder: formatFolder,
      filename: `${brandName}_${color}.pdf`,
      data: pdfBlob
    });
    
    console.log(`Created vector PDF from SVG for ${color}, size: ${pdfBlob.size} bytes`);
  } catch (error) {
    console.error('Error creating PDF from SVG:', error);
    // Try fallback method if primary method fails
    try {
      console.log('Attempting fallback PDF generation method');
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;
      
      // Set a viewBox if it doesn't exist
      if (!svgElement.hasAttribute('viewBox') && 
          svgElement.hasAttribute('width') && 
          svgElement.hasAttribute('height')) {
        const width = svgElement.getAttribute('width') || '300';
        const height = svgElement.getAttribute('height') || '300';
        svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
        console.log('Added missing viewBox to SVG');
      }
      
      const serializer = new XMLSerializer();
      const fixedSvg = serializer.serializeToString(svgElement);
      
      const pdfBlob = await createPdfFromSvg(fixedSvg);
      
      const formatFolder = 'PDF';
      files.push({
        folder: formatFolder,
        filename: `${brandName}_${color}.pdf`,
        data: pdfBlob
      });
      
      console.log(`Created PDF using fallback method for ${color}, size: ${pdfBlob.size} bytes`);
    } catch (fallbackError) {
      console.error('Fallback PDF generation failed:', fallbackError);
    }
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
    
    // Apply the correct color variation - consistent with raster exports
    if (color !== 'original') {
      applyColorFilter(ctx, canvas.width, canvas.height, color, colors);
    }
    
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
