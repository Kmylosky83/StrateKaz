# Políticas de Desarrollo

Guías y convenciones para mantener consistencia y calidad en el código.

## 1. Estructura de Archivos

### Raíz del Proyecto

Solo archivos de configuración esenciales:
- `docker-compose.yml`
- `Makefile`
- `.env` / `.env.example`
- `.gitignore`
- `README.md`

### Prohibido en Raíz

- Archivos temporales (`.bak`, `.tmp`, `.old`, `.log`)
- Documentación extensa (va en `/docs`)
- Scripts de utilidad (van en `/backend/scripts/` o `/frontend/scripts/`)

---

## 2. Convenciones de Código

### Backend (Python/Django)

```python
# PEP 8 estricto
# Type hints en funciones públicas
def create_area(name: str, parent: Optional[Area] = None) -> Area:
    """
    Crea una nueva área.

    Args:
        name: Nombre del área
        parent: Área padre opcional

    Returns:
        Área creada
    """
    return Area.objects.create(nombre=name, parent=parent)

# Docstrings en clases y métodos públicos
class AreaViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de áreas organizacionales."""

    queryset = Area.objects.all()
    serializer_class = AreaSerializer
```

### Frontend (TypeScript/React)

```typescript
// ESLint + Prettier configurados
// Componentes funcionales con hooks
// Types/Interfaces para props

interface AreaCardProps {
  area: Area;
  onEdit: (area: Area) => void;
  onDelete: (id: number) => void;
}

export function AreaCard({ area, onEdit, onDelete }: AreaCardProps) {
  // ...
}

// Carpeta por feature
// features/gestion-estrategica/
//   ├── components/
//   ├── hooks/
//   ├── api/
//   └── types/
```

---

## 3. Git Workflow

### Ramas

```
main           # Producción estable
develop        # Desarrollo integrado
feature/*      # Nuevas funcionalidades
fix/*          # Correcciones de bugs
hotfix/*       # Fixes urgentes en producción
```

### Convención de Commits

```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
refactor: refactorización sin cambio de funcionalidad
test: agregar o modificar tests
chore: mantenimiento (deps, config)
style: formato, sin cambios de lógica
```

### Ejemplos

```bash
feat(areas): agregar soft delete a áreas
fix(auth): corregir refresh token loop
docs(readme): actualizar quick start
refactor(cargo): migrar a abstract models
test(rbac): agregar tests de permisos
chore(deps): actualizar react-query a v5
```

---

## 4. Uso de Agentes Especializados

Este proyecto utiliza agentes Claude Code especializados. **SIEMPRE** usar el agente apropiado:

| Agente | Uso |
|--------|-----|
| `django-master` | APIs REST, modelos, serializers, vistas |
| `react-architect` | Componentes React, hooks, estado, UI |
| `data-architect` | Esquemas DB, queries, migraciones |
| `devops-infrastructure-engineer` | Docker, CI/CD, deployment |
| `qa-testing-specialist` | Tests unitarios, integración, E2E |
| `documentation-expert` | Documentación técnica, APIs |

### Reglas de Agentes

1. **Paralelización:** Cuando la tarea lo permita, ejecutar múltiples agentes en paralelo
2. **Especialización:** Cada agente trabaja en su dominio específico
3. **Contexto:** Los agentes analizan la estructura existente antes de recomendar

### Ejemplo de Uso Paralelo

```
Tarea: "Agregar nuevo endpoint de reportes"

→ Agente django-master: Crear modelo y API
→ Agente react-architect: Crear componente de visualización
→ Agente qa-testing-specialist: Crear tests

(Ejecutados en paralelo)
```

---

## 5. Documentación

### Ubicación

| Tipo | Ubicación |
|------|-----------|
| General del proyecto | `/docs` |
| Arquitectura | `/docs/arquitectura` |
| Desarrollo | `/docs/desarrollo` |
| DevOps | `/docs/devops` |
| Backend específico | `/backend/README.md` |
| Frontend específico | `/frontend/README.md` |

### Inline Comments

Solo cuando el código no es autoexplicativo:

```python
# MAL - Comentario obvio
# Incrementar contador
counter += 1

# BIEN - Explica el por qué
# Incrementar en 2 porque el primer slot está reservado para headers
counter += 2
```

---

## 6. Testing

### Requisitos Mínimos

| Área | Coverage Mínimo |
|------|-----------------|
| Models | 90% |
| Views/API | 80% |
| Components | 70% |
| Hooks | 80% |

### Antes de PR

```bash
# Backend
docker-compose exec backend pytest
docker-compose exec backend flake8

# Frontend
npm test
npm run lint
npm run type-check
```

---

## 7. Code Review Checklist

- [ ] Tests incluidos
- [ ] Sin console.log/print debug
- [ ] Types correctos (no `any`)
- [ ] Sin hardcoding
- [ ] Documentación actualizada
- [ ] Migraciones incluidas
- [ ] Sin secrets en código

---

## 8. Seguridad

### Prohibido en Código

- Credenciales hardcodeadas
- API keys en commits
- SQL queries sin parametrizar
- User input sin sanitizar

### Archivos Sensibles

Agregar a `.gitignore`:
```
.env
.env.local
*.pem
*.key
credentials.json
```

---

## 9. Convenciones de Nomenclatura

> **IMPORTANTE:** Seguir estas convenciones evita errores comunes de integración.

Ver documento completo: [CONVENCIONES-NOMENCLATURA.md](CONVENCIONES-NOMENCLATURA.md)

### Resumen Rápido

| Contexto | Convención | Ejemplo |
|----------|-----------|---------|
| Campo ordenamiento | `orden` (español) | `orden = models.PositiveIntegerField()` |
| Campos de negocio | Español | `nombre`, `descripcion`, `fecha_inicio` |
| Campos de auditoría | Inglés | `created_at`, `updated_at` |
| Códigos de tabs | snake_case corto | `identidad`, `planeacion` |
| URLs de API | kebab-case | `/revision-direccion/` |
| Enums backend | minúsculas | `'propuesto'`, `'ejecucion'` |
| Tipos TypeScript | Sincronizar con backend | `'propuesto' \| 'ejecucion'` |

### Errores Comunes

```python
# ERROR: Campo inexistente
ordering = ['order', 'name']  # MAL - usar 'orden'

# CORRECTO
ordering = ['orden', 'name']
```

```typescript
// ERROR: Enums no coinciden con backend
type Estado = 'PROPUESTO';  // MAL - backend usa minúsculas

// CORRECTO
type Estado = 'propuesto';
```

---

## Documentación Relacionada

- [CONVENCIONES-NOMENCLATURA.md](CONVENCIONES-NOMENCLATURA.md) - Nomenclatura de campos, enums y URLs
- [ARQUITECTURA-DINAMICA.md](ARQUITECTURA-DINAMICA.md) - Sistema dinámico
- [CODIGO-REUTILIZABLE.md](CODIGO-REUTILIZABLE.md) - Abstract models y hooks
- [TESTING.md](TESTING.md) - Guía de testing
