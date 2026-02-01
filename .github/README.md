# GitHub Configuration

Este directorio contiene la configuración de GitHub para el proyecto **StrateKaz**.

## Estructura del Directorio

```
.github/
├── workflows/              # GitHub Actions workflows
│   ├── ci.yml             # Continuous Integration
│   ├── docker-build.yml   # Docker image building
│   ├── pr-checks.yml      # Pull Request validation
│   ├── codeql.yml         # Security analysis
│   └── README.md          # Documentación de workflows
├── scripts/               # Helper scripts
│   ├── test-ci-locally.sh # Test CI locally (Bash)
│   └── test-ci-locally.ps1 # Test CI locally (PowerShell)
├── dependabot.yml         # Dependabot configuration
└── README.md              # This file
```

## Quick Start

### Para Desarrolladores

1. **Antes de crear un Pull Request:**
   ```bash
   # En Linux/Mac
   bash .github/scripts/test-ci-locally.sh

   # En Windows PowerShell
   .\.github\scripts\test-ci-locally.ps1
   ```

2. **Verificar solo el backend:**
   ```bash
   # Bash
   bash .github/scripts/test-ci-locally.sh --backend-only

   # PowerShell
   .\.github\scripts\test-ci-locally.ps1 -BackendOnly
   ```

3. **Verificar solo el frontend:**
   ```bash
   # Bash
   bash .github/scripts/test-ci-locally.sh --frontend-only

   # PowerShell
   .\.github\scripts\test-ci-locally.ps1 -FrontendOnly
   ```

### Crear un Pull Request

1. **Nombre de la rama:**
   ```
   feature/nombre-descriptivo
   bugfix/descripcion-del-bug
   hotfix/arreglo-urgente
   ```

2. **Título del PR (Conventional Commits):**
   ```
   feat(backend): add user authentication
   fix(frontend): resolve navigation bug
   docs: update deployment guide
   ```

3. **Esperar a que pasen los checks:**
   - Backend Tests
   - Frontend Build
   - CodeQL Analysis
   - PR Validation

## Workflows Disponibles

### 1. CI - Continuous Integration
- **Archivo:** `workflows/ci.yml`
- **Trigger:** Push a main/develop, Pull Requests
- **Duración:** ~5-8 minutos
- **Propósito:** Validar código y ejecutar tests

### 2. Docker Build & Push
- **Archivo:** `workflows/docker-build.yml`
- **Trigger:** Tags, Push a main
- **Duración:** ~8-12 minutos
- **Propósito:** Construir y publicar imágenes Docker

### 3. PR Checks
- **Archivo:** `workflows/pr-checks.yml`
- **Trigger:** Pull Requests
- **Duración:** ~2-3 minutos
- **Propósito:** Validaciones adicionales de PRs

### 4. CodeQL Security Analysis
- **Archivo:** `workflows/codeql.yml`
- **Trigger:** Push, PRs, Schedule (lunes 6AM)
- **Duración:** ~10-15 minutos
- **Propósito:** Análisis de seguridad

Para más detalles, ver [workflows/README.md](workflows/README.md)

## Dependabot

Dependabot está configurado para actualizar automáticamente las dependencias:

- **Python packages:** Lunes 6:00 AM
- **NPM packages:** Lunes 6:00 AM
- **Docker images:** Martes 6:00 AM
- **GitHub Actions:** Miércoles 6:00 AM

Las actualizaciones se agrupan inteligentemente (ej: todas las dependencias de React juntas).

## Configuración Requerida

### 1. GitHub Container Registry

Para publicar imágenes Docker:

1. Go to **Settings > Packages**
2. Enable "Improved container support"
3. Configure package visibility (Public/Private)

### 2. Branch Protection Rules

Configurar para `main`:

1. Go to **Settings > Branches**
2. Add rule para `main`
3. Habilitar:
   - Require pull request before merging
   - Require status checks to pass:
     - Backend - Django Tests
     - Frontend - Build & Type Check
     - CodeQL Analysis
   - Require conversation resolution before merging
   - Require linear history

### 3. Environments (Opcional)

Para deployments automáticos:

1. Go to **Settings > Environments**
2. Crear environments: `staging`, `production`
3. Configurar protection rules
4. Agregar secrets específicos del environment

### 4. Secrets

Configurar en **Settings > Secrets and variables > Actions**:

#### Secrets Predeterminados
- `GITHUB_TOKEN` - Provisto automáticamente

#### Secrets para Deployment (Opcional)
- `SSH_PRIVATE_KEY` - Para deployment via SSH
- `SERVER_HOST` - Host del servidor
- `SERVER_USER` - Usuario SSH
- `DOCKER_HUB_USERNAME` - Para Docker Hub
- `DOCKER_HUB_TOKEN` - Token de Docker Hub

## Testing Local de Workflows

### Bash (Linux/Mac/Git Bash)

```bash
# Test completo
bash .github/scripts/test-ci-locally.sh

# Solo backend
bash .github/scripts/test-ci-locally.sh --backend-only

# Solo frontend
bash .github/scripts/test-ci-locally.sh --frontend-only

# Incluir Docker
bash .github/scripts/test-ci-locally.sh --docker

# Sin checks de Git
bash .github/scripts/test-ci-locally.sh --skip-git

# Ver ayuda
bash .github/scripts/test-ci-locally.sh --help
```

### PowerShell (Windows)

```powershell
# Test completo
.\.github\scripts\test-ci-locally.ps1

# Solo backend
.\.github\scripts\test-ci-locally.ps1 -BackendOnly

# Solo frontend
.\.github\scripts\test-ci-locally.ps1 -FrontendOnly

# Incluir Docker
.\.github\scripts\test-ci-locally.ps1 -Docker

# Sin checks de Git
.\.github\scripts\test-ci-locally.ps1 -SkipGit

# Ver ayuda
.\.github\scripts\test-ci-locally.ps1 -Help
```

## Convenciones de Código

### Commits (Conventional Commits)

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Formato, espacios en blanco
- `refactor`: Refactorización de código
- `perf`: Mejoras de performance
- `test`: Tests
- `chore`: Mantenimiento
- `build`: Sistema de build
- `ci`: CI/CD

**Ejemplos:**
```
feat(auth): add JWT authentication
fix(api): resolve race condition in orders
docs: update deployment instructions
refactor(models): simplify user model structure
```

### Branches

```
<type>/<description>

Types: feature, bugfix, hotfix, release, docs, refactor, test
```

**Ejemplos:**
```
feature/user-authentication
bugfix/order-calculation-error
hotfix/security-vulnerability
release/v1.2.0
```

## Monitoreo y Alertas

### GitHub Actions Dashboard

1. Go to **Actions** tab
2. Ver workflows ejecutados
3. Revisar logs de ejecución
4. Cancelar workflows si es necesario

### Security Alerts

1. Go to **Security** tab
2. **Code scanning alerts** - Resultados de CodeQL
3. **Dependabot alerts** - Vulnerabilidades en dependencias
4. **Secret scanning** - Detecta secretos expuestos

### Insights

1. Go to **Insights** tab
2. **Pulse** - Actividad reciente
3. **Contributors** - Contribuidores
4. **Dependency graph** - Grafo de dependencias
5. **Network** - Visualización de branches

## Troubleshooting

### Workflow Failed

1. Ver logs en Actions tab
2. Reproducir localmente con scripts de testing
3. Corregir problemas
4. Re-run workflow o hacer nuevo commit

### Dependabot PRs

1. Revisar cambios
2. Verificar que tests pasen
3. Mergear si todo está bien
4. Cerrar si no es necesario

### Cache Issues

Si los caches causan problemas:

1. Go to **Actions > Caches**
2. Eliminar caches problemáticos
3. Siguiente run reconstruirá el cache

## Mejores Prácticas

1. **Siempre ejecutar tests localmente** antes de push
2. **Mantener PRs pequeños** y enfocados
3. **Escribir mensajes de commit descriptivos**
4. **Revisar PRs de otros** cuando sea asignado
5. **No hacer force push** a main/develop
6. **Actualizar dependencias regularmente** via Dependabot
7. **Monitorear security alerts** y actuar rápidamente
8. **Documentar cambios importantes** en el PR

## Recursos

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Docker Documentation](https://docs.docker.com/)

## Soporte

Para preguntas o problemas con la configuración de GitHub:

1. Crear un issue en el repositorio
2. Contactar al equipo de DevOps
3. Revisar la documentación en `docs/`

---

**Última actualización:** 2025-12-23
