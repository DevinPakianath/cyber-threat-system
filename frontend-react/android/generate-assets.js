/**
 * CTI Guard Android asset generator
 * Writes all icon and splash screen PNG files with no external dependencies.
 * Run from the frontend-react directory: node android/generate-assets.js
 */
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── Brand colors (match Dashboard.css CSS custom properties) ────────────────
const BG   = [2,   8,  23];   // --bg-deep  #020817
const CYAN = [0, 255, 213];   // --cyan     #00ffd5

// ── CRC-32 (required by PNG format) ─────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xFF];
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t   = Buffer.from(type);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

// ── PNG writer ───────────────────────────────────────────────────────────────
function makePNG(pixels, w, h) {
  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit depth, RGB color type

  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0; // filter byte = None
    for (let x = 0; x < w; x++) {
      const src = y * w + x;
      const dst = y * (1 + w * 3) + 1 + x * 3;
      raw[dst]   = pixels[src][0];
      raw[dst+1] = pixels[src][1];
      raw[dst+2] = pixels[src][2];
    }
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Shield shape (normalised coordinates, y-axis down) ──────────────────────
function inShield(nx, ny) {
  // ny in [-1, 1]; top = -1, bottom tip = 1
  if (ny < -1 || ny > 1) return false;

  let halfW;
  if (ny <= -0.6) {
    // Rounded top corners
    const t = (-ny - 0.6) / 0.4;
    halfW = 1 - 0.25 * t * t;
  } else if (ny <= 0.2) {
    // Wide middle section
    halfW = 1.0;
  } else {
    // Taper to a point at the bottom
    halfW = 1 - ((ny - 0.2) / 0.8) * ((ny - 0.2) / 0.8);
  }
  return Math.abs(nx) <= halfW;
}

// ── Draw a square icon (size × size) ────────────────────────────────────────
function drawIcon(size) {
  const cx = size / 2, cy = size / 2;
  const scaleX = size * 0.30, scaleY = size * 0.40; // shield extent in pixels
  const px = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x - cx) / scaleX;
      const ny = (y - cy) / scaleY;
      px.push(inShield(nx, ny) ? CYAN : BG);
    }
  }
  return px;
}

// ── Draw foreground layer for adaptive icons (centered in larger canvas) ────
function drawForeground(size) {
  // The "safe zone" for adaptive icons is the inner 66% of the canvas.
  // We draw the shield filling that safe zone.
  const iconR = size * 0.33; // radius of the safe zone
  const cx = size / 2, cy = size / 2;
  const scaleX = iconR * 0.60, scaleY = iconR * 0.80;
  const px = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x - cx) / scaleX;
      const ny = (y - cy) / scaleY;
      px.push(inShield(nx, ny) ? CYAN : BG);
    }
  }
  return px;
}

// ── Draw a splash screen (centred shield, rest = background) ────────────────
function drawSplash(w, h) {
  const cx = w / 2, cy = h / 2;
  const smallest = Math.min(w, h);
  const scaleX = smallest * 0.18, scaleY = smallest * 0.24;
  const px = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / scaleX;
      const ny = (y - cy) / scaleY;
      px.push(inShield(nx, ny) ? CYAN : BG);
    }
  }
  return px;
}

// ── File writer helper ───────────────────────────────────────────────────────
const BASE = path.join(__dirname, 'app/src/main/res');

function write(relPath, w, h, drawFn) {
  const abs = path.join(BASE, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const px  = drawFn(w, h);
  fs.writeFileSync(abs, makePNG(px, w, h));
  console.log(`  ✓  ${relPath.padEnd(58)} ${w}×${h}`);
}

// ── App icons ────────────────────────────────────────────────────────────────
console.log('\n→ App launcher icons');
const ICON_SIZES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const FG_SIZES   = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

for (const [d, s] of Object.entries(ICON_SIZES)) {
  write(`mipmap-${d}/ic_launcher.png`,       s, s, drawIcon);
  write(`mipmap-${d}/ic_launcher_round.png`, s, s, drawIcon);
}
for (const [d, s] of Object.entries(FG_SIZES)) {
  write(`mipmap-${d}/ic_launcher_foreground.png`, s, s, drawForeground);
}

// ── Splash screens ───────────────────────────────────────────────────────────
console.log('\n→ Splash screens');
const SPLASHES = [
  ['drawable/splash.png',               1080, 1920],
  ['drawable-port-mdpi/splash.png',      320,  480],
  ['drawable-port-hdpi/splash.png',      480,  800],
  ['drawable-port-xhdpi/splash.png',     720, 1280],
  ['drawable-port-xxhdpi/splash.png',    960, 1600],
  ['drawable-port-xxxhdpi/splash.png',  1280, 1920],
  ['drawable-land-mdpi/splash.png',      480,  320],
  ['drawable-land-hdpi/splash.png',      800,  480],
  ['drawable-land-xhdpi/splash.png',    1280,  720],
  ['drawable-land-xxhdpi/splash.png',   1600,  960],
  ['drawable-land-xxxhdpi/splash.png',  1920, 1280],
];
for (const [rel, w, h] of SPLASHES) write(rel, w, h, drawSplash);

console.log('\n✅  All assets written.\n');
