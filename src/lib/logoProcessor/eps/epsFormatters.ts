
/**
 * Create EPS file header with bounding box
 */
export const createEpsHeader = (width: number, height: number): string => {
  return `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${Math.ceil(width)} ${Math.ceil(height)}
%%HiResBoundingBox: 0.0 0.0 ${width.toFixed(3)} ${height.toFixed(3)}
%%Creator: Logo Package Generator
%%Title: Vector Logo
%%DocumentData: Clean7Bit
%%DocumentProcessColors: Black
%%EndComments

%%BeginProlog
% Define shortcuts for frequently used operations
/m {moveto} def
/l {lineto} def
/c {curveto} def
/cp {closepath} def
/rl {rlineto} def
/rm {rmoveto} def
/gr {grestore} def
/gs {gsave} def
/rc {rectclip} def
/rf {rectfill} def
/rgb {setrgbcolor} def
/s {stroke} def
/f {fill} def
/n {newpath} def
/w {setlinewidth} def
/sc {scale} def
/tr {translate} def
/ro {rotate} def
/mt {matrix} def
/ct {concat} def
/ar {arc} def
/ap {arc} def
/sfi {gsave fill grestore stroke} def

% Define a helper function for rounded rectangles
/roundrect { % x y width height radius => -
  /r exch def
  /h exch def
  /w exch def
  /y exch def
  /x exch def
  
  n
  x r add y m
  x w add y r sub r -90 0 ar
  x w add y h add r sub r 0 90 ar
  x r add y h add r 90 180 ar
  x y r add r 180 270 ar
  cp
} def

% Define a helper function for ellipses
/ellipse { % x y xradius yradius => -
  /yrad exch def
  /xrad exch def
  /y exch def
  /x exch def
  
  matrix currentmatrix
  x y tr
  xrad yrad sc
  0 0 1 0 360 arc
  setmatrix
} def
%%EndProlog

%%BeginSetup
<< /PageSize [${width} ${height}] >> setpagedevice
1 setlinecap
1 setlinejoin
10 setmiterlimit
%%EndSetup

%%Page: 1 1
%%BeginPageSetup
%%EndPageSetup

`;
};

/**
 * Create EPS file footer
 */
export const createEpsFooter = (): string => {
  return `
showpage
%%Trailer
%%EOF`;
};

/**
 * Create placeholder shape for empty SVGs
 */
export const createPlaceholderShape = (width: number, height: number): string => {
  const centerX = width / 2;
  const centerY = height / 2;
  const size = Math.min(width, height) * 0.4;
  
  return `% Placeholder shape due to missing vector elements
gsave
newpath
${centerX - size} ${centerY - size} moveto
${centerX + size} ${centerY - size} lineto
${centerX + size} ${centerY + size} lineto
${centerX - size} ${centerY + size} lineto
closepath
0.8 0.8 0.8 setrgbcolor
fill
grestore
`;
};

/**
 * Create fallback EPS file if conversion fails
 */
export const createFallbackEps = (): string => {
  const width = 400;
  const height = 400;
  
  let content = createEpsHeader(width, height);
  content += `
% Fallback shape - logo conversion error indicator
gsave
newpath
200 150 moveto
300 300 lineto
100 300 lineto
closepath
0.2 0.2 0.2 setrgbcolor
fill

newpath
200 250 50 0 360 arc
closepath
0.8 0.8 0.8 setrgbcolor
fill
grestore
`;
  content += createEpsFooter();
  
  return content;
};

// Export the setPostScriptColor function from epsSvgHelpers.ts instead of duplicating it here
export { setPostScriptColor } from './epsSvgHelpers';
