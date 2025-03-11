
import { hexToRgb } from './colorUtils';

// Process other SVG elements
export function processOtherSvgElements(svgDoc: Document): string {
  let result = "";
  
  // Handle rectangles
  const rects = svgDoc.querySelectorAll("rect");
  console.log(`Found ${rects.length} rectangles in SVG`);
  
  rects.forEach((rect, index) => {
    const x = parseFloat(rect.getAttribute("x") || "0");
    const y = parseFloat(rect.getAttribute("y") || "0");
    const width = parseFloat(rect.getAttribute("width") || "0");
    const height = parseFloat(rect.getAttribute("height") || "0");
    const fillColor = rect.getAttribute("fill") || "#000000";
    
    if (width > 0 && height > 0) {
      const rgbFill = hexToRgb(fillColor);
      
      result += `% Rectangle ${index + 1}\n`;
      if (rgbFill && fillColor !== "none") {
        result += `${rgbFill.r / 255} ${rgbFill.g / 255} ${rgbFill.b / 255} rgb\n`;
      }
      
      result += `n\n${x} ${y} m\n`;
      result += `${x + width} ${y} l\n`;
      result += `${x + width} ${y + height} l\n`;
      result += `${x} ${y + height} l\n`;
      result += `cp\n`;
      
      if (fillColor && fillColor !== "none") {
        result += `f\n`;
      } else {
        result += `s\n`;
      }
    }
  });
  
  // Handle circles
  const circles = svgDoc.querySelectorAll("circle");
  console.log(`Found ${circles.length} circles in SVG`);
  
  circles.forEach((circle, index) => {
    const cx = parseFloat(circle.getAttribute("cx") || "0");
    const cy = parseFloat(circle.getAttribute("cy") || "0");
    const r = parseFloat(circle.getAttribute("r") || "0");
    const fillColor = circle.getAttribute("fill") || "#000000";
    
    if (r > 0) {
      const rgbFill = hexToRgb(fillColor);
      
      result += `% Circle ${index + 1}\n`;
      if (rgbFill && fillColor !== "none") {
        result += `${rgbFill.r / 255} ${rgbFill.g / 255} ${rgbFill.b / 255} rgb\n`;
      }
      
      result += `n\n${cx} ${cy} ${r} 0 360 arc\ncp\n`;
      
      if (fillColor && fillColor !== "none") {
        result += `f\n`;
      } else {
        result += `s\n`;
      }
    }
  });
  
  // If we still don't have any content, return an empty string
  // A fallback shape will be added later
  if (rects.length === 0 && circles.length === 0) {
    console.warn("No rectangles or circles found in SVG");
  }
  
  return result;
}

// Convert SVG path commands to PostScript commands
export function convertSVGPathToPostScript(d: string): string {
  let result = "";
  
  // Normalize path data
  const normalizedPath = d
    .replace(/([MLHVCSQTAZmlhvcsqtaz])/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const tokens = normalizedPath.split(' ');
  let currentX = 0;
  let currentY = 0;
  let firstX = 0;
  let firstY = 0;
  let i = 0;
  
  while (i < tokens.length) {
    const token = tokens[i];
    
    if (/[MLHVCSQTAZmlhvcsqtaz]/.test(token)) {
      const command = token;
      i++;
      
      switch (command.toUpperCase()) {
        case 'M': // moveto
          if (i + 1 < tokens.length) {
            const x = parseFloat(tokens[i++]);
            const y = parseFloat(tokens[i++]);
            
            if (!isNaN(x) && !isNaN(y)) {
              currentX = command === 'M' ? x : currentX + x;
              currentY = command === 'M' ? y : currentY + y;
              result += `${currentX} ${currentY} m\n`;
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
              currentX = command === 'L' ? x : currentX + x;
              currentY = command === 'L' ? y : currentY + y;
              result += `${currentX} ${currentY} l\n`;
            }
          }
          break;
          
        case 'C': // curveto
          if (i + 5 < tokens.length) {
            const x1 = parseFloat(tokens[i++]);
            const y1 = parseFloat(tokens[i++]);
            const x2 = parseFloat(tokens[i++]);
            const y2 = parseFloat(tokens[i++]);
            const x = parseFloat(tokens[i++]);
            const y = parseFloat(tokens[i++]);
            
            if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2) && !isNaN(x) && !isNaN(y)) {
              const cx1 = command === 'C' ? x1 : currentX + x1;
              const cy1 = command === 'C' ? y1 : currentY + y1;
              const cx2 = command === 'C' ? x2 : currentX + x2;
              const cy2 = command === 'C' ? y2 : currentY + y2;
              currentX = command === 'C' ? x : currentX + x;
              currentY = command === 'C' ? y : currentY + y;
              
              result += `${cx1} ${cy1} ${cx2} ${cy2} ${currentX} ${currentY} c\n`;
            }
          }
          break;
          
        case 'Z': // closepath
          result += `cp\n`;
          currentX = firstX;
          currentY = firstY;
          break;
          
        default:
          // Skip unsupported commands for now
          i++;
          break;
      }
    } else {
      i++;
    }
  }
  
  return result;
}

// Add new helper to format PostScript color commands
export function getPostScriptColor(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return '0 0 0'; // Default to black if invalid color
  return `${(rgb.r / 255).toFixed(3)} ${(rgb.g / 255).toFixed(3)} ${(rgb.b / 255).toFixed(3)}`;
}
