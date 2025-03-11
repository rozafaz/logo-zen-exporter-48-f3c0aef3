import { hexToRgb } from '../colorUtils';

/**
 * Get SVG dimensions from viewBox or width/height attributes with improved precision
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
 * Set PostScript color based on fill color with enhanced gradient support
 */
export const setPostScriptColor = (fillColor: string): string => {
  if (!fillColor || fillColor === 'none' || fillColor === 'transparent') {
    return '0 0 0 setrgbcolor\n'; // Default to black
  }
  
  // Handle gradient references
  if (fillColor.startsWith('url(#')) {
    // For EPS, we can't directly use gradients, so use a fallback solid color
    // In a production environment, this would be replaced with proper gradient handling
    return '0 0 0 setrgbcolor % Gradient fallback\n';
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
      const alpha = parseFloat(rgbaMatch[4]);
      
      // In EPS we can't do real transparency, but we can adjust the color intensity
      // based on the alpha value to approximate the effect
      const adjustedR = r * alpha + (1 - alpha);
      const adjustedG = g * alpha + (1 - alpha);
      const adjustedB = b * alpha + (1 - alpha);
      
      return `${adjustedR.toFixed(3)} ${adjustedG.toFixed(3)} ${adjustedB.toFixed(3)} setrgbcolor % Alpha approx: ${alpha.toFixed(2)}\n`;
    }
  }
  
  // Handle hex colors with improved fallback
  const rgb = hexToRgb(fillColor);
  if (!rgb) {
    console.warn('Invalid color format:', fillColor, 'defaulting to black');
    return '0 0 0 setrgbcolor % Invalid color fallback\n';
  }
  
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} setrgbcolor\n`;
};

/**
 * Convert SVG transform attributes to PostScript commands with higher precision
 */
export const convertSvgTransform = (transform: string | null): string => {
  if (!transform) return '';
  
  let psCommands = '';
  
  // Match transform functions with improved regex
  const transformRegex = /(translate|scale|rotate|matrix|skewX|skewY)\s*\(\s*([^)]+)\s*\)/g;
  let match;
  
  while ((match = transformRegex.exec(transform)) !== null) {
    const transformType = match[1];
    const params = match[2].split(/[\s,]+/).map(parseFloat);
    
    switch (transformType) {
      case 'translate':
        if (params.length >= 2 && !isNaN(params[0]) && !isNaN(params[1])) {
          psCommands += `${params[0].toFixed(6)} ${params[1].toFixed(6)} translate\n`;
        } else if (params.length >= 1 && !isNaN(params[0])) {
          psCommands += `${params[0].toFixed(6)} 0 translate\n`;
        }
        break;
        
      case 'scale':
        if (params.length >= 2 && !isNaN(params[0]) && !isNaN(params[1])) {
          psCommands += `${params[0].toFixed(6)} ${params[1].toFixed(6)} scale\n`;
        } else if (params.length >= 1 && !isNaN(params[0])) {
          psCommands += `${params[0].toFixed(6)} ${params[0].toFixed(6)} scale\n`;
        }
        break;
        
      case 'rotate':
        if (params.length >= 1 && !isNaN(params[0])) {
          if (params.length >= 3 && !isNaN(params[1]) && !isNaN(params[2])) {
            // Rotate around point with higher precision
            psCommands += `${params[1].toFixed(6)} ${params[2].toFixed(6)} translate\n`;
            psCommands += `${params[0].toFixed(6)} rotate\n`;
            psCommands += `${(-params[1]).toFixed(6)} ${(-params[2]).toFixed(6)} translate\n`;
          } else {
            // Simple rotation around origin
            psCommands += `${params[0].toFixed(6)} rotate\n`;
          }
        }
        break;
        
      case 'matrix':
        if (params.length >= 6 && params.every(p => !isNaN(p))) {
          // High precision matrix transforms
          psCommands += `[${params.map(p => p.toFixed(6)).join(' ')}] concat\n`;
        }
        break;
        
      case 'skewX':
      case 'skewY':
        if (params.length >= 1 && !isNaN(params[0])) {
          // Convert skewX to matrix
          const angleRad = params[0] * Math.PI / 180;
          const tan = Math.tan(angleRad);
          psCommands += `[1 0 ${tan.toFixed(6)} 1 0 0] concat\n`;
        }
        break;
    }
  }
  
  return psCommands;
};

/**
 * Prepare SVG element for EPS conversion by analyzing its properties
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

/**
 * Extract gradient definitions from SVG for emulation in EPS
 */
export const extractGradients = (svgDoc: Document): Record<string, any> => {
  const gradients: Record<string, any> = {};
  const linearGradients = svgDoc.querySelectorAll('linearGradient');
  const radialGradients = svgDoc.querySelectorAll('radialGradient');
  
  // Process linear gradients
  linearGradients.forEach(gradient => {
    const id = gradient.getAttribute('id');
    if (!id) return;
    
    const stops: { offset: number; color: string; opacity: number }[] = [];
    const stopElements = gradient.querySelectorAll('stop');
    
    stopElements.forEach(stop => {
      const offset = parseFloat(stop.getAttribute('offset') || '0');
      const color = stop.getAttribute('stop-color') || '#000000';
      const opacity = parseFloat(stop.getAttribute('stop-opacity') || '1');
      
      stops.push({ offset, color, opacity });
    });
    
    gradients[id] = {
      type: 'linear',
      x1: parseFloat(gradient.getAttribute('x1') || '0') || 0,
      y1: parseFloat(gradient.getAttribute('y1') || '0') || 0,
      x2: parseFloat(gradient.getAttribute('x2') || '100%') || 1,
      y2: parseFloat(gradient.getAttribute('y2') || '0') || 0,
      stops
    };
  });
  
  // Process radial gradients
  radialGradients.forEach(gradient => {
    const id = gradient.getAttribute('id');
    if (!id) return;
    
    const stops: { offset: number; color: string; opacity: number }[] = [];
    const stopElements = gradient.querySelectorAll('stop');
    
    stopElements.forEach(stop => {
      const offset = parseFloat(stop.getAttribute('offset') || '0');
      const color = stop.getAttribute('stop-color') || '#000000';
      const opacity = parseFloat(stop.getAttribute('stop-opacity') || '1');
      
      stops.push({ offset, color, opacity });
    });
    
    gradients[id] = {
      type: 'radial',
      cx: parseFloat(gradient.getAttribute('cx') || '50%') || 0.5,
      cy: parseFloat(gradient.getAttribute('cy') || '50%') || 0.5,
      r: parseFloat(gradient.getAttribute('r') || '50%') || 0.5,
      fx: parseFloat(gradient.getAttribute('fx') || gradient.getAttribute('cx') || '50%') || 0.5,
      fy: parseFloat(gradient.getAttribute('fy') || gradient.getAttribute('cy') || '50%') || 0.5,
      stops
    };
  });
  
  return gradients;
};

/**
 * Process clip paths from SVG for application in EPS
 */
export const processClipPaths = (svgDoc: Document): Record<string, string> => {
  const clipPaths: Record<string, string> = {};
  const clipPathElements = svgDoc.querySelectorAll('clipPath');
  
  clipPathElements.forEach(clipPath => {
    const id = clipPath.getAttribute('id');
    if (!id) return;
    
    // Extract path data from clip path
    const paths = clipPath.querySelectorAll('path');
    let clipPathContent = '';
    
    paths.forEach(path => {
      const pathData = path.getAttribute('d');
      if (pathData) {
        clipPathContent += `newpath\n${pathData}\nclosepath\n`;
      }
    });
    
    // Also check for basic shapes in clip paths
    const rects = clipPath.querySelectorAll('rect');
    rects.forEach(rect => {
      const x = parseFloat(rect.getAttribute('x') || '0');
      const y = parseFloat(rect.getAttribute('y') || '0');
      const width = parseFloat(rect.getAttribute('width') || '0');
      const height = parseFloat(rect.getAttribute('height') || '0');
      
      if (width > 0 && height > 0) {
        clipPathContent += `newpath\n${x} ${y} moveto\n${x + width} ${y} lineto\n${x + width} ${y + height} lineto\n${x} ${y + height} lineto\nclosepath\n`;
      }
    });
    
    clipPaths[id] = clipPathContent;
  });
  
  return clipPaths;
};

