
import { setPostScriptColor, convertSvgTransform } from '../epsSvgHelpers';

export const convertPolygonElement = (
  element: Element,
  baseFillColor: string,
  svgHeight: number,
  isPolygon: boolean = true
): string => {
  const points = element.getAttribute('points');
  if (!points) return '';
  
  const transforms = element.getAttribute('transform');
  const fill = element.getAttribute('fill') || (isPolygon ? baseFillColor : 'none');
  const stroke = element.getAttribute('stroke') || baseFillColor;
  const strokeWidth = element.getAttribute('stroke-width');
  
  let output = 'gsave\n';
  
  if (transforms) {
    output += convertSvgTransform(transforms);
  }
  
  const pointPairs = points.trim().split(/\s+|,/);
  if (pointPairs.length < 2) return '';
  
  output += 'newpath\n';
  
  for (let i = 0; i < pointPairs.length; i += 2) {
    if (i + 1 >= pointPairs.length) break;
    
    const x = parseFloat(pointPairs[i]);
    const y = parseFloat(pointPairs[i + 1]);
    
    if (isNaN(x) || isNaN(y)) continue;
    
    if (i === 0) {
      output += `${x.toFixed(3)} ${(svgHeight - y).toFixed(3)} moveto\n`;
    } else {
      output += `${x.toFixed(3)} ${(svgHeight - y).toFixed(3)} lineto\n`;
    }
  }
  
  if (isPolygon) {
    output += 'closepath\n';
  }
  
  if (fill && fill !== 'none') {
    output += setPostScriptColor(fill);
    output += 'fill\n';
  }
  
  if (stroke && stroke !== 'none') {
    output += setPostScriptColor(stroke);
    if (strokeWidth) {
      const parsedWidth = parseFloat(strokeWidth);
      if (!isNaN(parsedWidth)) {
        output += `${parsedWidth.toFixed(3)} setlinewidth\n`;
      }
    }
    output += 'stroke\n';
  } else if (!fill || fill === 'none') {
    output += 'stroke\n';
  }
  
  output += 'grestore\n';
  return output;
};
