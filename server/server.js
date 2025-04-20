
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { processLogo } = require('./controllers/logoController');
const { execFile } = require('child_process');
const util = require('util');

const execFileAsync = util.promisify(execFile);
const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer storage with cleanup
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// Diagnostic endpoint to check if Inkscape is available
app.get('/api/check-inkscape', async (req, res) => {
  try {
    // Try to execute inkscape --version
    const { stdout } = await execFileAsync('inkscape', ['--version'], { timeout: 5000 });
    res.json({ 
      success: true, 
      message: 'Inkscape is available', 
      version: stdout.trim(),
      serverStatus: 'Server is running correctly'
    });
  } catch (error) {
    console.error('Inkscape check failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Inkscape not available',
      error: error.message,
      code: error.code,
      serverStatus: 'Server is running but Inkscape is not available'
    });
  }
});

// Server health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.post('/api/process-logo', upload.single('logo'), processLogo);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.message === 'Inkscape not found') {
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: Inkscape is not installed',
      error: err.message
    });
  }
  res.status(500).json({ 
    success: false, 
    message: 'Server error', 
    error: err.message 
  });
});

// Start server
app.listen(port, () => {
  console.log(`Logo processor server running on port ${port}`);
});
