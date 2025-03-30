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
    console.log('Generating vector PDF from SVG for color:', color);
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
      console.log('Applying BLACK color to SVG');
      modifiedSvg = applyColorToSvg(svgText, '#000000', colors);
    } else if (color === 'White') {
      // Convert all elements to white
      console.log('Applying WHITE color to SVG');
      modifiedSvg = applyColorToSvg(svgText, '#FFFFFF', colors);
    } else if (color === 'original') {
      // Keep original colors from the SVG
      console.log('Keeping ORIGINAL SVG colors');
      modifiedSvg = svgText;
    } else {
      // Apply specific color as requested
      console.log(`Applying custom color ${color} to SVG`);
      modifiedSvg = applyColorToSvg(svgText, color, colors);
    }
    
    console.log('Modified SVG for color:', color);
    console.log('First 100 chars of modified SVG:', modifiedSvg.substring(0, 100));
    
    // Extract dimensions for better positioning
    const dimensions = getSvgDimensions(modifiedSvg);
    console.log('SVG dimensions:', dimensions);
    
    // Create PDF with embedded SVG as vector
    console.log('Starting PDF creation from SVG for color:', color);
    const pdfBlob = await createPdfFromSvg(modifiedSvg);
    console.log('PDF creation completed for color:', color, 'blob size:', pdfBlob.size);
    
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
      
      // Apply color again in the fallback method
      if (color === 'Black') {
        svgElement.querySelectorAll('*').forEach(el => {
          if (el.tagName !== 'svg') {
            el.setAttribute('fill', '#000000');
            if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
              el.setAttribute('stroke', '#000000');
            }
          }
        });
      } else if (color === 'White') {
        svgElement.querySelectorAll('*').forEach(el => {
          if (el.tagName !== 'svg') {
            el.setAttribute('fill', '#FFFFFF');
            if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
              el.setAttribute('stroke', '#FFFFFF');
            }
          }
        });
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
