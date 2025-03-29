import { PDFDocument, rgb, ColorTypes } from 'pdf-lib';
import { getPostScriptColor } from '../vectorUtils';

/**
 * Creates a PDF from SVG text while preserving vector information
 */
export const createPdfFromSvg = async (svgString: string): Promise<Blob> => {
  try {
    console.log('Creating vector PDF from SVG, length:', svgString.length);
    
    // Validate SVG input
    if (!svgString || !svgString.includes('<svg')) {
      console.error('Invalid SVG input:', svgString.substring(0, 100) + '...');
      throw new Error('Invalid SVG input');
    }
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Extract SVG dimensions from viewBox
    const viewBoxMatch = svgString.match(/viewBox=["']([^"']+)["']/);
    let width = 600;
    let height = 600;
    
    if (viewBoxMatch && viewBoxMatch[1]) {
      const viewBoxParts = viewBoxMatch[1].split(/\s+/).map(Number);
      if (viewBoxParts.length >= 4) {
        const [minX, minY, w, h] = viewBoxParts;
        console.log('Extracted viewBox:', { minX, minY, w, h });
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          width = w;
          height = h;
        } else {
          console.warn('Invalid viewBox dimensions, using defaults');
        }
      }
    } else {
      // Try to get width/height attributes if viewBox is missing
      const widthMatch = svgString.match(/width=["']([^"']+)["']/);
      const heightMatch = svgString.match(/height=["']([^"']+)["']/);
      
      if (widthMatch && heightMatch) {
        const w = parseFloat(widthMatch[1]);
        const h = parseFloat(heightMatch[1]);
        console.log('Using width/height attributes:', { w, h });
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          width = w;
          height = h;
        }
      } else {
        console.warn('No viewBox or dimensions found, using defaults');
      }
    }
    
    console.log('Final dimensions for PDF:', { width, height });
    
    // Set aspect ratio for the page to match the SVG
    const pageWidth = 600;
    const pageHeight = 600;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // Create an SVG Data URI for embedding
    const svgDataUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
    
    // Calculate dimensions to maintain aspect ratio while centering
    const scale = Math.min(pageWidth * 0.8 / width, pageHeight * 0.8 / height);
    
    // Center on page - improved positioning
    const x = (pageWidth - width * scale) / 2;
    const y = (pageHeight - height * scale) / 2;
    
    console.log('Positioning in PDF:', { x, y, scale });
    
    // Add vector content to page with improved gradient and transparency support
    const elementsWithStyles = extractSvgElementsWithStyles(svgString);
    console.log(`Extracted ${elementsWithStyles.length} SVG elements`);
    
    // Draw the paths with their fill colors and proper positioning
    let drawnElements = 0;
    elementsWithStyles.forEach((element) => {
      try {
        // Handle each element based on its type
        if (element.type === 'rect') {
          drawRectangle(page, element, x, y, height, scale);
          drawnElements++;
        } else if (element.type === 'circle') {
          drawCircle(page, element, x, y, height, scale);
          drawnElements++;
        } else if (element.type === 'ellipse') {
          drawEllipse(page, element, x, y, height, scale);
          drawnElements++;
        } else if (element.type === 'path') {
          drawPath(page, element, x, y, height, scale);
          drawnElements++;
        } else if (element.type === 'polygon' || element.type === 'polyline') {
          drawPolygon(page, element, x, y, height, scale);
          drawnElements++;
        }
      } catch (elementError) {
        console.error(`Error drawing ${element.type} element:`, elementError);
      }
    });
    
    console.log(`Successfully drew ${drawnElements} elements to PDF`);
    
    // Handle gradient references - simplified approach
    try {
      const gradientElements = extractGradients(svgString);
      console.log(`Found ${gradientElements.length} gradient definitions`);
      
      gradientElements.forEach(gradient => {
        // We simplify gradients with a solid color approximation for now
        const averageColor = approximateGradientColor(gradient);
        
        // Find elements referencing this gradient and apply the average color
        elementsWithStyles.forEach(element => {
          if (element.fill && element.fill.includes(`url(#${gradient.id})`)) {
            element.simplifiedFill = averageColor;
            
            // Redraw with the simplified color
            try {
              if (element.type === 'rect') {
                drawRectangle(page, { ...element, fill: averageColor }, x, y, height, scale);
              } else if (element.type === 'path') {
                drawPath(page, { ...element, fill: averageColor }, x, y, height, scale);
              }
            } catch (redrawError) {
              console.error('Error redrawing element with gradient:', redrawError);
            }
          }
        });
      });
    } catch (gradientError) {
      console.error('Error processing gradients:', gradientError);
    }
    
    // If no elements were drawn, add a fallback rectangle to ensure the PDF isn't empty
    if (drawnElements === 0) {
      console.warn('No elements were drawn, adding fallback shape');
      page.drawRectangle({
        x: pageWidth * 0.2,
        y: pageHeight * 0.2,
        width: pageWidth * 0.6,
        height: pageHeight * 0.6,
        color: rgb(0, 0, 0),
        borderWidth: 1,
        borderColor: rgb(0, 0, 0),
        opacity: 0.5
      });
    }
    
    // Save the PDF to bytes
    console.log('Saving PDF document');
    const pdfBytes = await pdfDoc.save();
    
    // Create a Blob from the PDF bytes
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    console.log('Vector PDF created successfully, size:', pdfBlob.size, 'bytes');
    return pdfBlob;
  } catch (error) {
    console.error('Error in createPdfFromSvg:', error);
    
    // Fallback to a minimal PDF if conversion fails
    try {
      console.log('Creating minimal fallback PDF');
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 600]);
      
      // Add a text note about the error
      page.drawText('SVG conversion failed', {
        x: 50,
        y: 500,
        size: 20,
      });
      
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      console.log('Created fallback PDF, size:', pdfBlob.size);
      return pdfBlob;
    } catch (fallbackError) {
      console.error('Fallback PDF creation failed:', fallbackError);
      throw error; // Re-throw the original error if fallback fails
    }
  }
};

/**
 * Helper function to draw rectangles with proper colors and opacity
 */
function drawRectangle(page: any, element: any, baseX: number, baseY: number, svgHeight: number, scale: number) {
  const x = element.x !== undefined ? baseX + element.x * scale : baseX;
  const y = element.y !== undefined ? baseY + (svgHeight - element.y - element.height) * scale : baseY;
  const width = element.width !== undefined ? element.width * scale : 10 * scale;
  const height = element.height !== undefined ? element.height * scale : 10 * scale;
  
  // Get proper color from fill or simplifiedFill (for gradients)
  const fill = element.simplifiedFill || element.fill || '#000000';
  const rgbColor = hexToRgb(fill);
  
  if (rgbColor) {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: rgb(rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255),
      opacity: element.opacity !== undefined ? element.opacity : 1,
      borderWidth: 0,
    });
  }
}

/**
 * Helper function to draw circles with proper colors and opacity
 */
function drawCircle(page: any, element: any, baseX: number, baseY: number, svgHeight: number, scale: number) {
  const cx = baseX + (element.cx !== undefined ? element.cx * scale : 0);
  const cy = baseY + (svgHeight - (element.cy !== undefined ? element.cy : 0)) * scale;
  const r = (element.r !== undefined ? element.r : 5) * scale;
  
  const fill = element.simplifiedFill || element.fill || '#000000';
  const rgbColor = hexToRgb(fill);
  
  if (rgbColor) {
    page.drawCircle({
      x: cx,
      y: cy,
      size: r * 2,
      color: rgb(rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255),
      opacity: element.opacity !== undefined ? element.opacity : 1,
      borderWidth: 0,
    });
  }
}

/**
 * Helper function to draw ellipses with proper colors and opacity
 */
function drawEllipse(page: any, element: any, baseX: number, baseY: number, svgHeight: number, scale: number) {
  const cx = element.cx !== undefined ? element.cx : 0;
  const cy = element.cy !== undefined ? element.cy : 0;
  const rx = element.rx !== undefined ? element.rx : 10;
  const ry = element.ry !== undefined ? element.ry : 5;
  
  // Approximate ellipse with bezier curves
  const pathData = approximateEllipsePath(cx, cy, rx, ry);
  
  const fill = element.simplifiedFill || element.fill || '#000000';
  const rgbColor = hexToRgb(fill);
  
  if (rgbColor) {
    page.drawSvgPath(pathData, {
      x: baseX,
      y: baseY + svgHeight * scale,
      scale: scale,
      color: rgb(rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255),
      opacity: element.opacity !== undefined ? element.opacity : 1,
      borderWidth: 0,
    });
  }
}

/**
 * Helper function to approximate an ellipse with a path
 */
function approximateEllipsePath(cx: number, cy: number, rx: number, ry: number): string {
  // Use bezier curves to approximate an ellipse
  return `M ${cx + rx} ${cy} C ${cx + rx} ${cy + ry * 0.552284}, ${cx + rx * 0.552284} ${cy + ry}, ${cx} ${cy + ry} C ${cx - rx * 0.552284} ${cy + ry}, ${cx - rx} ${cy + ry * 0.552284}, ${cx - rx} ${cy} C ${cx - rx} ${cy - ry * 0.552284}, ${cx - rx * 0.552284} ${cy - ry}, ${cx} ${cy - ry} C ${cx + rx * 0.552284} ${cy - ry}, ${cx + rx} ${cy - ry * 0.552284}, ${cx + rx} ${cy} Z`;
}

/**
 * Helper function to draw paths with proper colors and opacity
 */
function drawPath(page: any, element: any, baseX: number, baseY: number, svgHeight: number, scale: number) {
  if (!element.d) return;
  
  const fill = element.simplifiedFill || element.fill || '#000000';
  const rgbColor = hexToRgb(fill);
  
  if (rgbColor) {
    page.drawSvgPath(element.d, {
      x: baseX,
      y: baseY + svgHeight * scale,
      scale: scale,
      color: rgb(rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255),
      opacity: element.opacity !== undefined ? element.opacity : 1,
      borderWidth: 0,
    });
  }
}

/**
 * Helper function to draw polygons with proper colors and opacity
 */
function drawPolygon(page: any, element: any, baseX: number, baseY: number, svgHeight: number, scale: number) {
  if (!element.points) return;
  
  // Convert polygon points to path data
  const points = element.points.trim().split(/[\s,]+/);
  if (points.length < 4) return; // Need at least 2 points
  
  let pathData = `M ${points[0]} ${points[1]}`;
  for (let i = 2; i < points.length; i += 2) {
    if (i + 1 < points.length) {
      pathData += ` L ${points[i]} ${points[i+1]}`;
    }
  }
  pathData += ' Z'; // Close the path
  
  const fill = element.simplifiedFill || element.fill || '#000000';
  const rgbColor = hexToRgb(fill);
  
  if (rgbColor) {
    page.drawSvgPath(pathData, {
      x: baseX,
      y: baseY + svgHeight * scale,
      scale: scale,
      color: rgb(rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255),
      opacity: element.opacity !== undefined ? element.opacity : 1,
      borderWidth: 0,
    });
  }
}

/**
 * Helper function to extract SVG elements with their styles
 */
function extractSvgElementsWithStyles(svgString: string): Array<{type: string, [key: string]: any}> {
  try {
    const elements: Array<{type: string, [key: string]: any}> = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('SVG parsing error:', parserError.textContent);
      return elements;
    }
    
    // Process rectangles
    const rects = doc.querySelectorAll('rect');
    rects.forEach(rect => {
      elements.push({
        type: 'rect',
        x: parseFloat(rect.getAttribute('x') || '0'),
        y: parseFloat(rect.getAttribute('y') || '0'),
        width: parseFloat(rect.getAttribute('width') || '0'),
        height: parseFloat(rect.getAttribute('height') || '0'),
        fill: rect.getAttribute('fill') || '#000000',
        stroke: rect.getAttribute('stroke'),
        'stroke-width': rect.getAttribute('stroke-width'),
        opacity: rect.getAttribute('opacity') ? parseFloat(rect.getAttribute('opacity') || '1') : 1,
        style: rect.getAttribute('style') || '',
      });
    });
    
    // Process circles
    const circles = doc.querySelectorAll('circle');
    circles.forEach(circle => {
      elements.push({
        type: 'circle',
        cx: parseFloat(circle.getAttribute('cx') || '0'),
        cy: parseFloat(circle.getAttribute('cy') || '0'),
        r: parseFloat(circle.getAttribute('r') || '0'),
        fill: circle.getAttribute('fill') || '#000000',
        stroke: circle.getAttribute('stroke'),
        'stroke-width': circle.getAttribute('stroke-width'),
        opacity: circle.getAttribute('opacity') ? parseFloat(circle.getAttribute('opacity') || '1') : 1,
        style: circle.getAttribute('style') || '',
      });
    });
    
    // Process ellipses
    const ellipses = doc.querySelectorAll('ellipse');
    ellipses.forEach(ellipse => {
      elements.push({
        type: 'ellipse',
        cx: parseFloat(ellipse.getAttribute('cx') || '0'),
        cy: parseFloat(ellipse.getAttribute('cy') || '0'),
        rx: parseFloat(ellipse.getAttribute('rx') || '0'),
        ry: parseFloat(ellipse.getAttribute('ry') || '0'),
        fill: ellipse.getAttribute('fill') || '#000000',
        stroke: ellipse.getAttribute('stroke'),
        'stroke-width': ellipse.getAttribute('stroke-width'),
        opacity: ellipse.getAttribute('opacity') ? parseFloat(ellipse.getAttribute('opacity') || '1') : 1,
        style: ellipse.getAttribute('style') || '',
      });
    });
    
    // Process paths
    const paths = doc.querySelectorAll('path');
    paths.forEach(path => {
      elements.push({
        type: 'path',
        d: path.getAttribute('d') || '',
        fill: path.getAttribute('fill') || '#000000',
        stroke: path.getAttribute('stroke'),
        'stroke-width': path.getAttribute('stroke-width'),
        opacity: path.getAttribute('opacity') ? parseFloat(path.getAttribute('opacity') || '1') : 1,
        style: path.getAttribute('style') || '',
      });
    });
    
    // Process polygons
    const polygons = doc.querySelectorAll('polygon');
    polygons.forEach(polygon => {
      elements.push({
        type: 'polygon',
        points: polygon.getAttribute('points') || '',
        fill: polygon.getAttribute('fill') || '#000000',
        stroke: polygon.getAttribute('stroke'),
        'stroke-width': polygon.getAttribute('stroke-width'),
        opacity: polygon.getAttribute('opacity') ? parseFloat(polygon.getAttribute('opacity') || '1') : 1,
        style: polygon.getAttribute('style') || '',
      });
    });
    
    // Process polylines
    const polylines = doc.querySelectorAll('polyline');
    polylines.forEach(polyline => {
      elements.push({
        type: 'polyline',
        points: polyline.getAttribute('points') || '',
        fill: polyline.getAttribute('fill') || 'none',
        stroke: polyline.getAttribute('stroke') || '#000000',
        'stroke-width': polyline.getAttribute('stroke-width'),
        opacity: polyline.getAttribute('opacity') ? parseFloat(polyline.getAttribute('opacity') || '1') : 1,
        style: polyline.getAttribute('style') || '',
      });
    });
    
    return elements;
  } catch (error) {
    console.error('Error extracting SVG elements:', error);
    return [];
  }
}

/**
 * Helper function to extract gradients from SVG
 */
function extractGradients(svgString: string): Array<{id: string, type: string, stops: Array<{offset: string, color: string, opacity: number}>}> {
  const gradients: Array<{id: string, type: string, stops: Array<{offset: string, color: string, opacity: number}>}> = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  
  // Process linear gradients
  const linearGradients = doc.querySelectorAll('linearGradient');
  linearGradients.forEach(gradient => {
    const id = gradient.getAttribute('id') || '';
    const stops: Array<{offset: string, color: string, opacity: number}> = [];
    
    // Extract stops
    gradient.querySelectorAll('stop').forEach(stop => {
      stops.push({
        offset: stop.getAttribute('offset') || '0%',
        color: stop.getAttribute('stop-color') || '#000000',
        opacity: parseFloat(stop.getAttribute('stop-opacity') || '1')
      });
    });
    
    gradients.push({
      id,
      type: 'linear',
      stops
    });
  });
  
  // Process radial gradients
  const radialGradients = doc.querySelectorAll('radialGradient');
  radialGradients.forEach(gradient => {
    const id = gradient.getAttribute('id') || '';
    const stops: Array<{offset: string, color: string, opacity: number}> = [];
    
    // Extract stops
    gradient.querySelectorAll('stop').forEach(stop => {
      stops.push({
        offset: stop.getAttribute('offset') || '0%',
        color: stop.getAttribute('stop-color') || '#000000',
        opacity: parseFloat(stop.getAttribute('stop-opacity') || '1')
      });
    });
    
    gradients.push({
      id,
      type: 'radial',
      stops
    });
  });
  
  return gradients;
}

/**
 * Helper function to approximate a gradient with a solid color
 * This is a simplified approach - for better results, actual PDF gradients should be used
 */
function approximateGradientColor(gradient: {id: string, type: string, stops: Array<{offset: string, color: string, opacity: number}>}): string {
  if (gradient.stops.length === 0) return '#000000';
  
  if (gradient.stops.length === 1) {
    return gradient.stops[0].color;
  }
  
  // For simplicity, we use the middle color or average the first and last stops
  if (gradient.stops.length === 2) {
    const startColor = hexToRgb(gradient.stops[0].color) || { r: 0, g: 0, b: 0 };
    const endColor = hexToRgb(gradient.stops[1].color) || { r: 0, g: 0, b: 0 };
    
    const avgR = Math.round((startColor.r + endColor.r) / 2);
    const avgG = Math.round((startColor.g + endColor.g) / 2);
    const avgB = Math.round((startColor.b + endColor.b) / 2);
    
    return `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
  }
  
  // If more than 2 stops, use the middle stop
  const middleIndex = Math.floor(gradient.stops.length / 2);
  return gradient.stops[middleIndex].color;
}

/**
 * Helper function to convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Handle named colors
  if (!hex) return { r: 0, g: 0, b: 0 };
  if (hex.toLowerCase() === 'black' || hex === '#000000') return { r: 0, g: 0, b: 0 };
  if (hex.toLowerCase() === 'white' || hex === '#ffffff') return { r: 255, g: 255, b: 255 };
  if (hex.toLowerCase() === 'none' || hex === 'transparent') return null;
  
  // Handle RGB/RGBA format
  const rgbMatch = hex.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }
  
  // Handle shorthand hex (#abc -> #aabbcc)
  let normalizedHex = hex.startsWith('#') ? hex : '#' + hex;
  if (normalizedHex.length === 4) {
    normalizedHex = '#' + normalizedHex[1] + normalizedHex[1] + 
                          normalizedHex[2] + normalizedHex[2] + 
                          normalizedHex[3] + normalizedHex[3];
  }
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalizedHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }; // Default to black if parsing fails
}
