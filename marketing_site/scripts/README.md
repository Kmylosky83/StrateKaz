# Marketing Site Scripts

Utility scripts for build, deployment, and verification.

## Scripts

### post-build-cache-bust.js
Automatically runs after `npm run build` to:
- Generate version.json with build metadata
- Update cache-killer.js with unique build hash
- Create _headers file for cache control
- Analyze bundle size
- Check for source maps

**Usage:**
```bash
node scripts/post-build-cache-bust.js
# Or automatically via: npm run build
```

### verify-deployment.sh
Comprehensive deployment verification script that tests:
- Site accessibility and response time
- SSL/TLS certificate validity
- Security headers
- Page content and structure
- All critical pages
- Static assets
- Health endpoint

**Usage:**
```bash
# Test production
./scripts/verify-deployment.sh https://stratekaz.com

# Test staging
./scripts/verify-deployment.sh https://staging.stratekaz.com

# Test local
./scripts/verify-deployment.sh http://localhost:3006
```

**Requirements:**
- curl
- openssl
- bash

## CI/CD Integration

These scripts are designed to work in CI/CD pipelines and will output appropriate exit codes:
- 0: Success
- 1: Failure

In GitHub Actions, they will also set output variables for use in subsequent steps.
