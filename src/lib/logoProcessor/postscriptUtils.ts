// PostScript helper functions for EPS generation
export const createPostScriptHeader = (width: number, height: number): string => {
  return `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${Math.ceil(width)} ${Math.ceil(height)}
%%HiResBoundingBox: 0 0 ${width.toFixed(6)} ${height.toFixed(6)}
%%Creator: Logo Package Generator
%%Title: Vector Logo
%%DocumentData: Clean7Bit
%%Pages: 1
%%EndComments

%%BeginProlog
/m { moveto } def
/l { lineto } def
/c { curveto } def
/cp { closepath } def
/f { fill } def
/s { stroke } def
/rgb { setrgbcolor } def
/w { setlinewidth } def
/gs { gsave } def
/gr { grestore } def
/n { newpath } def
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

% Default to black if no color specified
0 0 0 rgb

`;
};

export const createPostScriptFooter = (): string => {
  return `
gr
showpage
%%Trailer
%%EOF`;
};

export const createPostScriptPlaceholder = (width: number, height: number): string => {
  const centerX = width / 2;
  const centerY = height / 2;
  const size = Math.min(width, height) * 0.4;
  
  return `% Placeholder shape - rectangle in the center
n
${centerX - size} ${centerY - size} m
${centerX + size} ${centerY - size} l
${centerX + size} ${centerY + size} l
${centerX - size} ${centerY + size} l
cp
0.8 0.8 0.8 rgb
f
`;
};

// Convert SVG path commands to PostScript
export const svgPathToPostScript = (pathData: string): string => {
  let result = 'n\n'; // Start a new path
  const commands = pathData.match(/([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g) || [];
  
  let currentX = 0;
  let currentY = 0;
  
  for (const cmd of commands) {
    const command = cmd[0];
    const params = cmd.slice(1).trim().split(/[\s,]+/).map(Number);
    
    switch (command) {
      case 'M':
      case 'm':
        currentX = command === 'M' ? params[0] : currentX + params[0];
        currentY = command === 'M' ? params[1] : currentY + params[1];
        result += `${currentX} ${currentY} m\n`;
        break;
        
      case 'L':
      case 'l':
        currentX = command === 'L' ? params[0] : currentX + params[0];
        currentY = command === 'L' ? params[1] : currentY + params[1];
        result += `${currentX} ${currentY} l\n`;
        break;
        
      case 'H':
      case 'h':
        currentX = command === 'H' ? params[0] : currentX + params[0];
        result += `${currentX} ${currentY} l\n`;
        break;
        
      case 'V':
      case 'v':
        currentY = command === 'V' ? params[0] : currentY + params[0];
        result += `${currentX} ${currentY} l\n`;
        break;
        
      case 'C':
      case 'c':
        const x1 = command === 'C' ? params[0] : currentX + params[0];
        const y1 = command === 'C' ? params[1] : currentY + params[1];
        const x2 = command === 'C' ? params[2] : currentX + params[2];
        const y2 = command === 'C' ? params[3] : currentY + params[3];
        const x = command === 'C' ? params[4] : currentX + params[4];
        const y = command === 'C' ? params[5] : currentY + params[5];
        result += `${x1} ${y1} ${x2} ${y2} ${x} ${y} c\n`;
        currentX = x;
        currentY = y;
        break;
        
      case 'Z':
      case 'z':
        result += 'cp\n';
        break;
    }
  }
  
  return result;
};

// Create a test shape for debugging
export const createTestShape = (width: number, height: number): string => {
  const centerX = width / 2;
  const centerY = height / 2;
  const size = Math.min(width, height) * 0.3;
  
  return `% Test shape - basic logo representation
n
${centerX} ${centerY + size} m
${centerX + size} ${centerY} l
${centerX} ${centerY - size} l
${centerX - size} ${centerY} l
cp
0 0 0 rgb
f
`;
};

// Improved SVG path to PostScript conversion with error handling
export const convertSVGPathToPostScript = (pathData: string): string => {
  try {
    let result = 'n\n'; // Start a new path
    
    // Normalize path data
    const normalizedPath = pathData
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
  } catch (error) {
    console.error('Error converting SVG path to PostScript:', error);
    // Return a basic shape as fallback
    return 'n\n100 100 m\n200 100 l\n200 200 l\n100 200 l\ncp\n';
  }
};

// Direct SVG to EPS conversion function with improvements
export const directSvgToEps = (svgString: string): string => {
  try {
    console.log('Starting direct SVG to EPS conversion');
    
    // Parse SVG
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.querySelector('svg');
    
    if (!svgElement) {
      console.error('Invalid SVG: No SVG element found');
      throw new Error('Invalid SVG: No SVG element found');
    }
    
    // Get SVG dimensions
    let width = 1000;
    let height = 1000;
    
    const vb = svgElement.getAttribute('viewBox');
    if (vb) {
      const [, , w, h] = vb.split(/\s+/).map(parseFloat);
      if (!isNaN(w) && !isNaN(h)) {
        width = w;
        height = h;
      }
    } else {
      const svgWidth = svgElement.getAttribute('width');
      const svgHeight = svgElement.getAttribute('height');
      if (svgWidth && svgHeight) {
        width = parseFloat(svgWidth);
        height = parseFloat(svgHeight);
      }
    }
    
    console.log('SVG dimensions for EPS:', width, 'x', height);
    
    // Start building EPS content
    let epsContent = createPostScriptHeader(width, height);
    let hasContent = false;
    
    // Process paths - the most important element for vectors
    const paths = svgDoc.querySelectorAll('path');
    console.log(`Found ${paths.length} paths in SVG`);
    
    if (paths.length > 0) {
      paths.forEach((path, index) => {
        const d = path.getAttribute('d');
        if (!d) return;
        
        const fill = path.getAttribute('fill') || '#000000';
        const stroke = path.getAttribute('stroke');
        const strokeWidth = path.getAttribute('stroke-width');
        
        console.log(`Processing path ${index + 1} with fill ${fill}, stroke ${stroke || 'none'}`);
        
        // Set fill color
        if (fill !== 'none') {
          const rgbValues = hexToRgbForPostScript(fill);
          epsContent += `${rgbValues} rgb\n`;
        }
        
        // Convert path to PostScript - enhanced version with manual fallback
        try {
          epsContent += 'n\n'; // Start a new path
          
          // Try our convertSVGPathToPostScript function first (more robust)
          const pathCommands = convertSVGPathToPostScript(d);
          epsContent += pathCommands;
          
          // If no commands were generated, try simpler svgPathToPostScript
          if (!pathCommands || pathCommands.trim() === 'n') {
            epsContent += svgPathToPostScript(d);
          }
          
          // Apply appropriate operations based on fill/stroke
          if (fill !== 'none') {
            epsContent += 'cp\nf\n'; // Close path and fill
            hasContent = true;
          } else if (stroke) {
            // Set stroke properties if specified
            if (strokeWidth) {
              epsContent += `${parseFloat(strokeWidth) || 1} w\n`;
            }
            epsContent += 'cp\ns\n'; // Close path and stroke
            hasContent = true;
          } else {
            epsContent += 'cp\nf\n'; // Default to fill
            hasContent = true;
          }
        } catch (e) {
          console.error(`Error processing path: ${e}`);
          // Continue processing other paths
        }
      });
    }
    
    // Process rectangles if no paths were found or if processing paths failed
    if (!hasContent) {
      const rects = svgDoc.querySelectorAll('rect');
      console.log(`Found ${rects.length} rectangles in SVG`);
      
      rects.forEach((rect, index) => {
        const x = parseFloat(rect.getAttribute('x') || '0');
        const y = parseFloat(rect.getAttribute('y') || '0');
        const rectWidth = parseFloat(rect.getAttribute('width') || '0');
        const rectHeight = parseFloat(rect.getAttribute('height') || '0');
        const fill = rect.getAttribute('fill') || '#000000';
        
        console.log(`Processing rect ${index + 1} at (${x},${y}) size ${rectWidth}x${rectHeight}`);
        
        if (rectWidth <= 0 || rectHeight <= 0) return; // Skip invalid rectangles
        
        // Set fill color
        if (fill !== 'none') {
          const rgbValues = hexToRgbForPostScript(fill);
          epsContent += `${rgbValues} rgb\n`;
        }
        
        // Create rectangle path
        epsContent += `n\n${x} ${y} m\n`;
        epsContent += `${x + rectWidth} ${y} l\n`;
        epsContent += `${x + rectWidth} ${y + rectHeight} l\n`;
        epsContent += `${x} ${y + rectHeight} l\n`;
        epsContent += `cp\n`;
        
        // Apply fill
        if (fill !== 'none') {
          epsContent += 'f\n';
          hasContent = true;
        } else {
          epsContent += 's\n';
          hasContent = true;
        }
      });
    }
    
    // Process circles if still no content
    if (!hasContent) {
      const circles = svgDoc.querySelectorAll('circle');
      console.log(`Found ${circles.length} circles in SVG`);
      
      circles.forEach((circle, index) => {
        const cx = parseFloat(circle.getAttribute('cx') || '0');
        const cy = parseFloat(circle.getAttribute('cy') || '0');
        const r = parseFloat(circle.getAttribute('r') || '0');
        const fill = circle.getAttribute('fill') || '#000000';
        
        if (r <= 0) return; // Skip invalid circles
        
        console.log(`Processing circle ${index + 1} at (${cx},${cy}) radius ${r}`);
        
        // Set fill color
        if (fill !== 'none') {
          const rgbValues = hexToRgbForPostScript(fill);
          epsContent += `${rgbValues} rgb\n`;
        }
        
        // Create circle path (approximating with cubic bezier curves)
        const kappa = 0.5522848; // Magic number for approximating a circle with bezier curves
        const ox = r * kappa;    // Control point offset horizontal
        const oy = r * kappa;    // Control point offset vertical
        
        epsContent += `n\n${cx + r} ${cy} m\n`; // Start at right point
        // Top right quadrant
        epsContent += `${cx + r} ${cy + oy} ${cx + ox} ${cy + r} ${cx} ${cy + r} c\n`;
        // Top left quadrant
        epsContent += `${cx - ox} ${cy + r} ${cx - r} ${cy + oy} ${cx - r} ${cy} c\n`;
        // Bottom left quadrant
        epsContent += `${cx - r} ${cy - oy} ${cx - ox} ${cy - r} ${cx} ${cy - r} c\n`;
        // Bottom right quadrant
        epsContent += `${cx + ox} ${cy - r} ${cx + r} ${cy - oy} ${cx + r} ${cy} c\n`;
        epsContent += `cp\n`;
        
        // Apply fill
        if (fill !== 'none') {
          epsContent += 'f\n';
          hasContent = true;
        } else {
          epsContent += 's\n';
          hasContent = true;
        }
      });
    }
    
    // As a last resort, add a clearly visible test shape if we didn't generate any content
    if (!hasContent) {
      console.warn('No vector content found, adding test shape');
      epsContent += createTestShape(width, height);
    }
    
    // Add footer
    epsContent += createPostScriptFooter();
    
    console.log('EPS content generated successfully, size:', epsContent.length, 'bytes');
    return epsContent;
  } catch (error) {
    console.error('Error in direct SVG to EPS conversion:', error);
    // Return a fallback EPS with a simple shape that is clearly visible
    return createFallbackEps();
  }
};

// Convert hex color to RGB PostScript values
const hexToRgbForPostScript = (hex: string): string => {
  // Default to black
  if (!hex || hex === 'none') return '0 0 0';
  
  // Handle special case: transparent or none
  if (hex.toLowerCase() === 'transparent' || hex === 'none') {
    return '0 0 0';
  }
  
  // Handle special named colors
  if (hex.toLowerCase() === 'black') return '0 0 0';
  if (hex.toLowerCase() === 'white') return '1 1 1';
  if (hex.toLowerCase() === 'red') return '1 0 0';
  if (hex.toLowerCase() === 'green') return '0 1 0';
  if (hex.toLowerCase() === 'blue') return '0 0 1';
  
  // If not a hex value starting with #, return default black
  if (!hex.startsWith('#')) return '0 0 0';
  
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  
  // Parse hex values
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  if (!result) return '0 0 0'; // Default to black if parsing fails
  
  // Convert to normalized RGB values
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
};

// Create a fallback EPS with a visually distinctive shape
const createFallbackEps = (): string => {
  const width = 400;
  const height = 400;
  
  let content = createPostScriptHeader(width, height);
  
  // Add a visually distinctive shape that will be obvious when opened
  content += `
% Fallback shape - clearly visible logo placeholder
n
200 300 m
300 200 l
200 100 l
100 200 l
cp
0 0 0 rgb
f

n
200 250 m
250 200 l
200 150 l
150 200 l
cp
1 1 1 rgb
f
`;
  
  content += createPostScriptFooter();
  
  return content;
};
