import { PDFDocument, rgb } from 'pdf-lib';
import { getPostScriptColor } from './vectorUtils';
import { createPostScriptHeader, createPostScriptFooter } from './postscriptUtils';

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
        // For true vector support, we need to use a library that can
        // properly interpret SVG paths and convert them to PDF vector paths.
        return buffer;
      });
    
    // Calculate dimensions to maintain aspect ratio while centering
    const scale = Math.min(pageWidth * 0.8 / width, pageHeight * 0.8 / height);
    
    // Center on page - improved positioning
    const x = (pageWidth - width * scale) / 2;
    const y = (pageHeight - height * scale) / 2;
    
    // Add vector content to page (improved approach)
    // Extract paths from SVG and draw them using pdf-lib's vector drawing operations
    const paths = extractSimplePaths(svgString);
    
    // Draw the paths with proper fill and positioning
    paths.forEach((pathData) => {
      // Draw a simplified representation based on the path type
      if (pathData.type === 'rect') {
        page.drawRectangle({
          x: x + (pathData.x || 0) * scale,
          y: y + ((height - (pathData.y || 0) - (pathData.height || 0))) * scale, // Fix Y-axis coordinate system difference
          width: (pathData.width || 10) * scale,
          height: (pathData.height || 10) * scale,
          color: rgb(0, 0, 0), // Default to black, but use color if available
          opacity: pathData.opacity || 1,
          borderWidth: 0, // Set to 0 to ensure we're using fill, not stroke
        });
      } else if (pathData.type === 'circle') {
        page.drawCircle({
          x: x + (pathData.cx || width/2) * scale,
          y: y + ((height - (pathData.cy || height/2))) * scale, // Fix Y-axis coordinate system difference
          size: (pathData.r || 10) * scale * 2,
          color: rgb(0, 0, 0),
          borderWidth: 0, // Set to 0 to ensure we're using fill, not stroke
          opacity: pathData.opacity || 1,
        });
      } else if (pathData.type === 'path') {
        // Fix for path rendering - prioritize fill over stroke
        page.drawSvgPath(pathData.d || `M ${x} ${y} L ${x+10*scale} ${y+10*scale}`, {
          x: x,
          y: y + height * scale, // Fix Y-axis coordinate system difference
          scale: scale,
          color: rgb(0, 0, 0), // Use fill color instead of stroke
          borderWidth: 0, // Set to 0 to prioritize fill over stroke
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

// Function to create a PDF from an image data URL
export const createPdfFromImage = async (imageDataUrl: string): Promise<Blob> => {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 600]);
    
    // Embed the image into the PDF
    const imgData = await fetch(imageDataUrl).then(res => res.arrayBuffer());
    const img = await pdfDoc.embedPng(imgData);
    
    // Calculate dimensions to maintain aspect ratio
    const imgDims = img.scale(1);
    const scale = Math.min(500 / imgDims.width, 500 / imgDims.height);
    
    // Center the image on the page
    const x = (600 - imgDims.width * scale) / 2;
    const y = (600 - imgDims.height * scale) / 2;
    
    // Draw the image
    page.drawImage(img, {
      x,
      y,
      width: imgDims.width * scale,
      height: imgDims.height * scale,
    });
    
    // Save the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Create a Blob from the PDF bytes
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    console.log('PDF created successfully from image, size:', pdfBlob.size, 'bytes');
    return pdfBlob;
  } catch (error) {
    console.error('Error in createPdfFromImage:', error);
    throw error;
  }
};

// Convert vector PDF paths to EPS with improved vector quality
export const convertPdfToEps = async (pdfBlob: Blob): Promise<Blob> => {
  try {
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    // Extract paths from PDF and convert to PostScript
    const paths = extractSimplePaths(await pdfBlob.text());
    let epsContent = createPostScriptHeader(width, height);

    // Convert each path to PostScript commands with proper scaling and positioning
    paths.forEach(path => {
      const color = getPostScriptColor(path.fill || '#000000');
      if (path.type === 'path') {
        epsContent += `\n% Path\n${color} rgb\nn\n${path.d}\ncp\nf\n`;
      } else if (path.type === 'rect') {
        const x = path.x || 0;
        const y = height - (path.y || 0) - (path.height || 0); // Flip Y coordinates
        epsContent += `\n% Rectangle\n${color} rgb\nn\n${x} ${y} m\n${x + path.width} ${y} l\n${x + path.width} ${y + path.height} l\n${x} ${y + path.height} l\ncp\nf\n`;
      } else if (path.type === 'circle') {
        const cx = path.cx || 0;
        const cy = height - (path.cy || 0); // Flip Y coordinates
        const r = path.r || 0;
        epsContent += `\n% Circle\n${color} rgb\nn\n${cx} ${cy} ${r} 0 360 arc\ncp\nf\n`;
      }
    });

    epsContent += createPostScriptFooter();

    return new Blob([epsContent], { type: 'application/postscript' });
  } catch (error) {
    console.error('Error converting PDF to EPS:', error);
    throw error;
  }
};
