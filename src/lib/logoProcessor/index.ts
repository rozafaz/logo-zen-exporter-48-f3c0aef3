
// Export all functionality from the module

// Export placeholders for backward compatibility
export * from './deprecated';
export * from './zipUtils';
export * from './types';

// Remove exports of modules that are now handled on the server
// export * from './colorUtils';
// export * from './vectorUtils';
// export * from './pdfUtils';
// export * from './rasterUtils';
// export * from './svgUtils';
// export * from './pdfProcessor';
// export * from './pdf';

/**
 * Test function for ZIP download - Keep for debugging
 */
export const testZipDownload = () => {
  console.log('Test ZIP download initiated');
  try {
    const blob = new Blob(['Test ZIP file content'], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-download.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Test download error:', error);
  }
};
