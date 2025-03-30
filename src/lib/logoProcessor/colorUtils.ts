export const applyBlackFilter = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0;       // red
    data[i + 1] = 0;   // green
    data[i + 2] = 0;   // blue
  }
  
  ctx.putImageData(imageData, 0, 0);
};

export const applyWhiteFilter = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;     // red
    data[i + 1] = 255; // green
    data[i + 2] = 255; // blue
  }
  
  ctx.putImageData(imageData, 0, 0);
};

export const applyGrayscaleFilter = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;       // red
    data[i + 1] = avg;   // green
    data[i + 2] = avg;   // blue
  }
  
  ctx.putImageData(imageData, 0, 0);
};

export const applyInvertedFilter = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];       // red
    data[i + 1] = 255 - data[i + 1];   // green
    data[i + 2] = 255 - data[i + 2];   // blue
  }
  
  ctx.putImageData(imageData, 0, 0);
};

// Improved function to modify the color of an SVG
export const modifySvgColor = (svgString: string, newColor: string): string => {
  try {
    console.log(`Modifying SVG colors to: ${newColor}`);
    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    
    // Check for parsing errors
    const parserError = svgDoc.querySelector('parsererror');
    if (parserError) {
      console.error('SVG parsing error:', parserError.textContent);
      // Use basic string replacement as fallback
      console.log('Using fallback string replacement for color modification');
      let modifiedSvg = svgString.replace(/fill="[^"]*"/g, `fill="${newColor}"`);
      modifiedSvg = modifiedSvg.replace(/stroke="[^"]*"/g, `stroke="${newColor}"`);
      return modifiedSvg;
    }
    
    // Count elements before modification
    const beforeCount = svgDoc.querySelectorAll('*').length;
    console.log(`SVG contains ${beforeCount} elements before color modification`);
    
    // Function to override fill and stroke for an element
    function overrideElementColor(el: Element) {
      // Skip SVG root element
      if (el.tagName === 'svg') return;
      
      // Remove inline styles that may conflict
      if (el.hasAttribute('style')) {
        el.removeAttribute('style');
      }
      
      // Set fill and stroke attributes
      if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') {
        el.setAttribute('fill', newColor);
        console.log(`Set fill="${newColor}" on ${el.tagName} element`);
      } else if (!el.hasAttribute('fill')) {
        // Add fill if missing (for most elements except certain ones)
        if (!['clipPath', 'defs', 'g', 'marker', 'mask', 'pattern', 'symbol', 'use'].includes(el.tagName)) {
          el.setAttribute('fill', newColor);
          console.log(`Added fill="${newColor}" to ${el.tagName} element`);
        }
      }
      
      if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
        el.setAttribute('stroke', newColor);
        console.log(`Set stroke="${newColor}" on ${el.tagName} element`);
      }
      
      // Remove any fill-opacity or stroke-opacity that might interfere
      el.removeAttribute('fill-opacity');
      el.removeAttribute('stroke-opacity');
    }
    
    // Process all visual elements
    const visualElements = svgDoc.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon, text, tspan');
    console.log(`Found ${visualElements.length} visual elements to modify`);
    visualElements.forEach(overrideElementColor);
    
    // Process groups (g elements) - they can have fills that affect children
    const groups = svgDoc.querySelectorAll('g');
    console.log(`Found ${groups.length} group elements to modify`);
    groups.forEach(overrideElementColor);
    
    // Remove any style blocks that might override our attributes
    const styleBlocks = svgDoc.querySelectorAll('style');
    styleBlocks.forEach(styleEl => {
      console.log('Removing style block that might override colors');
      styleEl.textContent = '';
    });
    
    // Handle defs section - remove gradients, patterns, etc.
    const defs = svgDoc.querySelectorAll('linearGradient, radialGradient, pattern');
    console.log(`Found ${defs.length} gradient/pattern definitions`);
    defs.forEach(def => {
      // Find elements using this def
      const id = def.getAttribute('id');
      if (id) {
        const users = svgDoc.querySelectorAll(`[fill="url(#${id})"], [stroke="url(#${id})"]`);
        console.log(`Found ${users.length} elements using gradient/pattern #${id}`);
        users.forEach(el => {
          el.setAttribute('fill', newColor);
          console.log(`Replaced gradient with solid color on element`);
          if (el.hasAttribute('stroke') && el.getAttribute('stroke').includes(`url(#${id})`)) {
            el.setAttribute('stroke', newColor);
          }
        });
      }
    });
    
    const result = serializer.serializeToString(svgDoc);
    console.log(`Color modification complete. New SVG length: ${result.length}`);
    console.log(`First 100 chars of modified SVG: ${result.substring(0, 100)}`);
    return result;
  } catch (error) {
    console.error('Error modifying SVG color:', error);
    // Fallback to the basic string replacement if DOM manipulation fails
    console.log('Using emergency fallback for color modification due to error');
    let modifiedSvg = svgString.replace(/fill="[^"]*"/g, `fill="${newColor}"`);
    modifiedSvg = modifiedSvg.replace(/stroke="[^"]*"/g, `stroke="${newColor}"`);
    return modifiedSvg;
  }
};

// Function to invert the colors of an SVG (updated to use DOM manipulation)
export const invertSvgColors = (svgString: string): string => {
  try {
    const parser = new DOMParser();
    const serializer = new XMLSerializer();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    
    // Function to invert the color of an element
    function invertElementColor(el: Element) {
      // Remove inline styles that may conflict
      el.removeAttribute('style');
      
      // Invert fill and stroke attributes
      if (el.tagName !== 'svg') { // Don't invert the root svg element's fill
        const fill = el.getAttribute('fill');
        const stroke = el.getAttribute('stroke');
        
        if (fill) {
          const rgb = hexToRgb(fill);
          if (rgb) {
            const invertedR = 255 - rgb.r;
            const invertedG = 255 - rgb.g;
            const invertedB = 255 - rgb.b;
            el.setAttribute('fill', `#${invertedR.toString(16).padStart(2, '0')}${invertedG.toString(16).padStart(2, '0')}${invertedB.toString(16).padStart(2, '0')}`);
          }
        }
        
        if (stroke && stroke !== 'none') {
          const rgb = hexToRgb(stroke);
          if (rgb) {
            const invertedR = 255 - rgb.r;
            const invertedG = 255 - rgb.g;
            const invertedB = 255 - rgb.b;
            el.setAttribute('stroke', `#${invertedR.toString(16).padStart(2, '0')}${invertedG.toString(16).padStart(2, '0')}${invertedB.toString(16).padStart(2, '0')}`);
          }
        }
      }
      
      // Remove any fill-opacity or stroke-opacity
      el.removeAttribute('fill-opacity');
      el.removeAttribute('stroke-opacity');
    }
    
    // Process all visual elements
    const visualElements = svgDoc.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon, text, tspan, g');
    visualElements.forEach(invertElementColor);
    
    // Remove any style blocks
    const styleBlocks = svgDoc.querySelectorAll('style');
    styleBlocks.forEach(styleEl => {
      styleEl.textContent = '';
    });
    
    // Handle defs section - remove gradients, patterns, etc.
    const defs = svgDoc.querySelectorAll('linearGradient, radialGradient, pattern');
    defs.forEach(def => {
      // Find elements using this def
      const id = def.getAttribute('id');
      if (id) {
        const users = svgDoc.querySelectorAll(`[fill="url(#${id})"], [stroke="url(#${id})"]`);
        users.forEach(el => {
          invertElementColor(el);
        });
      }
    });
    
    return serializer.serializeToString(svgDoc);
  } catch (error) {
    console.error('Error inverting SVG colors:', error);
    return svgString;
  }
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  // Handle shorthand hex (#fff)
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  
  // Handle color names
  if (hex.toLowerCase() === 'white') hex = '#FFFFFF';
  if (hex.toLowerCase() === 'black') hex = '#000000';
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};
