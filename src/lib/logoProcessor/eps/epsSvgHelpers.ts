
import { hexToRgb } from '../colorUtils';

/**
 * Get SVG dimensions from viewBox or width/height attributes
 */
export const getSvgDimensions = (svgElement: Element): { width: number; height: number } => {
  let width = 0;
  let height = 0;
  
  // Try to get dimensions from viewBox
  const viewBox = svgElement.getAttribute('viewBox');
  if (viewBox) {
    const viewBoxParts = viewBox.split(/\s+/);
    if (viewBoxParts.length >= 4) {
      const vbWidth = parseFloat(viewBoxParts[2]);
      const vbHeight = parseFloat(viewBoxParts[3]);
      if (!isNaN(vbWidth) && !isNaN(vbHeight) && vbWidth > 0 && vbHeight > 0) {
        width = vbWidth;
        height = vbHeight;
        console.log(`Using viewBox dimensions: ${width} x ${height}`);
      }
    }
  }
  
  // If viewBox didn't provide valid dimensions, try width/height attributes
  if (width <= 0 || height <= 0) {
    const widthAttr = svgElement.getAttribute('width');
    const heightAttr = svgElement.getAttribute('height');
    
    if (widthAttr && heightAttr) {
      // Remove any units (px, pt, etc.)
      const w = parseFloat(widthAttr);
      const h = parseFloat(heightAttr);
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
        width = w;
        height = h;
        console.log(`Using attribute dimensions: ${width} x ${height}`);
      }
    }
  }
  
  // Provide default values if no valid dimensions found
  if (width <= 0 || height <= 0) {
    width = 300;
    height = 300;
    console.warn('Using default dimensions 300x300 as no valid dimensions found');
  }
  
  return { width, height };
};

/**
 * Set PostScript color based on fill color
 */
export const setPostScriptColor = (fillColor: string): string => {
  if (!fillColor || fillColor === 'none' || fillColor === 'transparent') {
    return '0 0 0 setrgbcolor\n'; // Default to black
  }
  
  // Special handling for keywords
  const lowerColor = fillColor.toLowerCase();
  if (lowerColor === 'black' || lowerColor === '#000' || lowerColor === '#000000') 
    return '0 0 0 setrgbcolor\n';
  if (lowerColor === 'white' || lowerColor === '#fff' || lowerColor === '#ffffff') 
    return '1 1 1 setrgbcolor\n';
  if (lowerColor === 'red' || lowerColor === '#f00' || lowerColor === '#ff0000') 
    return '1 0 0 setrgbcolor\n';
  if (lowerColor === 'green' || lowerColor === '#0f0' || lowerColor === '#00ff00') 
    return '0 1 0 setrgbcolor\n';
  if (lowerColor === 'blue' || lowerColor === '#00f' || lowerColor === '#0000ff') 
    return '0 0 1 setrgbcolor\n';
  
  // Handle RGB color in different formats
  if (fillColor.startsWith('rgb')) {
    const rgbMatch = fillColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]) / 255;
      const g = parseInt(rgbMatch[2]) / 255;
      const b = parseInt(rgbMatch[3]) / 255;
      return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} setrgbcolor\n`;
    }
    
    // Handle rgba colors
    const rgbaMatch = fillColor.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]) / 255;
      const g = parseInt(rgbaMatch[2]) / 255;
      const b = parseInt(rgbaMatch[3]) / 255;
      // Alpha is ignored in EPS, but we could adjust color intensity
      return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} setrgbcolor\n`;
    }
  }
  
  // Handle hex colors
  const rgb = hexToRgb(fillColor);
  if (!rgb) {
    console.warn('Invalid color format:', fillColor, 'defaulting to black');
    return '0 0 0 setrgbcolor\n'; // Default to black if invalid color
  }
  
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} setrgbcolor\n`;
};

/**
 * Convert SVG transform attributes to PostScript commands
 */
export const convertSvgTransform = (transform: string | null): string => {
  if (!transform) return '';
  
  let psCommands = '';
  
  // Match transform functions like translate(x,y), scale(x,y), etc.
  const transformRegex = /(translate|scale|rotate|matrix|skewX|skewY)\s*\(\s*([^)]+)\s*\)/g;
  let match;
  
  while ((match = transformRegex.exec(transform)) !== null) {
    const transformType = match[1];
    const params = match[2].split(/[\s,]+/).map(parseFloat);
    
    switch (transformType) {
      case 'translate':
        if (params.length >= 2 && !isNaN(params[0]) && !isNaN(params[1])) {
          psCommands += `${params[0].toFixed(3)} ${params[1].toFixed(3)} translate\n`;
        } else if (params.length >= 1 && !isNaN(params[0])) {
          psCommands += `${params[0].toFixed(3)} 0 translate\n`;
        }
        break;
        
      case 'scale':
        if (params.length >= 2 && !isNaN(params[0]) && !isNaN(params[1])) {
          psCommands += `${params[0].toFixed(3)} ${params[1].toFixed(3)} scale\n`;
        } else if (params.length >= 1 && !isNaN(params[0])) {
          psCommands += `${params[0].toFixed(3)} ${params[0].toFixed(3)} scale\n`;
        }
        break;
        
      case 'rotate':
        if (params.length >= 1 && !isNaN(params[0])) {
          if (params.length >= 3 && !isNaN(params[1]) && !isNaN(params[2])) {
            // Rotate around point: first translate to point, rotate, then translate back
            psCommands += `${params[1].toFixed(3)} ${params[2].toFixed(3)} translate\n`;
            psCommands += `${params[0].toFixed(3)} rotate\n`;
            psCommands += `${(-params[1]).toFixed(3)} ${(-params[2]).toFixed(3)} translate\n`;
          } else {
            // Simple rotation around origin
            psCommands += `${params[0].toFixed(3)} rotate\n`;
          }
        }
        break;
        
      case 'matrix':
        if (params.length >= 6 && params.every(p => !isNaN(p))) {
          // PostScript uses the same matrix notation as SVG
          psCommands += `[${params.map(p => p.toFixed(6)).join(' ')}] concat\n`;
        }
        break;
        
      case 'skewX':
        if (params.length >= 1 && !isNaN(params[0])) {
          // Convert skewX to matrix
          const angleRad = params[0] * Math.PI / 180;
          const tan = Math.tan(angleRad);
          psCommands += `[1 0 ${tan.toFixed(6)} 1 0 0] concat\n`;
        }
        break;
        
      case 'skewY':
        if (params.length >= 1 && !isNaN(params[0])) {
          // Convert skewY to matrix
          const angleRad = params[0] * Math.PI / 180;
          const tan = Math.tan(angleRad);
          psCommands += `[1 ${tan.toFixed(6)} 0 1 0 0] concat\n`;
        }
        break;
    }
  }
  
  return psCommands;
};

/**
 * Prepare SVG element for EPS conversion by analyzing its properties
 * and returning appropriate settings
 */
export const prepareSvgElement = (element: Element): { 
  hasTransform: boolean;
  hasFill: boolean;
  hasStroke: boolean;
  isVisible: boolean;
} => {
  const display = element.getAttribute('display');
  const visibility = element.getAttribute('visibility');
  const opacity = parseFloat(element.getAttribute('opacity') || '1');
  
  // Check visibility status
  const isVisible = 
    display !== 'none' && 
    visibility !== 'hidden' && 
    opacity > 0;
  
  // Check if element has transforms
  const hasTransform = element.hasAttribute('transform');
  
  // Check if element has fill
  const fill = element.getAttribute('fill');
  const hasFill = fill !== 'none' && fill !== null;
  
  // Check if element has stroke
  const stroke = element.getAttribute('stroke');
  const hasStroke = stroke !== 'none' && stroke !== null;
  
  return {
    hasTransform,
    hasFill,
    hasStroke,
    isVisible
  };
};
