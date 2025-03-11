
import JSZip from 'jszip';
import type { ProcessedFile } from './types';

export const createZipPackage = async (files: ProcessedFile[]): Promise<Blob> => {
  console.log('Creating ZIP package...');
  try {
    const zip = new JSZip();
    
    // Group files by format
    const filesByFormat = files.reduce((acc: Record<string, ProcessedFile[]>, file) => {
      const format = file.folder;
      if (!acc[format]) {
        acc[format] = [];
      }
      acc[format].push(file);
      return acc;
    }, {});
    
    // Add files to their respective format folders
    Object.entries(filesByFormat).forEach(([format, formatFiles]) => {
      const folder = zip.folder(format);
      if (folder) {
        formatFiles.forEach(file => {
          folder.file(file.filename, file.data);
          console.log(`Added ${file.filename} to ${format} folder`);
        });
      }
    });
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    console.log(`ZIP package created successfully, size: ${zipBlob.size} bytes`);
    
    return zipBlob;
  } catch (error) {
    console.error('Error creating ZIP package:', error);
    throw error;
  }
};

export const downloadZip = (zipBlob: Blob, brandName: string): void => {
  try {
    // Create a URL for the blob
    const url = URL.createObjectURL(zipBlob);
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brandName}_LogoPackage.zip`;
    
    // Append to the document, click, and clean up
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Download initiated for ZIP file');
  } catch (error) {
    console.error('Error downloading ZIP:', error);
    throw error;
  }
};

// Function for testing ZIP download (for development)
export const testZipDownload = (): void => {
  try {
    console.log('Testing ZIP download...');
    
    const zip = new JSZip();
    
    // Add a text file for testing
    zip.file('test.txt', 'This is a test file for ZIP download functionality.');
    
    // Add a small SVG
    const testSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
      <circle cx="25" cy="25" r="20" fill="blue" />
    </svg>`;
    
    zip.file('test.svg', testSvg);
    
    // Generate and download the ZIP
    zip.generateAsync({ type: 'blob' }).then(blob => {
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test_download.zip';
      
      // Append to the document, click, and clean up
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Test ZIP download complete');
    }).catch(err => {
      console.error('Error in test ZIP download:', err);
    });
  } catch (error) {
    console.error('Error testing ZIP download:', error);
    throw error;
  }
};
