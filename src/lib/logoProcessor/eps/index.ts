
// Export all EPS-related functionality
export * from './epsCore';
export { getSvgDimensions } from './epsSvgHelpers';
export { 
  createEpsHeader,
  createEpsFooter,
  createPlaceholderShape,
  createFallbackEps,
  setPostScriptColor
} from './epsFormatters';
export {
  convertPathToPostScript,
  convertElementsToPostScript
} from './epsPathConverters';
