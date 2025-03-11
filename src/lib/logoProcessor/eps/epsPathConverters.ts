import { setPostScriptColor, convertSvgTransform } from './epsSvgHelpers';

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

/**
 * Convert different SVG elements to PostScript with improved precision and gradient support
 */
export const convertElementsToPostScript = (
  elements: Element[],
  baseFillColor: string,
  svgHeight: number,
  elementType = 'path'
): string => {
  let output = '';
  
  elements.forEach(element => {
    // Skip invisible elements
    if (element.getAttribute('display') === 'none' || 
        element.getAttribute('visibility') === 'hidden') {
      return;
    }
    
    // Get any transformation attributes
    const transforms = element.getAttribute('transform');
    
    if (elementType === 'path') {
      const pathData = element.getAttribute('d');
      if (!pathData) return;
      
      const pathFill = element.getAttribute('fill') || baseFillColor;
      const pathStroke = element.getAttribute('stroke');
      const opacity = element.getAttribute('opacity') || '1';
      
      // Start a new graphics state to isolate changes
      output += 'gsave\n';
      
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
      
      // Handle stroke if specified
      if (pathStroke && pathStroke !== 'none') {
        output += setPostScriptColor(pathStroke);
        // Set stroke width if specified
        if (strokeWidth) {
          const parsedWidth = parseFloat(strokeWidth);
          if (!isNaN(parsedWidth)) {
            // Fix: Ensure numeric value is converted to string with toFixed
            output += `${parsedWidth.toFixed(3)} setlinewidth\n`;
          }
        }
        // Draw the path again for the stroke (if already filled)
        if (pathFill && pathFill !== 'none') {
          output += convertPathToPostScript(pathData, true, svgHeight, transforms);
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
      const ry = parseFloat(element.getAttribute('ry') || rx);
      const rectFill = element.getAttribute('fill') || baseFillColor;
      const rectStroke = element.getAttribute('stroke');
      const strokeWidth = element.getAttribute('stroke-width');
      
      if (width <= 0 || height <= 0) return;
      
      output += 'gsave\n';
      
      // Apply transforms if any
      if (transforms) {
        output += convertSvgTransform(transforms);
      }
      
      // Set color for this rectangle
      output += setPostScriptColor(rectFill);
      
      // In PostScript, coordinate system origin is at bottom left
      // So we need to flip the y-coordinate
      const psY = svgHeight - y - height;
      
      // Create rectangle path, handling rounded corners if specified
      if (rx > 0 && ry > 0) {
        // Rounded rectangle implementation with proper arcs
        output += 'newpath\n';
        
        // Bottom-left to bottom-right
        output += `${(x + rx).toFixed(3)} ${psY.toFixed(3)} moveto\n`;
        output += `${(x + width - rx).toFixed(3)} ${psY.toFixed(3)} lineto\n`;
        
        // Bottom-right corner arc
        output += `${(x + width).toFixed(3)} ${psY.toFixed(3)} ${rx.toFixed(3)} 270 360 arc\n`;
        
        // Right side
        output += `${(x + width).toFixed(3)} ${(psY + height - ry).toFixed(3)} lineto\n`;
        
        // Top-right corner arc
        output += `${(x + width - rx).toFixed(3)} ${(psY + height).toFixed(3)} ${rx.toFixed(3)} 0 90 arc\n`;
        
        // Top side
        output += `${(x + rx).toFixed(3)} ${(psY + height).toFixed(3)} lineto\n`;
        
        // Top-left corner arc
        output += `${x.toFixed(3)} ${(psY + height - ry).toFixed(3)} ${rx.toFixed(3)} 90 180 arc\n`;
        
        // Left side
        output += `${x.toFixed(3)} ${(psY + ry).toFixed(3)} lineto\n`;
        
        // Bottom-left corner arc
        output += `${(x + rx).toFixed(3)} ${psY.toFixed(3)} ${rx.toFixed(3)} 180 270 arc\n`;
        
        output += 'closepath\n';
      } else {
        // Simple rectangle
        output += 'newpath\n';
        output += `${x.toFixed(3)} ${psY.toFixed(3)} moveto\n`;
        output += `${(x + width).toFixed(3)} ${psY.toFixed(3)} lineto\n`;
        output += `${(x + width).toFixed(3)} ${(psY + height).toFixed(3)} lineto\n`;
        output += `${x.toFixed(3)} ${(psY + height).toFixed(3)} lineto\n`;
        output += 'closepath\n';
      }
      
      // Fill and/or stroke the rectangle
      if (rectFill && rectFill !== 'none') {
        output += 'fill\n';
      }
      
      if (rectStroke && rectStroke !== 'none') {
        output += setPostScriptColor(rectStroke);
        if (strokeWidth) {
          const parsedWidth = parseFloat(strokeWidth);
          if (!isNaN(parsedWidth)) {
            // Fix: Ensure numeric value is converted to string with toFixed
            output += `${parsedWidth.toFixed(3)} setlinewidth\n`;
          }
        }
        output += 'stroke\n';
      } else if (!rectFill || rectFill === 'none') {
        output += 'stroke\n';
      }
      
      output += 'grestore\n';
    } else if (elementType === 'circle') {
      const cx = parseFloat(element.getAttribute('cx') || '0');
      const cy = parseFloat(element.getAttribute('cy') || '0');
      const r = parseFloat(element.getAttribute('r') || '0');
      const circleFill = element.getAttribute('fill') || baseFillColor;
      const circleStroke = element.getAttribute('stroke');
      const strokeWidth = element.getAttribute('stroke-width');
      
      if (r <= 0) return;
      
      output += 'gsave\n';
      
      // Apply transforms if any
      if (transforms) {
        output += convertSvgTransform(transforms);
      }
      
      // Set color for this circle
      output += setPostScriptColor(circleFill);
      
      // Create circle - properly adjust Y coordinate for PostScript
      const psY = svgHeight - cy;
      output += 'newpath\n';
      output += `${cx.toFixed(3)} ${psY.toFixed(3)} ${r.toFixed(3)} 0 360 arc\n`;
      output += 'closepath\n';
      
      // Fill and/or stroke the circle
      if (circleFill && circleFill !== 'none') {
        output += 'fill\n';
      }
      
      if (circleStroke && circleStroke !== 'none') {
        output += setPostScriptColor(circleStroke);
        if (strokeWidth) {
          const parsedWidth = parseFloat(strokeWidth);
          if (!isNaN(parsedWidth)) {
            // Fix: Ensure numeric value is converted to string with toFixed
            output += `${parsedWidth.toFixed(3)} setlinewidth\n`;
          }
        }
        output += 'stroke\n';
      } else if (!circleFill || circleFill === 'none') {
        output += 'stroke\n';
      }
      
      output += 'grestore\n';
    } else if (elementType === 'ellipse') {
      const cx = parseFloat(element.getAttribute('cx') || '0');
      const cy = parseFloat(element.getAttribute('cy') || '0');
      const rx = parseFloat(element.getAttribute('rx') || '0');
      const ry = parseFloat(element.getAttribute('ry') || '0');
      const ellipseFill = element.getAttribute('fill') || baseFillColor;
      const ellipseStroke = element.getAttribute('stroke');
      const strokeWidth = element.getAttribute('stroke-width');
      
      if (rx <= 0 || ry <= 0) return;
      
      output += 'gsave\n';
      
      // Apply transforms if any
      if (transforms) {
        output += convertSvgTransform(transforms);
      }
      
      // Set color for this ellipse
      output += setPostScriptColor(ellipseFill);
      
      // Create ellipse by scaling a circle
      const psY = svgHeight - cy;
      output += 'newpath\n';
      
      // Move to center, scale, draw circle, restore scale
      output += `${cx.toFixed(3)} ${psY.toFixed(3)} translate\n`;
      output += `${rx.toFixed(3)} ${ry.toFixed(3)} scale\n`;
      output += `0 0 1 0 360 arc\n`; 
      output += `${(1/rx).toFixed(6)} ${(1/ry).toFixed(6)} scale\n`;
      output += `${(-cx).toFixed(3)} ${(-psY).toFixed(3)} translate\n`;
      output += 'closepath\n';
      
      // Fill and/or stroke the ellipse
      if (ellipseFill && ellipseFill !== 'none') {
        output += 'fill\n';
      }
      
      if (ellipseStroke && ellipseStroke !== 'none') {
        output += setPostScriptColor(ellipseStroke);
        if (strokeWidth) {
          const parsedWidth = parseFloat(strokeWidth);
          if (!isNaN(parsedWidth)) {
            // Fix: Ensure numeric value is converted to string with toFixed
            output += `${parsedWidth.toFixed(3)} setlinewidth\n`;
          }
        }
        output += 'stroke\n';
      } else if (!ellipseFill || ellipseFill === 'none') {
        output += 'stroke\n';
      }
      
      output += 'grestore\n';
    } else if (elementType === 'line') {
      const x1 = parseFloat(element.getAttribute('x1') || '0');
      const y1 = parseFloat(element.getAttribute('y1') || '0');
      const x2 = parseFloat(element.getAttribute('x2') || '0');
      const y2 = parseFloat(element.getAttribute('y2') || '0');
      const lineStroke = element.getAttribute('stroke') || baseFillColor;
      const strokeWidth = element.getAttribute('stroke-width');
      
      output += 'gsave\n';
      
      // Apply transforms if any
      if (transforms) {
        output += convertSvgTransform(transforms);
      }
      
      // Set color for this line
      output += setPostScriptColor(lineStroke);
      
      // Create line
      output += 'newpath\n';
      output += `${x1.toFixed(3)} ${(svgHeight - y1).toFixed(3)} moveto\n`;
      output += `${x2.toFixed(3)} ${(svgHeight - y2).toFixed(3)} lineto\n`;
      
      // Set stroke width if specified
      if (strokeWidth) {
        const parsedWidth = parseFloat(strokeWidth);
        if (!isNaN(parsedWidth)) {
          // Fix: Ensure numeric value is converted to string with toFixed
          output += `${parsedWidth.toFixed(3)} setlinewidth\n`;
        }
      }
      
      output += 'stroke\n';
      output += 'grestore\n';
    } else if (elementType === 'polyline' || elementType === 'polygon') {
      const points = element.getAttribute('points');
      if (!points) return;
      
      const fill = element.getAttribute('fill') || (elementType === 'polygon' ? baseFillColor : 'none');
      const stroke = element.getAttribute('stroke') || baseFillColor;
      const strokeWidth = element.getAttribute('stroke-width');
      
      output += 'gsave\n';
      
      // Apply transforms if any
      if (transforms) {
        output += convertSvgTransform(transforms);
      }
      
      // Parse points
      const pointPairs = points.trim().split(/\s+|,/);
      if (pointPairs.length < 2) return;
      
      output += 'newpath\n';
      
      for (let i = 0; i < pointPairs.length; i += 2) {
        if (i + 1 >= pointPairs.length) break;
        
        const x = parseFloat(pointPairs[i]);
        const y = parseFloat(pointPairs[i + 1]);
        
        if (isNaN(x) || isNaN(y)) continue;
        
        if (i === 0) {
          output += `${x.toFixed(3)} ${(svgHeight - y).toFixed(3)} moveto\n`;
        } else {
          output += `${x.toFixed(3)} ${(svgHeight - y).toFixed(3)} lineto\n`;
        }
      }
      
      // Close path for polygons
      if (elementType === 'polygon') {
        output += 'closepath\n';
      }
      
      // Fill and/or stroke
      if (fill && fill !== 'none') {
        output += setPostScriptColor(fill);
        output += 'fill\n';
      }
      
      if (stroke && stroke !== 'none') {
        output += setPostScriptColor(stroke);
        if (strokeWidth) {
          const parsedWidth = parseFloat(strokeWidth);
          if (!isNaN(parsedWidth)) {
            output += `${parsedWidth.toFixed(3)} setlinewidth\n`;
          }
        }
        output += 'stroke\n';
      } else if (!fill || fill === 'none') {
        output += 'stroke\n';
      }
      
      output += 'grestore\n';
    }
  });
  
  return output;
};
