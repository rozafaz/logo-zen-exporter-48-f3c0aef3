
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
    canvas.width = originalLogo.width || 300; // Fallback size
    canvas.height = originalLogo.height || 300; // Fallback size
    
    // Process each color variation
    for (const color of colors) {
      console.log(`Processing ${color} color variation`);
      
      for (const format of formats) {
        // Handle raster formats (PNG, JPG)
        if (['PNG', 'JPG'].includes(format)) {
          console.log(`Generating ${format} files for ${color}`);
          
          for (const resolution of resolutions) {
            try {
              // Clear canvas and draw image
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(originalLogo, 0, 0);
              
              // Apply color variations
              if (color === 'Black') {
                applyBlackFilter(ctx, canvas.width, canvas.height);
              } else if (color === 'White') {
                applyWhiteFilter(ctx, canvas.width, canvas.height);
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
              
              console.log(`Created ${format} blob of size ${blob.size} bytes`);
              
              files.push({
                folder: getFolderName(color),
                filename: `${brandName}_${color}_${format}_${resolution}.${format.toLowerCase()}`,
                data: blob
              });
            } catch (error) {
              console.error(`Error processing ${format} in ${resolution}:`, error);
            }
          }
        } 
        // Handle SVG files
        else if (format === 'SVG' && logoFile.type === 'image/svg+xml') {
          console.log('Including original SVG file');
          // For SVG, we use the original file but need to read and potentially modify it
          try {
            const svgText = await logoFile.text();
            let modifiedSvg = svgText;
            
            // Apply color modifications if needed
            if (color === 'Black') {
              // Simple replacement - in a real app this would be more sophisticated
              modifiedSvg = modifySvgColor(svgText, '#000000');
            } else if (color === 'White') {
              modifiedSvg = modifySvgColor(svgText, '#FFFFFF');
            }
            
            const svgBlob = new Blob([modifiedSvg], { type: 'image/svg+xml' });
            
            files.push({
              folder: getFolderName(color),
              filename: `${brandName}_${color}_${format}.svg`,
              data: svgBlob
            });
          } catch (error) {
            console.error('Error processing SVG:', error);
          }
        }
        // We'll skip EPS and PDF since they require server-side processing
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

const getFolderName = (color: string): string => {
  switch (color) {
    case 'Original':
      return 'Primary Logo';
    case 'Black':
    case 'White':
      return 'Black & White Versions';
    default:
      return 'Variations';
  }
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

export const createZipPackage = async (files: ProcessedFile[]): Promise<Blob> => {
  console.log('Creating ZIP package...');
  try {
    const zip = new JSZip();
    
    // Add files to their respective folders
    files.forEach(file => {
      const folder = zip.folder(file.folder);
      if (folder) {
        folder.file(file.filename, file.data);
        console.log(`Added ${file.filename} to ${file.folder} folder`);
      } else {
        console.error(`Could not create folder: ${file.folder}`);
      }
    });
    
    // Add a simple readme file
    zip.file("README.txt", "This logo package was generated by AI Logo Package Exporter.");
    
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
