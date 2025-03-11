
import type { ProcessedFile } from '../types';
import { getSvgDimensions, prepareSvgElement } from './epsSvgHelpers';
import { createEpsHeader, createEpsFooter, setPostScriptColor, createPlaceholderShape, createFallbackEps } from './epsFormatters';
import { convertPathToPostScript, convertElementsToPostScript } from './epsPathConverters';
import { optimizeSvgPaths } from '../svgUtils';

/**
 * Creates an EPS file from SVG content with improved precision
 */
export const createEpsFromSvg = async (
  svgText: string,
  color: string,
  brandName: string
): Promise<ProcessedFile[]> => {
  const files: ProcessedFile[] = [];
  
  try {
    console.log('Generating EPS file from SVG for', color);
    
    // Pre-process and optimize SVG for better conversion
    const optimizedSvg = optimizeSvgPaths(svgText);
    
    // Generate EPS content from optimized SVG
    const epsContent = convertSvgToEps(optimizedSvg, color);
    
    // Create EPS file as a Blob
    const epsBlob = new Blob([epsContent], { type: 'application/postscript' });
    
    const formatFolder = 'EPS';
    files.push({
      folder: formatFolder,
      filename: `${brandName}_${color}.eps`,
      data: epsBlob
    });
    
    console.log(`Created EPS file from SVG for ${color}, size: ${epsBlob.size} bytes`);
    
    // Validate EPS file size
    if (epsBlob.size < 5000) {
      console.warn('Warning: EPS file size is smaller than expected:', epsBlob.size, 'bytes');
    }
  } catch (error) {
    console.error('Error creating EPS from SVG:', error);
  }
  
  return files;
};

/**
 * Convert SVG content to EPS format with improved accuracy
 */
export const convertSvgToEps = (svgContent: string, color: string): string => {
  try {
    console.log('Starting SVG to EPS conversion with improved precision');
    
    // Parse SVG
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
    
    // Check for parsing errors
    const parserError = svgDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('SVG parsing error: ' + parserError.textContent);
    }
    
    const svgElement = svgDoc.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found in the document');
    }
    
    // Get SVG dimensions
    const dimensions = getSvgDimensions(svgElement);
    console.log('SVG dimensions for EPS:', dimensions);
    
    // Preprocess SVG by transforming elements to handle coordinate system differences
    transformSvgForEps(svgDoc, dimensions.height);
    
    // Apply color modification based on the specified color
    let fillColor = '#000000'; // Default black
    if (color === 'Black') fillColor = '#000000';
    else if (color === 'White') fillColor = '#FFFFFF';
    else if (color === 'Grayscale') fillColor = '#808080';
    
    // Generate EPS header with proper dimensions and padding
    let epsContent = createEpsHeader(dimensions.width, dimensions.height);
    
    // Process all SVG elements and convert to PostScript commands
    const paths = Array.from(svgDoc.querySelectorAll('path'));
    const rects = Array.from(svgDoc.querySelectorAll('rect'));
    const circles = Array.from(svgDoc.querySelectorAll('circle'));
    const ellipses = Array.from(svgDoc.querySelectorAll('ellipse'));
    const lines = Array.from(svgDoc.querySelectorAll('line'));
    const polylines = Array.from(svgDoc.querySelectorAll('polyline'));
    const polygons = Array.from(svgDoc.querySelectorAll('polygon'));
    
    console.log(`Found SVG elements: ${paths.length} paths, ${rects.length} rects, ${circles.length} circles, ` +
                `${ellipses.length} ellipses, ${lines.length} lines, ${polylines.length} polylines, ${polygons.length} polygons`);
    
    // Setup for SVG coordinate system transformation
    epsContent += `% Setup for SVG coordinate system (origin at top-left)\n`;
    epsContent += `gsave\n\n`;
    
    // Set default line attributes for better quality
    epsContent += `1 setlinecap\n`;
    epsContent += `1 setlinejoin\n`;
    epsContent += `0.5 setlinewidth\n\n`;
    
    // Convert paths to PostScript with improved precision
    if (paths.length > 0) {
      console.log('Processing SVG paths...');
      epsContent += convertElementsToPostScript(paths, fillColor, dimensions.height);
    }
    
    // Convert other elements
    if (rects.length > 0) {
      console.log('Processing SVG rectangles...');
      epsContent += convertElementsToPostScript(rects, fillColor, dimensions.height, 'rect');
    }
    
    if (circles.length > 0) {
      console.log('Processing SVG circles...');
      epsContent += convertElementsToPostScript(circles, fillColor, dimensions.height, 'circle');
    }
    
    if (ellipses.length > 0) {
      console.log('Processing SVG ellipses...');
      epsContent += convertElementsToPostScript(ellipses, fillColor, dimensions.height, 'ellipse');
    }
    
    if (lines.length > 0) {
      console.log('Processing SVG lines...');
      epsContent += convertElementsToPostScript(lines, fillColor, dimensions.height, 'line');
    }
    
    if (polylines.length > 0) {
      console.log('Processing SVG polylines...');
      epsContent += convertElementsToPostScript(polylines, fillColor, dimensions.height, 'polyline');
    }
    
    if (polygons.length > 0) {
      console.log('Processing SVG polygons...');
      epsContent += convertElementsToPostScript(polygons, fillColor, dimensions.height, 'polygon');
    }
    
    // Add placeholder if no content was processed
    if (paths.length === 0 && rects.length === 0 && circles.length === 0 &&
        ellipses.length === 0 && lines.length === 0 && polylines.length === 0 && polygons.length === 0) {
      console.warn('No vector elements found in SVG, adding placeholder');
      epsContent += createPlaceholderShape(dimensions.width, dimensions.height);
    }
    
    // Close main graphics state
    epsContent += `\ngrestore\n`;
    
    // Add EPS footer
    epsContent += createEpsFooter();
    
    console.log('EPS conversion complete, content length:', epsContent.length);
    return epsContent;
  } catch (error) {
    console.error('Error in SVG to EPS conversion:', error);
    // Return a fallback/placeholder EPS file
    return createFallbackEps();
  }
};

/**
 * Transform SVG elements to prepare for EPS conversion
 * This helps address coordinate system differences between SVG and PostScript
 */
const transformSvgForEps = (svgDoc: Document, svgHeight: number): void => {
  // For paths that need special handling for coordinate systems
  const paths = svgDoc.querySelectorAll('path');
  paths.forEach(path => {
    // Ensure path has proper attributes
    if (!path.hasAttribute('fill') && !path.hasAttribute('stroke')) {
      path.setAttribute('fill', '#000000');
    }
    
    // Set line join and cap for better quality
    if (path.hasAttribute('stroke') && path.getAttribute('stroke') !== 'none') {
      if (!path.hasAttribute('stroke-linecap')) {
        path.setAttribute('stroke-linecap', 'round');
      }
      if (!path.hasAttribute('stroke-linejoin')) {
        path.setAttribute('stroke-linejoin', 'round');
      }
      // Ensure stroke width is specified
      if (!path.hasAttribute('stroke-width')) {
        path.setAttribute('stroke-width', '0.5');
      }
    }
    
    // Preserve original data for debugging
    if (path.hasAttribute('d')) {
      path.setAttribute('data-original-d', path.getAttribute('d') || '');
    }
    
    // Check for transforms and store for later processing
    if (path.hasAttribute('transform')) {
      path.setAttribute('data-transform', path.getAttribute('transform') || '');
    }
  });
  
  // Apply any other transformations needed for proper conversion
  const svgElement = svgDoc.querySelector('svg');
  if (svgElement) {
    // Check if viewBox is present, if not and we have width/height, create one
    if (!svgElement.hasAttribute('viewBox') && 
        svgElement.hasAttribute('width') && 
        svgElement.hasAttribute('height')) {
      const width = svgElement.getAttribute('width');
      const height = svgElement.getAttribute('height');
      if (width && height) {
        // Remove any units (px, pt, etc.)
        const w = parseFloat(width);
        const h = parseFloat(height);
        if (!isNaN(w) && !isNaN(h)) {
          svgElement.setAttribute('viewBox', `0 0 ${w} ${h}`);
        }
      }
    }
    
    // Extract and handle any transforms on the SVG element itself
    if (svgElement.hasAttribute('transform')) {
      const transform = svgElement.getAttribute('transform');
      svgElement.setAttribute('data-root-transform', transform || '');
    }
  }
  
  // Also handle transforms on groups that may contain our target elements
  const groups = svgDoc.querySelectorAll('g');
  groups.forEach(group => {
    if (group.hasAttribute('transform')) {
      group.setAttribute('data-group-transform', group.getAttribute('transform') || '');
    }
  });
  
  // Fix line style attributes for other elements
  ['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'].forEach(selector => {
    const elements = svgDoc.querySelectorAll(selector);
    elements.forEach(el => {
      if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
        if (!el.hasAttribute('stroke-linecap')) {
          el.setAttribute('stroke-linecap', 'round');
        }
        if (!el.hasAttribute('stroke-linejoin')) {
          el.setAttribute('stroke-linejoin', 'round');
        }
        if (!el.hasAttribute('stroke-width')) {
          el.setAttribute('stroke-width', '0.5');
        }
      }
    });
  });
};
