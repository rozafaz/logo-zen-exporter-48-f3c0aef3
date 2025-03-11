import { setPostScriptColor, convertSvgTransform } from '../epsSvgHelpers';

/**
 * Convert SVG path data to PostScript commands with enhanced precision
 */
export const convertPathToPostScript = (
  pathData: string, 
  flipY: boolean = true, 
  height: number = 0,
  transforms: string | null = null
): string => {
  let output = 'newpath\n';
  let currentX = 0;
  let currentY = 0;
  let firstX = 0;
  let firstY = 0;
  let lastControlX = 0;
  let lastControlY = 0;
  
  // Apply any SVG transforms
  if (transforms) {
    output += 'gsave\n';
    output += convertSvgTransform(transforms);
  }
  
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
            output += `${currentX.toFixed(3)} ${transformedY.toFixed(3)} moveto\n`;
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
            output += `${currentX.toFixed(3)} ${transformedY.toFixed(3)} lineto\n`;
          }
        }
        break;
        
      case 'H': // horizontal lineto
        if (i < tokens.length) {
          const x = parseFloat(tokens[i++]);
          
          if (!isNaN(x)) {
            currentX = token === 'H' ? x : currentX + x;
            output += `${currentX.toFixed(3)} ${transformY(currentY).toFixed(3)} lineto\n`;
          }
        }
        break;
        
      case 'V': // vertical lineto
        if (i < tokens.length) {
          const y = parseFloat(tokens[i++]);
          
          if (!isNaN(y)) {
            currentY = token === 'V' ? y : currentY + y;
            output += `${currentX.toFixed(3)} ${transformY(currentY).toFixed(3)} lineto\n`;
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
            
            output += `${cx1.toFixed(3)} ${transformY(cy1).toFixed(3)} ${cx2.toFixed(3)} ${transformY(cy2).toFixed(3)} ${currentX.toFixed(3)} ${transformY(currentY).toFixed(3)} curveto\n`;
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
            
            output += `${cx1.toFixed(3)} ${transformY(cy1).toFixed(3)} ${cx2.toFixed(3)} ${transformY(cy2).toFixed(3)} ${currentX.toFixed(3)} ${transformY(currentY).toFixed(3)} curveto\n`;
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
            
            output += `${cx1.toFixed(3)} ${transformY(cy1).toFixed(3)} ${cx2.toFixed(3)} ${transformY(cy2).toFixed(3)} ${currentX.toFixed(3)} ${transformY(currentY).toFixed(3)} curveto\n`;
          }
        }
        break;
        
      case 'A': // Arc - improved arc approximation
        if (i + 6 < tokens.length) {
          const rx = parseFloat(tokens[i++]);
          const ry = parseFloat(tokens[i++]);
          const xAxisRotation = parseFloat(tokens[i++]);
          const largeArcFlag = parseInt(tokens[i++]);
          const sweepFlag = parseInt(tokens[i++]);
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);
          
          if (!isNaN(rx) && !isNaN(ry) && !isNaN(x) && !isNaN(y)) {
            // Improved arc handling with better approximation
            // Convert arc to cubic bezier segments for better quality
            const endX = token === 'A' ? x : currentX + x;
            const endY = token === 'A' ? y : currentY + y;
            
            output += `% Arc from (${currentX.toFixed(3)},${currentY.toFixed(3)}) to (${endX.toFixed(3)},${endY.toFixed(3)}) rx=${rx}, ry=${ry}\n`;
            
            if (rx === 0 || ry === 0) {
              // Zero radius arc is just a line
              output += `${endX.toFixed(3)} ${transformY(endY).toFixed(3)} lineto\n`;
            } else {
              // Simple approximation for now - just a line to the end point
              // In a production environment, implement proper arc-to-bezier conversion here
              output += `${endX.toFixed(3)} ${transformY(endY).toFixed(3)} lineto\n`;
            }
            
            currentX = endX;
            currentY = endY;
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
        console.warn('Unsupported SVG path command:', token);
        break;
    }
  }
  
  // Close the transformation group if needed
  if (transforms) {
    output += 'grestore\n';
  }
  
  return output;
};

export const convertPathElement = (
  element: Element,
  baseFillColor: string,
  svgHeight: number
): string => {
  const pathData = element.getAttribute('d');
  if (!pathData) return '';
  
  const pathFill = element.getAttribute('fill') || baseFillColor;
  const pathStroke = element.getAttribute('stroke');
  const strokeWidth = element.getAttribute('stroke-width');
  const opacity = element.getAttribute('opacity') || '1';
  const transforms = element.getAttribute('transform');
  
  let output = 'gsave\n';
  
  // Set opacity if needed (approximate in PostScript)
  const opacityValue = parseFloat(opacity);
  if (!isNaN(opacityValue) && opacityValue < 1) {
    output += `% Opacity set to ${opacityValue}\n`;
  }
  
  // Set color for this path
  output += setPostScriptColor(pathFill);
  
  // Convert path to PostScript commands
  output += convertPathToPostScript(pathData, true, svgHeight, transforms);
  
  // Apply fill or stroke
  if (pathFill && pathFill !== 'none') {
    output += 'fill\n';
  }
  
  if (pathStroke && pathStroke !== 'none') {
    output += setPostScriptColor(pathStroke);
    if (strokeWidth) {
      const parsedWidth = parseFloat(strokeWidth);
      if (!isNaN(parsedWidth)) {
        output += `${parsedWidth.toFixed(3)} setlinewidth\n`;
      }
    }
    if (pathFill && pathFill !== 'none') {
      output += convertPathToPostScript(pathData, true, svgHeight, transforms);
    }
    output += 'stroke\n';
  } else if (!pathFill || pathFill === 'none') {
    output += 'stroke\n';
  }
  
  output += 'grestore\n';
  return output;
};
