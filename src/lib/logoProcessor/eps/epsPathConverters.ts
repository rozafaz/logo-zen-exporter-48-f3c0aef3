
import { setPostScriptColor } from './epsSvgHelpers';

/**
 * Convert SVG path data to PostScript commands
 */
export const convertPathToPostScript = (pathData: string, flipY: boolean = true, height: number = 0): string => {
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
    .replace(/[-]/g, ' -')  // Ensure negative numbers are properly spaced
    .replace(/[,]/g, ' ')   // Replace commas with spaces
    .replace(/\s+/g, ' ')   // Normalize whitespace
    .trim();
  
  // Split into tokens
  const tokens = normalizedPath.split(' ');
  let i = 0;
  
  const transformY = (y: number): number => {
    return flipY ? height - y : y;
  };
  
  while (i < tokens.length) {
    const token = tokens[i++];
    if (!token || token === '') continue;
    
    switch (token.toUpperCase()) {
      case 'M': // moveto
        if (i + 1 < tokens.length) {
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);
          
          if (!isNaN(x) && !isNaN(y)) {
            currentX = token === 'M' ? x : currentX + x;
            currentY = token === 'M' ? y : currentY + y;
            const transformedY = transformY(currentY);
            output += `${currentX.toString()} ${transformedY.toString()} moveto\n`;
            firstX = currentX;
            firstY = transformedY;
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
            const transformedY = transformY(currentY);
            output += `${currentX.toString()} ${transformedY.toString()} lineto\n`;
          }
        }
        break;
        
      case 'H': // horizontal lineto
        if (i < tokens.length) {
          const x = parseFloat(tokens[i++]);
          
          if (!isNaN(x)) {
            currentX = token === 'H' ? x : currentX + x;
            output += `${currentX.toString()} ${transformY(currentY).toString()} lineto\n`;
          }
        }
        break;
        
      case 'V': // vertical lineto
        if (i < tokens.length) {
          const y = parseFloat(tokens[i++]);
          
          if (!isNaN(y)) {
            currentY = token === 'V' ? y : currentY + y;
            output += `${currentX.toString()} ${transformY(currentY).toString()} lineto\n`;
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
            
            output += `${cx1.toString()} ${transformY(cy1).toString()} ${cx2.toString()} ${transformY(cy2).toString()} ${currentX.toString()} ${transformY(currentY).toString()} curveto\n`;
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
            
            output += `${cx1.toString()} ${transformY(cy1).toString()} ${cx2.toString()} ${transformY(cy2).toString()} ${currentX.toString()} ${transformY(currentY).toString()} curveto\n`;
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
            
            output += `${cx1.toString()} ${transformY(cy1).toString()} ${cx2.toString()} ${transformY(cy2).toString()} ${currentX.toString()} ${transformY(currentY).toString()} curveto\n`;
          }
        }
        break;
        
      case 'A': // Arc - convert to cubic bezier approximation
        console.log('Arc commands in SVG are approximated in EPS');
        // Skip the 7 parameters of the arc command
        i += 7;
        break;
        
      case 'Z':
      case 'z': // closepath
        output += 'closepath\n';
        currentX = firstX;
        currentY = firstY;
        break;
        
      default:
        // Skip invalid or unsupported commands
        console.warn('Unsupported SVG path command:', token);
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
      
      // Start a new graphics state to isolate changes
      output += 'gsave\n';
      
      // Set color for this path
      output += setPostScriptColor(pathFill);
      
      // Convert path to PostScript commands
      output += convertPathToPostScript(pathData, true, svgHeight);
      
      // Apply fill or stroke
      if (pathFill && pathFill !== 'none') {
        output += 'fill\n';
      }
      
      // Handle stroke if specified
      if (pathStroke && pathStroke !== 'none') {
        output += setPostScriptColor(pathStroke);
        // Set stroke width if specified
        if (strokeWidth) {
          output += `${parseFloat(strokeWidth).toString() || "1"} setlinewidth\n`;
        }
        // Draw the path again for the stroke (if already filled)
        if (pathFill && pathFill !== 'none') {
          output += convertPathToPostScript(pathData, true, svgHeight);
        }
        output += 'stroke\n';
      } else if (!pathFill || pathFill === 'none') {
        // Default to stroke if fill is none
        output += 'stroke\n';
      }
      
      // Restore graphics state
      output += 'grestore\n';
    } else if (elementType === 'rect') {
      const x = parseFloat(element.getAttribute('x') || '0');
      const y = parseFloat(element.getAttribute('y') || '0');
      const width = parseFloat(element.getAttribute('width') || '0');
      const height = parseFloat(element.getAttribute('height') || '0');
      const rx = parseFloat(element.getAttribute('rx') || '0');
      const ry = parseFloat(element.getAttribute('ry') || rx.toString());
      const rectFill = element.getAttribute('fill') || baseFillColor;
      
      if (width <= 0 || height <= 0) return;
      
      output += 'gsave\n';
      
      // Set color for this rectangle
      output += setPostScriptColor(rectFill);
      
      // In PostScript, coordinate system origin is at bottom left
      // So we need to flip the y-coordinate
      const psY = svgHeight - y - height;
      
      // Create rectangle path, handling rounded corners if specified
      if (rx > 0 && ry > 0) {
        // Rounded rectangle implementation (approximate with arcs)
        output += 'newpath\n';
        output += `${(x + rx).toString()} ${psY.toString()} moveto\n`;
        output += `${(x + width - rx).toString()} ${psY.toString()} lineto\n`;
        // Bottom right corner
        output += `${(x + width).toString()} ${psY.toString()} ${(x + width).toString()} ${(psY + ry).toString()} ${rx.toString()} arcto 4 {pop} repeat\n`;
        output += `${(x + width).toString()} ${(psY + height - ry).toString()} lineto\n`;
        // Top right corner
        output += `${(x + width).toString()} ${(psY + height).toString()} ${(x + width - rx).toString()} ${(psY + height).toString()} ${rx.toString()} arcto 4 {pop} repeat\n`;
        output += `${(x + rx).toString()} ${(psY + height).toString()} lineto\n`;
        // Top left corner
        output += `${x.toString()} ${(psY + height).toString()} ${x.toString()} ${(psY + height - ry).toString()} ${rx.toString()} arcto 4 {pop} repeat\n`;
        output += `${x.toString()} ${(psY + ry).toString()} lineto\n`;
        // Bottom left corner
        output += `${x.toString()} ${psY.toString()} ${(x + rx).toString()} ${psY.toString()} ${rx.toString()} arcto 4 {pop} repeat\n`;
        output += 'closepath\n';
      } else {
        // Simple rectangle
        output += 'newpath\n';
        output += `${x.toString()} ${psY.toString()} moveto\n`;
        output += `${width.toString()} 0 rlineto\n`;
        output += `0 ${height.toString()} rlineto\n`;
        output += `${(-width).toString()} 0 rlineto\n`;
        output += 'closepath\n';
      }
      
      output += 'fill\n';
      output += 'grestore\n';
    } else if (elementType === 'circle') {
      const cx = parseFloat(element.getAttribute('cx') || '0');
      const cy = parseFloat(element.getAttribute('cy') || '0');
      const r = parseFloat(element.getAttribute('r') || '0');
      const circleFill = element.getAttribute('fill') || baseFillColor;
      
      if (r <= 0) return;
      
      output += 'gsave\n';
      
      // Set color for this circle
      output += setPostScriptColor(circleFill);
      
      // Create circle - properly adjust Y coordinate for PostScript
      const psY = svgHeight - cy;
      output += 'newpath\n';
      output += `${cx.toString()} ${psY.toString()} ${r.toString()} 0 360 arc\n`;
      output += 'closepath\n';
      output += 'fill\n';
      
      output += 'grestore\n';
    } else if (elementType === 'ellipse') {
      const cx = parseFloat(element.getAttribute('cx') || '0');
      const cy = parseFloat(element.getAttribute('cy') || '0');
      const rx = parseFloat(element.getAttribute('rx') || '0');
      const ry = parseFloat(element.getAttribute('ry') || '0');
      const ellipseFill = element.getAttribute('fill') || baseFillColor;
      
      if (rx <= 0 || ry <= 0) return;
      
      output += 'gsave\n';
      
      // Set color for this ellipse
      output += setPostScriptColor(ellipseFill);
      
      // Create ellipse by scaling a circle
      const psY = svgHeight - cy;
      output += 'newpath\n';
      output += `${cx.toString()} ${psY.toString()} translate\n`;
      output += `${rx.toString()} ${ry.toString()} scale\n`;
      output += '0 0 1 0 360 arc\n';
      output += '1 1 1 setrgbcolor\n';  // Reset the scaling
      output += `${(1/rx).toString()} ${(1/ry).toString()} scale\n`;
      output += `${(-cx).toString()} ${(-psY).toString()} translate\n`;
      output += 'closepath\n';
      output += 'fill\n';
      
      output += 'grestore\n';
    }
    
    // Additional element types could be added here (polylines, etc.)
  });
  
  return output;
};
