
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
    
    // Draw the paths with proper fill and positioning
    paths.forEach((pathData) => {
      if (pathData.type === 'rect') {
        page.drawRectangle({
          x: x + (pathData.x || 0) * scale,
          y: y + ((height - (pathData.y || 0) - (pathData.height || 0))) * scale,
          width: (pathData.width || 10) * scale,
          height: (pathData.height || 10) * scale,
          color: rgb(0, 0, 0),
          opacity: pathData.opacity || 1,
          borderWidth: 0,
        });
      } else if (pathData.type === 'circle') {
        page.drawCircle({
          x: x + (pathData.cx || width/2) * scale,
          y: y + ((height - (pathData.cy || height/2))) * scale,
          size: (pathData.r || 10) * scale * 2,
          color: rgb(0, 0, 0),
          borderWidth: 0,
          opacity: pathData.opacity || 1,
        });
      } else if (pathData.type === 'path') {
        page.drawSvgPath(pathData.d || `M ${x} ${y} L ${x+10*scale} ${y+10*scale}`, {
          x: x,
          y: y + height * scale,
          scale: scale,
          color: rgb(0, 0, 0),
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
  
  console.log(`Extracted ${shapes.length} shapes from SVG`);
  return shapes;
}
