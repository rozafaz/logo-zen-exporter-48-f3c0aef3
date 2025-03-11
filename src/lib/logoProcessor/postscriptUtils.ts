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
