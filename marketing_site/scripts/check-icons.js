#!/usr/bin/env node

import sharp from 'sharp';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

const iconsDir = './public/icons';

console.log('📱 Verificando tamaños actuales de iconos PWA...\n');

try {
  const files = readdirSync(iconsDir).filter(file => file.endsWith('.png'));

  for (const file of files) {
    const filePath = join(iconsDir, file);

    try {
      const metadata = await sharp(filePath).metadata();
      const expectedSize = file.match(/(\d+)x(\d+)/);
      const actualSize = `${metadata.width}x${metadata.height}`;

      const isCorrect =
        expectedSize &&
        metadata.width === parseInt(expectedSize[1]) &&
        metadata.height === parseInt(expectedSize[2]);

      const status = isCorrect ? '✅' : '❌';
      const expected = expectedSize
        ? `${expectedSize[1]}x${expectedSize[2]}`
        : 'N/A';

      console.log(`${status} ${file}`);
      console.log(`   Esperado: ${expected}`);
      console.log(`   Actual: ${actualSize}`);
      console.log('');
    } catch (error) {
      console.log(`❌ Error leyendo ${file}: ${error.message}`);
    }
  }
} catch (error) {
  console.error('Error:', error.message);
}
