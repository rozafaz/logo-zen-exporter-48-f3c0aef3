
import type { ExportSettings, ProcessedFile } from './types';
import { processRasterFormats, processIcoFormat } from './rasterUtils';
import { processSvgFormat } from './svgUtils';
import { processPdfFromSvg, processPdfFromRaster } from './pdfProcessor';

export const processLogo = async (
  logoFile: File, 
  settings: ExportSettings
): Promise<ProcessedFile[]> => {
  console.log('Starting logo processing...', { settings, logoType: logoFile.type });
  const files: ProcessedFile[] = [];
  const { brandName, formats, colors, resolutions, customColor } = settings;
  
  // Create a temporary canvas for image processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Canvas context not available');
    throw new Error('Canvas context not available');
  }
  
  // Load the original logo
  const originalLogo = new Image();
  const logoUrl = URL.createObjectURL(logoFile);
  
  // Log the file type
  console.log('Processing logo file:', logoFile.name, logoFile.type, 'size:', logoFile.size);
  
  try {
    // If it's an SVG, we'll store the SVG text for later use with PDF generation
    let svgText = '';
    if (logoFile.type === 'image/svg+xml' || logoFile.name.toLowerCase().endsWith('.svg')) {
      svgText = await logoFile.text();
      console.log('Successfully loaded SVG text, length:', svgText.length);
    }
    
    await new Promise<void>((resolve, reject) => {
      originalLogo.onload = () => {
        console.log('Logo loaded successfully', {
          width: originalLogo.width,
          height: originalLogo.height
        });
        resolve();
      };
      originalLogo.onerror = (e) => {
        console.error('Error loading logo:', e);
        reject(new Error('Failed to load logo image'));
      };
      originalLogo.src = logoUrl;
    });
    
    // Create color variants to process
    const colorVariants = [...colors];
    
    // Add custom color if selected
    if (colors.includes('Custom') && customColor) {
      console.log(`Adding custom color: ${customColor}`);
      // Either replace the "Custom" string with the hex code or add the hex code
      const customIndex = colorVariants.indexOf('Custom');
      if (customIndex >= 0) {
        colorVariants[customIndex] = customColor;
      } else {
        colorVariants.push(customColor);
      }
    }
    
    // Process each color variation
    for (const color of colorVariants) {
      console.log(`Processing ${color} color variation`);
      
      for (const format of formats) {
        // Handle PNG format
        if (format === 'PNG') {
          const rasterFiles = await processRasterFormats(
            ctx, canvas, originalLogo, format, color, resolutions, brandName, colorVariants
          );
          files.push(...rasterFiles);
        } 
        // Handle SVG files
        else if (format === 'SVG' && (logoFile.type === 'image/svg+xml' || logoFile.name.toLowerCase().endsWith('.svg'))) {
          const svgFiles = await processSvgFormat(svgText, color, brandName, colorVariants);
          files.push(...svgFiles);
        }
        // Handle PDF files
        else if (format === 'PDF') {
          // For SVG input, we can use pdf-lib's SVG embedding
          if (logoFile.type === 'image/svg+xml' || logoFile.name.toLowerCase().endsWith('.svg')) {
            const pdfFiles = await processPdfFromSvg(svgText, color, brandName, colorVariants);
            files.push(...pdfFiles);
          } 
          // For raster input, we draw on a canvas and create a PDF
          else {
            const pdfFiles = await processPdfFromRaster(
              ctx, canvas, originalLogo, color, brandName, colorVariants
            );
            files.push(...pdfFiles);
          }
        }
        // Handle ICO files (favicon)
        else if (format === 'ICO') {
          const icoFiles = await processIcoFormat(ctx, canvas, originalLogo, color, brandName, colorVariants);
          files.push(...icoFiles);
        }
      }
    }
  } catch (error) {
    console.error('Error in logo processing:', error);
    throw error;
  } finally {
    // Clean up
    URL.revokeObjectURL(logoUrl);
  }
  
  console.log(`Processing complete. Generated ${files.length} files.`);
  return files;
};
