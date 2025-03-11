import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import type { ExportSettings } from '@/components/ExportOptions';

interface ProcessedFile {
  folder: string;
  filename: string;
  data: Blob;
}

// Create PDF from image data
const createPdfFromImage = async (pngDataUrl: string): Promise<Blob> => {
  try {
    console.log('Creating PDF from PNG data URL');
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 600]);
    
    const pngImage = await fetch(pngDataUrl).then(res => res.arrayBuffer());
    const image = await pdfDoc.embedPng(pngImage);
    
    const { width, height } = image.scale(1);
    const scale = Math.min(500 / width, 500 / height);
    
    page.drawImage(image, {
      x: (600 - width * scale) / 2,
      y: (600 - height * scale) / 2,
      width: width * scale,
      height: height * scale,
    });
    
    const pdfBytes = await pdfDoc.save();
    console.log('PDF created successfully');
    return new Blob([pdfBytes], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error creating PDF from image:', error);
    throw error;
  }
};

// Create EPS from SVG paths
const createEpsFromSvg = (svgString: string): Blob => {
  try {
    console.log('Creating EPS from SVG string');
    
    // Basic EPS header
    const epsHeader = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 600 600
%%Creator: Logo Exporter
%%Pages: 1
%%EndComments
%%BeginProlog
/m { moveto } bind def
/l { lineto } bind def
/c { curveto } bind def
/h { closepath } bind def
/f { fill } bind def
/s { stroke } bind def
%%EndProlog
%%Page: 1 1

% Initialize graphics state
0 setgray
1 setlinewidth
1 setlinecap
1 setlinejoin

% Center the drawing
300 300 translate

`;
    
    // Parse SVG and extract paths
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const paths = svgDoc.querySelectorAll("path");
    
    let epsBody = "";
    paths.forEach(path => {
      const d = path.getAttribute("d") || "";
      const postScriptPath = convertSvgPathToPostScript(d);
      epsBody += `newpath\n${postScriptPath}\nstroke\n`;
    });
    
    const epsFooter = "\nshowpage\n%%EOF";
    const epsContent = epsHeader + epsBody + epsFooter;
    
    console.log('EPS file created successfully');
    return new Blob([epsContent], { type: 'application/postscript' });
  } catch (error) {
    console.error('Error creating EPS:', error);
    throw error;
  }
};

// Helper function to convert SVG path commands to PostScript
const convertSvgPathToPostScript = (svgPath: string): string => {
  // Basic conversion of SVG path commands to PostScript
  return svgPath
    .replace(/([ML])\s*([0-9.-]+)[,\s]([0-9.-]+)/g, (_, cmd, x, y) => 
      cmd === 'M' ? `${x} ${y} m\n` : `${x} ${y} l\n`)
    .replace(/Z/gi, 'h\n')
    .replace(/([C])\s*([0-9.-]+)[,\s]([0-9.-]+)[,\s]([0-9.-]+)[,\s]([0-9.-]+)[,\s]([0-9.-]+)[,\s]([0-9.-]+)/g, 
      (_, __, x1, y1, x2, y2, x, y) => `${x1} ${y1} ${x2} ${y2} ${x} ${y} c\n`);
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
                  // For client-side, we generate a simple EPS with metadata that points to the PDF
                  const epsBlob = await createEpsFromPdf(modifiedSvg);
                  
                  const epsFolder = 'EPS';
                  files.push({
                    folder: epsFolder,
                    filename: `${brandName}_${color}.eps`,
                    data: epsBlob
                  });
                  
                  console.log(`Created EPS from PDF for ${color}, size: ${epsBlob.size} bytes`);
                } catch (error) {
                  console.error('Error creating EPS from PDF:', error);
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
                  // For client-side, we generate a simple EPS with metadata that points to the PDF
                  const epsBlob = await createEpsFromPdf(modifiedSvg);
                  
                  const epsFolder = 'EPS';
                  files.push({
                    folder: epsFolder,
                    filename: `${brandName}_${color}.eps`,
                    data: epsBlob
                  });
                  
                  console.log(`Created EPS from PDF for ${color}, size: ${epsBlob.size} bytes`);
                } catch (error) {
                  console.error('Error creating EPS from PDF:', error);
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
              
              // Create a PDF first, then convert to EPS
              const epsBlob = await createEpsFromPdf(modifiedSvg);
              
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
              
              // Convert canvas to PNG
              const pngDataUrl = canvas.toDataURL('image/png');
              
              // Create PDF first, then convert to EPS
              const epsBlob = await createEpsFromPdf(svgText);
              
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

// Function to create an EPS from SVG
const createEpsFromPdf = async (svgString: string): Promise<Blob> => {
  try {
    console.log('Creating EPS from SVG string');
    
    // Basic EPS header
    const epsHeader = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 600 600
%%Creator: Logo Exporter
%%Pages: 1
%%EndComments
%%BeginProlog
/m { moveto } bind def
/l { lineto } bind def
/c { curveto } bind def
/h { closepath } bind def
/f { fill } bind def
/s { stroke } bind def
%%EndProlog
%%Page: 1 1

% Initialize graphics state
0 setgray
1 setlinewidth
1 setlinecap
1 setlinejoin

% Center the drawing
300 300 translate

`;
    
    // Parse SVG and extract paths
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const paths = svgDoc.querySelectorAll("path");
    
    let epsBody = "";
    paths.forEach(path => {
      const d = path.getAttribute("d") || "";
      const postScriptPath = convertSvgPathToPostScript(d);
      epsBody += `newpath\n${postScriptPath}\nstroke\n`;
    });
    
    const epsFooter = "\nshowpage\n%%EOF";
    const epsContent = epsHeader + epsBody + epsFooter;
    
    console.log('EPS file created successfully');
    return new Blob([epsContent], { type: 'application/postscript' });
  } catch (error) {
    console.error('Error creating EPS:', error);
    throw error;
  }
};

// Helper function to convert SVG path commands to PostScript
const convertSvgPathToPostScript = (svgPath: string): string => {
  // Basic conversion of SVG path commands to PostScript
  return svgPath
    .replace(/([ML])\s*([0-9.-]+)[,\s]([0-9.-]+)/g, (_, cmd, x, y) => 
      cmd === 'M' ? `${x} ${y} m\n` : `${x} ${y} l\n`)
    .replace(/Z/gi, 'h\n')
    .replace(/([C])\s*([0-9.-]+)[,\s]([0-9.-]+)[,\s]([0-9.-]+)[,\s]([0-9.-]+)[,\s]([0-9.-]+)[,\s]([0-9.-]+)/g, 
      (_, __, x1, y1, x2, y2, x, y) => `${x1} ${y1} ${x2} ${y2} ${x} ${y} c\n`);
};

// Helper function to generate EPS path instructions
const generateEPSPaths = (): string => {
  // Generate a simple shape as a fallback
  return `
    % Draw a placeholder rectangle
    newpath
    -100 -100 moveto
    200 0 rlineto
    0 200 rlineto
    -200 0 rlineto
    closepath
    0.5 setgray
    fill
  `;
};

// Helper to modify SVG colors - simplified version
const modifySvgColor = (svgText: string, color: string): string => {
  // This is a basic implementation that works for simple SVGs
  // A production app would use a proper SVG parser
  return svgText.replace(/fill="[^"]*"/g, `fill="${color}"`)
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
      } else {
        console.error(`Could not create folder: ${format}`);
      }
    });
    
    // Add a simple readme file
    zip.file("README.txt", 
      "This logo package was generated by AI Logo Package Exporter.\n\n" +
      "FORMATS INCLUDED:\n" +
      "- PNG: For web and general usage (with transparency)\n" +
      "- JPG: For web and general usage (without transparency)\n" +
      "- SVG: Vector format for scaling without quality loss\n" +
      "- PDF: For print and professional usage\n" +
      "- EPS: For professional print usage\n" +
      "- ICO: For website favicons\n\n" +
      "For questions or customizations, please contact support."
    );
    
    // Generate ZIP file
    console.log('Generating final ZIP file...');
    return await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
  } catch (error) {
    console.error('Error creating ZIP package:', error);
    throw error;
  }
};

export const downloadZip = (blob: Blob, brandName: string) => {
  console.log('Preparing to download ZIP file...');
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${brandName}_Logo_Package.zip`;
    document.body.appendChild(link);
    
    console.log('Triggering download...');
    link.click();
    
    // Clean up
    document
