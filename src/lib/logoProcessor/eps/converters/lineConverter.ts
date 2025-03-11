
import { setPostScriptColor, convertSvgTransform } from '../epsSvgHelpers';

export const convertLineElement = (
  element: Element,
  baseFillColor: string,
  svgHeight: number
): string => {
  const x1 = parseFloat(element.getAttribute('x1') || '0');
  const y1 = parseFloat(element.getAttribute('y1') || '0');
  const x2 = parseFloat(element.getAttribute('x2') || '0');
  const y2 = parseFloat(element.getAttribute('y2') || '0');
  
  const transforms = element.getAttribute('transform');
  const lineStroke = element.getAttribute('stroke') || baseFillColor;
  const strokeWidth = element.getAttribute('stroke-width');
  
  let output = 'gsave\n';
  
  if (transforms) {
    output += convertSvgTransform(transforms);
  }
  
  output += setPostScriptColor(lineStroke);
  
  output += 'newpath\n';
  output += `${x1.toFixed(3)} ${(svgHeight - y1).toFixed(3)} moveto\n`;
  output += `${x2.toFixed(3)} ${(svgHeight - y2).toFixed(3)} lineto\n`;
  
  if (strokeWidth) {
    const parsedWidth = parseFloat(strokeWidth);
    if (!isNaN(parsedWidth)) {
      output += `${parsedWidth.toFixed(3)} setlinewidth\n`;
    }
  }
  
  output += 'stroke\n';
  output += 'grestore\n';
  return output;
};
