
/**
 * Create EPS file header with bounding box
 */
export const createEpsHeader = (width: number, height: number): string => {
  return `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${Math.ceil(width)} ${Math.ceil(height)}
%%HiResBoundingBox: 0 0 ${width.toFixed(3)} ${height.toFixed(3)}
%%Creator: Logo Package Generator
%%Title: Vector Logo
%%DocumentData: Clean7Bit
%%EndComments

%%BeginProlog
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
/w {setlinewidth} def
/f {fill} def
/n {newpath} def
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

`;
};

/**
 * Create EPS file footer
 */
export const createEpsFooter = (): string => {
  return `
gr
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
newpath
${centerX - size} ${centerY - size} moveto
${centerX + size} ${centerY - size} lineto
${centerX + size} ${centerY + size} lineto
${centerX - size} ${centerY + size} lineto
closepath
0.8 0.8 0.8 setrgbcolor
fill
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
`;
  content += createEpsFooter();
  
  return content;
};

import { hexToRgb } from '../colorUtils';

/**
 * Set PostScript color based on fill color
 */
export const setPostScriptColor = (fillColor: string): string => {
  if (!fillColor || fillColor === 'none') {
    return '0 0 0 setrgbcolor\n'; // Default to black
  }
  
  const rgb = hexToRgb(fillColor);
  if (!rgb) {
    return '0 0 0 setrgbcolor\n'; // Default to black if invalid color
  }
  
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} setrgbcolor\n`;
};
