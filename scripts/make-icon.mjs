/**
 * Draws the app icon — `build/icon.png` and `build/icon.ico`.
 *
 * The mark is the same braces the in-app logo uses, rendered from signed
 * distance fields rather than scaled from one bitmap, so the 16px taskbar
 * version is drawn at 16px with its own stroke weight instead of being a
 * blurred shrink of the big one. No image library: PNG is a zlib stream with a
 * CRC, and ICO is a directory of PNGs.
 *
 *   node scripts/make-icon.mjs
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'build');

// ------------------------------------------------------------ geometry

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const mix = (a, b, t) => a + (b - a) * t;

/** Distance from p to a rounded rectangle centred at the origin. */
function sdRoundRect(px, py, halfW, halfH, r) {
  const qx = Math.abs(px) - (halfW - r);
  const qy = Math.abs(py) - (halfH - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

/**
 * Distance from p to an arc: the circle of radius R about c, but only between
 * angles a0 and a1. Outside that sweep the nearest point is an endpoint.
 */
function sdArc(px, py, cx, cy, R, a0, a1) {
  const vx = px - cx;
  const vy = py - cy;
  let ang = Math.atan2(vy, vx);
  const TAU = Math.PI * 2;
  const norm = (a) => ((a % TAU) + TAU) % TAU;
  const lo = norm(a0);
  const span = norm(a1 - a0);
  const rel = norm(ang - lo);
  if (rel <= span) return Math.abs(Math.hypot(vx, vy) - R);
  const e0x = cx + R * Math.cos(a0);
  const e0y = cy + R * Math.sin(a0);
  const e1x = cx + R * Math.cos(a1);
  const e1y = cy + R * Math.sin(a1);
  return Math.min(Math.hypot(px - e0x, py - e0y), Math.hypot(px - e1x, py - e1y));
}

/** Distance to a vertical segment at x0 running from y0 to y1. */
function sdVSeg(px, py, x0, y0, y1) {
  const dy = py < y0 ? y0 - py : py > y1 ? py - y1 : 0;
  return Math.hypot(px - x0, dy);
}

/**
 * One brace, centre-line only — stroke width is applied by the caller.
 *
 * Local space puts the stem on x = 0, the two tips at x = +r and the middle
 * nub at x = -r: four quarter-arcs joined by two straight runs of stem. That
 * is a `{`; `dir = -1` mirrors it into a `}`.
 */
function sdBrace(px, py, cx, cy, halfH, r, dir) {
  const x = (px - cx) * dir;
  const y = py - cy;
  const HALF_PI = Math.PI / 2;
  return Math.min(
    sdArc(x, y, r, -halfH + r, r, Math.PI, Math.PI + HALF_PI),   // curl to the top tip
    sdVSeg(x, y, 0, -halfH + r, -r),                             // upper stem
    sdArc(x, y, -r, -r, r, 0, HALF_PI),                          // into the nub
    sdArc(x, y, -r, r, r, -HALF_PI, 0),                          // out of the nub
    sdVSeg(x, y, 0, r, halfH - r),                               // lower stem
    sdArc(x, y, r, halfH - r, r, HALF_PI, Math.PI),              // curl to the bottom tip
  );
}

// -------------------------------------------------------------- palette

const TOP = [0xd0, 0x60, 0x40];
const BOTTOM = [0x9d, 0x36, 0x1f];
const INK = [0xff, 0xf6, 0xf1];

/** Render one square icon as raw RGBA. */
function render(size) {
  const px = new Uint8Array(size * size * 4);
  const SS = size >= 256 ? 3 : 4;     // samples per axis
  const s = size;
  const margin = s * 0.035;
  const halfBox = s / 2 - margin;
  const corner = s * 0.235;
  const braceHalfH = s * 0.255;
  const braceR = s * 0.078;
  const braceGap = s * 0.155;
  const stroke = s <= 32 ? s * 0.092 : s * 0.072;

  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      let boxCov = 0;
      let inkCov = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = x + (sx + 0.5) / SS - s / 2;
          const fy = y + (sy + 0.5) / SS - s / 2;
          boxCov += clamp(0.5 - sdRoundRect(fx, fy, halfBox, halfBox, corner), 0, 1);
          const brace = Math.min(
            sdBrace(fx, fy, -braceGap, 0, braceHalfH, braceR, 1),
            sdBrace(fx, fy, braceGap, 0, braceHalfH, braceR, -1),
          );
          inkCov += clamp(0.5 - (Math.abs(brace) - stroke / 2), 0, 1);
        }
      }
      const n = SS * SS;
      boxCov /= n;
      inkCov = Math.min(inkCov / n, boxCov);

      // A gradient with a little more life at the top than a linear ramp.
      const t = clamp((y + 0.5) / s, 0, 1);
      const ramp = t * 0.35 + t * t * 0.65;
      const ink = inkCov / Math.max(boxCov, 1e-6);
      const i = (y * s + x) * 4;
      for (let c = 0; c < 3; c++) {
        px[i + c] = Math.round(clamp(mix(mix(TOP[c], BOTTOM[c], ramp), INK[c], ink), 0, 255));
      }
      px[i + 3] = Math.round(boxCov * 255);
    }
  }
  return px;
}

// ------------------------------------------------------------------ png

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function toPng(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 6;    // RGBA
  // 10..12 stay zero: deflate, adaptive filtering, no interlace.

  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0; // filter: none
    Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(raw, row + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** An .ico is a small directory followed by the images — PNG entries are legal. */
function toIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const dir = Buffer.alloc(16 * images.length);
  let offset = header.length + dir.length;
  images.forEach(({ size, png }, i) => {
    const at = i * 16;
    dir[at] = size >= 256 ? 0 : size;
    dir[at + 1] = size >= 256 ? 0 : size;
    dir.writeUInt16LE(1, at + 4);       // colour planes
    dir.writeUInt16LE(32, at + 6);      // bits per pixel
    dir.writeUInt32BE(0, at + 8);
    dir.writeUInt32LE(png.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += png.length;
  });

  return Buffer.concat([header, dir, ...images.map((i) => i.png)]);
}

// ----------------------------------------------------------------- main

mkdirSync(OUT, { recursive: true });

const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const images = icoSizes.map((size) => ({ size, png: toPng(render(size), size) }));
writeFileSync(join(OUT, 'icon.ico'), toIco(images));

const big = toPng(render(512), 512);
writeFileSync(join(OUT, 'icon.png'), big);

console.log(`icon.ico  ${icoSizes.join(', ')} px`);
console.log(`icon.png  512 px  (${(big.length / 1024).toFixed(1)} KB)`);
