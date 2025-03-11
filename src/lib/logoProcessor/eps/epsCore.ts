
import type { ProcessedFile } from '../types';
import { getSvgDimensions, prepareSvgElement } from './epsSvgHelpers';
import { createEpsHeader, createEpsFooter, setPostScriptColor, createPlaceholderShape, createFallbackEps } from './epsFormatters';
import { convertPathToPostScript, convertElementsToPostScript } from './epsPathConverters';

/**
 * Creates an EPS file from SVG content
 */
export const createEpsFromSvg = async (
  svgText: string,
  color: string,
  brandName: string
): Promise<ProcessedFile[]> => {
  const files: ProcessedFile[] = [];
  
  try {
    console.log('Generating EPS file from SVG for', color);
    
    // Generate EPS content from SVG
    const epsContent = convertSvgToEps(svgText, color);
    
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
 * Convert SVG content to EPS format
 */
export const convertSvgToEps = (svgContent: string, color: string): string => {
  try {
    console.log('Starting SVG to EPS conversion');
    
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
    
    // Generate EPS header with proper dimensions
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
    
    // We'll handle the coordinate system differently to ensure correct rendering
    epsContent += `% Setup for SVG coordinate system (origin at top-left)\n`;
    epsContent += `gsave\n\n`;
    
    // Convert paths to PostScript
    if (paths.length > 0) {
      console.log('Processing SVG paths...');
      epsContent += convertElementsToPostScript(paths, fillColor, dimensions.height);
    }
    
    // Convert rectangles to PostScript
    if (rects.length > 0) {
      console.log('Processing SVG rectangles...');
      epsContent += convertElementsToPostScript(rects, fillColor, dimensions.height, 'rect');
    }
    
    // Convert circles to PostScript
    if (circles.length > 0) {
      console.log('Processing SVG circles...');
      epsContent += convertElementsToPostScript(circles, fillColor, dimensions.height, 'circle');
    }
    
    // Convert ellipses to PostScript
    if (ellipses.length > 0) {
      console.log('Processing SVG ellipses...');
      epsContent += convertElementsToPostScript(ellipses, fillColor, dimensions.height, 'ellipse');
    }
    
    // Convert lines to PostScript
    if (lines.length > 0) {
      console.log('Processing SVG lines...');
      epsContent += convertElementsToPostScript(lines, fillColor, dimensions.height, 'line');
    }
    
    // Convert polylines to PostScript
    if (polylines.length > 0) {
      console.log('Processing SVG polylines...');
      epsContent += convertElementsToPostScript(polylines, fillColor, dimensions.height, 'polyline');
    }
    
    // Convert polygons to PostScript
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
};
