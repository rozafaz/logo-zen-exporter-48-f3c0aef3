
# AI Logo Package Exporter

An application for automating logo export workflow with precision and efficiency. This application processes logo files in various formats and colors for professional branding packages.

## Frontend

A React application that provides a user interface for:
- Uploading logo files
- Setting export options (formats, colors, resolutions)
- Previewing generated files
- Downloading the final ZIP package

The frontend is built with:
- React
- TypeScript
- Tailwind CSS
- shadcn/ui components

## Backend

A Node.js/Express server that handles the actual logo processing:
- Receives logo files and export settings from the frontend
- Processes logos into various formats and color variations
- Generates a ZIP package with all files
- Sends the ZIP back to the frontend for download

The backend uses:
- Express.js for API endpoints
- Multer for file uploads
- Puppeteer for rendering and capturing images
- SVGO for SVG optimization
- PDF-lib for PDF creation
- JSZip for creating ZIP archives

## Getting Started

### Frontend

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm run dev
```

### Backend

1. Navigate to the server directory:
```
cd server
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

The backend server will run on port 5000 by default.

## Configuration

The frontend connects to the backend API at `http://localhost:5000` by default. To change this:

1. Update the `API_URL` constant in `src/lib/exportHelpers.ts`

## Deployment

### Frontend

Build the frontend for production:
```
npm run build
```

### Backend

For production deployment, consider:
- Setting environment variables
- Using a process manager like PM2
- Setting up a reverse proxy with Nginx or similar

## License

MIT
