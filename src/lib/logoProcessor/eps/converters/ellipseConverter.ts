
import { setPostScriptColor, convertSvgTransform } from '../epsSvgHelpers';

export const convertEllipseElement = (
  element: Element,
  baseFillColor: string,
  svgHeight: number
): string => {
  const cx = parseFloat(element.getAttribute('cx') || '0');
  const cy = parseFloat(element.getAttribute('cy') || '0');
  const rx = parseFloat(element.getAttribute('rx') || '0');
  const ry = parseFloat(element.getAttribute('ry') || '0');
  
  if (rx <= 0 || ry <= 0) return '';
  
  const transforms = element.getAttribute('transform');
  const ellipseFill = element.getAttribute('fill') || baseFillColor;
  const ellipseStroke = element.getAttribute('stroke');
  const strokeWidth = element.getAttribute('stroke-width');
  
  let output = 'gsave\n';
  
  if (transforms) {
    output += convertSvgTransform(transforms);
  }
  
  output += setPostScriptColor(ellipseFill);
  
  const psY = svgHeight - cy;
  output += 'newpath\n';
  output += `${cx.toFixed(3)} ${psY.toFixed(3)} translate\n`;
  output += `${rx.toFixed(3)} ${ry.toFixed(3)} scale\n`;
  output += `0 0 1 0 360 arc\n`;
  output += `${(1/rx).toFixed(6)} ${(1/ry).toFixed(6)} scale\n`;
  output += `${(-cx).toFixed(3)} ${(-psY).toFixed(3)} translate\n`;
  output += 'closepath\n';
  
  if (ellipseFill && ellipseFill !== 'none') {
    output += 'fill\n';
  }
  
  if (ellipseStroke && ellipseStroke !== 'none') {
    output += setPostScriptColor(ellipseStroke);
    if (strokeWidth) {
      const parsedWidth = parseFloat(strokeWidth);
      if (!isNaN(parsedWidth)) {
        output += `${parsedWidth.toFixed(3)} setlinewidth\n`;
      }
    }
    output += 'stroke\n';
  } else if (!ellipseFill || ellipseFill === 'none') {
    output += 'stroke\n';
  }
  
  output += 'grestore\n';
  return output;
};
