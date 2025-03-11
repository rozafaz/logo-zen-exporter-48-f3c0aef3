
import JSZip from 'jszip';
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
  console.log('Processing logo file:', logoFile.name, logoFile.type);
  
  try {
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
              canvas.width = Math.round(baseWidth * scaleFactor);
              canvas.height = Math.round(baseHeight * scaleFactor);
              
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
            const svgText = await logoFile.text();
            let modifiedSvg = svgText;
            
            // Apply color modifications if needed
            if (color === 'Black') {
              modifiedSvg = modifySvgColor(svgText, '#000000');
            } else if (color === 'White') {
              modifiedSvg = modifySvgColor(svgText, '#FFFFFF');
            } else if (color === 'Grayscale' && colors.includes('Grayscale')) {
              modifiedSvg = modifySvgColor(svgText, '#808080');
            } else if (color === 'Inverted' && colors.includes('Inverted')) {
              modifiedSvg = invertSvgColors(svgText);
            }
            
            const svgBlob = new Blob([modifiedSvg], { type: 'image/svg+xml' });
            
            const formatFolder = 'SVG';
            files.push({
              folder: formatFolder,
              filename: `${brandName}_${color}.svg`,
              data: svgBlob
            });
            
            console.log(`Created SVG file for ${color} variation`);
          } catch (error) {
            console.error('Error processing SVG:', error);
          }
        }
        // Handle ICO files (favicon)
        else if (format === 'ICO') {
          try {
            // Set canvas to standard favicon sizes
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
            
            console.log(`Created ICO placeholder (as PNG) of size ${pngBlob.size} bytes`);
            
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
        // Create placeholder PDF files
        else if (format === 'PDF') {
          try {
            // Create a simple placeholder PDF for client-side
            // In a real app, you would use a server for proper PDF generation
            const pdfPlaceholder = 
              `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000010 00000 n
0000000053 00000 n
0000000102 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
178
%%EOF
`;
            
            const pdfBlob = new Blob([pdfPlaceholder], { type: 'application/pdf' });
            
            const formatFolder = 'PDF';
            files.push({
              folder: formatFolder,
              filename: `${brandName}_${color}.pdf`,
              data: pdfBlob
            });
            
            console.log(`Created PDF placeholder for ${color}`);
          } catch (error) {
            console.error('Error creating PDF placeholder:', error);
          }
        }
        // Create placeholder EPS files
        else if (format === 'EPS') {
          try {
            // Create a simple placeholder EPS for client-side
            // In a real app, you would use a server for proper EPS generation
            const epsPlaceholder = 
              `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 100 100
%%Creator: Logo Exporter
%%Title: ${brandName} Logo (${color})
%%Pages: 0
%%EndComments
% This is a placeholder EPS file. A server-side implementation would be needed for actual EPS export.
`;
            
            const epsBlob = new Blob([epsPlaceholder], { type: 'application/postscript' });
            
            const formatFolder = 'EPS';
            files.push({
              folder: formatFolder,
              filename: `${brandName}_${color}.eps`,
              data: epsBlob
            });
            
            console.log(`Created EPS placeholder for ${color}`);
          } catch (error) {
            console.error('Error creating EPS placeholder:', error);
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
