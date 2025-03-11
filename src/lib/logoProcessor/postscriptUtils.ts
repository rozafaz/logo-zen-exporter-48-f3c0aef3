
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

// Helper to create a basic shape when no paths are found
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

// Generate a simple shape for testing
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
