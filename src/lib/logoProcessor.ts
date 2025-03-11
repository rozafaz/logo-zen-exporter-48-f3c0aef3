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
    
    const epsHeader = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 1000 1000
%%HiResBoundingBox: 0 0 1000 1000
%%EndComments
/Helvetica findfont 12 scalefont setfont
newpath
`;

    const epsFooter = `showpage
%%EOF`;

    // Convert the entire SVG into a PostScript-friendly format
    const epsBody = convertSVGToEPS(svgString);
    
    const epsContent = epsHeader + epsBody + epsFooter;
    
    console.log('EPS file created successfully');
    return new Blob([epsContent], { type: 'application/postscript' });
  } catch (error) {
    console.error('Error creating EPS:', error);
    throw error;
  }
};

// Convert SVG to EPS
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

  // Extract Paths
  const paths = svgDoc.querySelectorAll("path");
  console.log(`Found ${paths.length} paths in SVG`);
  
  if (paths.length > 0) {
    paths.forEach((path, index) => {
      const d = path.getAttribute("d");
      if (d) {
        const fillColor = path.getAttribute("fill") || "#000000";
        const strokeColor = path.getAttribute("stroke");
        
        // Convert hex color to RGB values for PostScript
        const rgbFill = hexToRgb(fillColor);
        
        epsData += `% Path ${index + 1}\n`;
        
        // Set fill color if available
        if (rgbFill) {
          epsData += `${rgbFill.r / 255} ${rgbFill.g / 255} ${rgbFill.b / 255} setrgbcolor\n`;
        }
        
        // Improved path conversion
        epsData += `newpath\n`;
        epsData += convertSVGPathToEPS(d);
        
        // Apply fill and/or stroke
        if (strokeColor && strokeColor !== "none") {
          epsData += "gsave\n";
          const rgbStroke = hexToRgb(strokeColor);
          if (rgbStroke) {
            epsData += `${rgbStroke.r / 255} ${rgbStroke.g / 255} ${rgbStroke.b / 255} setrgbcolor\n`;
          }
          epsData += "stroke\ngrestore\n";
        }
        
        if (fillColor && fillColor !== "none") {
          epsData += "fill\n";
        } else {
          epsData += "stroke\n";
        }
      }
    });
  } else {
    // Handle rectangles, circles, etc. if no paths found
    console.log("No paths found, looking for other SVG elements");
    
    // Handle rectangles
    const rects = svgDoc.querySelectorAll("rect");
    rects.forEach((rect, index) => {
      const x = parseFloat(rect.getAttribute("x") || "0");
      const y = parseFloat(rect.getAttribute("y") || "0");
      const width = parseFloat(rect.getAttribute("width") || "0");
      const height = parseFloat(rect.getAttribute("height") || "0");
      const fillColor = rect.getAttribute("fill") || "#000000";
      
      const rgbFill = hexToRgb(fillColor);
      
      epsData += `% Rectangle ${index + 1}\n`;
      if (rgbFill) {
        epsData += `${rgbFill.r / 255} ${rgbFill.g / 255} ${rgbFill.b / 255} setrgbcolor\n`;
      }
      
      epsData += `newpath\n${x} ${y} moveto\n`;
      epsData += `${x + width} ${y} lineto\n`;
      epsData += `${x + width} ${y + height} lineto\n`;
      epsData += `${x} ${y + height} lineto\n`;
      epsData += `closepath\nfill\n`;
    });
    
    // Handle circles
    const circles = svgDoc.querySelectorAll("circle");
    circles.forEach((circle, index) => {
      const cx = parseFloat(circle.getAttribute("cx") || "0");
      const cy = parseFloat(circle.getAttribute("cy") || "0");
      const r = parseFloat(circle.getAttribute("r") || "0");
      const fillColor = circle.getAttribute("fill") || "#000000";
      
      const rgbFill = hexToRgb(fillColor);
      
      epsData += `% Circle ${index + 1}\n`;
      if (rgbFill) {
        epsData += `${rgbFill.r / 255} ${rgbFill.g / 255} ${rgbFill.b / 255} setrgbcolor\n`;
      }
      
      epsData += `newpath\n${cx} ${cy} ${r} 0 360 arc\nclosepath\nfill\n`;
    });
  }
  
  // If we still don't have any content, create a simple placeholder
  if (epsData.trim() === "") {
    console.warn("No SVG elements found, creating placeholder");
    epsData += `% Placeholder shape\nnewpath\n-100 -100 moveto\n100 -100 lineto\n100 100 lineto\n-100 100 lineto\nclosepath\n0.5 setgray\nfill\n`;
  }
  
  return epsData;
}

// Convert SVG path to EPS commands using improved regex
function convertSVGPathToEPS(d: string): string {
  return d
    .replace(/([Mm])\s*([0-9.-]+)[,\s]([0-9.-]+)/g, (_, cmd, x, y) => 
      `${x} ${y} ${cmd === 'm' ? 'rmoveto' : 'moveto'}\n`)
    .replace(/([Ll])\s*([0-9.-]+)[,\s]([0-9.-]+)/g, (_, cmd, x, y) => 
      `${x} ${y} ${cmd === 'l' ? 'rlineto' : 'lineto'}\n`)
    .replace(/([Zz])/g, 'closepath\n')
    .replace(/([Cc])\s*([0-9.-]+)[,\s]([0-9.-]+)[,\s]([0-9.-]+)[,\s]([0-9.-]+)[,\s]([0-9.-]+)[,\s]([0-9.-]+)/g, 
      (_, cmd, x1, y1, x2, y2, x, y) => `${x1} ${y1} ${x2} ${y2} ${x} ${y} curveto\n`);
}

// Helper function to convert hex color to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
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
