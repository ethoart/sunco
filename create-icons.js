import fs from 'fs';
import sharp from 'sharp';

const svgBuffer = fs.readFileSync('assets/icon.svg');

async function generate() {
  try {
    await sharp(svgBuffer)
      .resize(1024, 1024)
      .png()
      .toFile('assets/icon.png');
    console.log('icon.png created successfully');

    const splashSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="2732" height="2732" viewBox="0 0 2732 2732" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </linearGradient>
  </defs>
  <rect width="2732" height="2732" fill="#ffffff"/>
  <rect width="1024" height="1024" x="854" y="854" rx="256" fill="url(#g)"/>
  <text x="1366" y="1554" font-family="sans-serif" font-size="600" font-weight="bold" fill="white" text-anchor="middle">S</text>
</svg>`;

    await sharp(Buffer.from(splashSvg))
      .resize(2732, 2732)
      .png()
      .toFile('assets/splash.png');
    console.log('splash.png created successfully');

  } catch (err) {
    console.error(err);
  }
}

generate();
