
import type { ExportSettings, ProcessedFile } from './types';
import { processRasterFormats, processIcoFormat } from './rasterUtils';
import { processSvgFormat } from './svgUtils';
import { processPdfFromSvg, processPdfFromRaster } from './pdfProcessor';
import { createEpsFromSvg } from './epsUtils';

export const processLogo = async (
  logoFile: File, 
  settings: ExportSettings
): Promise<ProcessedFile[]> => {
  console.log('Starting logo processing...', { settings, logoType: logoFile.type });
  const files: ProcessedFile[] = [];
  const { brandName, formats, colors, resolutions } = settings;
  
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
    
    // Process each color variation
    for (const color of colors) {
      console.log(`Processing ${color} color variation`);
      
      for (const format of formats) {
        // Handle raster formats (PNG, JPG)
        if (['PNG', 'JPG'].includes(format)) {
          const rasterFiles = await processRasterFormats(
            ctx, canvas, originalLogo, format, color, resolutions, brandName, colors
          );
          files.push(...rasterFiles);
        } 
        // Handle SVG files
        else if (format === 'SVG' && (logoFile.type === 'image/svg+xml' || logoFile.name.toLowerCase().endsWith('.svg'))) {
          const svgFiles = await processSvgFormat(svgText, color, brandName, colors);
          files.push(...svgFiles);
        }
        // Handle PDF files
        else if (format === 'PDF') {
          // For SVG input, we can use pdf-lib's SVG embedding
          if (logoFile.type === 'image/svg+xml' || logoFile.name.toLowerCase().endsWith('.svg')) {
            const pdfFiles = await processPdfFromSvg(svgText, color, brandName, colors);
            files.push(...pdfFiles);
          } 
          // For raster input, we draw on a canvas and create a PDF
          else {
            const pdfFiles = await processPdfFromRaster(
              ctx, canvas, originalLogo, color, brandName, colors
            );
            files.push(...pdfFiles);
          }
        }
        // Handle EPS files - only available for SVG input
        else if (format === 'EPS' && (logoFile.type === 'image/svg+xml' || logoFile.name.toLowerCase().endsWith('.svg'))) {
          console.log('Processing EPS format for SVG input');
          const epsFiles = await createEpsFromSvg(svgText, color, brandName);
          files.push(...epsFiles);
        }
        // Handle ICO files (favicon)
        else if (format === 'ICO') {
          const icoFiles = await processIcoFormat(ctx, canvas, originalLogo, color, brandName, colors);
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
