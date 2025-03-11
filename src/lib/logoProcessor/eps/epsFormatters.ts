
/**
 * Create EPS file header with improved bounding box and high quality settings
 * Adds a small padding to prevent clipping
 */
export const createEpsHeader = (width: number, height: number): string => {
  // Add padding to bounding box to prevent clipping
  const padding = Math.max(10, Math.min(width, height) * 0.05);
  const bbWidth = Math.ceil(width + padding * 2);
  const bbHeight = Math.ceil(height + padding * 2);
  
  return `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: -${Math.ceil(padding)} -${Math.ceil(padding)} ${bbWidth} ${bbHeight}
%%HiResBoundingBox: -${padding.toFixed(3)} -${padding.toFixed(3)} ${(width + padding * 2).toFixed(3)} ${(height + padding * 2).toFixed(3)}
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

% Define a simplified gradient function (linear gradient)
/linear_gradient { % x0 y0 x1 y1 r0 g0 b0 r1 g1 b1 => -
  /b1 exch def
  /g1 exch def
  /r1 exch def
  /b0 exch def
  /g0 exch def
  /r0 exch def
  /y1 exch def
  /x1 exch def
  /y0 exch def
  /x0 exch def
  
  % Calculate gradient vector
  /gvectx x1 x0 sub def
  /gvecty y1 y0 sub def
  /glen gvectx dup mul gvecty dup mul add sqrt def
  /gnormx glen 0 eq {0} {gvectx glen div} ifelse def
  /gnormy glen 0 eq {0} {gvecty glen div} ifelse def
  
  % For each point, we'll determine how far along the gradient vector it is
  % and interpolate between the two colors accordingly
  % This is a simplification - in a production environment you would implement
  % proper gradient rendering with multiple color stops
} def

% Higher quality settings for better path rendering
2 setlinecap
2 setlinejoin
0.5 setlinewidth
%%EndProlog

%%BeginSetup
<< /PageSize [${width} ${height}] >> setpagedevice
%%EndSetup

%%Page: 1 1
%%BeginPageSetup
% Translate by padding amount to ensure everything is visible
${padding} ${padding} translate
%%EndPageSetup

`;
};

/**
 * Create EPS file footer with improved cleanup
 */
export const createEpsFooter = (): string => {
  return `
% Clean up any leftover graphics state
grestore

showpage
%%Trailer
%%EOF`;
};

/**
 * Create placeholder shape for empty SVGs with improved visibility
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

// Export the setPostScriptColor function from epsSvgHelpers.ts
export { setPostScriptColor } from './epsSvgHelpers';
