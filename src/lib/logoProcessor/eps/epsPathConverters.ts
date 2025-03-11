
import { setPostScriptColor } from './epsFormatters';

/**
 * Convert SVG path data to PostScript commands
 */
export const convertPathToPostScript = (pathData: string): string => {
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
 * Convert different SVG elements to PostScript
 */
export const convertElementsToPostScript = (
  elements: Element[],
  baseFillColor: string,
  svgHeight: number,
  elementType = 'path'
): string => {
  let output = '';
  
  elements.forEach(element => {
    if (elementType === 'path') {
      const pathData = element.getAttribute('d');
      if (!pathData) return;
      
      const pathFill = element.getAttribute('fill') || baseFillColor;
      const pathStroke = element.getAttribute('stroke');
      const strokeWidth = element.getAttribute('stroke-width');
      
      // Set color for this path
      output += setPostScriptColor(pathFill);
      
      // Convert path to PostScript commands
      output += convertPathToPostScript(pathData);
      
      // Apply fill or stroke
      if (pathFill && pathFill !== 'none') {
        output += 'fill\n';
      } else if (pathStroke && pathStroke !== 'none') {
        // Set stroke width if specified
        if (strokeWidth) {
          output += `${parseFloat(strokeWidth) || 1} setlinewidth\n`;
        }
        output += 'stroke\n';
      } else {
        // Default to fill if neither is specified
        output += 'fill\n';
      }
    } else if (elementType === 'rect') {
      const x = parseFloat(element.getAttribute('x') || '0');
      const y = parseFloat(element.getAttribute('y') || '0');
      const width = parseFloat(element.getAttribute('width') || '0');
      const height = parseFloat(element.getAttribute('height') || '0');
      const rectFill = element.getAttribute('fill') || baseFillColor;
      
      if (width <= 0 || height <= 0) return;
      
      // Set color for this rectangle
      output += setPostScriptColor(rectFill);
      
      // Create rectangle path - adjust Y coordinate for PostScript
      output += 'newpath\n';
      output += `${x} ${svgHeight - y - height} moveto\n`;
      output += `${width} 0 rlineto\n`;
      output += `0 ${height} rlineto\n`;
      output += `${-width} 0 rlineto\n`;
      output += 'closepath\n';
      output += 'fill\n';
    } else if (elementType === 'circle') {
      const cx = parseFloat(element.getAttribute('cx') || '0');
      const cy = parseFloat(element.getAttribute('cy') || '0');
      const r = parseFloat(element.getAttribute('r') || '0');
      const circleFill = element.getAttribute('fill') || baseFillColor;
      
      if (r <= 0) return;
      
      // Set color for this circle
      output += setPostScriptColor(circleFill);
      
      // Create circle - adjust Y coordinate for PostScript
      output += 'newpath\n';
      output += `${cx} ${svgHeight - cy} ${r} 0 360 arc\n`;
      output += 'closepath\n';
      output += 'fill\n';
    }
    // Additional element types could be added here (ellipses, polylines, etc.)
  });
  
  return output;
};
