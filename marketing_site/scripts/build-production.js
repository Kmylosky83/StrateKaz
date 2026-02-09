#!/usr/bin/env node

/**
 * Production Build Script for cPanel Deployment
 *
 * This script:
 * 1. Runs the production build
 * 2. Creates a .tar.gz file ready for cPanel upload
 * 3. Generates deployment instructions
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const OUTPUT_DIR = path.join(ROOT_DIR, 'releases');
const TIMESTAMP = new Date().toISOString().split('T')[0].replace(/-/g, '');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8')).version;
const OUTPUT_NAME = `stratekaz-marketing-v${VERSION}-${TIMESTAMP}`;

console.log('');
console.log('========================================');
console.log('  StrateKaz Marketing - Production Build');
console.log('========================================');
console.log('');
console.log(`Version: ${VERSION}`);
console.log(`Date: ${TIMESTAMP}`);
console.log('');

// Create releases directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('Created releases directory');
}

// Step 1: Run production build
console.log('Step 1/4: Running production build...');
try {
  execSync('npm run build', {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

// Step 2: Create .htaccess for Apache/cPanel
console.log('');
console.log('Step 2/4: Creating .htaccess for cPanel...');
const htaccessContent = `# StrateKaz Marketing Site - Apache Configuration
# Generated: ${new Date().toISOString()}
# Version: ${VERSION}

# Enable rewrite engine
RewriteEngine On

# Force HTTPS (uncomment in production)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle Angular/React SPA routing
RewriteBase /
RewriteRule ^index\\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security Headers
<IfModule mod_headers.c>
    # Prevent clickjacking
    Header always set X-Frame-Options "SAMEORIGIN"

    # XSS Protection
    Header always set X-XSS-Protection "1; mode=block"

    # Prevent MIME type sniffing
    Header always set X-Content-Type-Options "nosniff"

    # Referrer Policy
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # Permissions Policy
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/css application/json
    AddOutputFilterByType DEFLATE application/javascript text/javascript application/x-javascript
    AddOutputFilterByType DEFLATE text/xml application/xml application/xhtml+xml
    AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
    ExpiresActive On

    # HTML - No cache (SPA updates)
    ExpiresByType text/html "access plus 0 seconds"

    # CSS and JavaScript - 1 year (hashed filenames)
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/javascript "access plus 1 year"

    # Images - 1 month
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType image/webp "access plus 1 month"
    ExpiresByType image/x-icon "access plus 1 month"

    # Fonts - 1 year
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    ExpiresByType application/font-woff2 "access plus 1 year"

    # JSON - No cache
    ExpiresByType application/json "access plus 0 seconds"
</IfModule>

# Prevent access to sensitive files
<FilesMatch "^\\.(htaccess|htpasswd|ini|log|sh|sql)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# Block access to version control
<IfModule mod_rewrite.c>
    RewriteRule ^(\\.git|node_modules) - [F,L]
</IfModule>
`;

fs.writeFileSync(path.join(DIST_DIR, '.htaccess'), htaccessContent);
console.log('Created .htaccess file');

// Step 3: Create deployment instructions
console.log('');
console.log('Step 3/4: Creating deployment instructions...');
const deployInstructions = `# StrateKaz Marketing Site - Deployment Instructions
# Version: ${VERSION}
# Generated: ${new Date().toISOString()}

## Pre-requisitos
- Acceso a cPanel con File Manager o FTP
- El dominio debe estar configurado (stratekaz.com)

## Pasos de Deployment

### 1. Subir el archivo
1. Descomprimir el archivo .tar.gz
2. En cPanel, ir a File Manager
3. Navegar a public_html (o el directorio del dominio)
4. Subir TODOS los archivos de la carpeta dist/

### 2. Verificar archivos
Asegurar que estos archivos existan en public_html:
- index.html
- .htaccess
- assets/ (carpeta)
- version.json

### 3. Configurar SSL (si no está)
1. En cPanel, ir a SSL/TLS
2. Instalar certificado Let's Encrypt
3. Forzar HTTPS (descomentar líneas en .htaccess)

### 4. Verificar deployment
1. Visitar https://stratekaz.com
2. Verificar que todas las páginas carguen:
   - /
   - /pricing
   - /contact
   - /register
3. Verificar que los formularios funcionen
4. Verificar en móvil

## Rollback
Si hay problemas:
1. Mantener backup del dist anterior
2. Restaurar archivos del backup anterior

## Contacto
Soporte: dev@stratekaz.com
`;

fs.writeFileSync(path.join(DIST_DIR, 'DEPLOYMENT.md'), deployInstructions);
console.log('Created DEPLOYMENT.md');

// Step 4: Create tar.gz file
console.log('');
console.log('Step 4/4: Creating .tar.gz file...');

const tarFileName = `${OUTPUT_NAME}.tar.gz`;
const tarFilePath = path.join(OUTPUT_DIR, tarFileName);

// Use tar command (available on Windows with Git Bash, WSL, or similar)
try {
  // Try using tar command
  execSync(`tar -czvf "${tarFilePath}" -C "${path.dirname(DIST_DIR)}" dist`, {
    cwd: ROOT_DIR,
    stdio: 'pipe'
  });
  console.log(`Created ${tarFileName}`);
} catch (error) {
  // Fallback: create a zip file instead (more Windows-friendly)
  console.log('tar command not available, creating .zip instead...');
  const zipFileName = `${OUTPUT_NAME}.zip`;
  const zipFilePath = path.join(OUTPUT_DIR, zipFileName);

  try {
    // Try PowerShell compression
    execSync(`powershell -command "Compress-Archive -Path '${DIST_DIR}\\*' -DestinationPath '${zipFilePath}' -Force"`, {
      cwd: ROOT_DIR,
      stdio: 'pipe'
    });
    console.log(`Created ${zipFileName}`);
  } catch (zipError) {
    console.error('Could not create archive. Please manually zip the dist folder.');
    console.log(`Dist folder location: ${DIST_DIR}`);
  }
}

// Calculate dist size
function getDirSize(dirPath) {
  let size = 0;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      size += getDirSize(filePath);
    } else {
      size += stat.size;
    }
  }
  return size;
}

const distSize = getDirSize(DIST_DIR);
const distSizeMB = (distSize / 1024 / 1024).toFixed(2);

// Summary
console.log('');
console.log('========================================');
console.log('  Build Complete!');
console.log('========================================');
console.log('');
console.log(`  Version:     ${VERSION}`);
console.log(`  Build Size:  ${distSizeMB} MB`);
console.log(`  Output:      releases/${OUTPUT_NAME}.*`);
console.log('');
console.log('  Files included:');
console.log('    - index.html');
console.log('    - .htaccess (Apache config)');
console.log('    - assets/ (JS, CSS, images)');
console.log('    - version.json');
console.log('    - DEPLOYMENT.md');
console.log('');
console.log('  Next steps:');
console.log('    1. Upload to cPanel File Manager');
console.log('    2. Extract in public_html');
console.log('    3. Verify at https://stratekaz.com');
console.log('');
console.log('========================================');
