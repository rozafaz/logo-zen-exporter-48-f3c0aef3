
import { hexToRgb } from '../colorUtils';

/**
 * Get SVG dimensions from viewBox or width/height attributes
 */
export const getSvgDimensions = (svgElement: Element): { width: number; height: number } => {
  // Try to get dimensions from viewBox
  const viewBox = svgElement.getAttribute('viewBox');
  if (viewBox) {
    const [, , w, h] = viewBox.split(/\s+/).map(Number);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      return { width: w, height: h };
    }
  }
  
  // Try to get from width/height attributes
  let width = parseFloat(svgElement.getAttribute('width') || '0');
  let height = parseFloat(svgElement.getAttribute('height') || '0');
  
  // Remove any units (px, pt, etc.) if present
  if (isNaN(width) || width <= 0) {
    const widthStr = svgElement.getAttribute('width') || '';
    width = parseFloat(widthStr) || 300;
  }
  
  if (isNaN(height) || height <= 0) {
    const heightStr = svgElement.getAttribute('height') || '';
    height = parseFloat(heightStr) || 300;
  }
  
  return { 
    width: Math.max(width, 100), 
    height: Math.max(height, 100) 
  };
};

/**
 * Set PostScript color based on fill color
 */
export const setPostScriptColor = (fillColor: string): string => {
  if (!fillColor || fillColor === 'none' || fillColor === 'transparent') {
    return '0 0 0 setrgbcolor\n'; // Default to black
  }
  
  // Special handling for keywords
  if (fillColor.toLowerCase() === 'black') return '0 0 0 setrgbcolor\n';
  if (fillColor.toLowerCase() === 'white') return '1 1 1 setrgbcolor\n';
  if (fillColor.toLowerCase() === 'red') return '1 0 0 setrgbcolor\n';
  if (fillColor.toLowerCase() === 'green') return '0 1 0 setrgbcolor\n';
  if (fillColor.toLowerCase() === 'blue') return '0 0 1 setrgbcolor\n';
  
  // Handle RGB color in different formats
  if (fillColor.startsWith('rgb')) {
    const rgbMatch = fillColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]) / 255;
      const g = parseInt(rgbMatch[2]) / 255;
      const b = parseInt(rgbMatch[3]) / 255;
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
