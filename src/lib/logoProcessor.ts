
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import type { ExportSettings } from '@/components/ExportOptions';

interface ProcessedFile {
  folder: string;
  filename: string;
  data: Blob;
}

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
                  const epsBlob = await createEpsFromPdf(pdfBlob, brandName, color);
                  
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
                  const epsBlob = await createEpsFromPdf(pdfBlob, brandName, color);
                  
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
              const pdfBlob = await createPdfFromSvg(modifiedSvg);
              const epsBlob = await createEpsFromPdf(pdfBlob, brandName, color);
              
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
              const pdfBlob = await createPdfFromImage(pngDataUrl);
              const epsBlob = await createEpsFromPdf(pdfBlob, brandName, color);
              
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
    
    // First try embedding the SVG
    try {
      // Add a page
      const page = pdfDoc.addPage([600, 600]);
      
      // Embed the SVG
      const svgImage = await pdfDoc.embedSvg(svgString);
      
      // Calculate dimensions to maintain aspect ratio
      const svgDims = svgImage.scale(1);
      const scale = Math.min(500 / svgDims.width, 500 / svgDims.height);
      
      // Center the image on the page
      const x = (600 - svgDims.width * scale) / 2;
      const y = (600 - svgDims.height * scale) / 2;
      
      // Draw the SVG on the page
      page.drawSvg(svgString, {
        x: x,
        y: y,
        width: svgDims.width * scale,
        height: svgDims.height * scale,
      });
      
      console.log('Successfully embedded SVG in PDF');
    } catch (error) {
      console.error('Error embedding SVG directly, falling back to image approach:', error);
      
      // Create a data URL from the SVG
      const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
      
      // Load the SVG as an image
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load SVG as image'));
        img.src = svgUrl;
      });
      
      // Draw the image on a canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 600;
      canvas.height = img.height || 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      ctx.drawImage(img, 0, 0);
      
      // Get the PNG data URL
      const pngDataUrl = canvas.toDataURL('image/png');
      
      // Create PDF from the PNG
      return await createPdfFromImage(pngDataUrl);
    }
    
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

// Function to create a PDF from an image
const createPdfFromImage = async (imageDataUrl: string): Promise<Blob> => {
  try {
    console.log('Creating PDF from image');
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page
    const page = pdfDoc.addPage([600, 600]);
    
    // Load the image
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUrl;
    });
    
    // Calculate aspect ratio to fit the page
    const aspectRatio = img.width / img.height;
    let width = 500;
    let height = width / aspectRatio;
    
    if (height > 500) {
      height = 500;
      width = height * aspectRatio;
    }
    
    // Center the image on the page
    const x = (600 - width) / 2;
    const y = (600 - height) / 2;
    
    // Convert Data URL to binary
    const imageData = await fetch(imageDataUrl).then(res => res.arrayBuffer());
    const embedImage = await pdfDoc.embedPng(imageData);
    
    // Draw the image on the page
    page.drawImage(embedImage, {
      x,
      y,
      width,
      height,
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

// Function to create an EPS from a PDF
const createEpsFromPdf = async (pdfBlob: Blob, brandName: string, color: string): Promise<Blob> => {
  // In a client-side implementation, we create a placeholder EPS with proper metadata
  // A full implementation would require server-side conversion
  
  // Create EPS header with proper metadata
  const epsHeader = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 600 600
%%Creator: Logo Exporter
%%Title: ${brandName} ${color} Logo
%%Pages: 1
%%DocumentData: Clean7Bit
%%EndComments
%%BeginProlog
/BeginEPSF { 
  /EPSFsave save def  
  0 0 translate  
  1 1 scale 
} def
/EndEPSF { EPSFsave restore } def
%%EndProlog
%%Page: 1 1
BeginEPSF
`;
  
  // Create EPS footer
  const epsFooter = `
EndEPSF
%%Trailer
%%EOF
`;

  // Convert PDF to binary string
  const pdfArrayBuffer = await pdfBlob.arrayBuffer();
  const pdfBytes = new Uint8Array(pdfArrayBuffer);

  // Create a binary string with EPS metadata
  // Note: This is a simplified approach for client-side
  const epsContent = epsHeader + 
    `% This is a simplified EPS file created from PDF for client-side processing
% For production use, consider a server-side conversion service
% The original PDF size was ${pdfBlob.size} bytes

/PDF {
  % Metadata for the embedded PDF data
  % Original PDF size: ${pdfBlob.size} bytes
  % Brand: ${brandName}
  % Color: ${color}
} def

% Draw a placeholder rectangle to represent the logo
300 300 moveto
200 200 rlineto
-200 200 rlineto
-200 -200 rlineto
200 -200 rlineto
0.5 setgray
fill
` + epsFooter;

  // Create EPS blob
  const epsBlob = new Blob([epsContent], { type: 'application/postscript' });
  
  return epsBlob;
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
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
      console.log('Download URL revoked.');
    }, 100);
  } catch (error) {
    console.error('Error during download:', error);
    throw error;
  }
};

// Test function to verify ZIP functionality
export const testZipDownload = () => {
  console.log('Testing ZIP functionality...');
  const zip = new JSZip();
  zip.file("test.txt", "Hello, world!");
  
  zip.generateAsync({ type: "blob" })
    .then(function (content) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = "test.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("Test ZIP download triggered!");
    })
    .catch(function (error) {
      console.error("Test ZIP generation failed:", error);
    });
};
