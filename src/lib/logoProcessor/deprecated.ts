
/**
 * DEPRECATED FUNCTIONS
 * 
 * These functions have been moved to the backend server.
 * They are kept here for backward compatibility during the transition.
 * All processing now happens on the server side.
 */

import type { ProcessedFile } from './types';

/**
 * DEPRECATED: This functionality is now handled by the backend
 */
export const processLogo = async (
  logoFile: File, 
  settings: any
): Promise<ProcessedFile[]> => {
  console.warn('processLogo has been moved to the backend server');
  console.log('To process logos, use the exportLogoPackage function in exportHelpers.ts');
  return [];
};

/**
 * DEPRECATED: This functionality is now handled by the backend
 */
export const processPdfFromSvg = async (
  svgText: string,
  color: string,
  brandName: string,
  colors: string[]
): Promise<ProcessedFile[]> => {
  console.warn('processPdfFromSvg has been moved to the backend server');
  return [];
};

/**
 * DEPRECATED: This functionality is now handled by the backend
 */
export const processPdfFromRaster = async (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  originalLogo: HTMLImageElement,
  color: string,
  brandName: string,
  colors: string[]
): Promise<ProcessedFile[]> => {
  console.warn('processPdfFromRaster has been moved to the backend server');
  return [];
};

/**
 * DEPRECATED: This functionality is now handled by the backend
 */
export const processSvgFormat = async (
  svgText: string,
  color: string,
  brandName: string,
  colors: string[]
): Promise<ProcessedFile[]> => {
  console.warn('processSvgFormat has been moved to the backend server');
  return [];
};

/**
 * DEPRECATED: This functionality is now handled by the backend
 */
export const applyColorToSvg = (
  svgText: string,
  color: string,
  colors: string[]
): string => {
  console.warn('applyColorToSvg has been moved to the backend server');
  return svgText;
};
