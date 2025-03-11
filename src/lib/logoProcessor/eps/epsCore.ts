
import type { ProcessedFile } from '../types';
import { getSvgDimensions, prepareSvgElement, extractGradients, processClipPaths } from './epsSvgHelpers';
import { createEpsHeader, createEpsFooter, setPostScriptColor, createPlaceholderShape, createFallbackEps } from './epsFormatters';
import { convertPathToPostScript, convertElementsToPostScript } from './epsPathConverters';
import { optimizeSvgPaths, simplifyPath } from '../svgUtils';

/**
 * Creates an EPS file from SVG content with enhanced precision
 */
export const createEpsFromSvg = async (
  svgText: string,
  color: string,
  brandName: string
): Promise<ProcessedFile[]> => {
  const files: ProcessedFile[] = [];
  
  try {
    console.log('Generating high-quality EPS file from SVG for', color);
    
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
    if (epsBlob.size < 10000) {
      console.warn('Warning: EPS file size might be too small:', epsBlob.size, 'bytes');
    }
  } catch (error) {
    console.error('Error creating EPS from SVG:', error);
    
    // Create a fallback EPS if conversion fails
    const fallbackEps = createFallbackEps();
    const fallbackBlob = new Blob([fallbackEps], { type: 'application/postscript' });
    
    const formatFolder = 'EPS';
    files.push({
      folder: formatFolder,
      filename: `${brandName}_${color}_fallback.eps`,
      data: fallbackBlob
    });
    
    console.log('Created fallback EPS file due to conversion error');
  }
  
  return files;
};

/**
 * Convert SVG content to EPS format with enhanced accuracy
 */
export const convertSvgToEps = (svgContent: string, color: string): string => {
  try {
    console.log('Starting improved SVG to EPS conversion with high precision');
    
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
    
    // Extract gradients and patterns for emulation in EPS
    const gradients = extractGradients(svgDoc);
    console.log(`Found ${Object.keys(gradients).length} gradients in SVG`);
    
    // Extract clip paths
    const clipPaths = processClipPaths(svgDoc);
    console.log(`Found ${Object.keys(clipPaths).length} clip paths in SVG`);
    
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
    const elementSelectors = [
      { type: 'path', selector: 'path' },
      { type: 'rect', selector: 'rect' },
      { type: 'circle', selector: 'circle' },
      { type: 'ellipse', selector: 'ellipse' },
      { type: 'line', selector: 'line' },
      { type: 'polyline', selector: 'polyline' },
      { type: 'polygon', selector: 'polygon' }
    ];
    
    const elementCounts: Record<string, number> = {};
    
    // Process all element types and count them
    elementSelectors.forEach(({ type, selector }) => {
      const elements = Array.from(svgDoc.querySelectorAll(selector));
      elementCounts[type] = elements.length;
    });
    
    console.log('Found SVG elements:', elementCounts);
    
    // Setup for SVG coordinate system transformation
    epsContent += `% Setup for SVG coordinate system (origin at top-left)\n`;
    epsContent += `gsave\n\n`;
    
    // Set default line attributes for better quality
    epsContent += `2 setlinecap % Round line caps for better quality\n`;
    epsContent += `2 setlinejoin % Round line joins for better quality\n`;
    epsContent += `0.5 setlinewidth % Default line width\n\n`;
    
    // Process elements in proper order for layering
    // First defs and clip paths
    epsContent += `% Define clip paths if needed\n`;
    Object.entries(clipPaths).forEach(([id, clipPathContent]) => {
      if (clipPathContent) {
        epsContent += `% ClipPath definition: ${id}\n`;
        epsContent += `gsave\n${clipPathContent}\nclip\ngrestore\n\n`;
      }
    });
    
    // Process elements in Z-order from back to front
    elementSelectors.forEach(({ type, selector }) => {
      const elements = Array.from(svgDoc.querySelectorAll(selector));
      if (elements.length > 0) {
        console.log(`Processing SVG ${type} elements (${elements.length} found)...`);
        epsContent += `% Processing ${elements.length} ${type} elements\n`;
        epsContent += convertElementsToPostScript(elements, fillColor, dimensions.height, type);
        epsContent += `\n`;
      }
    });
    
    // Add placeholder if no content was processed
    const totalElements = Object.values(elementCounts).reduce((sum, count) => sum + count, 0);
    if (totalElements === 0) {
      console.warn('No vector elements found in SVG, adding placeholder');
      epsContent += createPlaceholderShape(dimensions.width, dimensions.height);
    }
    
    // Close main graphics state
    epsContent += `\ngrestore % End SVG coordinate system\n`;
    
    // Add EPS footer
    epsContent += createEpsFooter();
    
    console.log('Enhanced EPS conversion complete, content length:', epsContent.length);
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
  // SVG paths - optimize for better EPS quality
  const paths = svgDoc.querySelectorAll('path');
  paths.forEach(path => {
    // Get path data
    const pathData = path.getAttribute('d');
    if (pathData) {
      // Simplify path data for better conversion quality
      const simplifiedPathData = simplifyPath(pathData);
      path.setAttribute('d', simplifiedPathData);
      
      // Store original data for reference
      path.setAttribute('data-original-d', pathData);
    }
    
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
        path.setAttribute('stroke-width', '1');
      }
    }
    
    // Store any transforms for processing
    if (path.hasAttribute('transform')) {
      path.setAttribute('data-transform', path.getAttribute('transform') || '');
    }
  });
  
  // Handle viewBox on the SVG element
  const svgElement = svgDoc.querySelector('svg');
  if (svgElement) {
    // Ensure proper viewBox for coordinate system
    if (!svgElement.hasAttribute('viewBox') && 
        svgElement.hasAttribute('width') && 
        svgElement.hasAttribute('height')) {
      const width = parseFloat(svgElement.getAttribute('width') || '0');
      const height = parseFloat(svgElement.getAttribute('height') || '0');
      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
    }
    
    // Process root transform
    if (svgElement.hasAttribute('transform')) {
      svgElement.setAttribute('data-root-transform', svgElement.getAttribute('transform') || '');
    }
  }
  
  // Process group transforms
  const groups = svgDoc.querySelectorAll('g');
  groups.forEach(group => {
    // Collect transforms for groups
    if (group.hasAttribute('transform')) {
      group.setAttribute('data-group-transform', group.getAttribute('transform') || '');
    }
    
    // Handle opacity on groups
    if (group.hasAttribute('opacity')) {
      group.setAttribute('data-opacity', group.getAttribute('opacity') || '1');
    }
  });
  
  // Process other elements for consistent styling
  ['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'].forEach(selector => {
    const elements = svgDoc.querySelectorAll(selector);
    elements.forEach(el => {
      // Ensure stroke styling is consistent
      if (el.hasAttribute('stroke') && el.getAttribute('stroke') !== 'none') {
        if (!el.hasAttribute('stroke-linecap')) {
          el.setAttribute('stroke-linecap', 'round');
        }
        if (!el.hasAttribute('stroke-linejoin')) {
          el.setAttribute('stroke-linejoin', 'round');
        }
        if (!el.hasAttribute('stroke-width')) {
          el.setAttribute('stroke-width', '1');
        }
      }
    });
  });
};
