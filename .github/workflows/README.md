# GitHub Actions Workflows

Este directorio contiene los workflows de CI/CD para el proyecto StrateKaz.

## Workflows Disponibles

### 1. CI - Continuous Integration (`ci.yml`)

**Propósito:** Validar código en cada push y pull request.

**Triggers:**
- Push a `main` o `develop`
- Pull requests hacia `main` o `develop`

**Jobs:**
- **backend-test**: Ejecuta tests del backend Django
  - Instala Python 3.11
  - Configura MySQL 8.0 para testing
  - Ejecuta Django checks, migrations y tests
  - Valida código con Black y Ruff
  - Cache de pip para optimización

- **frontend-build**: Compila y valida el frontend React
  - Instala Node.js 20
  - Ejecuta TypeScript type checking
  - Ejecuta ESLint
  - Compila el bundle de producción
  - Cache de npm para optimización
  - Sube artifacts del build

- **quality-summary**: Genera resumen de calidad
  - Muestra estado de todos los checks
  - Genera reporte en GitHub Step Summary

**Duración aproximada:** 5-8 minutos

---

### 2. Docker Build & Push (`docker-build.yml`)

**Propósito:** Construir y publicar imágenes Docker.

**Triggers:**
- Push a `main`
- Tags con formato `v*.*.*` o `release-*`
- Manual dispatch

**Jobs:**
- **build-backend**: Construye imagen del backend
  - Usa multi-platform build (linux/amd64)
  - Publica a GitHub Container Registry
  - Usa cache de GitHub Actions
  - Genera metadata con tags automáticos

- **build-frontend**: Construye imagen del frontend
  - Usa multi-platform build (linux/amd64)
  - Publica a GitHub Container Registry
  - Configura variables de entorno para Vite
  - Usa cache de GitHub Actions

- **security-scan**: Escaneo de seguridad con Trivy
  - Analiza vulnerabilidades CRITICAL y HIGH
  - Sube resultados a GitHub Security

- **build-summary**: Genera resumen del build
  - Muestra estado de las imágenes
  - Provee comandos de pull

**Duración aproximada:** 8-12 minutos

**Imágenes generadas:**
```bash
# Backend
ghcr.io/<username>/grasas-y-huesos-del-norte/backend:latest
ghcr.io/<username>/grasas-y-huesos-del-norte/backend:v1.0.0

# Frontend
ghcr.io/<username>/grasas-y-huesos-del-norte/frontend:latest
ghcr.io/<username>/grasas-y-huesos-del-norte/frontend:v1.0.0
```

---

### 3. PR Checks (`pr-checks.yml`)

**Propósito:** Validaciones adicionales para pull requests.

**Triggers:**
- Pull requests (opened, synchronize, reopened)

**Jobs:**
- **pr-validation**: Valida formato del PR
  - Verifica título con Conventional Commits
  - Detecta conflictos de merge
  - Valida nombre de la rama

- **code-stats**: Genera estadísticas de código
  - Cuenta archivos modificados por categoría
  - Muestra líneas agregadas/removidas

- **dependency-check**: Revisa cambios en dependencias
  - Muestra diff de requirements.txt
  - Muestra diff de package.json

- **pr-comment**: Comenta en el PR con resumen
  - Actualiza comentario existente
  - Muestra estado de todos los checks

**Formato esperado para PRs:**
```
feat(backend): add user authentication
fix(frontend): resolve navigation bug
docs: update deployment guide
```

**Formato esperado para branches:**
```
feature/user-authentication
bugfix/navigation-error
hotfix/security-patch
```

---

### 4. CodeQL Security Analysis (`codeql.yml`)

**Propósito:** Análisis de seguridad del código.

**Triggers:**
- Push a `main` o `develop`
- Pull requests
- Schedule: Lunes a las 6:00 AM UTC

**Jobs:**
- **analyze**: Análisis con CodeQL
  - Lenguajes: JavaScript/TypeScript y Python
  - Queries: security-extended y security-and-quality
  - Sube resultados a GitHub Security

- **dependency-review**: Revisión de dependencias (solo PRs)
  - Detecta vulnerabilidades en dependencias
  - Falla en severidad moderate o superior
  - Comenta en PR con hallazgos

**Duración aproximada:** 10-15 minutos

---

## Configuración de Secrets

Los workflows usan secretos de GitHub. Configurar en `Settings > Secrets and variables > Actions`:

### Secrets Requeridos

| Secret | Descripción | Usado en |
|--------|-------------|----------|
| `GITHUB_TOKEN` | Token automático de GitHub (provisto por defecto) | Todos |

### Secrets Opcionales (para deployment)

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `DOCKER_HUB_USERNAME` | Usuario de Docker Hub | `mycompany` |
| `DOCKER_HUB_TOKEN` | Token de Docker Hub | `dckr_pat_...` |
| `SSH_PRIVATE_KEY` | Clave SSH para deployment | `-----BEGIN OPENSSH...` |
| `SERVER_HOST` | Host del servidor de producción | `app.example.com` |
| `SERVER_USER` | Usuario SSH | `deploy` |

---

## Variables de Entorno

Configurar en `Settings > Secrets and variables > Actions > Variables`:

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `PYTHON_VERSION` | `3.11` | Versión de Python |
| `NODE_VERSION` | `20` | Versión de Node.js |
| `REGISTRY` | `ghcr.io` | Registry de Docker |

---

## Optimizaciones Implementadas

### Cache Strategy
- **pip cache**: Acelera instalación de dependencias Python
- **npm cache**: Acelera instalación de dependencias Node
- **Docker layer cache**: Usa GitHub Actions cache para layers
- **node_modules cache**: Evita reinstalación completa

### Concurrency Control
- Cancela workflows anteriores en la misma branch
- Ahorra tiempo y recursos de CI/CD

### Parallel Jobs
- Backend y frontend se ejecutan en paralelo
- Reduce tiempo total de pipeline

---

## Uso y Best Practices

### Para Desarrolladores

1. **Antes de crear un PR:**
   ```bash
   # Backend
   cd backend
   python manage.py check
   black --check .
   ruff check .

   # Frontend
   cd frontend
   npm run lint
   npx tsc --noEmit
   npm run build
   ```

2. **Formato de commits:**
   ```
   type(scope): description

   Types: feat, fix, docs, style, refactor, perf, test, chore
   ```

3. **Crear tags para releases:**
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

### Para Administradores

1. **Habilitar GitHub Container Registry:**
   - Go to Settings > Packages
   - Enable package visibility

2. **Configurar branch protection:**
   ```yaml
   Required checks:
     - Backend - Django Tests
     - Frontend - Build & Type Check
     - CodeQL Analysis
   ```

3. **Monitorear usage:**
   - Settings > Actions > General
   - Revisar límites de minutos

---

## Troubleshooting

### Build Failures

**Backend tests failing:**
```bash
# Local testing
docker-compose up -d db
cd backend
python manage.py test --keepdb
```

**Frontend build failing:**
```bash
# Local testing
cd frontend
npm ci
npm run build
```

**Docker build failing:**
```bash
# Test Docker build locally
docker build -f backend/Dockerfile.prod -t test-backend ./backend
docker build -f frontend/Dockerfile -t test-frontend ./frontend
```

### Cache Issues

Si el cache está causando problemas:
1. Go to Actions tab
2. Click on "Caches"
3. Delete problematic cache entries

### Permission Issues

Si hay errores de permisos:
1. Verify repository settings
2. Check GITHUB_TOKEN permissions
3. Enable "Read and write permissions" in Settings > Actions > General

---

## Métricas y Monitoreo

### Dashboards Recomendados

1. **Actions Usage**
   - Path: Insights > Actions
   - Monitorear minutos consumidos
   - Identificar workflows más lentos

2. **Security Alerts**
   - Path: Security > Code scanning alerts
   - Revisar hallazgos de CodeQL y Trivy

3. **Dependency Graph**
   - Path: Insights > Dependency graph
   - Monitorear vulnerabilidades

---

## Próximos Pasos

- [ ] Agregar deployment automático a staging
- [ ] Configurar notificaciones de Slack
- [ ] Implementar performance testing
- [ ] Agregar E2E tests con Playwright
- [ ] Configurar environments (staging, production)

---

## Contacto y Soporte

Para preguntas sobre los workflows, contactar al equipo de DevOps o crear un issue en el repositorio.
