import { modifySvgColor, invertSvgColors } from './colorUtils';
import { createEpsFromSvg } from './vectorUtils';
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
 * Processes EPS format directly from SVG with improved vector conversion
 */
export const processEpsFromSvg = (
  svgText: string,
  color: string,
  brandName: string,
  colors: string[]
): ProcessedFile[] => {
  const files: ProcessedFile[] = [];
  
  try {
    console.log('Generating EPS directly for', color);
    
    // Apply color modifications if needed
    let modifiedSvg = applyColorToSvg(svgText, color, colors);
    
    // Log SVG content preview for debugging
    console.log('Modified SVG preview (first 100 chars):', modifiedSvg.substring(0, 100));
    
    // Create EPS directly from SVG with enhanced processing
    const epsBlob = createEpsFromSvg(modifiedSvg);
    
    // Validate that EPS has sufficient content
    if (epsBlob.size < 500) {
      console.warn('Warning: EPS file is suspiciously small:', epsBlob.size, 'bytes');
    } else {
      console.log('EPS generation successful, size:', epsBlob.size, 'bytes');
    }
    
    const epsFolder = 'EPS';
    files.push({
      folder: epsFolder,
      filename: `${brandName}_${color}.eps`,
      data: epsBlob
    });
    
    console.log(`Created EPS directly for ${color}, size: ${epsBlob.size} bytes`);
  } catch (error) {
    console.error('Error creating EPS:', error);
    
    // Create a minimal fallback EPS with visible content
    const fallbackContent = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 400 400
%%Creator: Logo Package Generator Fallback
%%Title: Fallback Vector Logo
%%Pages: 1
%%EndComments

200 200 100 0 360 arc
closepath
0 0 0 setrgbcolor
fill

showpage
%%EOF`;
    
    const fallbackBlob = new Blob([fallbackContent], { type: 'application/postscript' });
    
    // Add fallback EPS
    const epsFolder = 'EPS';
    files.push({
      folder: epsFolder,
      filename: `${brandName}_${color}_fallback.eps`,
      data: fallbackBlob
    });
    
    console.log(`Created fallback EPS for ${color} due to error, size: ${fallbackBlob.size} bytes`);
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
 * Extracts path data from SVG for vector PDF creation
 */
export const extractSvgPathsForPdf = (svgText: string): string[] => {
  const paths: string[] = [];
  
  // Find all path elements
  const pathRegex = /<path[^>]*d=["']([^"']+)["'][^>]*>/g;
  let match;
  
  while ((match = pathRegex.exec(svgText)) !== null) {
    paths.push(match[1]);
  }
  
  // Find all rect elements and convert to paths
  const rectRegex = /<rect[^>]*x=["']([^"']+)["'][^>]*y=["']([^"']+)["'][^>]*width=["']([^"']+)["'][^>]*height=["']([^"']+)["'][^>]*>/g;
  
  while ((match = rectRegex.exec(svgText)) !== null) {
    const [, x, y, width, height] = match;
    // Convert rect to path d attribute
    const pathD = `M ${x} ${y} h ${width} v ${height} h -${width} Z`;
    paths.push(pathD);
  }
  
  return paths;
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
