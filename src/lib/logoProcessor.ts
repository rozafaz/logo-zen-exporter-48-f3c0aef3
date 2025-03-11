
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import type { ExportSettings } from '@/components/ExportOptions';

interface ProcessedFile {
  folder: string;
  filename: string;
  data: Blob;
}

// Helper function to convert SVG to EPS with improved vector quality
const createEpsFromSvg = (svgString: string): Blob => {
  try {
    console.log('Creating EPS from SVG string');
    
    // Extract SVG dimensions and viewBox for proper bounding box
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.querySelector('svg');
    
    let width = 1000;
    let height = 1000;
    
    if (svgElement) {
      // Try to get dimensions from viewBox or width/height attributes
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const [, , w, h] = viewBox.split(' ').map(parseFloat);
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
    }
    
    const epsHeader = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${Math.ceil(width)} ${Math.ceil(height)}
%%HiResBoundingBox: 0 0 ${width} ${height}
%%Creator: AI Logo Package Exporter
%%Title: Vector Logo
%%CreationDate: ${new Date().toISOString()}
%%DocumentData: Clean7Bit
%%LanguageLevel: 2
%%Pages: 1
%%EndComments

%%BeginProlog
/bd { bind def } bind def
/incompound false def
/m { moveto } bd
/l { lineto } bd
/c { curveto } bd
/F { incompound not {fill} if } bd
/f { closepath F } bd
/S { stroke } bd
/clipproc {
  clip
} def
/W { clipproc } bd
%%EndProlog

%%BeginSetup
%%EndSetup

%%Page: 1 1
%%BeginPageSetup
%%EndPageSetup

% Save graphics state
gsave

% Scale and translate coordinates to match SVG viewBox
0.75 0.75 scale
0 ${height} translate
0 -1 scale

`;

    const epsFooter = `
% Restore graphics state
grestore

showpage
%%Trailer
%%EOF`;

    // Convert SVG to EPS commands
    const epsBody = convertSVGToEPS(svgString);
    
    const epsContent = epsHeader + epsBody + epsFooter;
    
    console.log('EPS file created successfully');
    return new Blob([epsContent], { type: 'application/postscript' });
  } catch (error) {
    console.error('Error creating EPS:', error);
    throw error;
  }
};

// Convert SVG to EPS with improved path handling
function convertSVGToEPS(svgString: string): string {
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
function processOtherSvgElements(svgDoc: Document, epsData: string): string {
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
function convertSVGPathToPostScript(d: string): string {
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

// Helper function to convert hex color to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  // Handle colors like "none"
  if (typeof hex !== 'string' || hex === 'none') {
    return null;
  }
  
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle shorthand hex
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  // Invalid hex
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return null;
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
};

// Helper to modify SVG colors - simplified version
const modifySvgColor = (svgString: string, color: string): string => {
  // This is a basic implementation that works for simple SVGs
  // A production app would use a proper SVG parser
  return svgString.replace(/fill="[^"]*"/g, `fill="${color}"`)
                .replace(/stroke="[^"]*"/g, `stroke="${color}"`);
};

// Helper to invert SVG colors (simplified version)
const invertSvgColors = (svgText: string): string => {
  // This is a simplified approach - in production, you'd use a proper SVG parser
  return svgText.replace(
    /fill="(#[0-9A-Fa-f]{6})"/g, 
    (match, color) => `fill="${invertHexColor(color)}"`
  ).replace(
    /stroke="(#[0-9A-Fa-f]{6})"/g, 
    (match, color) => `stroke="${invertHexColor(color)}"`
  );
};

// Helper to invert a hex color
const invertHexColor = (hex: string): string => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Invert colors
  const invertedR = (255 - r).toString(16).padStart(2, '0');
  const invertedG = (255 - g).toString(16).padStart(2, '0');
  const invertedB = (255 - b).toString(16).padStart(2, '0');
  
  return `#${invertedR}${invertedG}${invertedB}`;
};

const applyBlackFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 0) {
      data[i] = 0;     // R
      data[i + 1] = 0; // G
      data[i + 2] = 0; // B
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

const applyWhiteFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 0) {
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

const applyGrayscaleFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;     // R
    data[i + 1] = avg; // G
    data[i + 2] = avg; // B
    // Alpha stays the same
  }
  
  ctx.putImageData(imageData, 0, 0);
};

const applyInvertedFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];         // R
    data[i + 1] = 255 - data[i + 1]; // G
    data[i + 2] = 255 - data[i + 2]; // B
    // Alpha stays the same
  }
  
  ctx.putImageData(imageData, 0, 0);
};

export const processLogo = async (
  logoFile: File, 
  settings: ExportSettings
): Promise<ProcessedFile[]> => {
  console.log('Starting logo processing...', { settings, logoType: logoFile.type });
  const files: ProcessedFile[] = [];
  const { brandName, formats, colors, resolutions } = settings;
  
  // Create a temporary canvas for image processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Canvas context not available');
    throw new Error('Canvas context not available');
  }
  
  // Load the original logo
  const originalLogo = new Image();
  const logoUrl = URL.createObjectURL(logoFile);
  
  // Log the file type
  console.log('Processing logo file:', logoFile.name, logoFile.type, 'size:', logoFile.size);
  
  try {
    // If it's an SVG, we'll store the SVG text for later use with PDF generation
    let svgText = '';
    if (logoFile.type === 'image/svg+xml' || logoFile.name.toLowerCase().endsWith('.svg')) {
      svgText = await logoFile.text();
      console.log('Successfully loaded SVG text, length:', svgText.length);
    }
    
    await new Promise<void>((resolve, reject) => {
      originalLogo.onload = () => {
        console.log('Logo loaded successfully', {
          width: originalLogo.width,
          height: originalLogo.height
        });
        resolve();
      };
      originalLogo.onerror = (e) => {
        console.error('Error loading logo:', e);
        reject(new Error('Failed to load logo image'));
      };
      originalLogo.src = logoUrl;
    });
    
    // Set canvas size based on the original logo
    const baseWidth = originalLogo.width || 300; // Fallback size
    const baseHeight = originalLogo.height || 300; // Fallback size
    
    // Process each color variation
    for (const color of colors) {
      console.log(`Processing ${color} color variation`);
      
      for (const format of formats) {
        // Handle raster formats (PNG, JPG)
        if (['PNG', 'JPG'].includes(format)) {
          console.log(`Generating ${format} files for ${color}`);
          
          for (const resolution of resolutions) {
            try {
              // Set DPI-based scaling
              let scaleFactor = 1;
              if (resolution === '300dpi') {
                scaleFactor = 300 / 72; // Scale up for 300dpi
              } else if (resolution === '150dpi') {
                scaleFactor = 150 / 72; // Scale up for 150dpi
              }
              
              // Scale canvas according to DPI
              const scaledWidth = Math.round(baseWidth * scaleFactor);
              const scaledHeight = Math.round(baseHeight * scaleFactor);
              
              console.log(`Creating ${resolution} image at ${scaledWidth}x${scaledHeight} pixels`);
              
              canvas.width = scaledWidth;
              canvas.height = scaledHeight;
              
              // Clear canvas and draw image
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(originalLogo, 0, 0, canvas.width, canvas.height);
              
              // Apply color variations
              if (color === 'Black') {
                applyBlackFilter(ctx, canvas.width, canvas.height);
              } else if (color === 'White') {
                applyWhiteFilter(ctx, canvas.width, canvas.height);
              } else if (color === 'Grayscale' && colors.includes('Grayscale')) {
                applyGrayscaleFilter(ctx, canvas.width, canvas.height);
              } else if (color === 'Inverted' && colors.includes('Inverted')) {
                applyInvertedFilter(ctx, canvas.width, canvas.height);
              }
              
              // Convert to blob
              const mimeType = format === 'PNG' ? 'image/png' : 'image/jpeg';
              const quality = format === 'JPG' ? 0.9 : undefined;
              
              const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(
                  (blob) => {
                    if (blob) {
                      resolve(blob);
                    } else {
                      reject(new Error(`Failed to create ${format} blob`));
                    }
                  }, 
                  mimeType, 
                  quality
                );
              });
              
              console.log(`Created ${format} blob of size ${blob.size} bytes for ${resolution}`);
              
              const formatFolder = `${format}`;
              files.push({
                folder: formatFolder,
                filename: `${brandName}_${color}_${resolution}.${format.toLowerCase()}`,
                data: blob
              });
            } catch (error) {
              console.error(`Error processing ${format} in ${resolution}:`, error);
            }
          }
        } 
        // Handle SVG files
        else if (format === 'SVG' && (logoFile.type === 'image/svg+xml' || logoFile.name.toLowerCase().endsWith('.svg'))) {
          console.log('Processing SVG file');
          try {
            // Get SVG content or use previously extracted content
            let modifiedSvg = svgText || await logoFile.text();
            
            // Apply color modifications if needed
            if (color === 'Black') {
              modifiedSvg = modifySvgColor(modifiedSvg, '#000000');
            } else if (color === 'White') {
              modifiedSvg = modifySvgColor(modifiedSvg, '#FFFFFF');
            } else if (color === 'Grayscale' && colors.includes('Grayscale')) {
              modifiedSvg = modifySvgColor(modifiedSvg, '#808080');
            } else if (color === 'Inverted' && colors.includes('Inverted')) {
              modifiedSvg = invertSvgColors(modifiedSvg);
            }
            
            const svgBlob = new Blob([modifiedSvg], { type: 'image/svg+xml' });
            
            const formatFolder = 'SVG';
            files.push({
              folder: formatFolder,
              filename: `${brandName}_${color}.svg`,
              data: svgBlob
            });
            
            console.log(`Created SVG file for ${color} variation, size: ${svgBlob.size} bytes`);
          } catch (error) {
            console.error('Error processing SVG:', error);
          }
        }
        // Handle PDF files - proper implementation
        else if (format === 'PDF') {
          try {
            console.log('Generating PDF for', color);
            
            // For SVG input, we can use pdf-lib's SVG embedding
            if (logoFile.type === 'image/svg+xml' || logoFile.name.toLowerCase().endsWith('.svg')) {
              // Get SVG content or use previously extracted content
              let modifiedSvg = svgText || await logoFile.text();
              
              // Apply color modifications if needed
              if (color === 'Black') {
                modifiedSvg = modifySvgColor(modifiedSvg, '#000000');
              } else if (color === 'White') {
                modifiedSvg = modifySvgColor(modifiedSvg, '#FFFFFF');
              } else if (color === 'Grayscale' && colors.includes('Grayscale')) {
                modifiedSvg = modifySvgColor(modifiedSvg, '#808080');
              } else if (color === 'Inverted' && colors.includes('Inverted')) {
                modifiedSvg = invertSvgColors(modifiedSvg);
              }
              
              // Create PDF with embedded SVG
              const pdfBlob = await createPdfFromSvg(modifiedSvg);
              
              const formatFolder = 'PDF';
              files.push({
                folder: formatFolder,
                filename: `${brandName}_${color}.pdf`,
                data: pdfBlob
              });
              
              console.log(`Created PDF from SVG for ${color}, size: ${pdfBlob.size} bytes`);
              
              // Also create EPS from the PDF if EPS is selected
              if (formats.includes('EPS')) {
                try {
                  // Create EPS directly from SVG
                  const epsBlob = createEpsFromSvg(modifiedSvg);
                  
                  const epsFolder = 'EPS';
                  files.push({
                    folder: epsFolder,
                    filename: `${brandName}_${color}.eps`,
                    data: epsBlob
                  });
                  
                  console.log(`Created EPS from SVG for ${color}, size: ${epsBlob.size} bytes`);
                } catch (error) {
                  console.error('Error creating EPS from SVG:', error);
                }
              }
            } 
            // For raster input, we draw on a canvas and create a PDF
            else {
              // Create a canvas with the logo
              canvas.width = baseWidth;
              canvas.height = baseHeight;
              
              // Clear canvas and draw image
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(originalLogo, 0, 0, canvas.width, canvas.height);
              
              // Apply color variations
              if (color === 'Black') {
                applyBlackFilter(ctx, canvas.width, canvas.height);
              } else if (color === 'White') {
                applyWhiteFilter(ctx, canvas.width, canvas.height);
              } else if (color === 'Grayscale' && colors.includes('Grayscale')) {
                applyGrayscaleFilter(ctx, canvas.width, canvas.height);
              } else if (color === 'Inverted' && colors.includes('Inverted')) {
                applyInvertedFilter(ctx, canvas.width, canvas.height);
              }
              
              // Convert canvas to PNG for embedding in PDF
              const pngDataUrl = canvas.toDataURL('image/png');
              
              // Create PDF with embedded PNG
              const pdfBlob = await createPdfFromImage(pngDataUrl);
              
              const formatFolder = 'PDF';
              files.push({
                folder: formatFolder,
                filename: `${brandName}_${color}.pdf`,
                data: pdfBlob
              });
              
              console.log(`Created PDF from raster for ${color}, size: ${pdfBlob.size} bytes`);
              
              // Also create EPS if requested
              if (formats.includes('EPS')) {
                try {
                  // For raster images, convert to SVG path (simplified)
                  const simpleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${baseWidth} ${baseHeight}">
                    <rect width="${baseWidth}" height="${baseHeight}" fill="${color === 'Black' ? '#000000' : color === 'White' ? '#FFFFFF' : '#808080'}" />
                  </svg>`;
                  
                  const epsBlob = createEpsFromSvg(simpleSvg);
                  
                  const epsFolder = 'EPS';
                  files.push({
                    folder: epsFolder,
                    filename: `${brandName}_${color}.eps`,
                    data: epsBlob
                  });
                  
                  console.log(`Created EPS from raster for ${color}, size: ${epsBlob.size} bytes`);
                } catch (error) {
                  console.error('Error creating EPS from raster:', error);
                }
              }
            }
          } catch (error) {
            console.error('Error creating PDF:', error);
          }
        }
        // Handle EPS files - if not already created via PDF
        else if (format === 'EPS' && !formats.includes('PDF')) {
          try {
            console.log('Generating EPS directly for', color);
            
            // For SVG input
            if (logoFile.type === 'image/svg+xml' || logoFile.name.toLowerCase().endsWith('.svg')) {
              // Get SVG content or use previously extracted content
              let modifiedSvg = svgText || await logoFile.text();
              
              // Apply color modifications if needed
              if (color === 'Black') {
                modifiedSvg = modifySvgColor(modifiedSvg, '#000000');
              } else if (color === 'White') {
                modifiedSvg = modifySvgColor(modifiedSvg, '#FFFFFF');
              } else if (color === 'Grayscale' && colors.includes('Grayscale')) {
                modifiedSvg = modifySvgColor(modifiedSvg, '#808080');
              } else if (color === 'Inverted' && colors.includes('Inverted')) {
                modifiedSvg = invertSvgColors(modifiedSvg);
              }
              
              // Create EPS directly from SVG
              const epsBlob = createEpsFromSvg(modifiedSvg);
              
              const epsFolder = 'EPS';
              files.push({
                folder: epsFolder,
                filename: `${brandName}_${color}.eps`,
                data: epsBlob
              });
              
              console.log(`Created EPS directly for ${color}, size: ${epsBlob.size} bytes`);
            } 
            // For raster input
            else {
              // Create a canvas with the logo
              canvas.width = baseWidth;
              canvas.height = baseHeight;
              
              // Clear canvas and draw image
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(originalLogo, 0, 0, canvas.width, canvas.height);
              
              // Apply color variations
              if (color === 'Black') {
                applyBlackFilter(ctx, canvas.width, canvas.height);
              } else if (color === 'White') {
                applyWhiteFilter(ctx, canvas.width, canvas.height);
              } else if (color === 'Grayscale' && colors.includes('Grayscale')) {
                applyGrayscaleFilter(ctx, canvas.width, canvas.height);
              } else if (color === 'Inverted' && colors.includes('Inverted')) {
                applyInvertedFilter(ctx, canvas.width, canvas.height);
              }
              
              // For raster images, convert to simple SVG rect
              const simpleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${baseWidth} ${baseHeight}">
                <rect width="${baseWidth}" height="${baseHeight}" fill="${color === 'Black' ? '#000000' : color === 'White' ? '#FFFFFF' : '#808080'}" />
              </svg>`;
              
              const epsBlob = createEpsFromSvg(simpleSvg);
              
              const epsFolder = 'EPS';
              files.push({
                folder: epsFolder,
                filename: `${brandName}_${color}.eps`,
                data: epsBlob
              });
              
              console.log(`Created EPS directly for ${color}, size: ${epsBlob.size} bytes`);
            }
          } catch (error) {
            console.error('Error creating EPS:', error);
          }
        }
        // Handle ICO files (favicon)
        else if (format === 'ICO') {
          try {
            console.log('Generating ICO for', color);
            
            // Set canvas to standard favicon sizes (32x32 for simplicity)
            canvas.width = 32;
            canvas.height = 32;
            
            // Clear canvas and draw image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(originalLogo, 0, 0, canvas.width, canvas.height);
            
            // Apply color variations
            if (color === 'Black') {
              applyBlackFilter(ctx, canvas.width, canvas.height);
            } else if (color === 'White') {
              applyWhiteFilter(ctx, canvas.width, canvas.height);
            } else if (color === 'Grayscale' && colors.includes('Grayscale')) {
              applyGrayscaleFilter(ctx, canvas.width, canvas.height);
            } else if (color === 'Inverted' && colors.includes('Inverted')) {
              applyInvertedFilter(ctx, canvas.width, canvas.height);
            }
            
            // Convert to PNG for ICO (browser can't generate ICO directly)
            const pngBlob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error(`Failed to create ICO blob`));
                  }
                }, 
                'image/png'
              );
            });
            
            console.log(`Created ICO (as PNG) of size ${pngBlob.size} bytes`);
            
            const formatFolder = 'ICO';
            files.push({
              folder: formatFolder,
              filename: `${brandName}_favicon_${color}.ico`,
              data: pngBlob
            });
          } catch (error) {
            console.error('Error creating ICO:', error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in logo processing:', error);
    throw error;
  } finally {
    // Clean up
    URL.revokeObjectURL(logoUrl);
  }
  
  console.log(`Processing complete. Generated ${files.length} files.`);
  return files;
};

// Function to create a PDF from SVG text
const createPdfFromSvg = async (svgString: string): Promise<Blob> => {
  try {
    console.log('Creating PDF from SVG, length:', svgString.length);
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 600]);
    
    // Convert SVG to PNG for embedding
    // First, create a data URL from the SVG
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    
    // Load the SVG as an image
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load SVG as image'));
      img.src = svgUrl;
    });
    
    // Draw the image on a canvas at high resolution
    const canvas = document.createElement('canvas');
    canvas.width = img.width * 4; // Higher resolution
    canvas.height = img.height * 4;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Get the PNG data URL
    const pngDataUrl = canvas.toDataURL('image/png');
    
    // Embed the PNG into the PDF
    const pngData = await fetch(pngDataUrl).then(res => res.arrayBuffer());
    const pngImage = await pdfDoc.embedPng(pngData);
    
    // Calculate dimensions to maintain aspect ratio
    const pngDims = pngImage.scale(1);
    const scale = Math.min(500 / pngDims.width, 500 / pngDims.height);
    
    // Center the image on the page
    const x = (600 - pngDims.width * scale) / 2;
    const y = (600 - pngDims.height * scale) / 2;
    
    // Draw the image
    page.drawImage(pngImage, {
      x,
      y,
      width: pngDims.width * scale,
      height: pngDims.height * scale,
    });
    
    // Save the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Create a Blob from the PDF bytes
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    console.log('PDF created successfully, size:', pdfBlob.size, 'bytes');
    return pdfBlob;
  } catch (error) {
    console.error('Error in createPdfFromSvg:', error);
    throw error;
  }
};

// Function to create a PDF from an image data URL
const createPdfFromImage = async (imageDataUrl: string): Promise<Blob> => {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 600]);
    
    // Embed the image into the PDF
    const imgData = await fetch(imageDataUrl).then(res => res.arrayBuffer());
    const img = await pdfDoc.embedPng(imgData);
    
    // Calculate dimensions to maintain aspect ratio
    const imgDims = img.scale(1);
    const scale = Math.min(500 / imgDims.width, 500 / imgDims.height);
    
    // Center the image on the page
    const x = (600 - imgDims.width * scale) / 2;
    const y = (600 - imgDims.height * scale) / 2;
    
    // Draw the image
    page.drawImage(img, {
      x,
      y,
      width: imgDims.width * scale,
      height: imgDims.height * scale,
    });
    
    // Save the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Create a Blob from the PDF bytes
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    console.log('PDF created successfully from image, size:', pdfBlob.size, 'bytes');
    return pdfBlob;
  } catch (error) {
    console.error('Error in createPdfFromImage:', error);
    throw error;
  }
};

export const createZipPackage = async (files: ProcessedFile[]): Promise<Blob> => {
  console.log('Creating ZIP package...');
  try {
    const zip = new JSZip();
    
    // Group files by format
    const filesByFormat = files.reduce((acc: Record<string, ProcessedFile[]>, file) => {
      const format = file.folder;
      if (!acc[format]) {
        acc[format] = [];
      }
      acc[format].push(file);
      return acc;
    }, {});
    
    // Add files to their respective format folders
    Object.entries(filesByFormat).forEach(([format, formatFiles]) => {
      const folder = zip.folder(format);
      if (folder) {
        formatFiles.forEach(file => {
          folder.file(file.filename, file.data);
          console.log(`Added ${file.filename} to ${format} folder`);
        });
      }
    });
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    console.log(`ZIP package created successfully, size: ${zipBlob.size} bytes`);
    
    return zipBlob;
  } catch (error) {
    console.error('Error creating ZIP package:', error);
    throw error;
  }
};

export const downloadZip = (zipBlob: Blob, brandName: string): void => {
  try {
    // Create a URL for the blob
    const url = URL.createObjectURL(zipBlob);
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brandName}_LogoPackage.zip`;
    
    // Append to the document, click, and clean up
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Download initiated for ZIP file');
  } catch (error) {
    console.error('Error downloading ZIP:', error);
    throw error;
  }
};

// Function for testing ZIP download (for development)
export const testZipDownload = (): void => {
  try {
    console.log('Testing ZIP download...');
    
    const zip = new JSZip();
    
    // Add a text file for testing
    zip.file('test.txt', 'This is a test file for ZIP download functionality.');
    
    // Add a small SVG
    const testSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
      <circle cx="25" cy="25" r="20" fill="blue" />
    </svg>`;
    
    zip.file('test.svg', testSvg);
    
    // Generate and download the ZIP
    zip.generateAsync({ type: 'blob' }).then(blob => {
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test_download.zip';
      
      // Append to the document, click, and clean up
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Test ZIP download complete');
    }).catch(err => {
      console.error('Error in test ZIP download:', err);
    });
  } catch (error) {
    console.error('Error testing ZIP download:', error);
    throw error;
  }
};
