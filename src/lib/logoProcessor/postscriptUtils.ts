
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
