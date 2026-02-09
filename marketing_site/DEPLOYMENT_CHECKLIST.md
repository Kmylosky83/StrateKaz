# Marketing Site - Production Deployment Checklist

**Last Updated:** 2025-12-01
**Target Deployment:** Production
**Estimated Time:** 4-6 hours (critical fixes + deployment)

---

## Pre-Deployment: Critical Fixes (3 hours)

### 1. Fix Environment Variables (30 minutes) 🔴 CRITICAL

**Current Status:** ⚠️ Using placeholders

**Action Required:**
```bash
# 1. Create Sentry project
# Go to: https://sentry.io → Create Project → React

# 2. Get DSN
# Copy DSN from: Settings → Client Keys (DSN)

# 3. Update marketing_site/.env.production
VITE_SENTRY_DSN_MARKETING=https://REAL_KEY@oXXXXXX.ingest.sentry.io/XXXXXXX

# 4. Get Google Analytics ID
# Go to: https://analytics.google.com → Create Property
VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# 5. Add to GitHub Secrets
gh secret set SENTRY_AUTH_TOKEN --body "YOUR_SENTRY_AUTH_TOKEN"
```

**Verification:**
- [ ] Real Sentry DSN in .env.production
- [ ] Sentry Auth Token in GitHub Secrets
- [ ] Google Analytics ID obtained (optional for MVP)

---

### 2. Enable Minification (5 minutes) 🔴 CRITICAL

**Current Status:** ⚠️ Disabled (minify: false)

**Action Required:**
```typescript
// File: marketing_site/vite.config.ts
// Line 171: Change from false to 'terser'

build: {
  minify: 'terser',  // ← Change this
  // ... rest of config
}
```

**Expected Impact:**
- Bundle size: 680KB → ~450KB (35% reduction)
- Gzipped: 175KB → ~120KB

**Verification:**
```bash
cd marketing_site
npm run build
# Check dist/ folder size - should be ~30% smaller
```

- [ ] Changed minify: false → minify: 'terser'
- [ ] Build completes successfully
- [ ] Bundle size reduced

---

### 3. Fix Dockerfile Path (5 minutes) 🔴 CRITICAL

**Current Status:** ⚠️ References wrong nginx config

**Action Required:**
```dockerfile
# File: deployment/docker/Dockerfile.marketing
# Line 137: Fix nginx config path

# OLD (WRONG):
COPY deployment/docker/nginx-frontend.conf /etc/nginx/conf.d/default.conf

# NEW (CORRECT):
COPY nginx-marketing.conf /etc/nginx/conf.d/default.conf
```

**Verification:**
```bash
# Test build
docker build -f deployment/docker/Dockerfile.marketing \
  --target production \
  --tag stratekaz-marketing:test \
  ./marketing_site

# Should complete without errors
```

- [ ] Fixed nginx config path in Dockerfile
- [ ] Docker build succeeds (production target)

---

### 4. Create Post-Build Script (30 minutes) 🔴 CRITICAL

**Current Status:** ⚠️ Script missing

**Action Required:**
```bash
# Create directory
mkdir -p marketing_site/scripts

# Create file: marketing_site/scripts/post-build-cache-bust.js
```

```javascript
// marketing_site/scripts/post-build-cache-bust.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const distPath = path.join(__dirname, '../dist');

// Generate build version
const version = {
  version: process.env.npm_package_version || '1.0.5',
  buildTime: new Date().toISOString(),
  buildHash: crypto.randomBytes(8).toString('hex'),
  commit: process.env.GITHUB_SHA || 'local',
  environment: process.env.VITE_ENV || 'production'
};

// Write version.json
const versionPath = path.join(distPath, 'version.json');
fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));

console.log('✅ Cache bust version created:');
console.log(JSON.stringify(version, null, 2));

// Update cache-killer.js version
const cacheKillerPath = path.join(distPath, 'cache-killer.js');
if (fs.existsSync(cacheKillerPath)) {
  let content = fs.readFileSync(cacheKillerPath, 'utf8');
  content = content.replace(
    /const CURRENT_VERSION = ['"].*?['"]/,
    `const CURRENT_VERSION = '${version.buildHash}'`
  );
  fs.writeFileSync(cacheKillerPath, content);
  console.log('✅ cache-killer.js updated with build hash');
}
```

**Verification:**
```bash
cd marketing_site
npm run build
# Should see: "✅ Cache bust version created"
# Check: dist/version.json exists
```

- [ ] Created scripts/post-build-cache-bust.js
- [ ] Build runs successfully
- [ ] dist/version.json generated

---

### 5. Fix CSP for Production (15 minutes) 🟡 HIGH

**Current Status:** ⚠️ Includes localhost URLs

**Action Required:**
```bash
# Create production nginx config
cp marketing_site/nginx-marketing.conf \
   marketing_site/nginx-marketing-prod.conf
```

```nginx
# File: marketing_site/nginx-marketing-prod.conf
# Update CSP line 17:

# REMOVE localhost URLs:
# connect-src 'self' http://localhost:8001 ws://localhost:8001;

# REPLACE WITH production:
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https: https://www.google-analytics.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://app.stratekaz.com wss://app.stratekaz.com https://www.google-analytics.com https://*.ingest.sentry.io;
  frame-ancestors 'none';
" always;
```

**Update Dockerfile:**
```dockerfile
# Line 115 (staging target):
COPY nginx-marketing.conf /etc/nginx/conf.d/default.conf

# Line 137 (production target):
COPY nginx-marketing-prod.conf /etc/nginx/conf.d/default.conf
```

- [ ] Created nginx-marketing-prod.conf
- [ ] Updated CSP for production
- [ ] Updated Dockerfile references

---

## Server Setup (2 hours)

### 6. Provision Server 🔴 CRITICAL

**Requirements:**
- 2 vCPU, 4GB RAM minimum
- Ubuntu 22.04 LTS or similar
- Public IP address
- Root or sudo access

**Recommended Providers:**
- DigitalOcean: Droplet ($24/mo)
- AWS: EC2 t3.medium (~$30/mo)
- Linode: Standard 4GB ($24/mo)
- Vultr: Cloud Compute ($24/mo)

**Setup Steps:**
```bash
# SSH into server
ssh root@YOUR_SERVER_IP

# 1. Update system
apt update && apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Install Docker Compose
apt install docker-compose-plugin -y

# 4. Create app user
adduser stratekaz
usermod -aG docker stratekaz
usermod -aG sudo stratekaz

# 5. Setup firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# 6. Install fail2ban (security)
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

- [ ] Server provisioned
- [ ] Docker installed
- [ ] Firewall configured
- [ ] Security tools installed

---

### 7. Configure DNS 🔴 CRITICAL

**Action Required:**
```bash
# Add DNS A records (at your DNS provider):
stratekaz.com           → YOUR_SERVER_IP
www.stratekaz.com       → YOUR_SERVER_IP

# Optional: Add CAA record for Let's Encrypt
stratekaz.com  CAA  0 issue "letsencrypt.org"
```

**Verification:**
```bash
# Wait 5-10 minutes for propagation, then test:
dig stratekaz.com +short
dig www.stratekaz.com +short
# Should return: YOUR_SERVER_IP
```

- [ ] A records created
- [ ] DNS propagated (verified)
- [ ] CAA record added (optional)

---

### 8. SSL Certificate Setup 🔴 CRITICAL

**Action Required:**
```bash
# On production server as stratekaz user
ssh stratekaz@YOUR_SERVER_IP

# 1. Clone repository
git clone https://github.com/YOUR_ORG/StrateKaz.git
cd StrateKaz

# 2. Create environment file
cp .env.production.example .env.production
nano .env.production  # Edit with real values

# 3. Generate SSL certificate (first time only)
docker-compose -f docker-compose.production.yml \
  --profile certbot \
  run certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@stratekaz.com \
    --agree-tos \
    --no-eff-email \
    -d stratekaz.com \
    -d www.stratekaz.com

# Certificate saved to: /etc/letsencrypt/live/stratekaz.com/
```

**Setup Auto-Renewal:**
```bash
# Create cron job
crontab -e

# Add this line (runs at 2 AM on 1st of every month):
0 2 1 * * docker-compose -f ~/StrateKaz/docker-compose.production.yml --profile certbot run certbot renew --quiet && docker-compose -f ~/StrateKaz/docker-compose.production.yml exec nginx nginx -s reload
```

- [ ] SSL certificate generated
- [ ] Certificate auto-renewal configured
- [ ] Cron job added

---

### 9. Create Nginx SSL Configuration 🔴 CRITICAL

**Action Required:**
```bash
# Create directory
mkdir -p deployment/nginx/conf.d

# Create file: deployment/nginx/conf.d/marketing-ssl.conf
```

```nginx
# File: deployment/nginx/conf.d/marketing-ssl.conf

# HTTP → HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name stratekaz.com www.stratekaz.com;

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name stratekaz.com www.stratekaz.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/stratekaz.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stratekaz.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/stratekaz.com/chain.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # SSL Session Cache
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # HSTS (6 months initially, then increase to 1 year)
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains" always;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # CSP Header
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://app.stratekaz.com wss://app.stratekaz.com https://*.ingest.sentry.io; frame-ancestors 'none';" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Marketing site proxy
    location / {
        proxy_pass http://marketing:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 '{"status":"healthy","service":"marketing"}';
        add_header Content-Type application/json;
    }
}
```

**Update docker-compose.production.yml:**
```yaml
# Add volume mount to nginx service:
nginx:
  volumes:
    - ./deployment/nginx/conf.d:/etc/nginx/conf.d:ro  # Add this line
    # ... other volumes
```

- [ ] Created marketing-ssl.conf
- [ ] Updated docker-compose.production.yml
- [ ] Verified configuration syntax

---

## Deployment (1-2 hours)

### 10. Build Production Images 🔴 CRITICAL

**Via GitHub Actions (Recommended):**
```bash
# Push to main branch or create release tag
git tag v1.0.5
git push origin v1.0.5

# GitHub Actions will automatically:
# 1. Run CI tests
# 2. Build Docker images
# 3. Push to GitHub Container Registry
# 4. Deploy to production (if configured)
```

**Manual Build (if needed):**
```bash
# On production server
cd ~/StrateKaz

# Build marketing image
docker-compose -f docker-compose.production.yml build marketing

# Verify image
docker images | grep stratekaz-marketing
```

- [ ] Images built successfully
- [ ] No build errors
- [ ] Images pushed to registry (if using)

---

### 11. Deploy to Production 🔴 CRITICAL

**Action Required:**
```bash
# On production server
cd ~/StrateKaz

# 1. Pull latest code
git pull origin main

# 2. Update environment variables
nano .env.production  # Verify all values are correct

# 3. Build and start services
docker-compose -f docker-compose.production.yml up -d marketing nginx

# 4. Check service status
docker-compose -f docker-compose.production.yml ps

# 5. Monitor logs
docker-compose -f docker-compose.production.yml logs -f marketing

# Press Ctrl+C to stop following logs
```

- [ ] Services started successfully
- [ ] No errors in logs
- [ ] Containers running

---

### 12. Post-Deployment Verification 🔴 CRITICAL

**Automated Tests:**
```bash
# Test HTTP → HTTPS redirect
curl -I http://stratekaz.com
# Should return: 301 Moved Permanently
# Location: https://stratekaz.com/

# Test HTTPS
curl -I https://stratekaz.com
# Should return: 200 OK

# Test all pages
curl -I https://stratekaz.com/
curl -I https://stratekaz.com/pricing
curl -I https://stratekaz.com/contact
curl -I https://stratekaz.com/register

# Test health endpoint
curl https://stratekaz.com/health
# Should return: {"status":"healthy","service":"marketing"}

# Verify SSL certificate
openssl s_client -connect stratekaz.com:443 -servername stratekaz.com </dev/null 2>/dev/null | openssl x509 -noout -dates
# Check expiry date

# Test SSL grade
# Go to: https://www.ssllabs.com/ssltest/analyze.html?d=stratekaz.com
# Target: A or A+
```

**Manual Tests:**
```
1. Open https://stratekaz.com in browser
   - [ ] Page loads correctly
   - [ ] No SSL warnings
   - [ ] All images/fonts load
   - [ ] No console errors

2. Test all pages:
   - [ ] Home page (/)
   - [ ] Pricing (/pricing)
   - [ ] Contact (/contact)
   - [ ] Register (/register)

3. Test responsive design:
   - [ ] Desktop (1920px)
   - [ ] Laptop (1366px)
   - [ ] Tablet (768px)
   - [ ] Mobile (375px)

4. Test functionality:
   - [ ] Navigation works
   - [ ] Links work
   - [ ] Animations smooth
   - [ ] Forms load (don't submit yet)
```

- [ ] All automated tests pass
- [ ] All manual tests pass
- [ ] No errors in browser console
- [ ] Mobile responsive working

---

### 13. Configure Monitoring 🟡 HIGH

**Sentry:**
```bash
# 1. Trigger test error
# In browser console on https://stratekaz.com:
Sentry.captureException(new Error('Test error - deployment verification'));

# 2. Check Sentry dashboard
# Go to: https://sentry.io/organizations/stratekaz/issues/
# Should see the test error
```

**Uptime Monitoring:**
```bash
# Option 1: UptimeRobot (Free)
# 1. Go to: https://uptimerobot.com
# 2. Add monitor: https://stratekaz.com
# 3. Add monitor: https://stratekaz.com/health
# 4. Set alert email

# Option 2: Pingdom
# Option 3: StatusCake
```

**Google Analytics:**
```bash
# 1. Install GA tracking code (if not done)
# 2. Go to: https://analytics.google.com
# 3. Check Real-Time view
# 4. Visit site and verify tracking
```

- [ ] Sentry receiving errors
- [ ] Uptime monitoring configured
- [ ] Alerts configured
- [ ] Analytics tracking (if implemented)

---

### 14. Security Verification 🔴 CRITICAL

**SSL/TLS Check:**
```bash
# SSL Labs Test
# Go to: https://www.ssllabs.com/ssltest/analyze.html?d=stratekaz.com
# Target Grade: A or A+

# Should show:
✅ TLS 1.2/1.3 only
✅ Strong cipher suites
✅ Certificate chain complete
✅ HSTS enabled
✅ Forward secrecy supported
```

**Security Headers Check:**
```bash
# SecurityHeaders.com Test
# Go to: https://securityheaders.com/?q=stratekaz.com
# Target Grade: A or A+

# Should show:
✅ Strict-Transport-Security
✅ Content-Security-Policy
✅ X-Frame-Options
✅ X-Content-Type-Options
✅ Referrer-Policy
✅ Permissions-Policy
```

**Vulnerability Scan:**
```bash
# Run Trivy scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image stratekaz-marketing:latest

# Should show:
✅ No CRITICAL vulnerabilities
✅ No HIGH vulnerabilities
⚠️ MEDIUM vulnerabilities acceptable
```

- [ ] SSL Labs grade A or A+
- [ ] Security Headers grade A or A+
- [ ] No critical vulnerabilities
- [ ] Firewall configured

---

### 15. Performance Verification 🟡 HIGH

**Lighthouse Test:**
```bash
# Option 1: Chrome DevTools
# 1. Open https://stratekaz.com
# 2. F12 → Lighthouse tab
# 3. Run audit (Desktop + Mobile)

# Option 2: PageSpeed Insights
# Go to: https://pagespeed.web.dev/
# Enter: stratekaz.com

# Target Scores:
Desktop:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

Mobile:
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90
```

**Core Web Vitals:**
```
Target Metrics:
✅ LCP (Largest Contentful Paint): < 2.5s
✅ FID (First Input Delay): < 100ms
✅ CLS (Cumulative Layout Shift): < 0.1
✅ FCP (First Contentful Paint): < 1.8s
✅ TTI (Time to Interactive): < 3.8s
```

**Bundle Size:**
```bash
# Check actual bundle size served
curl -s https://stratekaz.com | wc -c  # HTML size
curl -s https://stratekaz.com/assets/index-[hash].css | wc -c  # CSS
curl -s https://stratekaz.com/assets/index-[hash].js | wc -c   # JS

# With gzip (what users actually download):
curl -s -H "Accept-Encoding: gzip" https://stratekaz.com/assets/index-[hash].js | wc -c

# Target: < 200KB gzipped for initial load
```

- [ ] Lighthouse scores meet targets
- [ ] Core Web Vitals GOOD
- [ ] Bundle size acceptable
- [ ] Load time < 3s

---

## Post-Deployment (First Week)

### 16. Monitor & Observe (24-48 hours)

**Critical Monitoring:**
```bash
# 1. Watch error rates
# Sentry dashboard: Check every 6 hours

# 2. Monitor server resources
ssh stratekaz@YOUR_SERVER_IP
docker stats  # Check CPU/Memory usage

# 3. Review logs
docker-compose -f docker-compose.production.yml logs marketing --tail=100

# 4. Check uptime
# UptimeRobot dashboard
```

**Key Metrics to Watch:**
- Error rate: Should be < 0.1%
- Response time: < 1 second p95
- CPU usage: < 50% average
- Memory usage: < 80% of limit
- Disk space: > 20% free

- [ ] No critical errors (24h)
- [ ] Server resources healthy
- [ ] Response times good
- [ ] No downtime

---

### 17. SEO & Analytics Setup 🟡 HIGH

**Google Search Console:**
```bash
# 1. Go to: https://search.google.com/search-console
# 2. Add property: stratekaz.com
# 3. Verify ownership (DNS TXT record or HTML file)
# 4. Submit sitemap: https://stratekaz.com/sitemap.xml (if exists)
```

**Google Analytics Setup:**
```bash
# 1. Create GA4 property
# 2. Get Measurement ID (G-XXXXXXXXXX)
# 3. Update .env.production
# 4. Redeploy with analytics code
```

**robots.txt:**
```bash
# Create: marketing_site/public/robots.txt
User-agent: *
Allow: /
Sitemap: https://stratekaz.com/sitemap.xml
```

- [ ] Search Console configured
- [ ] Sitemap submitted
- [ ] robots.txt present
- [ ] Analytics tracking working

---

### 18. Backup Configuration 🟡 HIGH

**Automated Backups:**
```bash
# On production server
# Create backup script: ~/backup-stratekaz.sh

#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup Docker volumes
docker run --rm \
  -v stratekaz_prod_mysql_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/mysql-$DATE.tar.gz -C /data .

# Backup application files
tar czf $BACKUP_DIR/app-$DATE.tar.gz \
  ~/StrateKaz/.env.production \
  ~/StrateKaz/deployment/nginx

# Backup Let's Encrypt certificates
sudo tar czf $BACKUP_DIR/letsencrypt-$DATE.tar.gz /etc/letsencrypt

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: $DATE"

# Make executable
chmod +x ~/backup-stratekaz.sh

# Add to cron (daily at 3 AM)
crontab -e
# Add: 0 3 * * * ~/backup-stratekaz.sh >> ~/backup.log 2>&1
```

**Off-Site Backup (Optional):**
```bash
# AWS S3
apt install awscli -y
aws configure
aws s3 sync ~/backups s3://stratekaz-backups/

# Or use rsync to another server
```

- [ ] Backup script created
- [ ] Cron job configured
- [ ] Test backup/restore
- [ ] Off-site backup (optional)

---

## Rollback Plan

### In Case of Critical Issues

**Rollback Procedure:**
```bash
# On production server
cd ~/StrateKaz

# 1. Stop current deployment
docker-compose -f docker-compose.production.yml stop marketing

# 2. Check previous images
docker images | grep stratekaz-marketing

# 3. Start previous version
docker-compose -f docker-compose.production.yml up -d marketing

# 4. Verify rollback
curl -I https://stratekaz.com/health

# 5. Investigate issue
docker-compose -f docker-compose.production.yml logs marketing --tail=100
```

**Blue-Green Rollback (if using):**
```bash
# Revert traffic to previous environment
echo "blue" > ~/stratekaz-production/current-environment.txt
docker-compose exec nginx nginx -s reload
```

---

## Summary Checklist

### Critical Path (Must Complete)
- [ ] 1. Fix environment variables (Sentry DSN)
- [ ] 2. Enable minification
- [ ] 3. Fix Dockerfile path
- [ ] 4. Create post-build script
- [ ] 5. Fix CSP for production
- [ ] 6. Provision server
- [ ] 7. Configure DNS
- [ ] 8. Generate SSL certificate
- [ ] 9. Create nginx SSL config
- [ ] 10. Build production images
- [ ] 11. Deploy to production
- [ ] 12. Verify deployment
- [ ] 13. Configure monitoring
- [ ] 14. Security verification
- [ ] 15. Performance check

### High Priority (Complete Week 1)
- [ ] 16. Monitor 24-48 hours
- [ ] 17. SEO setup
- [ ] 18. Backup configuration

### Medium Priority (Complete Month 1)
- [ ] Implement Google Analytics code
- [ ] Add CDN (CloudFlare)
- [ ] Image optimization
- [ ] Lighthouse CI in GitHub Actions

---

## Success Criteria

### Technical ✅
- [ ] Site accessible via HTTPS
- [ ] SSL Labs grade A or A+
- [ ] Lighthouse score > 90 (desktop)
- [ ] No critical errors in Sentry
- [ ] Uptime > 99.9% (24 hours)

### Business ✅
- [ ] All pages load correctly
- [ ] Forms work (contact, register)
- [ ] Mobile responsive
- [ ] WhatsApp link works
- [ ] Analytics tracking (if implemented)

---

## Timeline

**Day 1 (3-4 hours):**
- Morning: Fix critical issues (#1-5)
- Afternoon: Server setup (#6-9)

**Day 2 (2-3 hours):**
- Morning: Deployment (#10-12)
- Afternoon: Verification (#13-15)

**Day 3-7:**
- Monitor and optimize
- Complete high-priority items

---

## Support Contacts

**Server Issues:**
- Provider: [DigitalOcean/AWS/etc]
- Support: [support link]

**DNS Issues:**
- Provider: [Your DNS provider]
- Support: [support link]

**Development Team:**
- Lead: [Name/Email]
- DevOps: [Name/Email]

**Emergency Contacts:**
- On-call: [Phone]
- Backup: [Phone]

---

## Useful Commands

**Check Service Status:**
```bash
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs marketing --tail=50
```

**Restart Service:**
```bash
docker-compose -f docker-compose.production.yml restart marketing
```

**View Logs:**
```bash
docker-compose -f docker-compose.production.yml logs -f marketing
```

**Check Resource Usage:**
```bash
docker stats
htop
df -h
```

**SSL Certificate Renewal:**
```bash
docker-compose -f docker-compose.production.yml --profile certbot run certbot renew
docker-compose -f docker-compose.production.yml exec nginx nginx -s reload
```

---

**Last Updated:** 2025-12-01
**Next Review:** After production deployment
**Document Owner:** DevOps Team
