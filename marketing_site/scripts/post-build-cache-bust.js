#!/usr/bin/env node

/**
 * Post-Build Cache Busting Script
 *
 * This script runs after Vite build and adds cache-busting mechanisms:
 * 1. Adds version meta tag to index.html
 * 2. Updates manifest.webmanifest with timestamp
 * 3. Creates a version.json file for client-side checks
 * 4. Ensures SW and HTML are never cached
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const BUILD_TIMESTAMP = Date.now();
const BUILD_DATE = new Date().toISOString();
const VERSION = `1.0.${BUILD_TIMESTAMP}`;

console.log('🚀 Starting post-build cache busting...');
console.log(`📦 Version: ${VERSION}`);
console.log(`⏰ Build Time: ${BUILD_DATE}`);

// 1. Update index.html with version meta tag
function updateIndexHtml() {
  const indexPath = path.join(DIST_DIR, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.warn('⚠️  index.html not found, skipping...');
    return;
  }

  let html = fs.readFileSync(indexPath, 'utf-8');

  // Add version meta tag
  const versionMeta = `
    <!-- Cache Busting Version -->
    <meta name="build-version" content="${VERSION}" />
    <meta name="build-timestamp" content="${BUILD_TIMESTAMP}" />
    <meta name="build-date" content="${BUILD_DATE}" />`;

  // Insert before closing head tag
  html = html.replace('</head>', `${versionMeta}\n  </head>`);

  // Add version comment at the beginning
  html = `<!-- Build Version: ${VERSION} | Built: ${BUILD_DATE} -->\n${html}`;

  fs.writeFileSync(indexPath, html);
  console.log('✅ Updated index.html with version metadata');
}

// 2. Update manifest.webmanifest with timestamp
function updateManifest() {
  const manifestPath = path.join(DIST_DIR, 'manifest.webmanifest');

  if (!fs.existsSync(manifestPath)) {
    console.warn('⚠️  manifest.webmanifest not found, skipping...');
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  // Update version and add timestamp
  manifest.version = VERSION;
  manifest.build_timestamp = BUILD_TIMESTAMP;
  manifest.build_date = BUILD_DATE;

  // Force new app identity on each build
  manifest.id = `stratekaz-pwa-${BUILD_TIMESTAMP}`;
  manifest.start_url = `/?v=${BUILD_TIMESTAMP}`;

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Updated manifest.webmanifest with version and timestamp');
}

// 3. Create version.json for runtime checks
function createVersionFile() {
  const versionData = {
    version: VERSION,
    build_timestamp: BUILD_TIMESTAMP,
    build_date: BUILD_DATE,
    git_commit: process.env.GITHUB_SHA || process.env.GIT_COMMIT || 'unknown',
    git_branch:
      process.env.GITHUB_REF_NAME || process.env.GIT_BRANCH || 'unknown',
    environment: process.env.VITE_ENV || process.env.NODE_ENV || 'production',
  };

  const versionPath = path.join(DIST_DIR, 'version.json');
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
  console.log('✅ Created version.json');
}

// 4. Add cache-busting headers hint file
function createHeadersFile() {
  const headers = `# Cache Control Headers for CDN/Proxy
# This file serves as documentation for proper caching

# HTML - Never cache
/*.html
  Cache-Control: no-cache, no-store, must-revalidate, max-age=0
  Pragma: no-cache
  Expires: 0

# Service Worker - Never cache
/sw.js
  Cache-Control: no-cache, no-store, must-revalidate
  Service-Worker-Allowed: /

/registerSW.js
  Cache-Control: no-cache, no-store, must-revalidate

# Manifest - Check often
/manifest.webmanifest
  Cache-Control: no-cache, must-revalidate

/version.json
  Cache-Control: no-cache, must-revalidate

# Static Assets - Cache forever (immutable)
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Images - Cache for 1 month
/*.png
  Cache-Control: public, max-age=2592000

/*.jpg
  Cache-Control: public, max-age=2592000

/*.svg
  Cache-Control: public, max-age=2592000

/*.webp
  Cache-Control: public, max-age=2592000
`;

  const headersPath = path.join(DIST_DIR, '_headers');
  fs.writeFileSync(headersPath, headers);
  console.log('✅ Created _headers file (for Netlify/CDN)');
}

// 5. Update service worker comment
function updateServiceWorker() {
  const swPath = path.join(DIST_DIR, 'sw.js');

  if (!fs.existsSync(swPath)) {
    console.warn('⚠️  sw.js not found, skipping...');
    return;
  }

  let sw = fs.readFileSync(swPath, 'utf-8');

  // Add version comment at the beginning
  const versionComment = `// Service Worker Version: ${VERSION}\n// Built: ${BUILD_DATE}\n// Auto-updated on every build\n`;
  sw = versionComment + sw;

  fs.writeFileSync(swPath, sw);
  console.log('✅ Updated sw.js with version comment');
}

// 6. Create clear-cache redirect helper
function updateClearCacheHelper() {
  const clearCachePath = path.join(DIST_DIR, 'clear-cache.html');

  if (!fs.existsSync(clearCachePath)) {
    console.warn('⚠️  clear-cache.html not found, skipping...');
    return;
  }

  let html = fs.readFileSync(clearCachePath, 'utf-8');

  // Add version info
  const versionInfo = `\n        <p><small>Latest Version: ${VERSION}</small></p>\n        <p><small>Built: ${BUILD_DATE}</small></p>`;
  html = html.replace(
    '<button onclick="clearAllCache()">',
    `${versionInfo}\n        <button onclick="clearAllCache()">`
  );

  fs.writeFileSync(clearCachePath, html);
  console.log('✅ Updated clear-cache.html with version info');
}

// 7. Log build summary
function logBuildSummary() {
  const distFiles = fs.readdirSync(DIST_DIR);
  const assetsDir = path.join(DIST_DIR, 'assets');
  const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];

  console.log('\n📊 Build Summary:');
  console.log(`   Files in dist: ${distFiles.length}`);
  console.log(`   Assets: ${assetFiles.length}`);
  console.log(`   Version: ${VERSION}`);
  console.log(`   Timestamp: ${BUILD_TIMESTAMP}`);
  console.log('\n🎯 Cache Strategy:');
  console.log('   ✅ HTML: Never cached');
  console.log('   ✅ SW: Never cached');
  console.log('   ✅ Manifest: Dynamic version');
  console.log('   ✅ Assets: Immutable (hash-based)');
  console.log('\n✨ Cache busting complete!\n');
}

// Main execution
try {
  updateIndexHtml();
  updateManifest();
  createVersionFile();
  createHeadersFile();
  updateServiceWorker();
  updateClearCacheHelper();
  logBuildSummary();

  console.log('🎉 Post-build cache busting completed successfully!\n');
  process.exit(0);
} catch (error) {
  console.error('❌ Error during post-build cache busting:', error);
  process.exit(1);
}
