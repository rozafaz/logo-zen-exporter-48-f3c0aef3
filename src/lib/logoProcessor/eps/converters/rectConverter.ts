
import { setPostScriptColor, convertSvgTransform } from '../epsSvgHelpers';

export const convertRectElement = (
  element: Element,
  baseFillColor: string,
  svgHeight: number
): string => {
  const x = parseFloat(element.getAttribute('x') || '0');
  const y = parseFloat(element.getAttribute('y') || '0');
  const width = parseFloat(element.getAttribute('width') || '0');
  const height = parseFloat(element.getAttribute('height') || '0');
  const rx = parseFloat(element.getAttribute('rx') || '0');
  const ry = parseFloat(element.getAttribute('ry') || rx.toString());
  
  if (width <= 0 || height <= 0) return '';
  
  const transforms = element.getAttribute('transform');
  const rectFill = element.getAttribute('fill') || baseFillColor;
  const rectStroke = element.getAttribute('stroke');
  const strokeWidth = element.getAttribute('stroke-width');
  
  let output = 'gsave\n';
  
  if (transforms) {
    output += convertSvgTransform(transforms);
  }
  
  output += setPostScriptColor(rectFill);
  
  const psY = svgHeight - y - height;
  
  if (rx > 0 && ry > 0) {
    output += 'newpath\n';
    
    // Bottom-left to bottom-right
    output += `${(x + rx).toFixed(3)} ${psY.toFixed(3)} moveto\n`;
    output += `${(x + width - rx).toFixed(3)} ${psY.toFixed(3)} lineto\n`;
    
    // Bottom-right corner arc
    output += `${(x + width).toFixed(3)} ${psY.toFixed(3)} ${rx.toFixed(3)} 270 360 arc\n`;
    
    // Right side
    output += `${(x + width).toFixed(3)} ${(psY + height - ry).toFixed(3)} lineto\n`;
    
    // Top-right corner arc
    output += `${(x + width - rx).toFixed(3)} ${(psY + height).toFixed(3)} ${rx.toFixed(3)} 0 90 arc\n`;
    
    // Top side
    output += `${(x + rx).toFixed(3)} ${(psY + height).toFixed(3)} lineto\n`;
    
    // Top-left corner arc
    output += `${x.toFixed(3)} ${(psY + height - ry).toFixed(3)} ${rx.toFixed(3)} 90 180 arc\n`;
    
    // Left side
    output += `${x.toFixed(3)} ${(psY + ry).toFixed(3)} lineto\n`;
    
    // Bottom-left corner arc
    output += `${(x + rx).toFixed(3)} ${psY.toFixed(3)} ${rx.toFixed(3)} 180 270 arc\n`;
    
    output += 'closepath\n';
  } else {
    output += 'newpath\n';
    output += `${x.toFixed(3)} ${psY.toFixed(3)} moveto\n`;
    output += `${(x + width).toFixed(3)} ${psY.toFixed(3)} lineto\n`;
    output += `${(x + width).toFixed(3)} ${(psY + height).toFixed(3)} lineto\n`;
    output += `${x.toFixed(3)} ${(psY + height).toFixed(3)} lineto\n`;
    output += 'closepath\n';
  }
  
  if (rectFill && rectFill !== 'none') {
    output += 'fill\n';
  }
  
  if (rectStroke && rectStroke !== 'none') {
    output += setPostScriptColor(rectStroke);
    if (strokeWidth) {
      const parsedWidth = parseFloat(strokeWidth);
      if (!isNaN(parsedWidth)) {
        output += `${parsedWidth.toFixed(3)} setlinewidth\n`;
      }
    }
    output += 'stroke\n';
  } else if (!rectFill || rectFill === 'none') {
    output += 'stroke\n';
  }
  
  output += 'grestore\n';
  return output;
};
