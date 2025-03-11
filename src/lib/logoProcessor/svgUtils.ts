
import { modifySvgColor, invertSvgColors } from './colorUtils';
import type { ProcessedFile } from './types';

/**
 * Processes SVG format with different color variations
 */
export const processSvgFormat = async (
  svgText: string,
  color: string,
  brandName: string,
  colors: string[]
): Promise<ProcessedFile[]> => {
  const files: ProcessedFile[] = [];
  
  try {
    console.log('Processing SVG file');
    
    // Apply color modifications if needed
    let modifiedSvg = applyColorToSvg(svgText, color, colors);
    
    const svgBlob = new Blob([modifiedSvg], { type: 'image/svg+xml' });
    
    const formatFolder = 'SVG';
    files.push({
      folder: formatFolder,
      filename: `${brandName}_${color}.svg`,
      data: svgBlob
    });
    
    console.log(`Created SVG file for ${color} variation, size: ${svgBlob.size} bytes`);
  } catch (error) {
    console.error('Error processing SVG:', error);
  }
  
  return files;
};

/**
 * Helper function to apply the appropriate color modifications to SVG
 */
export const applyColorToSvg = (
  svgText: string,
  color: string,
  colors: string[]
): string => {
  let modifiedSvg = svgText;
  
  if (color === 'Black') {
    modifiedSvg = modifySvgColor(modifiedSvg, '#000000');
  } else if (color === 'White') {
    modifiedSvg = modifySvgColor(modifiedSvg, '#FFFFFF');
  } else if (color === 'Grayscale' && colors.includes('Grayscale')) {
    modifiedSvg = modifySvgColor(modifiedSvg, '#808080');
  } else if (color === 'Inverted' && colors.includes('Inverted')) {
    modifiedSvg = invertSvgColors(modifiedSvg);
  }
  
  return modifiedSvg;
};

/**
 * Creates a simple SVG representation for raster images
 */
export const createSimpleSvgFromRaster = (
  baseWidth: number,
  baseHeight: number,
  color: string
): string => {
  const fillColor = color === 'Black' ? '#000000' : 
                   color === 'White' ? '#FFFFFF' : 
                   color === 'Grayscale' ? '#808080' : '#000000';
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${baseWidth} ${baseHeight}">
    <rect width="${baseWidth}" height="${baseHeight}" fill="${fillColor}" />
  </svg>`;
};

/**
 * Gets SVG dimensions from viewBox or width/height attributes
 */
export const getSvgDimensions = (svgText: string): { width: number; height: number } => {
  // Try to get dimensions from viewBox
  const viewBoxMatch = svgText.match(/viewBox=["']([^"']+)["']/);
  if (viewBoxMatch && viewBoxMatch[1]) {
    const [, , w, h] = viewBoxMatch[1].split(/\s+/).map(Number);
    if (!isNaN(w) && !isNaN(h)) {
      return { width: w, height: h };
    }
  }
  
  // Try to get from width/height attributes
  const widthMatch = svgText.match(/width=["']([^"']+)["']/);
  const heightMatch = svgText.match(/height=["']([^"']+)["']/);
  
  let width = 600;
  let height = 600;
  
  if (widthMatch && widthMatch[1]) {
    const w = parseFloat(widthMatch[1]);
    if (!isNaN(w)) width = w;
  }
  
  if (heightMatch && heightMatch[1]) {
    const h = parseFloat(heightMatch[1]);
    if (!isNaN(h)) height = h;
  }
  
  return { width, height };
};

