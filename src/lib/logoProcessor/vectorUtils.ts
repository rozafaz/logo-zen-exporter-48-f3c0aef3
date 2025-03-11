import { hexToRgb } from './colorUtils';

// Helper function to convert SVG to EPS with improved vector quality
export const createEpsFromSvg = (svgString: string): Blob => {
  try {
    console.log('Creating EPS from SVG string');
    
    // Extract SVG dimensions and viewBox for proper bounding box
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.querySelector('svg');
    
    if (!svgElement) {
      throw new Error('Invalid SVG: No SVG element found');
    }
    
    // Get SVG dimensions
    let width = 1000;
    let height = 1000;
    let viewBox = '0 0 1000 1000';
    
    // Try to get dimensions from viewBox first
    const vb = svgElement.getAttribute('viewBox');
    if (vb) {
      viewBox = vb;
      const [, , w, h] = vb.split(' ').map(parseFloat);
      if (!isNaN(w) && !isNaN(h)) {
        width = w;
        height = h;
      }
    } else {
      // Try width/height attributes
      const svgWidth = svgElement.getAttribute('width');
      const svgHeight = svgElement.getAttribute('height');
      if (svgWidth && svgHeight) {
        width = parseFloat(svgWidth);
        height = parseFloat(svgHeight);
        viewBox = `0 0 ${width} ${height}`;
      }
    }
    
    // Enhanced EPS header with better DSC comments and setup
    const epsHeader = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${Math.ceil(width)} ${Math.ceil(height)}
%%HiResBoundingBox: 0 0 ${width.toFixed(6)} ${height.toFixed(6)}
%%Creator: AI Logo Package Exporter
%%Title: Vector Logo
%%CreationDate: ${new Date().toISOString()}
%%DocumentData: Clean7Bit
%%LanguageLevel: 3
%%Pages: 1
%%EndComments

%%BeginProlog
/bd { bind def } bind def
/ld { load def } bd
/GR /grestore ld
/GS /gsave ld
/RM /rmoveto ld
/TR /translate ld
/CT /curveto ld
/L /lineto ld
/M /moveto ld
/CP /closepath ld
/S /stroke ld
/F /fill ld
/RC { rectclip } bd
/RF { rectfill } bd
/RG { setrgbcolor } bd
/W { clip } bd
%%EndProlog

%%BeginSetup
<< /PageSize [${width} ${height}] >> setpagedevice
1 setlinewidth
%%EndSetup

%%Page: 1 1
%%BeginPageSetup
GS
0 0 TR
1 1 scale
%%EndPageSetup

% Initialize graphics state
0 0 0 RG % Set default color to black
1 setlinewidth
0 setlinecap
0 setlinejoin

`;

    // Convert SVG paths and shapes to EPS commands
    const epsBody = convertSVGToEPS(svgString);
    
    const epsFooter = `

% Restore graphics state
GR

showpage
%%Trailer
%%EOF`;

    const epsContent = epsHeader + epsBody + epsFooter;
    
    // Create EPS blob with PostScript MIME type
    const epsBlob = new Blob([epsContent], { 
      type: 'application/postscript'
    });
    
    console.log('EPS file created successfully, size:', epsBlob.size, 'bytes');
    return epsBlob;
  } catch (error) {
    console.error('Error creating EPS:', error);
    throw error;
  }
};

// Convert SVG to EPS with improved path handling
export function convertSVGToEPS(svgString: string): string {
  let epsData = "";
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, "image/svg+xml");

  // Check for parsing errors
  const parseError = svgDoc.querySelector("parsererror");
  if (parseError) {
    console.error("SVG parse error:", parseError.textContent);
    throw new Error("Failed to parse SVG");
  }

  // Process each path element
  const paths = svgDoc.querySelectorAll("path");
  console.log(`Found ${paths.length} paths in SVG`);
  
  paths.forEach((path, index) => {
    const d = path.getAttribute("d");
    if (d) {
      const fillColor = path.getAttribute("fill") || "#000000";
      const strokeColor = path.getAttribute("stroke");
      const strokeWidth = path.getAttribute("stroke-width") || "1";
      
      // Convert colors to PostScript RGB values
      const rgbFill = hexToRgb(fillColor);
      const rgbStroke = strokeColor ? hexToRgb(strokeColor) : null;
      
      epsData += `% Path ${index + 1}\n`;
      
      // Set fill color
      if (rgbFill && fillColor !== "none") {
        epsData += `${rgbFill.r / 255} ${rgbFill.g / 255} ${rgbFill.b / 255} setrgbcolor\n`;
      }
      
      // Begin the path
      epsData += `newpath\n`;
      
      // Convert SVG path to PostScript
      epsData += convertSVGPathToPostScript(d);
      
      // Handle fill and stroke operations
      if (strokeColor && strokeColor !== "none") {
        if (fillColor && fillColor !== "none") {
          epsData += "gsave\n";
          epsData += "fill\n";
          epsData += "grestore\n";
        }
        
        if (rgbStroke) {
          epsData += `${rgbStroke.r / 255} ${rgbStroke.g / 255} ${rgbStroke.b / 255} setrgbcolor\n`;
        }
        
        epsData += `${strokeWidth} setlinewidth\n`;
        epsData += "stroke\n";
      } else if (fillColor && fillColor !== "none") {
        epsData += "fill\n";
      } else {
        epsData += "stroke\n";
      }
    }
  });
  
  // Process rectangles if no paths found
  if (paths.length === 0) {
    console.log("Processing other SVG elements (rectangles, circles, etc.)");
    processOtherSvgElements(svgDoc, epsData);
  }
  
  // If we still don't have any content, create a simple placeholder
  if (epsData.trim() === "") {
    console.warn("No SVG elements found, creating placeholder");
    epsData += `% Placeholder shape\nnewpath\n100 100 moveto\n900 100 lineto\n900 900 lineto\n100 900 lineto\nclosepath\n0.5 setgray\nfill\n`;
  }
  
  return epsData;
}

// Process rectangles, circles, and other SVG elements
export function processOtherSvgElements(svgDoc: Document, epsData: string): string {
  let result = epsData;
  
  // Handle rectangles
  const rects = svgDoc.querySelectorAll("rect");
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
        result += `${rgbFill.r / 255} ${rgbFill.g / 255} ${rgbFill.b / 255} setrgbcolor\n`;
      }
      
      result += `newpath\n${x} ${y} moveto\n`;
      result += `${x + width} ${y} lineto\n`;
      result += `${x + width} ${y + height} lineto\n`;
      result += `${x} ${y + height} lineto\n`;
      result += `closepath\n`;
      
      if (fillColor && fillColor !== "none") {
        result += `fill\n`;
      } else {
        result += `stroke\n`;
      }
    }
  });
  
  // Handle circles
  const circles = svgDoc.querySelectorAll("circle");
  circles.forEach((circle, index) => {
    const cx = parseFloat(circle.getAttribute("cx") || "0");
    const cy = parseFloat(circle.getAttribute("cy") || "0");
    const r = parseFloat(circle.getAttribute("r") || "0");
    const fillColor = circle.getAttribute("fill") || "#000000";
    
    if (r > 0) {
      const rgbFill = hexToRgb(fillColor);
      
      result += `% Circle ${index + 1}\n`;
      if (rgbFill && fillColor !== "none") {
        result += `${rgbFill.r / 255} ${rgbFill.g / 255} ${rgbFill.b / 255} setrgbcolor\n`;
      }
      
      result += `newpath\n${cx} ${cy} ${r} 0 360 arc\nclosepath\n`;
      
      if (fillColor && fillColor !== "none") {
        result += `fill\n`;
      } else {
        result += `stroke\n`;
      }
    }
  });
  
  // Handle ellipses
  const ellipses = svgDoc.querySelectorAll("ellipse");
  ellipses.forEach((ellipse, index) => {
    const cx = parseFloat(ellipse.getAttribute("cx") || "0");
    const cy = parseFloat(ellipse.getAttribute("cy") || "0");
    const rx = parseFloat(ellipse.getAttribute("rx") || "0");
    const ry = parseFloat(ellipse.getAttribute("ry") || "0");
    const fillColor = ellipse.getAttribute("fill") || "#000000";
    
    if (rx > 0 && ry > 0) {
      const rgbFill = hexToRgb(fillColor);
      
      result += `% Ellipse ${index + 1}\n`;
      if (rgbFill && fillColor !== "none") {
        result += `${rgbFill.r / 255} ${rgbFill.g / 255} ${rgbFill.b / 255} setrgbcolor\n`;
      }
      
      // Approximate ellipse with Bezier curves
      result += `newpath\n`;
      result += `${cx + rx} ${cy} moveto\n`;
      result += `${cx + rx} ${cy + ry * 0.552} ${cx + rx * 0.552} ${cy + ry} ${cx} ${cy + ry} curveto\n`;
      result += `${cx - rx * 0.552} ${cy + ry} ${cx - rx} ${cy + ry * 0.552} ${cx - rx} ${cy} curveto\n`;
      result += `${cx - rx} ${cy - ry * 0.552} ${cx - rx * 0.552} ${cy - ry} ${cx} ${cy - ry} curveto\n`;
      result += `${cx + rx * 0.552} ${cy - ry} ${cx + rx} ${cy - ry * 0.552} ${cx + rx} ${cy} curveto\n`;
      result += `closepath\n`;
      
      if (fillColor && fillColor !== "none") {
        result += `fill\n`;
      } else {
        result += `stroke\n`;
      }
    }
  });
  
  return result;
}

// Convert SVG path commands to PostScript commands
export function convertSVGPathToPostScript(d: string): string {
  let result = "";
  
  // Normalize path data by adding spaces between commands and parameters
  const normalizedPath = d
    .replace(/([MLHVCSQTAZmlhvcsqtaz])/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const tokens = normalizedPath.split(' ');
  let currentX = 0;
  let currentY = 0;
  let firstX = 0;
  let firstY = 0;
  let prevCommand = '';
  
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    
    if (/[MLHVCSQTAZmlhvcsqtaz]/.test(token)) {
      // It's a command
      const command = token;
      i++;
      
      switch (command) {
        case 'M': // Absolute moveto
        case 'm': // Relative moveto
          while (i < tokens.length && !isNaN(parseFloat(tokens[i]))) {
            const x = parseFloat(tokens[i++]);
            const y = parseFloat(tokens[i++]);
            
            if (command === 'm') {
              currentX += x;
              currentY += y;
            } else {
              currentX = x;
              currentY = y;
            }
            
            if (prevCommand === '') {
              firstX = currentX;
              firstY = currentY;
            }
            
            result += `${currentX} ${currentY} moveto\n`;
          }
          break;
          
        case 'L': // Absolute lineto
        case 'l': // Relative lineto
          while (i < tokens.length && !isNaN(parseFloat(tokens[i]))) {
            const x = parseFloat(tokens[i++]);
            const y = parseFloat(tokens[i++]);
            
            if (command === 'l') {
              currentX += x;
              currentY += y;
            } else {
              currentX = x;
              currentY = y;
            }
            
            result += `${currentX} ${currentY} lineto\n`;
          }
          break;
          
        case 'H': // Absolute horizontal lineto
        case 'h': // Relative horizontal lineto
          while (i < tokens.length && !isNaN(parseFloat(tokens[i]))) {
            const x = parseFloat(tokens[i++]);
            
            if (command === 'h') {
              currentX += x;
            } else {
              currentX = x;
            }
            
            result += `${currentX} ${currentY} lineto\n`;
          }
          break;
          
        case 'V': // Absolute vertical lineto
        case 'v': // Relative vertical lineto
          while (i < tokens.length && !isNaN(parseFloat(tokens[i]))) {
            const y = parseFloat(tokens[i++]);
            
            if (command === 'v') {
              currentY += y;
            } else {
              currentY = y;
            }
            
            result += `${currentX} ${currentY} lineto\n`;
          }
          break;
          
        case 'C': // Absolute cubic Bezier curve
        case 'c': // Relative cubic Bezier curve
          while (i < tokens.length && !isNaN(parseFloat(tokens[i]))) {
            const x1 = parseFloat(tokens[i++]);
            const y1 = parseFloat(tokens[i++]);
            const x2 = parseFloat(tokens[i++]);
            const y2 = parseFloat(tokens[i++]);
            const x = parseFloat(tokens[i++]);
            const y = parseFloat(tokens[i++]);
            
            let cp1x, cp1y, cp2x, cp2y, endX, endY;
            
            if (command === 'c') {
              cp1x = currentX + x1;
              cp1y = currentY + y1;
              cp2x = currentX + x2;
              cp2y = currentY + y2;
              endX = currentX + x;
              endY = currentY + y;
            } else {
              cp1x = x1;
              cp1y = y1;
              cp2x = x2;
              cp2y = y2;
              endX = x;
              endY = y;
            }
            
            result += `${cp1x} ${cp1y} ${cp2x} ${cp2y} ${endX} ${endY} curveto\n`;
            
            currentX = endX;
            currentY = endY;
          }
          break;
          
        case 'Z': // Closepath
        case 'z': // Closepath
          result += `closepath\n`;
          currentX = firstX;
          currentY = firstY;
          i++; // Move past the Z command
          break;
          
        default:
          // Skip unsupported commands for now
          i++;
          while (i < tokens.length && !isNaN(parseFloat(tokens[i]))) {
            i++;
          }
      }
      
      prevCommand = command;
    } else {
      // Skip non-command, non-number tokens
      i++;
    }
  }
  
  return result;
}
