
const path = require('path');
const fs = require('fs').promises;
const JSZip = require('jszip');
const { processLogoFile } = require('../services/logoProcessor');

/**
 * Process logo controller
 * Handles file upload and processing, returns a ZIP file with all generated formats
 */
exports.processLogo = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Get settings from request body
    const settings = JSON.parse(req.body.settings);
    console.log('Processing with settings:', settings);
    
    // Process the logo
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype;
    
    console.log(`Processing ${fileName} (${fileType}), file saved at: ${filePath}`);
    
    try {
      // Process the logo and get array of generated files
      const processedFiles = await processLogoFile(filePath, fileName, fileType, settings);
      
      // Create a ZIP archive
      const zip = new JSZip();
      
      // Add files to the ZIP
      for (const file of processedFiles) {
        // Create folder if it doesn't exist in the ZIP
        if (!zip.folder(file.folder)) {
          zip.folder(file.folder);
        }
        
        // Add file to the appropriate folder
        zip.file(`${file.folder}/${file.filename}`, file.data);
      }
      
      // Generate the ZIP file
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      
      // Clean up the uploaded file
      await fs.unlink(filePath).catch(err => {
        console.warn(`Could not delete uploaded file ${filePath}:`, err.message);
      });
      
      // Set headers for ZIP download
      res.setHeader('Content-Disposition', `attachment; filename=${settings.brandName}_logo_package.zip`);
      res.setHeader('Content-Type', 'application/zip');
      
      // Send the ZIP file
      res.send(zipBuffer);
      
      console.log(`Successfully processed ${fileName} and sent ZIP package`);
    } catch (error) {
      // Clean up uploaded file on error
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.warn(`Failed to delete upload on error: ${unlinkError.message}`);
      }
      
      // Re-throw error to be caught by outer catch block
      throw error;
    }
  } catch (error) {
    console.error('Error in logo processing:', error);
    
    // Special handling for Inkscape errors
    if (error.code === 'INKSCAPE_NOT_AVAILABLE') {
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error: Inkscape is not installed',
        error: error.message
      });
    }
    
    if (error.message.startsWith('Invalid SVG')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    // Handle other errors
    res.status(500).json({ 
      success: false, 
      message: 'Error processing logo', 
      error: error.message 
    });
  }
};
