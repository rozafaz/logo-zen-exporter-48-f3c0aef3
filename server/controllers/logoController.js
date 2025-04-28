const path = require('path');
const fs = require('fs').promises;
const JSZip = require('jszip');
const { processLogoFile } = require('../services/logoProcessor');

/**
 * Process logo controller
 * Handles file upload and processing, returns a ZIP file with all generated formats
 * Supported formats now include: SVG, PNG, EPS, PDF, etc.
 */
exports.processLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const settings = JSON.parse(req.body.settings);
    console.log('Processing with settings:', settings);

    const { path: filePath, originalname: fileName, mimetype: fileType } = req.file;

    console.log(`Processing ${fileName} (${fileType}), file saved at: ${filePath}`);

    try {
      const processedFiles = await processLogoFile(filePath, fileName, fileType, settings);

      const zip = new JSZip();
      for (const file of processedFiles) {
        // ensure folder exists in archive
        if (!zip.folder(file.folder)) {
          zip.folder(file.folder);
        }
        zip.file(`${file.folder}/${file.filename}`, file.data);
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

      await fs.unlink(filePath).catch(err => {
        console.warn(`Could not delete uploaded file ${filePath}:`, err.message);
      });

      res.setHeader('Content-Disposition', `attachment; filename=${settings.brandName}_logo_package.zip`);
      res.setHeader('Content-Type', 'application/zip');
      res.send(zipBuffer);

      console.log(`Successfully processed ${fileName} and sent ZIP package`);
    } catch (error) {
      await fs.unlink(filePath).catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error('Error in logo processing:', error);
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
    res.status(500).json({
      success: false,
      message: 'Error processing logo',
      error: error.message
    });
  }
};