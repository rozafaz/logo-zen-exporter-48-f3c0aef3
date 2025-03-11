
import { PDFDocument } from 'pdf-lib';

// Function to create a PDF from SVG text
export const createPdfFromSvg = async (svgString: string): Promise<Blob> => {
  try {
    console.log('Creating PDF from SVG, length:', svgString.length);
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 600]);
    
    // Convert SVG to PNG for embedding
    // First, create a data URL from the SVG
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    
    // Load the SVG as an image
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load SVG as image'));
      img.src = svgUrl;
    });
    
    // Draw the image on a canvas at high resolution
    const canvas = document.createElement('canvas');
    canvas.width = img.width * 4; // Higher resolution
    canvas.height = img.height * 4;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Get the PNG data URL
    const pngDataUrl = canvas.toDataURL('image/png');
    
    // Embed the PNG into the PDF
    const pngData = await fetch(pngDataUrl).then(res => res.arrayBuffer());
    const pngImage = await pdfDoc.embedPng(pngData);
    
    // Calculate dimensions to maintain aspect ratio
    const pngDims = pngImage.scale(1);
    const scale = Math.min(500 / pngDims.width, 500 / pngDims.height);
    
    // Center the image on the page
    const x = (600 - pngDims.width * scale) / 2;
    const y = (600 - pngDims.height * scale) / 2;
    
    // Draw the image
    page.drawImage(pngImage, {
      x,
      y,
      width: pngDims.width * scale,
      height: pngDims.height * scale,
    });
    
    // Save the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Create a Blob from the PDF bytes
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    console.log('PDF created successfully, size:', pdfBlob.size, 'bytes');
    return pdfBlob;
  } catch (error) {
    console.error('Error in createPdfFromSvg:', error);
    throw error;
  }
};

// Function to create a PDF from an image data URL
export const createPdfFromImage = async (imageDataUrl: string): Promise<Blob> => {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 600]);
    
    // Embed the image into the PDF
    const imgData = await fetch(imageDataUrl).then(res => res.arrayBuffer());
    const img = await pdfDoc.embedPng(imgData);
    
    // Calculate dimensions to maintain aspect ratio
    const imgDims = img.scale(1);
    const scale = Math.min(500 / imgDims.width, 500 / imgDims.height);
    
    // Center the image on the page
    const x = (600 - imgDims.width * scale) / 2;
    const y = (600 - imgDims.height * scale) / 2;
    
    // Draw the image
    page.drawImage(img, {
      x,
      y,
      width: imgDims.width * scale,
      height: imgDims.height * scale,
    });
    
    // Save the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    
    // Create a Blob from the PDF bytes
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    console.log('PDF created successfully from image, size:', pdfBlob.size, 'bytes');
    return pdfBlob;
  } catch (error) {
    console.error('Error in createPdfFromImage:', error);
    throw error;
  }
};
