
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
    
    // Optimize and clean SVG before color modifications
    let optimizedSvg = optimizeSvgPaths(svgText);
    
    // Apply color modifications if needed
    let modifiedSvg = applyColorToSvg(optimizedSvg, color, colors);
    
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
 * Optimize SVG paths for better conversion quality
 * This function helps simplify paths before conversion to other formats
 */
export const optimizeSvgPaths = (svgText: string): string => {
  try {
    // Parse the SVG
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    
    // Fix common issues that can cause problems in conversion
    
    // 1. Handle invalid viewBox format
    const svgElement = svgDoc.querySelector('svg');
    if (svgElement && !svgElement.hasAttribute('viewBox') && 
        svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
      const width = parseFloat(svgElement.getAttribute('width') || '0');
      const height = parseFloat(svgElement.getAttribute('height') || '0');
      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
        console.log('Added missing viewBox to SVG');
      }
    }
    
    // 2. Process path elements for better conversion
    const paths = svgDoc.querySelectorAll('path');
    paths.forEach(path => {
      const pathData = path.getAttribute('d');
      if (pathData) {
        // Ensure path has stroke or fill for visibility
        if (!path.hasAttribute('fill') && !path.hasAttribute('stroke')) {
          path.setAttribute('fill', '#000000');
        }
        
        // Set proper stroke-linecap and stroke-linejoin for better quality
        if (path.hasAttribute('stroke') && path.getAttribute('stroke') !== 'none') {
          if (!path.hasAttribute('stroke-linecap')) {
            path.setAttribute('stroke-linecap', 'round');
          }
          if (!path.hasAttribute('stroke-linejoin')) {
            path.setAttribute('stroke-linejoin', 'round');
          }
        }
      }
    });
    
    // 3. Handle missing fill and stroke attributes on other elements
    ['rect', 'circle', 'ellipse', 'polygon', 'polyline'].forEach(selector => {
      const elements = svgDoc.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el.hasAttribute('fill') && !el.hasAttribute('stroke')) {
          el.setAttribute('fill', '#000000');
        }
      });
    });
    
    // Convert back to string
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgDoc);
  } catch (error) {
    console.error('Error optimizing SVG paths:', error);
    return svgText; // Return original if optimization fails
  }
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

/**
 * Simplify complex SVG paths for better EPS conversion
 * This reduces number of control points while maintaining shape fidelity
 */
export const simplifyPath = (pathData: string): string => {
  // This is a placeholder for path simplification
  // In a production environment, you would use a proper path simplification algorithm
  // Like Ramer-Douglas-Peucker algorithm
  return pathData;
};
