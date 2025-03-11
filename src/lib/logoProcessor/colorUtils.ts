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

// Function to modify the color of an SVG
export const modifySvgColor = (svgString: string, newColor: string): string => {
  try {
    // Replace fill colors
    let modifiedSvg = svgString.replace(/fill="[^"]*"/g, `fill="${newColor}"`);
    
    // Replace stroke colors
    modifiedSvg = modifiedSvg.replace(/stroke="[^"]*"/g, `stroke="${newColor}"`);
    
    return modifiedSvg;
  } catch (error) {
    console.error('Error modifying SVG color:', error);
    return svgString;
  }
};

// Function to invert the colors of an SVG
export const invertSvgColors = (svgString: string): string => {
  try {
    // Use a regular expression to find and replace all color values
    let modifiedSvg = svgString.replace(/(fill|stroke)="(#([0-9a-fA-F]{3}){1,2}|[a-zA-Z]+)"/g, (match, p1, color) => {
      // Convert the color to RGB
      const rgb = hexToRgb(color);
      if (!rgb) return match;
      
      // Invert the RGB values
      const invertedR = 255 - rgb.r;
      const invertedG = 255 - rgb.g;
      const invertedB = 255 - rgb.b;
      
      // Convert the inverted RGB values back to hex
      const invertedHex = `#${invertedR.toString(16).padStart(2, '0')}${invertedG.toString(16).padStart(2, '0')}${invertedB.toString(16).padStart(2, '0')}`;
      
      return `${p1}="${invertedHex}"`;
    });
    
    return modifiedSvg;
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
