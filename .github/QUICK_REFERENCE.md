# GitHub Actions - Referencia Rápida

## Comandos de Testing Local

### Windows PowerShell
```powershell
# Test completo (backend + frontend)
.\.github\scripts\test-ci-locally.ps1

# Solo backend
.\.github\scripts\test-ci-locally.ps1 -BackendOnly

# Solo frontend
.\.github\scripts\test-ci-locally.ps1 -FrontendOnly

# Incluir Docker builds
.\.github\scripts\test-ci-locally.ps1 -Docker

# Ver ayuda
.\.github\scripts\test-ci-locally.ps1 -Help
```

### Bash (Linux/Mac/Git Bash)
```bash
# Test completo
bash .github/scripts/test-ci-locally.sh

# Solo backend
bash .github/scripts/test-ci-locally.sh --backend-only

# Solo frontend
bash .github/scripts/test-ci-locally.sh --frontend-only

# Incluir Docker builds
bash .github/scripts/test-ci-locally.sh --docker

# Ver ayuda
bash .github/scripts/test-ci-locally.sh --help
```

---

## Workflows y Duración

| Workflow | Trigger | Duración | Propósito |
|----------|---------|----------|-----------|
| CI | Push/PR | 5-8 min | Tests y validación |
| Docker Build | Tags/Main | 8-12 min | Build de imágenes |
| PR Checks | PRs | 2-3 min | Validación de PRs |
| CodeQL | Push/Schedule | 10-15 min | Seguridad |

---

## Formato de Commits

```
<type>(<scope>): <description>
```

### Types Comunes
- `feat` - Nueva funcionalidad
- `fix` - Corrección de bug
- `docs` - Documentación
- `refactor` - Refactorización
- `chore` - Mantenimiento

### Ejemplos
```
feat(auth): add JWT authentication
fix(api): resolve race condition
docs: update deployment guide
refactor(models): simplify user model
chore(deps): update Django to 5.0.9
```

---

## Formato de Branches

```
<type>/<description>
```

### Ejemplos
```
feature/user-authentication
bugfix/calculation-error
hotfix/security-patch
release/v1.2.0
```

---

## Crear Release

```bash
# 1. Crear tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# 2. Push tag
git push origin v1.0.0

# 3. Workflow automático construye imágenes Docker
```

---

## Imágenes Docker Generadas

```bash
# Backend
ghcr.io/<usuario>/grasas-y-huesos-del-norte/backend:latest
ghcr.io/<usuario>/grasas-y-huesos-del-norte/backend:v1.0.0

# Frontend
ghcr.io/<usuario>/grasas-y-huesos-del-norte/frontend:latest
ghcr.io/<usuario>/grasas-y-huesos-del-norte/frontend:v1.0.0

# Pull
docker pull ghcr.io/<usuario>/grasas-y-huesos-del-norte/backend:latest
```

---

## Checklist Pre-Push

- [ ] Tests pasan localmente
- [ ] Linting sin errores
- [ ] Type checking pasa
- [ ] Build exitoso
- [ ] Commits siguen convención
- [ ] Branch tiene nombre correcto
- [ ] No hay secrets hardcodeados

---

## Status Checks Requeridos

Para merge a `main`:

1. Backend - Django Tests
2. Frontend - Build & Type Check
3. CodeQL Analysis
4. PR Validation

---

## Troubleshooting Rápido

### Backend falla
```bash
cd backend
python manage.py check --deploy
python manage.py test
```

### Frontend falla
```bash
cd frontend
npm ci
npx tsc --noEmit
npm run build
```

### Docker falla
```bash
docker info  # Verificar Docker running
docker build -f backend/Dockerfile.prod -t test ./backend
```

### Cache problemas
1. Actions > Caches
2. Delete problematic cache
3. Re-run workflow

---

## Recursos Rápidos

- **Workflows**: `.github/workflows/`
- **Scripts**: `.github/scripts/`
- **Documentación completa**: `GITHUB_ACTIONS_SETUP.md`
- **Workflows README**: `.github/workflows/README.md`

---

## Configuración GitHub Requerida

### Mínima
1. Habilitar GitHub Container Registry
2. Configurar branch protection para `main`

### Recomendada
1. Crear equipos: devops-team, backend-team, frontend-team
2. Configurar environments: staging, production
3. Agregar secrets para deployment

---

## Dependabot Schedule

| Paquete | Día | Hora |
|---------|-----|------|
| Python | Lunes | 6:00 AM |
| NPM | Lunes | 6:00 AM |
| Docker | Martes | 6:00 AM |
| Actions | Miércoles | 6:00 AM |

---

**Última actualización:** 2025-12-23
