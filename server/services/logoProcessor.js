
const path = require('path');
const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');
const puppeteer = require('puppeteer');
const { optimize } = require('svgo');
const cheerio = require('cheerio');

/**
 * Main function to process a logo file
 */
exports.processLogoFile = async (filePath, fileName, fileType, settings) => {
  const { formats, colors, resolutions, brandName } = settings;
  const processedFiles = [];
  
  try {
    console.log(`Starting server-side processing of ${fileName}`);
    
    // Read the file content
    const fileContent = await fs.readFile(filePath);
    
    // Determine if it's an SVG or raster image
    const isSvg = fileType === 'image/svg+xml' || fileName.toLowerCase().endsWith('.svg');
    
    // Process SVG
    if (isSvg) {
      const svgText = fileContent.toString('utf8');

    // Validate XML syntax
    try {
        cheerio.load(svgText, { xmlMode: true });
    } catch (err) {
        console.error('SVG validation failed:', err);
        throw new Error('Invalid SVG file: malformed XML');
    }
    // --------------------------------
      
      // Process for each color variation
      for (const color of colors) {
        console.log(`Processing ${color} color variation`);
        
        // Handle different formats
        for (const format of formats) {
          if (format === 'SVG') {
            // Process SVG format
            const svgFiles = await processSvgFormat(svgText, color, brandName);
            processedFiles.push(...svgFiles);
          }
          
          if (format === 'PDF') {
            // Process PDF format from SVG
            const pdfFiles = await processPdfFromSvg(svgText, color, brandName);
            processedFiles.push(...pdfFiles);
          }
          
          if (['PNG', 'JPG'].includes(format)) {
            // Process raster formats from SVG
            const rasterFiles = await processRasterFromSvg(
              svgText, format, color, resolutions, brandName
            );
            processedFiles.push(...rasterFiles);
          }
          
          if (format === 'ICO' && (color === 'original' || color === 'Black')) {
            // Process ICO format from SVG
            const icoFiles = await processIcoFromSvg(svgText, color, brandName);
            processedFiles.push(...icoFiles);
          }
        }
      }
    } else {
      // It's a raster image
      // Launch headless browser for image processing
      const browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();
      
      // Create data URL from file content
      const base64Image = fileContent.toString('base64');
      const dataUrl = `data:${fileType};base64,${base64Image}`;
      
      // Load image to get dimensions
      await page.setContent(`<img src="${dataUrl}" id="logoImage">`);
      const dimensions = await page.evaluate(() => {
        const img = document.getElementById('logoImage');
        return { width: img.naturalWidth, height: img.naturalHeight };
      });
      
      // Process for each color variation
      for (const color of colors) {
        console.log(`Processing ${color} color variation for raster image`);
        
        for (const format of formats) {
          if (['PNG', 'JPG'].includes(format)) {
            // Process raster formats
            const rasterFiles = await processRasterFromRaster(
              dataUrl, dimensions, format, color, resolutions, brandName
            );
            processedFiles.push(...rasterFiles);
          }
          
          if (format === 'PDF') {
            // Process PDF from raster
            const pdfFiles = await processPdfFromRaster(
              dataUrl, dimensions, color, brandName
            );
            processedFiles.push(...pdfFiles);
          }
          
          if (format === 'ICO' && (color === 'original' || color === 'Black')) {
            // Process ICO from raster
            const icoFiles = await processIcoFromRaster(
              dataUrl, dimensions, color, brandName
            );
            processedFiles.push(...icoFiles);
          }
        }
      }
      
      await browser.close();
    }
    
    console.log(`Generated ${processedFiles.length} files`);
    return processedFiles;
  } catch (error) {
    console.error('Error in processLogoFile:', error);
    throw error;
  }
};

/**
 * Process SVG format with different color variations
 */
async function processSvgFormat(svgText, color, brandName) {
  const files = [];
  
  try {
    console.log('Processing SVG file');
    
    // Optimize and clean SVG
    let optimizedSvg = await optimizeSvg(svgText);
    
    // Apply color modifications
    let modifiedSvg = await applySvgColor(optimizedSvg, color);
    
    const svgBlob = Buffer.from(modifiedSvg);
    
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
  
  return files;
}

/**
 * Process PDF format from SVG input with true vector preservation
 */
async function processPdfFromSvg(svgText, color, brandName) {
  const files = [];
  
  try {
    console.log('Generating vector PDF from SVG for color:', color);
    
    // Apply color modifications
    let modifiedSvg = await applySvgColor(svgText, color);
    
    // Create PDF with puppeteer
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Inject the SVG into a basic HTML page
    await page.setContent(`
      <html>
        <body style="margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh;">
          ${modifiedSvg}
        </body>
      </html>
    `);
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });
    
    await browser.close();
    
    const formatFolder = 'PDF';
    files.push({
      folder: formatFolder,
      filename: `${brandName}_${color}.pdf`,
      data: pdfBuffer
    });
    
    console.log(`Created vector PDF from SVG for ${color}`);
  } catch (error) {
    console.error('Error creating PDF from SVG:', error);
  }
  
  return files;
}

/**
 * Process raster formats (PNG, JPG) from SVG
 */
async function processRasterFromSvg(svgText, format, color, resolutions, brandName) {
  const files = [];
  
  try {
    // Apply color modifications
    let modifiedSvg = await applySvgColor(svgText, color);
    
    // Launch browser
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Get SVG dimensions
    const svgDimensions = await getSvgDimensions(modifiedSvg);
    console.log('SVG dimensions:', svgDimensions);
    
    // Set viewport size
    await page.setViewport({
      width: svgDimensions.width,
      height: svgDimensions.height
    });
    
    // Inject SVG
    await page.setContent(`
      <html>
        <body style="margin: 0; background: transparent;">
          ${modifiedSvg}
        </body>
      </html>
    `);
    
    // Process for each resolution
    for (const resolution of resolutions) {
      // Calculate scale based on DPI
      const dpi = parseInt(resolution.replace('dpi', ''));
      const scale = dpi / 72; // 72 is the default screen DPI
      
      // Calculate dimensions
      const width = Math.round(svgDimensions.width * scale);
      const height = Math.round(svgDimensions.height * scale);
      
      // Set screenshot options
      const screenshotOptions = {
        type: format.toLowerCase(),
        omitBackground: format === 'PNG', // For PNG, we want transparency
        quality: format === 'JPG' ? 90 : undefined,
        clip: {
          x: 0,
          y: 0,
          width: svgDimensions.width,
          height: svgDimensions.height
        }
      };
      
      // Take screenshot
      const imageBuffer = await page.screenshot(screenshotOptions);
      
      // Save file
      const formatFolder = format;
      files.push({
        folder: formatFolder,
        filename: `${brandName}_${color}_${resolution}.${format.toLowerCase()}`,
        data: imageBuffer
      });
      
      console.log(`Created ${format} from SVG for ${color} at ${resolution}`);
    }
    
    await browser.close();
  } catch (error) {
    console.error(`Error processing ${format} from SVG:`, error);
  }
  
  return files;
}

/**
 * Process ICO format from SVG
 */
async function processIcoFromSvg(svgText, color, brandName) {
  const files = [];
  
  try {
    // Apply color modifications
    let modifiedSvg = await applySvgColor(svgText, color);
    
    // Launch browser
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Set viewport to standard favicon sizes
    await page.setViewport({ width: 256, height: 256 });
    
    // Inject SVG
    await page.setContent(`
      <html>
        <body style="margin: 0; display: flex; justify-content: center; align-items: center;">
          ${modifiedSvg}
        </body>
      </html>
    `);
    
    // Take screenshot as PNG
    const pngBuffer = await page.screenshot({
      type: 'png',
      omitBackground: true
    });
    
    await browser.close();
    
    // Since full ICO creation is complex, we'll just provide the PNG for now
    // In a production environment, you'd convert this to ICO server-side
    const formatFolder = 'ICO';
    files.push({
      folder: formatFolder,
      filename: `${brandName}_${color}.png`, // Using PNG as a substitute for ICO
      data: pngBuffer
    });
    
    console.log(`Created ICO (as PNG) from SVG for ${color}`);
  } catch (error) {
    console.error('Error creating ICO from SVG:', error);
  }
  
  return files;
}

/**
 * Process raster formats from raster image
 */
async function processRasterFromRaster(dataUrl, dimensions, format, color, resolutions, brandName) {
  const files = [];
  
  try {
    // Launch browser
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({
      width: dimensions.width,
      height: dimensions.height
    });
    
    // Create HTML with image and apply color filter
    await page.setContent(`
      <html>
        <head>
          <style>
            body { margin: 0; background: transparent; }
            .logo-container {
              width: ${dimensions.width}px;
              height: ${dimensions.height}px;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .logo-img {
              max-width: 100%;
              max-height: 100%;
              ${color !== 'original' ? getColorFilterCSS(color) : ''}
            }
          </style>
        </head>
        <body>
          <div class="logo-container">
            <img src="${dataUrl}" class="logo-img" />
          </div>
        </body>
      </html>
    `);
    
    // Process for each resolution
    for (const resolution of resolutions) {
      // Calculate scale based on DPI
      const dpi = parseInt(resolution.replace('dpi', ''));
      const scale = dpi / 72;
      
      // Set screenshot options
      const screenshotOptions = {
        type: format.toLowerCase(),
        omitBackground: format === 'PNG',
        quality: format === 'JPG' ? 90 : undefined
      };
      
      // Take screenshot
      const imageBuffer = await page.screenshot(screenshotOptions);
      
      // Save file
      const formatFolder = format;
      files.push({
        folder: formatFolder,
        filename: `${brandName}_${color}_${resolution}.${format.toLowerCase()}`,
        data: imageBuffer
      });
      
      console.log(`Created ${format} from raster for ${color} at ${resolution}`);
    }
    
    await browser.close();
  } catch (error) {
    console.error(`Error processing ${format} from raster:`, error);
  }
  
  return files;
}

/**
 * Process PDF format from raster input
 */
async function processPdfFromRaster(dataUrl, dimensions, color, brandName) {
  const files = [];
  
  try {
    // Launch browser
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Create HTML with image and apply color filter
    await page.setContent(`
      <html>
        <head>
          <style>
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            .logo-img {
              max-width: 80%;
              max-height: 80%;
              ${color !== 'original' ? getColorFilterCSS(color) : ''}
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" class="logo-img" />
        </body>
      </html>
    `);
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });
    
    await browser.close();
    
    const formatFolder = 'PDF';
    files.push({
      folder: formatFolder,
      filename: `${brandName}_${color}.pdf`,
      data: pdfBuffer
    });
    
    console.log(`Created PDF from raster for ${color}`);
  } catch (error) {
    console.error('Error creating PDF from raster:', error);
  }
  
  return files;
}

/**
 * Process ICO format from raster
 */
async function processIcoFromRaster(dataUrl, dimensions, color, brandName) {
  const files = [];
  
  try {
    // Launch browser
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Set viewport to standard favicon size
    await page.setViewport({ width: 256, height: 256 });
    
    // Create HTML with image and apply color filter
    await page.setContent(`
      <html>
        <head>
          <style>
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background: transparent;
            }
            .logo-img {
              max-width: 64px;
              max-height: 64px;
              ${color !== 'original' ? getColorFilterCSS(color) : ''}
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" class="logo-img" />
        </body>
      </html>
    `);
    
    // Take screenshot
    const pngBuffer = await page.screenshot({
      type: 'png',
      omitBackground: true
    });
    
    await browser.close();
    
    // Similar to the SVG version, we provide a PNG as a substitute for ICO
    const formatFolder = 'ICO';
    files.push({
      folder: formatFolder,
      filename: `${brandName}_${color}.png`,
      data: pngBuffer
    });
    
    console.log(`Created ICO (as PNG) from raster for ${color}`);
  } catch (error) {
    console.error('Error creating ICO from raster:', error);
  }
  
  return files;
}

/**
 * Helper function to optimize SVG
 */
async function optimizeSvg(svgText) {
  try {
    const result = optimize(svgText, {
      multipass: true,
      plugins: [
        'preset-default',
        'removeDimensions',
        {
          name: 'removeViewBox',
          active: false
        },
        {
          name: 'convertPathData',
          params: {
            floatPrecision: 3
          }
        }
      ]
    });
    
    return result.data;
  } catch (error) {
    console.error('Error optimizing SVG:', error);
    return svgText;
  }
}

/**
 * Helper function to apply color to SVG
 */
async function applySvgColor(svgText, color) {
  try {
    if (color.toLowerCase() === 'original') {
      return svgText;
    }
    
    const { JSDOM } = require('jsdom');

    const dom = new JSDOM(svgText, { contentType: 'image/svg+xml' });
    const document = dom.window.document;

    const newColor = color.toLowerCase() === 'black' ? '#000000'
                    : color.toLowerCase() === 'white' ? '#FFFFFF'
                    : color.toLowerCase() === 'grayscale' ? '#808080'
                    : color;

    // Modify each element except the root <svg> element
    document.querySelectorAll('*').forEach(el => {
      if (el.tagName.toLowerCase() !== 'svg') {
        el.setAttribute('fill', newColor);
        if (el.hasAttribute('stroke') && el.getAttribute('stroke').toLowerCase() !== 'none') {
          el.setAttribute('stroke', newColor);
        }
        // Optionally, remove any conflicting inline style for fill, if present
        if (el.hasAttribute('style')) {
          const updatedStyle = el.getAttribute('style').replace(/fill\s*:\s*[^;]+;?/gi, '');
          el.setAttribute('style', updatedStyle);
        }
      }
    });
    
    // Return the modified SVG as a string
    return document.documentElement.outerHTML;
  } catch (error) {
    console.error('Error applying color to SVG:', error);
    return svgText;
  }
}

/**
 * Helper function to get SVG dimensions
 */
async function getSvgDimensions(svgText) {
  try {
    // Extract dimensions from viewBox or width/height attributes
    const viewBoxMatch = svgText.match(/viewBox=["']([^"']+)["']/);
    if (viewBoxMatch && viewBoxMatch[1]) {
      const [, , width, height] = viewBoxMatch[1].split(/\s+/).map(Number);
      if (!isNaN(width) && !isNaN(height)) {
        return { width, height };
      }
    }
    
    // Try to get from width/height attributes
    const widthMatch = svgText.match(/width=["']([^"']+)["']/);
    const heightMatch = svgText.match(/height=["']([^"']+)["']/);
    
    let width = 600;
    let height = 600;
    
    if (widthMatch && widthMatch[1]) {
      width = parseFloat(widthMatch[1]);
    }
    
    if (heightMatch && heightMatch[1]) {
      height = parseFloat(heightMatch[1]);
    }
    
    return { width, height };
  } catch (error) {
    console.error('Error getting SVG dimensions:', error);
    return { width: 600, height: 600 };
  }
}

/**
 * Helper function to get CSS for color filters
 */
function getColorFilterCSS(color) {
  if (color === 'Black') {
    return `
      filter: brightness(0) saturate(100%);
    `;
  } else if (color === 'White') {
    return `
      filter: brightness(0) saturate(100%) invert(1);
    `;
  } else if (color === 'Grayscale') {
    return `
      filter: grayscale(100%);
    `;
  } else if (color.startsWith('#')) {
    // This is a simplified approach - full color replacement would need more complex logic
    return `
      filter: opacity(0.5) drop-shadow(0 0 0 ${color});
    `;
  }
  
  return '';
}
