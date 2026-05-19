// Generates minimal placeholder PNG assets for development.
// These are small solid-color PNGs — replace with real artwork before publishing.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, r, g, b) {
  function writeUint32BE(n) {
    return Buffer.from([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
  }

  function crc32(buf) {
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    let crc = 0xffffffff;
    for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const lenBuf = writeUint32BE(data.length);
    const crcBuf = writeUint32BE(crc32(Buffer.concat([typeBytes, data])));
    return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.concat([
    writeUint32BE(width), writeUint32BE(height),
    Buffer.from([8, 2, 0, 0, 0]),
  ]);
  const ihdr = chunk('IHDR', ihdrData);

  const rowLen = 1 + width * 3;
  const raw = Buffer.alloc(rowLen * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowLen] = 0;
    for (let x = 0; x < width; x++) {
      raw[y * rowLen + 1 + x * 3] = r;
      raw[y * rowLen + 1 + x * 3 + 1] = g;
      raw[y * rowLen + 1 + x * 3 + 2] = b;
    }
  }
  const compressed = zlib.deflateSync(raw);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

// Purple #534AB7 = rgb(83,74,183)
const purple = [83, 74, 183];

const files = [
  { name: 'icon.png', w: 1024, h: 1024 },
  { name: 'splash.png', w: 1284, h: 2778 },
  { name: 'adaptive-icon.png', w: 1024, h: 1024 },
  { name: 'favicon.png', w: 32, h: 32 },
];

for (const { name, w, h } of files) {
  const dest = path.join(assetsDir, name);
  if (!fs.existsSync(dest)) {
    fs.writeFileSync(dest, createPNG(w, h, ...purple));
    console.log(`Created ${name} (${w}x${h})`);
  } else {
    console.log(`Skipped ${name} (already exists)`);
  }
}
