
# Logo Processor Backend

This is a Node.js/Express server that handles logo processing for the Logo Package Exporter application. It processes SVG and raster images to generate various formats (SVG, PDF, PNG, JPG, ICO) with different color variations.

## Setup

1. Install dependencies:
```
npm install
```

2. Start the server:
```
npm run dev
```

The server will start on port 5000 by default (can be changed by setting the PORT environment variable).

## API Endpoints

### POST /api/process-logo

Processes a logo file and returns a ZIP package with all the generated files.

**Request:**
- Content-Type: multipart/form-data
- Body:
  - `logo`: The logo file (SVG or raster image)
  - `settings`: JSON string with the following structure:
    ```json
    {
      "formats": ["SVG", "PDF", "PNG", "JPG", "ICO"],
      "colors": ["original", "Black", "White"],
      "resolutions": ["72dpi", "300dpi"],
      "brandName": "Brand"
    }
    ```

**Response:**
- Content-Type: application/zip
- Body: ZIP file containing all generated files organized in folders

## Dependencies

- express: Web server framework
- cors: CORS middleware
- multer: File upload handling
- jszip: ZIP file creation
- pdf-lib: PDF generation
- puppeteer: Browser automation for rendering
- svgo: SVG optimization

## License

MIT
