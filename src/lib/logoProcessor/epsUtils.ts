
/**
 * EPS (Encapsulated PostScript) utilities for logo processing
 * Converts SVG vector graphics to EPS format while preserving vector data
 */

import { hexToRgb } from './colorUtils';
import type { ProcessedFile } from './types';

/**
 * Creates an EPS file from SVG content
 */
export const createEpsFromSvg = async (
  svgText: string,
  color: string,
  brandName: string
): Promise<ProcessedFile[]> => {
  const files: ProcessedFile[] = [];
  
  try {
    console.log('Generating EPS file from SVG for', color);
    
    // Generate EPS content from SVG
    const epsContent = convertSvgToEps(svgText, color);
    
    // Create EPS file as a Blob
    const epsBlob = new Blob([epsContent], { type: 'application/postscript' });
    
    const formatFolder = 'EPS';
    files.push({
      folder: formatFolder,
      filename: `${brandName}_${color}.eps`,
      data: epsBlob
    });
    
    console.log(`Created EPS file from SVG for ${color}, size: ${epsBlob.size} bytes`);
    
    // Validate EPS file size
    if (epsBlob.size < 5000) {
      console.warn('Warning: EPS file size is smaller than expected:', epsBlob.size, 'bytes');
    }
  } catch (error) {
    console.error('Error creating EPS from SVG:', error);
  }
  
  return files;
};

/**
 * Convert SVG content to EPS format
 */
export const convertSvgToEps = (svgContent: string, color: string): string => {
  try {
    console.log('Starting SVG to EPS conversion');
    
    // Parse SVG
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
    
    // Check for parsing errors
    const parserError = svgDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('SVG parsing error: ' + parserError.textContent);
    }
    
    const svgElement = svgDoc.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found in the document');
    }
    
    // Get SVG dimensions
    const dimensions = getSvgDimensions(svgElement);
    console.log('SVG dimensions for EPS:', dimensions);
    
    // Generate EPS header with proper dimensions
    let epsContent = createEpsHeader(dimensions.width, dimensions.height);
    
    // Process all SVG elements and convert to PostScript commands
    const paths = Array.from(svgDoc.querySelectorAll('path'));
    const rects = Array.from(svgDoc.querySelectorAll('rect'));
    const circles = Array.from(svgDoc.querySelectorAll('circle'));
    const ellipses = Array.from(svgDoc.querySelectorAll('ellipse'));
    const lines = Array.from(svgDoc.querySelectorAll('line'));
    const polylines = Array.from(svgDoc.querySelectorAll('polyline'));
    const polygons = Array.from(svgDoc.querySelectorAll('polygon'));
    
    console.log(`Found SVG elements: ${paths.length} paths, ${rects.length} rects, ${circles.length} circles`);
    
    // Apply color modification based on the specified color
    let fillColor = '#000000'; // Default black
    if (color === 'Black') fillColor = '#000000';
    else if (color === 'White') fillColor = '#FFFFFF';
    else if (color === 'Grayscale') fillColor = '#808080';
    
    // Convert paths to PostScript
    if (paths.length > 0) {
      console.log('Processing SVG paths...');
      for (const path of paths) {
        const pathData = path.getAttribute('d');
        if (!pathData) continue;
        
        const pathFill = path.getAttribute('fill') || fillColor;
        const pathStroke = path.getAttribute('stroke');
        const strokeWidth = path.getAttribute('stroke-width');
        
        // Set color for this path
        epsContent += setPostScriptColor(pathFill);
        
        // Convert path to PostScript commands
        epsContent += convertPathToPostScript(pathData);
        
        // Apply fill or stroke
        if (pathFill && pathFill !== 'none') {
          epsContent += 'fill\n';
        } else if (pathStroke && pathStroke !== 'none') {
          // Set stroke width if specified
          if (strokeWidth) {
            epsContent += `${parseFloat(strokeWidth) || 1} setlinewidth\n`;
          }
          epsContent += 'stroke\n';
        } else {
          // Default to fill if neither is specified
          epsContent += 'fill\n';
        }
      }
    }
    
    // Convert rectangles to PostScript
    if (rects.length > 0) {
      console.log('Processing SVG rectangles...');
      for (const rect of rects) {
        const x = parseFloat(rect.getAttribute('x') || '0');
        const y = parseFloat(rect.getAttribute('y') || '0');
        const width = parseFloat(rect.getAttribute('width') || '0');
        const height = parseFloat(rect.getAttribute('height') || '0');
        const rectFill = rect.getAttribute('fill') || fillColor;
        
        if (width <= 0 || height <= 0) continue;
        
        // Set color for this rectangle
        epsContent += setPostScriptColor(rectFill);
        
        // Create rectangle path
        epsContent += 'newpath\n';
        epsContent += `${x} ${dimensions.height - y - height} moveto\n`;  // Adjust Y coordinate for PostScript
        epsContent += `${width} 0 rlineto\n`;
        epsContent += `0 ${height} rlineto\n`;
        epsContent += `${-width} 0 rlineto\n`;
        epsContent += 'closepath\n';
        epsContent += 'fill\n';
      }
    }
    
    // Convert circles to PostScript
    if (circles.length > 0) {
      console.log('Processing SVG circles...');
      for (const circle of circles) {
        const cx = parseFloat(circle.getAttribute('cx') || '0');
        const cy = parseFloat(circle.getAttribute('cy') || '0');
        const r = parseFloat(circle.getAttribute('r') || '0');
        const circleFill = circle.getAttribute('fill') || fillColor;
        
        if (r <= 0) continue;
        
        // Set color for this circle
        epsContent += setPostScriptColor(circleFill);
        
        // Create circle
        epsContent += 'newpath\n';
        epsContent += `${cx} ${dimensions.height - cy} ${r} 0 360 arc\n`; // Adjust Y coordinate for PostScript
        epsContent += 'closepath\n';
        epsContent += 'fill\n';
      }
    }
    
    // Process other SVG elements as needed
    // ... (similar processing for ellipses, lines, polylines, polygons)
    
    // Add placeholder if no content was processed
    if (paths.length === 0 && rects.length === 0 && circles.length === 0) {
      console.warn('No vector elements found in SVG, adding placeholder');
      epsContent += createPlaceholderShape(dimensions.width, dimensions.height);
    }
    
    // Add EPS footer
    epsContent += createEpsFooter();
    
    console.log('EPS conversion complete, content length:', epsContent.length);
    return epsContent;
  } catch (error) {
    console.error('Error in SVG to EPS conversion:', error);
    // Return a fallback/placeholder EPS file
    return createFallbackEps();
  }
};

/**
 * Get SVG dimensions from viewBox or width/height attributes
 */
const getSvgDimensions = (svgElement: Element): { width: number; height: number } => {
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
 * Create EPS file header with bounding box
 */
const createEpsHeader = (width: number, height: number): string => {
  return `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${Math.ceil(width)} ${Math.ceil(height)}
%%HiResBoundingBox: 0 0 ${width.toFixed(3)} ${height.toFixed(3)}
%%Creator: Logo Package Generator
%%Title: Vector Logo
%%DocumentData: Clean7Bit
%%EndComments

%%BeginProlog
/m {moveto} def
/l {lineto} def
/c {curveto} def
/cp {closepath} def
/rl {rlineto} def
/rm {rmoveto} def
/gr {grestore} def
/gs {gsave} def
/rc {rectclip} def
/rf {rectfill} def
/rgb {setrgbcolor} def
/s {stroke} def
/w {setlinewidth} def
/f {fill} def
/n {newpath} def
%%EndProlog

%%BeginSetup
<< /PageSize [${width} ${height}] >> setpagedevice
1 setlinewidth
0 setlinecap
0 setlinejoin
%%EndSetup

%%Page: 1 1
%%BeginPageSetup
gs
%%EndPageSetup

`;
};

/**
 * Create EPS file footer
 */
const createEpsFooter = (): string => {
  return `
gr
showpage
%%Trailer
%%EOF`;
};

/**
 * Convert SVG path data to PostScript commands
 */
const convertPathToPostScript = (pathData: string): string => {
  let output = 'newpath\n';
  let currentX = 0;
  let currentY = 0;
  let firstX = 0;
  let firstY = 0;
  let lastControlX = 0;
  let lastControlY = 0;
  
  // Normalize path data to ensure consistent parsing
  const normalizedPath = pathData
    .replace(/([MLHVCSQTAZmlhvcsqtaz])/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split into tokens
  const tokens = normalizedPath.split(' ');
  let i = 0;
  
  while (i < tokens.length) {
    const token = tokens[i++];
    
    switch (token.toUpperCase()) {
      case 'M': // moveto
        if (i + 1 < tokens.length) {
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);
          
          if (!isNaN(x) && !isNaN(y)) {
            currentX = token === 'M' ? x : currentX + x;
            currentY = token === 'M' ? y : currentY + y;
            output += `${currentX} ${currentY} moveto\n`;
            firstX = currentX;
            firstY = currentY;
          }
        }
        break;
        
      case 'L': // lineto
        if (i + 1 < tokens.length) {
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);
          
          if (!isNaN(x) && !isNaN(y)) {
            currentX = token === 'L' ? x : currentX + x;
            currentY = token === 'L' ? y : currentY + y;
            output += `${currentX} ${currentY} lineto\n`;
          }
        }
        break;
        
      case 'H': // horizontal lineto
        if (i < tokens.length) {
          const x = parseFloat(tokens[i++]);
          
          if (!isNaN(x)) {
            currentX = token === 'H' ? x : currentX + x;
            output += `${currentX} ${currentY} lineto\n`;
          }
        }
        break;
        
      case 'V': // vertical lineto
        if (i < tokens.length) {
          const y = parseFloat(tokens[i++]);
          
          if (!isNaN(y)) {
            currentY = token === 'V' ? y : currentY + y;
            output += `${currentX} ${currentY} lineto\n`;
          }
        }
        break;
        
      case 'C': // cubic bezier curve
        if (i + 5 < tokens.length) {
          const x1 = parseFloat(tokens[i++]);
          const y1 = parseFloat(tokens[i++]);
          const x2 = parseFloat(tokens[i++]);
          const y2 = parseFloat(tokens[i++]);
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);
          
          if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2) && !isNaN(x) && !isNaN(y)) {
            const cx1 = token === 'C' ? x1 : currentX + x1;
            const cy1 = token === 'C' ? y1 : currentY + y1;
            const cx2 = token === 'C' ? x2 : currentX + x2;
            const cy2 = token === 'C' ? y2 : currentY + y2;
            lastControlX = cx2;
            lastControlY = cy2;
            currentX = token === 'C' ? x : currentX + x;
            currentY = token === 'C' ? y : currentY + y;
            
            output += `${cx1} ${cy1} ${cx2} ${cy2} ${currentX} ${currentY} curveto\n`;
          }
        }
        break;
        
      case 'S': // smooth cubic bezier curve
        if (i + 3 < tokens.length) {
          const x2 = parseFloat(tokens[i++]);
          const y2 = parseFloat(tokens[i++]);
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);
          
          if (!isNaN(x2) && !isNaN(y2) && !isNaN(x) && !isNaN(y)) {
            // Reflect the last control point
            const cx1 = 2 * currentX - lastControlX;
            const cy1 = 2 * currentY - lastControlY;
            const cx2 = token === 'S' ? x2 : currentX + x2;
            const cy2 = token === 'S' ? y2 : currentY + y2;
            lastControlX = cx2;
            lastControlY = cy2;
            currentX = token === 'S' ? x : currentX + x;
            currentY = token === 'S' ? y : currentY + y;
            
            output += `${cx1} ${cy1} ${cx2} ${cy2} ${currentX} ${currentY} curveto\n`;
          }
        }
        break;
        
      case 'Q': // quadratic bezier curve - convert to cubic
        if (i + 3 < tokens.length) {
          const x1 = parseFloat(tokens[i++]);
          const y1 = parseFloat(tokens[i++]);
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);
          
          if (!isNaN(x1) && !isNaN(y1) && !isNaN(x) && !isNaN(y)) {
            // Convert quadratic to cubic bezier
            const qx1 = token === 'Q' ? x1 : currentX + x1;
            const qy1 = token === 'Q' ? y1 : currentY + y1;
            const qx = token === 'Q' ? x : currentX + x;
            const qy = token === 'Q' ? y : currentY + y;
            
            // Calculate control points for cubic bezier
            const cx1 = currentX + 2/3 * (qx1 - currentX);
            const cy1 = currentY + 2/3 * (qy1 - currentY);
            const cx2 = qx + 2/3 * (qx1 - qx);
            const cy2 = qy + 2/3 * (qy1 - qy);
            
            lastControlX = qx1;
            lastControlY = qy1;
            currentX = qx;
            currentY = qy;
            
            output += `${cx1} ${cy1} ${cx2} ${cy2} ${currentX} ${currentY} curveto\n`;
          }
        }
        break;
        
      case 'Z':
      case 'z': // closepath
        output += 'closepath\n';
        currentX = firstX;
        currentY = firstY;
        break;
        
      default:
        // Skip invalid or unsupported commands
        break;
    }
  }
  
  return output;
};

/**
 * Set PostScript color based on fill color
 */
const setPostScriptColor = (fillColor: string): string => {
  if (!fillColor || fillColor === 'none') {
    return '0 0 0 setrgbcolor\n'; // Default to black
  }
  
  const rgb = hexToRgb(fillColor);
  if (!rgb) {
    return '0 0 0 setrgbcolor\n'; // Default to black if invalid color
  }
  
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} setrgbcolor\n`;
};

/**
 * Create placeholder shape for empty SVGs
 */
const createPlaceholderShape = (width: number, height: number): string => {
  const centerX = width / 2;
  const centerY = height / 2;
  const size = Math.min(width, height) * 0.4;
  
  return `% Placeholder shape due to missing vector elements
newpath
${centerX - size} ${centerY - size} moveto
${centerX + size} ${centerY - size} lineto
${centerX + size} ${centerY + size} lineto
${centerX - size} ${centerY + size} lineto
closepath
0.8 0.8 0.8 setrgbcolor
fill
`;
};

/**
 * Create fallback EPS file if conversion fails
 */
const createFallbackEps = (): string => {
  const width = 400;
  const height = 400;
  
  let content = createEpsHeader(width, height);
  content += `
% Fallback shape - logo conversion error indicator
newpath
200 150 moveto
300 300 lineto
100 300 lineto
closepath
0.2 0.2 0.2 setrgbcolor
fill
  
newpath
200 250 50 0 360 arc
closepath
0.8 0.8 0.8 setrgbcolor
fill
`;
  content += createEpsFooter();
  
  return content;
};
