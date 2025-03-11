
// PostScript helper functions for EPS generation
export const createPostScriptHeader = (width: number, height: number): string => {
  return `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${Math.ceil(width)} ${Math.ceil(height)}
%%HiResBoundingBox: 0 0 ${width.toFixed(6)} ${height.toFixed(6)}
%%Creator: Logo Package Generator
%%Title: Vector Logo
%%DocumentData: Clean7Bit
%%LanguageLevel: 2
%%Pages: 1
%%EndComments

%%BeginProlog
/bd { bind def } bind def
/m { moveto } bd
/l { lineto } bd
/c { curveto } bd
/cp { closepath } bd
/f { fill } bd
/s { stroke } bd
/rgb { setrgbcolor } bd
/n { newpath } bd
/gs { gsave } bd
/gr { grestore } bd
/tr { translate } bd
/sc { scale } bd
/ro { rotate } bd
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
%%EndPageSetup\n`;
};

export const createPostScriptFooter = (): string => {
  return `\ngr
showpage
%%Trailer
%%EOF`;
};

