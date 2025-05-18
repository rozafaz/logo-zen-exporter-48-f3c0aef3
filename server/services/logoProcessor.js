const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const util = require('util');
const { execFile } = require('child_process');
const cheerio = require('cheerio');
const crypto = require('crypto');

const execFileAsync = util.promisify(execFile);
const INKSCAPE_PATH = 'inkscape';

/**
 * Check if Inkscape is installed and available
 */
async function checkInkscapeAvailability() {
  try {
    const { stdout } = await execFileAsync(INKSCAPE_PATH, ['--version']);
    console.log('Inkscape installation detected:', stdout.trim());
    return { available: true, version: stdout.trim() };
  } catch (error) {
    console.error('Inkscape not available:', error.message);
    const e = new Error('Inkscape not found');
    e.code = 'INKSCAPE_NOT_AVAILABLE';
    throw e;
  }
}

/**
 * Process a logo SVG into multiple formats, colors, and resolutions.
 */
exports.processLogoFile = async (filePath, fileName, fileType, settings) => {
  const { formats, colors, resolutions, brandName } = settings;
  const outputFiles = [];

  // Only SVG inputs
  if (!(fileType === 'image/svg+xml' || fileName.toLowerCase().endsWith('.svg'))) {
    throw new Error('Only SVG inputs are supported');
  }

  await checkInkscapeAvailability();

  const svgText = await fs.readFile(filePath, 'utf8');
  try { cheerio.load(svgText, { xmlMode: true }); } catch {
    throw new Error('Invalid SVG: malformed XML');
  }

  for (const color of colors) {
    console.log(`Processing color variation: ${color}`);
    const transformedSvg = transformSvgColor(svgText, color);
    const tempPath = await writeTempFile(transformedSvg, 'svg');

    for (const format of formats) {
      for (const res of resolutions) {
        const dpi = parseInt(res, 10);
        const label = isNaN(dpi) ? 'vector' : `${dpi}dpi`;
        try {
          if (format === 'SVG') {
            // Native SVG output
            outputFiles.push({
              folder: 'SVG',
              filename: `${brandName}_${color}_${label}.svg`,
              data: Buffer.from(transformedSvg, 'utf8')
            });
          } else {
            // Other formats (PNG, EPS, PDF, etc.)
            const ext = format.toLowerCase();      // -> 'png', 'eps', etc.
            const out = tempPath.replace(/\.svg$/, `_${label}.${ext}`);
            const args = [`--export-type=${ext}`];

            // Only PNG needs DPI
            if (ext === 'png') {
              args.push('--export-dpi', String(isNaN(dpi) ? 300 : dpi));
            }

            args.push('--export-area-drawing', '--export-area-page');
            args.push(`--export-filename=${out}`);

            console.log(`Running Inkscape command: inkscape ${args.join(' ')} ${tempPath}`);

            await execFileAsync(INKSCAPE_PATH, [tempPath, ...args], {
              timeout: 30000
            });

            const data = await fs.readFile(out);
            outputFiles.push({
              folder: format.toUpperCase(),
              filename: `${brandName}_${color}_${label}.${ext}`,
              data
            });
            await fs.unlink(out);
          }
        } catch (inkscapeError) {
          console.error(`Error exporting ${format}@${label} for ${color}:`, inkscapeError);
          throw new Error(`Inkscape failed to convert to ${format}: ${inkscapeError.message}`);
        }
      }
    }

    try {
      await fs.unlink(tempPath);
    } catch (error) {
      console.warn(`Could not delete temp file ${tempPath}:`, error.message);
    }
  }

  return outputFiles;
};

async function writeTempFile(content, ext) {
  const name = `logo-${crypto.randomUUID()}.${ext}`;
  const p = path.join(os.tmpdir(), name);
  await fs.writeFile(p, content, 'utf8');
  console.log(`Temporary file created: ${p}`);
  return p;
}

function transformSvgColor(svgText, color) {
  const $ = cheerio.load(svgText, { xmlMode: true });
  const root = $('svg').first();
  if (!root.length) return svgText;

  const mode = (color || '').toLowerCase();
  if (mode === 'original' || !mode) return $.xml();

  let matrixVals;
  switch (mode) {
    case 'black':
      matrixVals = [0,0,0,0,0,  0,0,0,0,0,  0,0,0,0,0,  0,0,0,1,0];
      break;
    case 'white':
      matrixVals = [0,0,0,0,1,  0,0,0,0,1,  0,0,0,0,1,  0,0,0,1,0];
      break;
    case 'grayscale':
      matrixVals = [0.2126,0.7152,0.0722,0,0,  0.2126,0.7152,0.0722,0,0,  0.2126,0.7152,0.0722,0,0,  0,0,0,1,0];
      break;
    case 'inverted':
      matrixVals = [-1,0,0,0,1,  0,-1,0,0,1,  0,0,-1,0,1,  0,0,0,1,0];
      break;
    default:
      return $.xml();
  }

  const matrixStr = matrixVals.join(' ');
  let defs = root.children('defs').first();
  if (!defs.length) {
    defs = $('<defs/>');
    root.prepend(defs);
  }

  const filterId = 'svg2OneColor';
  defs.append(`
    <filter id="${filterId}" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="${matrixStr}" />
    </filter>
  `);

  const wrapper = $('<g/>').attr('filter', `url(#${filterId})`);
  root.children().not('defs').each((i, el) => wrapper.append($(el).clone())).remove();
  root.append(wrapper);

  return $.xml();
}