
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

// Add new helper to format PostScript color commands
export function getPostScriptColor(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return '0 0 0'; // Default to black if invalid color
  return `${(rgb.r / 255).toFixed(3)} ${(rgb.g / 255).toFixed(3)} ${(rgb.b / 255).toFixed(3)}`;
}
