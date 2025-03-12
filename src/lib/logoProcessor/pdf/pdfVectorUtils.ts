
import { PDFDocument, rgb } from 'pdf-lib';
import { getPostScriptColor } from '../vectorUtils';

/**
 * Creates a PDF from SVG text while preserving vector information
 */
export const createPdfFromSvg = async (svgString: string): Promise<Blob> => {
  try {
    console.log('Creating vector PDF from SVG, length:', svgString.length);
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Extract SVG dimensions from viewBox
    const viewBoxMatch = svgString.match(/viewBox=["']([^"']+)["']/);
    let width = 600;
    let height = 600;
    
    if (viewBoxMatch && viewBoxMatch[1]) {
      const [, , w, h] = viewBoxMatch[1].split(/\s+/).map(Number);
      if (!isNaN(w) && !isNaN(h)) {
        width = w;
        height = h;
      }
    }
    
    // Set aspect ratio for the page to match the SVG
    const pageWidth = 600;
    const pageHeight = 600;
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // Create an SVG Data URI
    const svgDataUri = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
    
    // Create a form XObject from the SVG
    await fetch(svgDataUri)
      .then(response => response.arrayBuffer())
      .then(async buffer => {
        return buffer;
      });
    
    // Calculate dimensions to maintain aspect ratio while centering
    const scale = Math.min(pageWidth * 0.8 / width, pageHeight * 0.8 / height);
    
    // Center on page - improved positioning
    const x = (pageWidth - width * scale) / 2;
    const y = (pageHeight - height * scale) / 2;
    
    // Add vector content to page
    const paths = extractSimplePaths(svgString);
    
    // Draw the paths with their fill colors and proper positioning
    paths.forEach((pathData) => {
      // Convert the fill color to RGB values for pdf-lib
      const fillColor = pathData.fill || '#000000';
      const rgbColor = hexToRgb(fillColor);
      const pdfColor = rgbColor ? rgb(rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255) : rgb(0, 0, 0);
      
      if (pathData.type === 'rect') {
        page.drawRectangle({
          x: x + (pathData.x || 0) * scale,
          y: y + ((height - (pathData.y || 0) - (pathData.height || 0))) * scale,
          width: (pathData.width || 10) * scale,
          height: (pathData.height || 10) * scale,
          color: pdfColor,
          opacity: pathData.opacity || 1,
          borderWidth: 0,
        });
      } else if (pathData.type === 'circle') {
        page.drawCircle({
          x: x + (pathData.cx || width/2) * scale,
          y: y + ((height - (pathData.cy || height/2))) * scale,
          size: (pathData.r || 10) * scale * 2,
          color: pdfColor,
          borderWidth: 0,
          opacity: pathData.opacity || 1,
        });
      } else if (pathData.type === 'path') {
        page.drawSvgPath(pathData.d || `M ${x} ${y} L ${x+10*scale} ${y+10*scale}`, {
          x: x,
          y: y + height * scale,
          scale: scale,
          color: pdfColor,
          borderWidth: 0,
          opacity: pathData.opacity || 1,
        });
      }
    });
    
    // Save the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Create a Blob from the PDF bytes
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    console.log('Vector PDF created successfully, size:', pdfBlob.size, 'bytes');
    return pdfBlob;
  } catch (error) {
    console.error('Error in createPdfFromSvg:', error);
    throw error;
  }
};

/**
 * Helper function to extract basic paths and shapes from SVG with improved color handling
 */
function extractSimplePaths(svgString: string): Array<{type: string, [key: string]: any}> {
  const shapes: Array<{type: string, [key: string]: any}> = [];
  
  // Convert some strokes to fills for better representation
  const fixedSvgString = svgString
    .replace(/stroke="([^"]+)"([^>]*?)fill="none"/g, 'fill="$1"$2stroke="none"') // Convert stroke-only to fill
    .replace(/stroke-width="([^"]+)"/g, 'data-stroke-width="$1"'); // Preserve stroke width as data attribute
  
  // Extract rectangles
  const rectRegex = /<rect[^>]*?(?:x=["']([^"']*?)["'])?[^>]*?(?:y=["']([^"']*?)["'])?[^>]*?(?:width=["']([^"']*?)["'])?[^>]*?(?:height=["']([^"']*?)["'])?[^>]*?(?:fill=["']([^"']*?)["'])?[^>]*?(?:opacity=["']([^"']*?)["'])?[^>]*?\/>/g;
  let rectMatch;
  while ((rectMatch = rectRegex.exec(fixedSvgString)) !== null) {
    const fill = rectMatch[5] || '#000000';
    const opacity = rectMatch[6] !== undefined ? parseFloat(rectMatch[6]) : 1;
    
    shapes.push({
      type: 'rect',
      x: parseFloat(rectMatch[1] || '0'),
      y: parseFloat(rectMatch[2] || '0'),
      width: parseFloat(rectMatch[3] || '10'),
      height: parseFloat(rectMatch[4] || '10'),
      fill,
      opacity
    });
  }
  
  // Extract circles
  const circleRegex = /<circle[^>]*?(?:cx=["']([^"']*?)["'])?[^>]*?(?:cy=["']([^"']*?)["'])?[^>]*?(?:r=["']([^"']*?)["'])?[^>]*?(?:fill=["']([^"']*?)["'])?[^>]*?(?:opacity=["']([^"']*?)["'])?[^>]*?\/>/g;
  let circleMatch;
  while ((circleMatch = circleRegex.exec(fixedSvgString)) !== null) {
    const fill = circleMatch[4] || '#000000';
    const opacity = circleMatch[5] !== undefined ? parseFloat(circleMatch[5]) : 1;
    
    shapes.push({
      type: 'circle',
      cx: parseFloat(circleMatch[1] || '0'),
      cy: parseFloat(circleMatch[2] || '0'),
      r: parseFloat(circleMatch[3] || '5'),
      fill,
      opacity
    });
  }
  
  // Extract paths
  const pathRegex = /<path[^>]*?(?:d=["']([^"']*?)["'])[^>]*?(?:fill=["']([^"']*?)["'])?[^>]*?(?:opacity=["']([^"']*?)["'])?[^>]*?\/>/g;
  let pathMatch;
  while ((pathMatch = pathRegex.exec(fixedSvgString)) !== null) {
    const fill = pathMatch[2] || '#000000';
    const opacity = pathMatch[3] !== undefined ? parseFloat(pathMatch[3]) : 1;
    
    shapes.push({
      type: 'path',
      d: pathMatch[1],
      fill,
      opacity
    });
  }
  
  // Extract additional filled shapes (polygons, polylines, etc.)
  const polygonRegex = /<polygon[^>]*?(?:points=["']([^"']*?)["'])[^>]*?(?:fill=["']([^"']*?)["'])?[^>]*?(?:opacity=["']([^"']*?)["'])?[^>]*?\/>/g;
  let polygonMatch;
  while ((polygonMatch = polygonRegex.exec(fixedSvgString)) !== null) {
    const fill = polygonMatch[2] || '#000000';
    const opacity = polygonMatch[3] !== undefined ? parseFloat(polygonMatch[3]) : 1;
    
    // Convert polygon points to path data
    const points = polygonMatch[1].trim().split(/[\s,]+/);
    if (points.length >= 4) { // Need at least 2 points (4 coordinates)
      let pathData = `M ${points[0]} ${points[1]}`;
      for (let i = 2; i < points.length; i += 2) {
        if (i + 1 < points.length) {
          pathData += ` L ${points[i]} ${points[i+1]}`;
        }
      }
      pathData += ' Z'; // Close the path
      
      shapes.push({
        type: 'path',
        d: pathData,
        fill,
        opacity
      });
    }
  }
  
  // Extract ellipses and convert to paths
  const ellipseRegex = /<ellipse[^>]*?(?:cx=["']([^"']*?)["'])?[^>]*?(?:cy=["']([^"']*?)["'])?[^>]*?(?:rx=["']([^"']*?)["'])?[^>]*?(?:ry=["']([^"']*?)["'])?[^>]*?(?:fill=["']([^"']*?)["'])?[^>]*?(?:opacity=["']([^"']*?)["'])?[^>]*?\/>/g;
  let ellipseMatch;
  while ((ellipseMatch = ellipseRegex.exec(fixedSvgString)) !== null) {
    const cx = parseFloat(ellipseMatch[1] || '0');
    const cy = parseFloat(ellipseMatch[2] || '0');
    const rx = parseFloat(ellipseMatch[3] || '5');
    const ry = parseFloat(ellipseMatch[4] || '5');
    const fill = ellipseMatch[5] || '#000000';
    const opacity = ellipseMatch[6] !== undefined ? parseFloat(ellipseMatch[6]) : 1;
    
    // Approximate ellipse with four bezier curves
    // This is a simplified approach; for better accuracy, more points could be used
    const pathData = `M ${cx + rx} ${cy} C ${cx + rx} ${cy + ry * 0.552284}, ${cx + rx * 0.552284} ${cy + ry}, ${cx} ${cy + ry} C ${cx - rx * 0.552284} ${cy + ry}, ${cx - rx} ${cy + ry * 0.552284}, ${cx - rx} ${cy} C ${cx - rx} ${cy - ry * 0.552284}, ${cx - rx * 0.552284} ${cy - ry}, ${cx} ${cy - ry} C ${cx + rx * 0.552284} ${cy - ry}, ${cx + rx} ${cy - ry * 0.552284}, ${cx + rx} ${cy} Z`;
    
    shapes.push({
      type: 'path',
      d: pathData,
      fill,
      opacity
    });
  }
  
  // Extract text elements and treat them as paths with fill color
  const textRegex = /<text[^>]*?(?:x=["']([^"']*?)["'])?[^>]*?(?:y=["']([^"']*?)["'])?[^>]*?(?:fill=["']([^"']*?)["'])?[^>]*?(?:opacity=["']([^"']*?)["'])?[^>]*?>([^<]*)<\/text>/g;
  let textMatch;
  while ((textMatch = textRegex.exec(fixedSvgString)) !== null) {
    const x = parseFloat(textMatch[1] || '0');
    const y = parseFloat(textMatch[2] || '0');
    const fill = textMatch[3] || '#000000';
    const opacity = textMatch[4] !== undefined ? parseFloat(textMatch[4]) : 1;
    
    // For text, we'll create a simple rectangle as a placeholder
    // In a real implementation, text would be rendered properly
    shapes.push({
      type: 'rect',
      x: x,
      y: y - 10, // Approximate text height
      width: 50,  // Approximate text width
      height: 12, // Approximate text height
      fill,
      opacity
    });
  }
  
  console.log(`Extracted ${shapes.length} shapes from SVG`);
  return shapes;
}

/**
 * Helper function to convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Handle named colors
  if (hex.toLowerCase() === 'black' || hex === '#000000') return { r: 0, g: 0, b: 0 };
  if (hex.toLowerCase() === 'white' || hex === '#ffffff') return { r: 255, g: 255, b: 255 };
  
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
  } : null;
}
