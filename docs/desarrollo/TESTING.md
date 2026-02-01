# Testing y QA

El proyecto implementa un stack completo de testing para garantizar calidad y estabilidad.

## Resumen de Tests

| Categoría | Tests | Framework |
|-----------|-------|-----------|
| Backend | 310+ | pytest + pytest-django |
| Frontend | 71+ | Vitest + React Testing Library |
| Componentes | Visual | Storybook |

---

## Backend Testing

### Framework

- **pytest** + **pytest-django**
- **Factory Boy** para fixtures
- **Coverage.py** para cobertura

### Comandos

```bash
# Ejecutar todos los tests
docker-compose exec backend pytest

# Tests con coverage
docker-compose exec backend pytest --cov=apps --cov-report=html

# Tests de una app específica
docker-compose exec backend pytest apps/core/tests/

# Tests con verbosidad
docker-compose exec backend pytest -v

# Tests que coincidan con patrón
docker-compose exec backend pytest -k "test_cargo"

# Solo tests fallidos anteriormente
docker-compose exec backend pytest --lf
```

### Estructura de Tests

```
backend/apps/
├── core/
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py          # Fixtures compartidas
│       ├── test_models.py       # Tests de modelos
│       ├── test_views.py        # Tests de vistas/API
│       ├── test_serializers.py  # Tests de serializers
│       └── test_permissions.py  # Tests de permisos
├── gestion_estrategica/
│   ├── gestion_proyectos/
│   │   └── tests/
│   │       ├── conftest.py      # Fixtures PMI
│   │       ├── test_models.py   # Tests Portafolio, Proyecto
│   │       └── test_views.py    # Tests ViewSets
│   └── revision_direccion/
│       └── tests/
│           ├── conftest.py      # Fixtures ISO 9.3
│           ├── test_models.py   # Tests Programa, Acta, Compromiso
│           └── test_views.py    # Tests ViewSets
```

### Ejemplo de Test

```python
# apps/core/tests/test_models.py
import pytest
from apps.core.models import Cargo

@pytest.mark.django_db
class TestCargoModel:
    def test_create_cargo(self):
        cargo = Cargo.objects.create(
            codigo='gerente_general',
            nombre='Gerente General',
            nivel_jerarquico='ESTRATEGICO'
        )
        assert cargo.id is not None
        assert cargo.is_active is True

    def test_cargo_str(self):
        cargo = Cargo(nombre='Gerente General')
        assert str(cargo) == 'Gerente General'

    def test_soft_delete(self):
        cargo = Cargo.objects.create(nombre='Test')
        cargo.soft_delete()
        assert cargo.is_active is False
        assert cargo.deleted_at is not None
```

### Fixtures con Factory Boy

```python
# apps/core/tests/factories.py
import factory
from apps.core.models import User, Cargo

class CargoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Cargo

    codigo = factory.Sequence(lambda n: f'cargo_{n}')
    nombre = factory.Faker('job', locale='es')
    nivel_jerarquico = 'OPERATIVO'
    is_active = True

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Faker('email')
    first_name = factory.Faker('first_name', locale='es')
    last_name = factory.Faker('last_name', locale='es')
    cargo = factory.SubFactory(CargoFactory)
```

### Tests Implementados

| Categoría | Tests | Descripción |
|-----------|-------|-------------|
| RBAC System | 106+ | Permisos, roles, grupos, jerarquías |
| Jerarquía Áreas | 29 | Tests de árbol jerárquico |
| Modelo Cargo | 32 | Manual de funciones completo |
| EmpresaConfig | 32 | Singleton, validaciones DIAN |
| ConsecutivoConfig | 40 | Thread-safe, reinicio automático |
| Gestión Proyectos | 50+ | Portafolios, programas, proyectos PMI |
| Revisión Dirección | 40+ | Programas, actas, compromisos ISO 9.3 |

---

## Frontend Testing

### Framework

- **Vitest** (compatible con Jest)
- **React Testing Library**
- **MSW** para mocking de API

### Configuración

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Comandos

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch

# Tests con UI
npm run test:ui
```

### Estructura de Tests

```
frontend/src/
├── __tests__/
│   ├── components/
│   │   ├── Button.test.tsx
│   │   └── Modal.test.tsx
│   ├── hooks/
│   │   └── useGenericCRUD.test.ts
│   └── utils/
│       └── formatters.test.ts
├── components/
│   └── common/
│       ├── Button.tsx
│       └── Button.test.tsx  # Co-located tests
```

### Ejemplo de Test

```typescript
// src/__tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/common/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant classes', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });
});
```

---

## Storybook

Catálogo visual de componentes UI.

### Comandos

```bash
# Iniciar Storybook
npm run storybook

# Build para producción
npm run build-storybook
```

**URL:** http://localhost:6006

### Ejemplo de Story

```typescript
// src/components/common/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
  },
};

export const Loading: Story = {
  args: {
    children: 'Saving...',
    loading: true,
  },
};

export const Danger: Story = {
  args: {
    children: 'Delete',
    variant: 'danger',
  },
};
```

### Stories Creadas

- `Button.stories.tsx` - Variantes de botón
- `Badge.stories.tsx` - Badges/etiquetas
- `Modal.stories.tsx` - Sistema de modales
- `Card.stories.tsx` - Tarjetas

---

## Coverage Goals

| Área | Objetivo | Actual |
|------|----------|--------|
| Backend models | 90% | 85% |
| Backend views | 80% | 75% |
| Frontend components | 70% | 65% |
| Frontend hooks | 80% | 70% |

---

## Documentación Adicional

- [INFORME_TESTING_SEMANA_3.md](sesiones/INFORME_TESTING_SEMANA_3.md) - Informe detallado
- [TESTS_RBAC_COMPLETADO.md](sesiones/TESTS_RBAC_COMPLETADO.md) - Tests RBAC
- [frontend/.storybook/README.md](../../frontend/.storybook/README.md) - Guía Storybook
