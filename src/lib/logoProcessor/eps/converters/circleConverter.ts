
import { setPostScriptColor, convertSvgTransform } from '../epsSvgHelpers';

export const convertCircleElement = (
  element: Element,
  baseFillColor: string,
  svgHeight: number
): string => {
  const cx = parseFloat(element.getAttribute('cx') || '0');
  const cy = parseFloat(element.getAttribute('cy') || '0');
  const r = parseFloat(element.getAttribute('r') || '0');
  
  if (r <= 0) return '';
  
  const transforms = element.getAttribute('transform');
  const circleFill = element.getAttribute('fill') || baseFillColor;
  const circleStroke = element.getAttribute('stroke');
  const strokeWidth = element.getAttribute('stroke-width');
  
  let output = 'gsave\n';
  
  if (transforms) {
    output += convertSvgTransform(transforms);
  }
  
  output += setPostScriptColor(circleFill);
  
  const psY = svgHeight - cy;
  output += 'newpath\n';
  output += `${cx.toFixed(3)} ${psY.toFixed(3)} ${r.toFixed(3)} 0 360 arc\n`;
  output += 'closepath\n';
  
  if (circleFill && circleFill !== 'none') {
    output += 'fill\n';
  }
  
  if (circleStroke && circleStroke !== 'none') {
    output += setPostScriptColor(circleStroke);
    if (strokeWidth) {
      const parsedWidth = parseFloat(strokeWidth);
      if (!isNaN(parsedWidth)) {
        output += `${parsedWidth.toFixed(3)} setlinewidth\n`;
      }
    }
    output += 'stroke\n';
  } else if (!circleFill || circleFill === 'none') {
    output += 'stroke\n';
  }
  
  output += 'grestore\n';
  return output;
};
