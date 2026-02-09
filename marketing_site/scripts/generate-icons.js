#!/usr/bin/env node

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';

const logoPath = './public/logo.svg';
const iconsDir = './public/icons';

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Icon specifications
const iconSpecs = [
  // PWA icons
  { name: 'pwa-64x64.png', size: 64, type: 'pwa' },
  { name: 'pwa-192x192.png', size: 192, type: 'pwa' },
  { name: 'pwa-512x512.png', size: 512, type: 'pwa' },

  // Apple touch icons
  { name: 'apple-touch-icon-76x76.png', size: 76, type: 'apple' },
  { name: 'apple-touch-icon-120x120.png', size: 120, type: 'apple' },
  { name: 'apple-touch-icon-144x144.png', size: 144, type: 'apple' },
  { name: 'apple-touch-icon-152x152.png', size: 152, type: 'apple' },
  { name: 'apple-touch-icon-180x180.png', size: 180, type: 'apple' },

  // Maskable icon (with safe zone padding)
  { name: 'maskable-icon-512x512.png', size: 512, type: 'maskable' },
];

console.log('🎨 Generando iconos PWA desde logo SVG...\n');

async function generateIcon({ name, size, type }) {
  try {
    const outputPath = `${iconsDir}/${name}`;

    let pipeline = sharp(logoPath);

    if (type === 'maskable') {
      // For maskable icons, add padding for safe zone (minimum 10% padding)
      const paddedSize = Math.round(size * 0.8); // Use 80% of space for logo
      const padding = Math.round((size - paddedSize) / 2);

      pipeline = pipeline.resize(paddedSize, paddedSize).extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
      });
    } else {
      // Standard resize for other icons
      pipeline = pipeline.resize(size, size);
    }

    await pipeline
      .png({
        quality: 100,
        compressionLevel: 9,
        adaptiveFiltering: true,
      })
      .toFile(outputPath);

    console.log(`✅ ${name} (${size}x${size})`);
  } catch (error) {
    console.log(`❌ Error generando ${name}: ${error.message}`);
  }
}

// Generate all icons
for (const spec of iconSpecs) {
  await generateIcon(spec);
}

console.log('\n🎯 ¡Generación de iconos completada!');
console.log(
  '📋 Ejecuta "node scripts/check-icons.js" para verificar los resultados.'
);
