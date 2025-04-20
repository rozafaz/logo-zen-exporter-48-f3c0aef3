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
    // Try to execute inkscape --version
    const { stdout } = await execFileAsync(INKSCAPE_PATH, ['--version']);
    console.log('Inkscape installation detected:', stdout.trim());
    return { available: true, version: stdout.trim() };
  } catch (error) {
    console.error('Inkscape not available:', error.message);
    // Throw a specific error that can be caught higher up
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

  // Check if Inkscape is available
  await checkInkscapeAvailability();

  // Load and validate
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
            outputFiles.push({
              folder: 'SVG',
              filename: `${brandName}_${color}_${label}.svg`,
              data: Buffer.from(transformedSvg, 'utf8')
            });
          } else {
            const ext = format.toLowerCase();
            const out = tempPath.replace(/\.svg$/, `_${label}.${ext}`);
            const args = [`--export-type=${ext}`];
            if (ext === 'png') args.push('--export-dpi', String(isNaN(dpi) ? 300 : dpi));
            args.push('--export-area-drawing', '--export-area-page');
            args.push(`--export-filename=${out}`);
            
            console.log(`Running Inkscape command: inkscape ${args.join(' ')} ${tempPath}`);
            
            try {
              await execFileAsync(INKSCAPE_PATH, [tempPath, ...args], {
                timeout: 30000 // 30-second timeout for Inkscape operations
              });
              
              const data = await fs.readFile(out);
              outputFiles.push({ folder: format, filename: `${brandName}_${color}_${label}.${ext}`, data });
              await fs.unlink(out);
            } catch (inkscapeError) {
              console.error(`Inkscape error converting to ${format}@${label}:`, inkscapeError);
              throw new Error(`Inkscape failed to convert to ${format}: ${inkscapeError.message}`);
            }
          }
        } catch (e) {
          console.error(`Error exporting ${format}@${label} for ${color}:`, e);
          throw e; // Propagate the error up
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
  try {
    await fs.writeFile(p, content, 'utf8');
    console.log(`Temporary file created: ${p}`);
    return p;
  } catch (error) {
    console.error(`Error creating temporary file at ${p}:`, error);
    throw new Error(`Failed to create temporary file: ${error.message}`);
  }
}

/**
 * Transform *all* colors in an SVG into a single target (black/white/grayscale/inverted),
 * preserving every pixel’s alpha channel.
 *
 * @param {string} svgText  – the raw SVG source
 * @param {'original'|'black'|'white'|'grayscale'|'inverted'} color
 * @returns {string}        – the new SVG source
 */
function transformSvgColor(svgText, color) {
  const $ = cheerio.load(svgText, { xmlMode: true });
  const root = $('svg').first();
  if (!root.length) return svgText;      // not an SVG, nothing to do

  const mode = (color || '').toLowerCase();
  if (mode === 'original' || !mode) return $.xml();

  // 1) Build the FeColorMatrix values for our 4 modes
  let matrixVals;
  switch (mode) {
    case 'black':
      // R=0, G=0, B=0, preserve A
      matrixVals = [
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 1, 0
      ];
      break;

    case 'white':
      // R=1, G=1, B=1, preserve A
      matrixVals = [
        0, 0, 0, 0, 1,
        0, 0, 0, 0, 1,
        0, 0, 0, 0, 1,
        0, 0, 0, 1, 0
      ];
      break;

    case 'grayscale':
      // standard luminance weights, preserve A
      matrixVals = [
        0.2126, 0.7152, 0.0722, 0, 0,
        0.2126, 0.7152, 0.0722, 0, 0,
        0.2126, 0.7152, 0.0722, 0, 0,
        0,      0,      0,      1, 0
      ];
      break;

    case 'inverted':
      // invert each channel, preserve A
      matrixVals = [
       -1,  0,  0, 0, 1,
        0, -1,  0, 0, 1,
        0,  0, -1, 0, 1,
        0,  0,  0, 1, 0
      ];
      break;

    default:
      return $.xml();  // unknown mode
  }

  const matrixStr = matrixVals.join(' ');

  // 2) Ensure we have a <defs> to put our filter in
  let defs = root.children('defs').first();
  if (!defs.length) {
    defs = $('<defs/>');
    root.prepend(defs);
  }

  // 3) Add our "toOneColor" filter
  const filterId = 'svg2OneColor';
  defs.append(`
    <filter id="${filterId}" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="${matrixStr}" />
    </filter>
  `);

  // 4) Wrap *all* non-<defs> children in a single <g> that uses our filter
  const wrapper = $('<g/>').attr('filter', `url(#${filterId})`);
  root
    .children()
    .not('defs')
    .each((i, el) => wrapper.append($(el).clone()))
    .remove();            // remove original children

  root.append(wrapper);

  // 5) Serialize back to string
  return $.xml();
}
