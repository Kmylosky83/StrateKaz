# 🌐 StrateKaz Marketing Site

> Modern, mobile-first landing page for StrateKaz BPM Suite

[![Deploy](https://img.shields.io/badge/status-production-success)](https://stratekaz.com)
[![React](https://img.shields.io/badge/react-19.1-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/typescript-5.9-blue)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/vite-7.1-646cff)](https://vitejs.dev)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development server (port 3006)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📦 What's Inside

This is a **standalone React application** separate from the main frontend app.

### Pages (4)
- **Landing** (`/`) - Hero + Features + CTA
- **Pricing** (`/pricing`) - Plans and pricing tiers
- **Contact** (`/contact`) - Contact form + WhatsApp integration
- **Register** (`/register`) - User registration flow

### Tech Stack

- **React 19.1** - UI framework
- **TypeScript 5.9** - Type safety
- **Vite 7.1** - Build tool
- **Tailwind CSS 3.4** - Styling
- **Framer Motion 12.x** - Animations
- **React Router 7.x** - Routing
- **Sentry 10.x** - Error tracking

## 🎯 Key Features

✅ **Mobile-First** - Optimized from 375px → 1536px  
✅ **Type-Safe** - 100% TypeScript coverage  
✅ **Fast Build** - ~18s production build  
✅ **Small Bundle** - ~680KB total (~175KB gzipped)  
✅ **SEO Ready** - Meta tags + performance optimized  
✅ **Error Tracking** - Sentry integration

## 📊 Performance

- **Lighthouse:** 95+ (desktop), 85+ (mobile)
- **First Contentful Paint:** <1.2s
- **Cumulative Layout Shift:** <0.1
- **Total Bundle:** 680KB (~175KB gzipped)

## 🛠️ Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test
```

## 📚 Documentation

- **[Responsive System](./docs/RESPONSIVE_SYSTEM.md)** - Mobile-first architecture
- **[Mobile Optimizations](./docs/MOBILE_OPTIMIZATION.md)** - Mobile UX strategies
- **[Custom Hooks](./docs/HOOKS_UTILITIES.md)** - React hooks documentation

## 🔗 Integration

**Backend API:**  
- Development: `http://localhost:8000`  
- Production: `https://app.stratekaz.com`

**Endpoints Used:**
```
POST /auth/register/           # User registration
POST /auth/check-email/        # Email validation
POST /tenants/check-subdomain/ # Subdomain validation
POST /contact/                 # Contact form
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Output: `dist/` directory ready for deployment

### Deploy to cPanel

1. Build the project
2. Upload `dist/` contents to web root
3. Ensure `.htaccess` is present
4. Verify at `https://stratekaz.com`

## 🌟 Recent Fixes

- ✅ Fixed Sentry TypeScript error (tracePropagationTargets)
- ✅ WebVitalsDebugger only in development
- ✅ Build compiles without errors

## 📝 Scripts Reference

```bash
npm run dev              # Development (port 3006)
npm run build            # Production build
npm run build:skip-ts    # Build without TypeScript check
npm run preview          # Preview build
npm run lint             # ESLint
npm run lint:fix         # Fix linting issues
npm run type-check       # TypeScript check
npm run test             # Run tests
npm run test:coverage    # Coverage report
```

## 📄 License

Proprietary - StrateKaz © 2025

---

**Version:** 1.0.5  
**Last Updated:** 2025-10-25  
**Production:** https://stratekaz.com
