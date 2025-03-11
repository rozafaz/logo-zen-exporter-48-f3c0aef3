
export * from './pathConverter';
export * from './rectConverter';
export * from './circleConverter';
export * from './ellipseConverter';
export * from './lineConverter';
export * from './polygonConverter';

import { convertPathElement } from './pathConverter';
import { convertRectElement } from './rectConverter';
import { convertCircleElement } from './circleConverter';
import { convertEllipseElement } from './ellipseConverter';
import { convertLineElement } from './lineConverter';
import { convertPolygonElement } from './polygonConverter';

export const convertElements = (
  elements: Element[],
  baseFillColor: string,
  svgHeight: number,
  elementType = 'path'
): string => {
  let output = '';
  
  elements.forEach(element => {
    // Skip invisible elements
    if (element.getAttribute('display') === 'none' || 
        element.getAttribute('visibility') === 'hidden') {
      return;
    }
    
    switch (elementType) {
      case 'path':
        output += convertPathElement(element, baseFillColor, svgHeight);
        break;
      case 'rect':
        output += convertRectElement(element, baseFillColor, svgHeight);
        break;
      case 'circle':
        output += convertCircleElement(element, baseFillColor, svgHeight);
        break;
      case 'ellipse':
        output += convertEllipseElement(element, baseFillColor, svgHeight);
        break;
      case 'line':
        output += convertLineElement(element, baseFillColor, svgHeight);
        break;
      case 'polygon':
        output += convertPolygonElement(element, baseFillColor, svgHeight, true);
        break;
      case 'polyline':
        output += convertPolygonElement(element, baseFillColor, svgHeight, false);
        break;
      default:
        console.warn('Unsupported SVG element type:', elementType);
    }
  });
  
  return output;
};
