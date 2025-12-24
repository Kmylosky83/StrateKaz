# ============================================
# Multi-stage build para Frontend React/Vite
# Producción optimizada
# ============================================

# ==================== STAGE 1: Builder ====================
FROM node:20-alpine AS builder

LABEL maintainer="Grasas y Huesos del Norte"
LABEL description="Frontend React/Vite - Build Stage"

# Variables de build
ARG VITE_API_URL
ARG VITE_APP_NAME="Grasas y Huesos del Norte"

# Instalar dependencias necesarias para compilación
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Crear directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias (incluyendo devDependencies para build)
RUN npm ci --only=production=false && \
    npm cache clean --force

# Copiar código fuente
COPY . .

# Build de producción
ENV NODE_ENV=production
RUN npm run build

# ==================== STAGE 2: Production ====================
FROM nginx:1.29-alpine AS production

LABEL maintainer="Grasas y Huesos del Norte"
LABEL description="Frontend React/Vite - Production Server"

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Copiar archivos compilados desde builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Crear usuario no-root para nginx
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-app -g nginx-app nginx-app && \
    chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/run/nginx.pid

# Exponer puerto
EXPOSE 80

# Cambiar a usuario no-root
USER nginx-app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
