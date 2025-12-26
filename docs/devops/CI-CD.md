# CI/CD con GitHub Actions

El proyecto implementa pipelines de CI/CD automatizados para garantizar calidad y deployment continuo.

## Workflows Configurados

**Ubicación:** `.github/workflows/`

| Workflow | Archivo | Trigger | Descripción |
|----------|---------|---------|-------------|
| CI Pipeline | `ci.yml` | Push, PR | Tests, linting, coverage |
| Docker Build | `docker-build.yml` | Push a main | Build imágenes Docker |
| PR Checks | `pr-checks.yml` | Pull Request | Validaciones de código |
| CodeQL | `codeql.yml` | Schedule | Análisis de seguridad |

---

## CI Pipeline (`ci.yml`)

Ejecuta en cada push y PR.

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r backend/requirements.txt
      - run: pytest backend/ --cov=apps --cov-report=xml
      - uses: codecov/codecov-action@v4

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run type-check
      - run: cd frontend && npm test -- --coverage
      - uses: codecov/codecov-action@v4

  build-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run build
```

---

## Docker Build (`docker-build.yml`)

Build automático de imágenes Docker.

```yaml
name: Docker Build

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ghcr.io/${{ github.repository }}/backend:latest

  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ghcr.io/${{ github.repository }}/frontend:latest
```

---

## PR Checks (`pr-checks.yml`)

Validaciones automáticas en PRs.

```yaml
name: PR Checks

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install flake8
      - run: flake8 backend/

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd frontend && npm ci
      - run: cd frontend && npm run type-check

  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd frontend && npm ci && npm run build
      - uses: preactjs/compressed-size-action@v2
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          build-script: 'build'
          pattern: 'frontend/dist/**/*.js'
```

---

## CodeQL (`codeql.yml`)

Análisis de seguridad semanal.

```yaml
name: CodeQL

on:
  schedule:
    - cron: '0 2 * * 1'  # Lunes 2:00 AM
  push:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    strategy:
      matrix:
        language: [python, javascript]
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
      - uses: github/codeql-action/analyze@v3
```

---

## Secretos Requeridos

Configurar en GitHub → Settings → Secrets:

| Secreto | Descripción |
|---------|-------------|
| `GITHUB_TOKEN` | Auto-generado |
| `CODECOV_TOKEN` | Token de Codecov |
| `DOCKER_USERNAME` | Usuario Docker Hub (opcional) |
| `DOCKER_PASSWORD` | Password Docker Hub (opcional) |

---

## Badges

Agregar al README:

```markdown
![CI](https://github.com/user/repo/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/user/repo/actions/workflows/codeql.yml/badge.svg)
[![codecov](https://codecov.io/gh/user/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/user/repo)
```

---

## Troubleshooting

### Tests Fallando en CI

```bash
# Ejecutar localmente igual que CI
docker-compose exec backend pytest -v

# Verificar diferencias de entorno
docker-compose exec backend python --version
```

### Build Docker Fallando

```bash
# Build local para debug
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend
```

---

## Documentación Relacionada

- [DESPLIEGUE.md](DESPLIEGUE.md) - Guía de deployment
- [BACKUPS.md](BACKUPS.md) - Sistema de backups
