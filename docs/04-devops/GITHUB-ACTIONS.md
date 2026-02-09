# GitHub Actions CI/CD - Configuración Completa

## Resumen de Implementación

Se ha creado una configuración completa de CI/CD usando GitHub Actions para el proyecto **StrateKaz**.

### Fecha de Creación
2025-12-23

---

## Archivos Creados

### Workflows (`.github/workflows/`)

1. **ci.yml** - Integración Continua
   - Tests del backend Django con PostgreSQL
   - Build y type-check del frontend React
   - Validación con Black, Ruff y ESLint
   - Cache de pip y npm para optimización
   - Duración: ~5-8 minutos

2. **docker-build.yml** - Build de Imágenes Docker
   - Construcción de imágenes backend y frontend
   - Publicación a GitHub Container Registry
   - Escaneo de seguridad con Trivy
   - Multi-platform support (linux/amd64)
   - Duración: ~8-12 minutos

3. **pr-checks.yml** - Validación de Pull Requests
   - Verificación de formato Conventional Commits
   - Detección de conflictos de merge
   - Estadísticas de código
   - Revisión de cambios en dependencias
   - Duración: ~2-3 minutos

4. **codeql.yml** - Análisis de Seguridad
   - Análisis estático de código (JavaScript/Python)
   - Revisión de dependencias
   - Ejecución programada (lunes 6AM)
   - Duración: ~10-15 minutos

### Configuración

5. **dependabot.yml** - Actualizaciones Automáticas
   - Python packages (lunes)
   - NPM packages (lunes)
   - Docker images (martes)
   - GitHub Actions (miércoles)

### Scripts de Testing

6. **test-ci-locally.sh** - Testing local (Bash)
   - Para Linux, Mac y Git Bash en Windows
   - Ejecuta todos los checks de CI localmente

7. **test-ci-locally.ps1** - Testing local (PowerShell)
   - Para Windows PowerShell
   - Misma funcionalidad que versión Bash

### Documentación

8. **workflows/README.md** - Documentación detallada de workflows
9. **.github/README.md** - Guía general de configuración de GitHub

---

## Estructura de Archivos

```
c:\Proyectos\StrateKaz\
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # CI Pipeline
│   │   ├── docker-build.yml          # Docker Build
│   │   ├── pr-checks.yml             # PR Validation
│   │   ├── codeql.yml                # Security Analysis
│   │   └── README.md                 # Workflows Documentation
│   ├── scripts/
│   │   ├── test-ci-locally.sh        # Local Testing (Bash)
│   │   └── test-ci-locally.ps1       # Local Testing (PowerShell)
│   ├── dependabot.yml                # Dependency Updates
│   └── README.md                     # GitHub Configuration Guide
└── GITHUB_ACTIONS_SETUP.md           # This file
```

---

## Características Principales

### Optimizaciones Implementadas

1. **Caching Inteligente**
   - Cache de pip para dependencias Python
   - Cache de npm para dependencias Node
   - Cache de Docker layers para builds más rápidos
   - Cache persistente entre runs

2. **Ejecución Paralela**
   - Backend y frontend tests corren simultáneamente
   - Build de imágenes Docker en paralelo
   - Reduce tiempo total de pipeline

3. **Concurrency Control**
   - Cancela workflows obsoletos automáticamente
   - Ahorra minutos de CI/CD
   - Evita ejecuciones duplicadas

4. **Seguridad**
   - CodeQL analysis para detectar vulnerabilidades
   - Trivy scanning para imágenes Docker
   - Dependabot para actualizaciones de seguridad
   - No hay secrets hardcodeados

### Integraciones

- **GitHub Container Registry** - Almacenamiento de imágenes
- **GitHub Security** - Alertas de seguridad centralizadas
- **GitHub Step Summary** - Reportes visuales en workflows
- **GitHub Comments** - Feedback automático en PRs

---

## Uso Rápido

### 1. Testing Local (Antes de Push)

#### En Windows PowerShell:
```powershell
# Test completo
.\.github\scripts\test-ci-locally.ps1

# Solo backend
.\.github\scripts\test-ci-locally.ps1 -BackendOnly

# Solo frontend
.\.github\scripts\test-ci-locally.ps1 -FrontendOnly

# Con Docker
.\.github\scripts\test-ci-locally.ps1 -Docker
```

#### En Bash (Git Bash/Linux/Mac):
```bash
# Test completo
bash .github/scripts/test-ci-locally.sh

# Solo backend
bash .github/scripts/test-ci-locally.sh --backend-only

# Solo frontend
bash .github/scripts/test-ci-locally.sh --frontend-only

# Con Docker
bash .github/scripts/test-ci-locally.sh --docker
```

### 2. Crear Pull Request

```bash
# 1. Crear rama con formato correcto
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios y commits
git add .
git commit -m "feat(backend): add nueva funcionalidad"

# 3. Testing local
.\.github\scripts\test-ci-locally.ps1

# 4. Push
git push origin feature/nueva-funcionalidad

# 5. Crear PR con título en formato Conventional Commits
# Ejemplo: "feat(backend): add nueva funcionalidad"
```

### 3. Crear Release y Publicar Imágenes Docker

```bash
# 1. Crear tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# 2. Push tag
git push origin v1.0.0

# 3. El workflow docker-build.yml se ejecutará automáticamente

# 4. Imágenes disponibles en:
# ghcr.io/<usuario>/grasas-y-huesos-del-norte/backend:v1.0.0
# ghcr.io/<usuario>/grasas-y-huesos-del-norte/frontend:v1.0.0
```

---

## Configuración Requerida en GitHub

### 1. Habilitar GitHub Container Registry

1. Go to **Settings > Packages**
2. Enable "Improved container support"
3. Configure visibility (Public o Private)

### 2. Configurar Branch Protection

Para la rama `main`:

1. Go to **Settings > Branches**
2. Click "Add branch protection rule"
3. Branch name pattern: `main`
4. Habilitar:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass before merging
     - Backend - Django Tests
     - Frontend - Build & Type Check
     - CodeQL Analysis
   - ✅ Require conversation resolution before merging
   - ✅ Require linear history
   - ✅ Include administrators

### 3. Secrets (Opcional para Deployment)

Go to **Settings > Secrets and variables > Actions**

#### Secrets predeterminados:
- `GITHUB_TOKEN` - Provisto automáticamente por GitHub

#### Secrets adicionales (si necesitas deployment):
```
SSH_PRIVATE_KEY       # Clave SSH para deployment
SERVER_HOST           # ejemplo: app.grasasyhuesos.com
SERVER_USER           # ejemplo: deploy
DOCKER_HUB_USERNAME   # Si usas Docker Hub
DOCKER_HUB_TOKEN      # Token de Docker Hub
```

### 4. Configurar Equipos (Opcional)

Para revisores automáticos en Dependabot:

1. Create teams: `devops-team`, `backend-team`, `frontend-team`
2. Add members to teams
3. Configure team permissions

---

## Convenciones de Código

### Formato de Commits (Conventional Commits)

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - Nueva funcionalidad
- `fix` - Corrección de bug
- `docs` - Documentación
- `style` - Formato de código
- `refactor` - Refactorización
- `perf` - Mejoras de performance
- `test` - Tests
- `chore` - Mantenimiento
- `build` - Build system
- `ci` - CI/CD

**Ejemplos válidos:**
```
feat(auth): add JWT authentication
fix(api): resolve race condition in order processing
docs: update deployment instructions
refactor(models): simplify user model structure
perf(queries): optimize database queries with select_related
test(auth): add unit tests for login flow
chore(deps): update Django to 5.0.9
ci: add Docker security scanning
```

### Formato de Branches

```
<type>/<description-kebab-case>

Types: feature, bugfix, hotfix, release, docs, refactor, test
```

**Ejemplos válidos:**
```
feature/user-authentication
feature/export-to-excel
bugfix/calculation-error
bugfix/navigation-menu
hotfix/security-patch
release/v1.2.0
docs/api-documentation
refactor/database-models
test/integration-tests
```

---

## Troubleshooting

### Problema: Backend tests fallan localmente

**Solución:**
```bash
cd backend

# Verificar que PostgreSQL esta corriendo
docker-compose up -d db

# Ejecutar migrations
python manage.py migrate

# Ejecutar tests
python manage.py test

# Ver logs de errores
python manage.py check --deploy
```

### Problema: Frontend build falla

**Solución:**
```bash
cd frontend

# Limpiar node_modules
rm -rf node_modules package-lock.json

# Reinstalar
npm install

# Type check
npx tsc --noEmit

# Build
npm run build
```

### Problema: Docker build falla

**Solución:**
```bash
# Verificar Docker está corriendo
docker info

# Build backend con logs
docker build -f backend/Dockerfile.prod -t test-backend ./backend --progress=plain

# Build frontend con logs
docker build -f frontend/Dockerfile -t test-frontend ./frontend --progress=plain

# Limpiar cache de Docker
docker builder prune -a
```

### Problema: Workflow falla en GitHub Actions

**Solución:**
1. Ver logs detallados en Actions tab
2. Reproducir localmente con script de testing
3. Verificar cambios en dependencias
4. Re-run workflow después de corregir

### Problema: Cache causa problemas

**Solución:**
1. Go to Actions > Caches
2. Borrar caches problemáticos
3. Re-run workflow para regenerar

---

## Monitoreo y Métricas

### Dashboards Importantes

1. **Actions Dashboard**
   - Path: Actions tab
   - Monitorear ejecuciones de workflows
   - Ver tiempos de ejecución
   - Identificar failures

2. **Security Alerts**
   - Path: Security > Code scanning alerts
   - Revisar vulnerabilidades de CodeQL
   - Revisar vulnerabilidades de Trivy

3. **Dependabot**
   - Path: Security > Dependabot
   - PRs automáticos de actualizaciones
   - Alertas de seguridad

4. **Insights**
   - Path: Insights tab
   - Actividad del repositorio
   - Contribuidores
   - Dependency graph

### Métricas a Monitorear

- **Build Success Rate**: Objetivo > 95%
- **Average Build Time**: CI ~5-8 min, Docker ~8-12 min
- **Time to Merge**: PR checks ~2-3 min
- **Security Vulnerabilities**: Objetivo = 0 critical/high
- **Code Coverage**: (configurar pytest-cov después)

---

## Próximos Pasos Recomendados

### Corto Plazo (1-2 semanas)

- [ ] Configurar branch protection en GitHub
- [ ] Habilitar GitHub Container Registry
- [ ] Ejecutar primer workflow manualmente
- [ ] Crear primer PR de prueba
- [ ] Revisar y ajustar tiempos de cache

### Medio Plazo (1 mes)

- [ ] Agregar code coverage reporting
- [ ] Configurar deployment automático a staging
- [ ] Implementar E2E tests con Playwright
- [ ] Configurar notificaciones de Slack/Discord
- [ ] Crear environments (staging, production)

### Largo Plazo (3 meses)

- [ ] Implementar deployment a producción
- [ ] Agregar performance testing
- [ ] Implementar canary deployments
- [ ] Configurar monitoring con Prometheus/Grafana
- [ ] Crear dashboards de métricas

---

## Recursos Adicionales

### Documentación Oficial

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [CodeQL](https://codeql.github.com/docs/)
- [Trivy](https://aquasecurity.github.io/trivy/)

### Archivos del Proyecto

- `.github/README.md` - Guía general de GitHub
- `.github/workflows/README.md` - Documentación detallada de workflows
- `docs/DOCKER.md` - Documentación de Docker (si existe)
- `README.md` - README principal del proyecto

### Contacto

Para preguntas sobre esta configuración:
1. Crear issue en el repositorio
2. Contactar al equipo de DevOps
3. Revisar logs de workflows en Actions tab

---

## Changelog

### 2025-12-23 - Configuración Inicial

**Creado:**
- CI workflow con backend tests y frontend build
- Docker build workflow con security scanning
- PR checks workflow con validaciones
- CodeQL security analysis workflow
- Dependabot configuration
- Scripts de testing local (Bash y PowerShell)
- Documentación completa

**Características:**
- Parallel execution de jobs
- Intelligent caching (pip, npm, Docker)
- Concurrency control
- Security scanning (CodeQL, Trivy)
- Automated dependency updates
- Conventional commits enforcement
- Local testing scripts

---

**Última actualización:** 2025-12-23

**Autor:** DevOps Team

**Versión:** 1.0.0
