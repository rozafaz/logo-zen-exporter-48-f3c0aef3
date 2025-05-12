
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
  console.log(`Applying color to SVG: ${color}`);
  let modifiedSvg = svgText;
  
  if (color === 'Black') {
    console.log('Applying black color to SVG elements');
    modifiedSvg = modifySvgColor(modifiedSvg, '#000000');
  } else if (color === 'White') {
    console.log('Applying white color to SVG elements');
    modifiedSvg = modifySvgColor(modifiedSvg, '#FFFFFF');
  } else if (color === 'Grayscale' && colors.includes('Grayscale')) {
    console.log('Applying grayscale to SVG elements');
    modifiedSvg = modifySvgColor(modifiedSvg, '#808080');
  } else if (color === 'Inverted' && colors.includes('Inverted')) {
    console.log('Inverting SVG colors');
    modifiedSvg = invertSvgColors(modifiedSvg);
  } else if (color === 'Custom' && colors.includes('Custom')) {
    // Find the custom color from settings
    const customColor = colors.find(c => c.startsWith('#'));
    if (customColor) {
      console.log(`Applying custom color ${customColor} to SVG elements`);
      modifiedSvg = modifySvgColor(modifiedSvg, customColor);
    }
  } else if (color === 'original') {
    // Keep original colors
    console.log('Keeping original SVG colors');
    modifiedSvg = svgText;
  } else if (color.startsWith('#')) {
    // Handle hex color codes
    console.log(`Applying hex color ${color} to SVG elements`);
    modifiedSvg = modifySvgColor(modifiedSvg, color);
  } else {
    // Try to handle named colors
    console.log(`Trying to apply named color ${color} to SVG elements`);
    modifiedSvg = modifySvgColor(modifiedSvg, color);
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
    if (svgElement) {
      // Add viewBox if missing
      if (!svgElement.hasAttribute('viewBox') && 
          svgElement.hasAttribute('width') && 
          svgElement.hasAttribute('height')) {
        const width = parseFloat(svgElement.getAttribute('width') || '0');
        const height = parseFloat(svgElement.getAttribute('height') || '0');
        if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
          svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
          console.log('Added missing viewBox to SVG');
        }
      }
      
      // Add width/height if missing but viewBox exists
      if (svgElement.hasAttribute('viewBox') && 
          (!svgElement.hasAttribute('width') || !svgElement.hasAttribute('height'))) {
        const viewBox = svgElement.getAttribute('viewBox') || '';
        const viewBoxParts = viewBox.split(/\s+/);
        if (viewBoxParts.length >= 4) {
          if (!svgElement.hasAttribute('width')) {
            svgElement.setAttribute('width', viewBoxParts[2]);
          }
          if (!svgElement.hasAttribute('height')) {
            svgElement.setAttribute('height', viewBoxParts[3]);
          }
        }
      }
    }
    
    // 2. Process path elements for better conversion
    const paths = svgDoc.querySelectorAll('path');
    paths.forEach(path => {
      const pathData = path.getAttribute('d');
      if (pathData) {
        // Clean up path data for better EPS conversion
        let cleanedPathData = pathData
          .replace(/([MmLlHhVvCcSsQqTtAaZz])/g, ' $1 ') // Add space around commands
          .replace(/,/g, ' ')                          // Replace commas with spaces 
          .replace(/\s+/g, ' ')                        // Normalize spaces
          .trim();
          
        path.setAttribute('d', cleanedPathData);
        
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
          // Ensure stroke-width is set
          if (!path.hasAttribute('stroke-width')) {
            path.setAttribute('stroke-width', '1');
          }
        }
      }
    });
    
    // 3. Handle missing fill and stroke attributes on other elements
    ['rect', 'circle', 'ellipse', 'polygon', 'polyline'].forEach(selector => {
      const elements = svgDoc.querySelectorAll(selector);
      elements.forEach(el => {
        // Add fill if no fill or stroke is defined
        if (!el.hasAttribute('fill') && !el.hasAttribute('stroke')) {
          el.setAttribute('fill', '#000000');
        }
        
        // Set proper stroke attributes for elements with strokes
        if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
          if (!el.hasAttribute('stroke-linecap')) {
            el.setAttribute('stroke-linecap', 'round');
          }
          if (!el.hasAttribute('stroke-linejoin')) {
            el.setAttribute('stroke-linejoin', 'round');
          }
          if (!el.hasAttribute('stroke-width')) {
            el.setAttribute('stroke-width', '1');
          }
        }
      });
    });
    
    // 4. Fix font issues by converting text to paths if possible
    // Note: In a full implementation, this would convert text to path data
    // For now, we just ensure text elements have proper attributes
    const textElements = svgDoc.querySelectorAll('text');
    textElements.forEach(text => {
      if (!text.hasAttribute('fill')) {
        text.setAttribute('fill', '#000000');
      }
      // Ideally, in a production environment, text would be converted to paths here
    });
    
    // 5. Fix clip paths - ensure they're properly defined
    const clipPaths = svgDoc.querySelectorAll('clipPath');
    clipPaths.forEach(clipPath => {
      // Ensure clip path has an ID
      if (!clipPath.hasAttribute('id')) {
        clipPath.setAttribute('id', `clipPath_${Math.random().toString(36).substr(2, 9)}`);
      }
      
      // Make sure clip path has content
      if (clipPath.children.length === 0) {
        // Remove references to empty clip paths
        const elementsWithClipPath = svgDoc.querySelectorAll('[clip-path]');
        elementsWithClipPath.forEach(el => {
          const clipPathRef = el.getAttribute('clip-path');
          if (clipPathRef && clipPathRef.includes(clipPath.getAttribute('id') || '')) {
            el.removeAttribute('clip-path');
          }
        });
      }
    });
    
    // 6. Process SVG gradients to ensure they're properly defined
    const linearGradients = svgDoc.querySelectorAll('linearGradient');
    linearGradients.forEach(gradient => {
      if (!gradient.hasAttribute('id')) {
        gradient.setAttribute('id', `linearGradient_${Math.random().toString(36).substr(2, 9)}`);
      }
      
      // Ensure gradients have proper attributes
      if (!gradient.hasAttribute('x1')) gradient.setAttribute('x1', '0%');
      if (!gradient.hasAttribute('y1')) gradient.setAttribute('y1', '0%');
      if (!gradient.hasAttribute('x2')) gradient.setAttribute('x2', '100%');
      if (!gradient.hasAttribute('y2')) gradient.setAttribute('y2', '0%');
      
      // Ensure each gradient has at least one stop
      if (gradient.querySelectorAll('stop').length === 0) {
        const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stopElement.setAttribute('offset', '0%');
        stopElement.setAttribute('stop-color', '#000000');
        gradient.appendChild(stopElement);
        
        const stopElement2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stopElement2.setAttribute('offset', '100%');
        stopElement2.setAttribute('stop-color', '#000000');
        gradient.appendChild(stopElement2);
      }
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
 * Simplify complex SVG paths for better EPS conversion
 * This reduces number of control points while maintaining shape fidelity
 */
export const simplifyPath = (pathData: string): string => {
  // This is an improved path simplification implementation
  // It preserves the key points while reducing unnecessary precision
  
  if (!pathData) return pathData;
  
  try {
    // Normalize command letters to have spaces before and after
    let normalized = pathData
      .replace(/([MLHVCSQTAZmlhvcsqtaz])/g, ' $1 ')
      .replace(/,/g, ' ')  // Replace commas with spaces
      .replace(/-/g, ' -') // Ensure negative values have a space
      .replace(/\s+/g, ' ') // Normalize space
      .trim();
    
    // Split into tokens
    const tokens = normalized.split(' ');
    let simplified = '';
    
    // Process tokens and limit decimal precision
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (!token) continue;
      
      // If this is a command letter, add it directly
      if (/[MLHVCSQTAZmlhvcsqtaz]/.test(token)) {
        simplified += token + ' ';
      } else {
        // This is a number, limit its precision
        const num = parseFloat(token);
        if (!isNaN(num)) {
          // Limit to 3 decimal places for better EPS compatibility
          simplified += num.toFixed(3) + ' ';
        }
      }
    }
    
    return simplified.trim();
  } catch (e) {
    console.error('Error simplifying path:', e);
    return pathData; // Return original if simplification fails
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
