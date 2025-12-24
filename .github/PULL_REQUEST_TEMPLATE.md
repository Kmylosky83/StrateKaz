# Pull Request

## Descripción

<!-- Describe los cambios realizados en este PR -->

## Tipo de Cambio

<!-- Marca con una X las opciones aplicables -->

- [ ] feat: Nueva funcionalidad
- [ ] fix: Corrección de bug
- [ ] docs: Cambios en documentación
- [ ] style: Formato, espacios en blanco (sin cambios en código)
- [ ] refactor: Refactorización de código
- [ ] perf: Mejoras de performance
- [ ] test: Agregar o modificar tests
- [ ] chore: Mantenimiento, configuración
- [ ] build: Cambios en build system
- [ ] ci: Cambios en CI/CD

## Área Afectada

<!-- Marca con una X las áreas afectadas -->

- [ ] Backend (Django/Python)
- [ ] Frontend (React/TypeScript)
- [ ] Base de datos (Modelos/Migraciones)
- [ ] API (Endpoints/Serializers)
- [ ] UI/UX (Componentes/Estilos)
- [ ] Documentación
- [ ] Configuración/DevOps
- [ ] Tests

## Cambios Realizados

<!-- Lista detallada de cambios -->

-
-
-

## Motivación y Contexto

<!-- ¿Por qué es necesario este cambio? ¿Qué problema resuelve? -->
<!-- Si resuelve un issue, referenciarlo: Closes #123 -->

## Screenshots (si aplica)

<!-- Agregar screenshots de cambios visuales -->

## Testing

### Tests Agregados/Modificados

- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Tests E2E
- [ ] No se requieren tests para este cambio

### Cómo Probar

<!-- Pasos para probar los cambios -->

1.
2.
3.

### Testing Local Completado

- [ ] Backend tests pasan (`python manage.py test`)
- [ ] Frontend build exitoso (`npm run build`)
- [ ] Type checking pasa (`npx tsc --noEmit`)
- [ ] Linting pasa (`npm run lint` / `black --check .`)
- [ ] Script de CI local ejecutado (`.github/scripts/test-ci-locally.*`)

## Checklist

### Código

- [ ] El código sigue las convenciones del proyecto
- [ ] He realizado self-review del código
- [ ] He comentado áreas complejas del código
- [ ] No hay console.logs o debugger statements
- [ ] No hay TODOs sin resolver críticos
- [ ] El código es DRY (Don't Repeat Yourself)

### Documentación

- [ ] He actualizado la documentación relevante
- [ ] He actualizado los comentarios de código
- [ ] He actualizado el README si es necesario
- [ ] He documentado nuevas APIs/funciones

### Base de Datos

- [ ] Las migraciones están incluidas
- [ ] Las migraciones son reversibles
- [ ] He probado las migraciones en dev
- [ ] No hay data loss en migraciones
- [ ] N/A - No hay cambios en DB

### Seguridad

- [ ] No expongo información sensible
- [ ] No hay secrets hardcodeados
- [ ] Valido input del usuario
- [ ] Implemento autorización adecuada
- [ ] N/A - No hay implicaciones de seguridad

### Performance

- [ ] Optimicé queries N+1
- [ ] Agregué índices en DB si es necesario
- [ ] Consideré el impacto en performance
- [ ] No hay memory leaks
- [ ] N/A - No hay impacto en performance

### Breaking Changes

- [ ] Este PR introduce breaking changes
- [ ] He documentado los breaking changes
- [ ] He actualizado la versión correspondiente
- [ ] N/A - No hay breaking changes

## Dependencias

<!-- ¿Este PR depende de otros PRs? ¿Requiere cambios en otros repositorios? -->

-

## Deployment Notes

<!-- Notas especiales para deployment -->

- [ ] Requiere variables de entorno nuevas
- [ ] Requiere ejecutar migraciones
- [ ] Requiere seed data
- [ ] Requiere rebuild de Docker images
- [ ] Requiere clear de cache
- [ ] N/A - Deploy estándar

## Notas Adicionales

<!-- Cualquier información adicional relevante -->

---

## Para Revisores

### Áreas de Enfoque

<!-- Áreas específicas donde necesitas feedback -->

-

### Preguntas

<!-- Preguntas específicas para los revisores -->

-

---

**Conventional Commit:**
<!-- Ejemplo: feat(auth): add JWT authentication -->
`<type>(<scope>): <description>`

**Related Issues:**
<!-- Closes #123, Refs #456 -->

---

<!--
Gracias por tu contribución!

Recuerda:
- Título del PR debe seguir Conventional Commits
- Todos los checks de CI deben pasar
- Al menos un reviewer debe aprobar
- Resolver todos los comentarios antes de merge
-->
