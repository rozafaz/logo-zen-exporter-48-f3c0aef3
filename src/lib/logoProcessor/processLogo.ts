
import type { ExportSettings, ProcessedFile } from './types';
import { createPdfFromImage, createPdfFromSvg } from './pdfUtils';
import { applyBlackFilter, applyWhiteFilter, applyGrayscaleFilter, applyInvertedFilter, modifySvgColor, invertSvgColors } from './colorUtils';
import { createEpsFromSvg } from './vectorUtils';

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
