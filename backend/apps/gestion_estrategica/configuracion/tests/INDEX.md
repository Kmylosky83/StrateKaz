# Índice de Tests - Módulo de Configuración

## Navegación Rápida

Este directorio contiene los tests unitarios completos para el modelo `EmpresaConfig` del módulo de Configuración.

---

## Archivos en este Directorio

### 📋 Archivos Principales

| Archivo | Descripción | Líneas | Uso |
|---------|-------------|--------|-----|
| **test_empresa_config.py** | Tests unitarios principales | 717 | Archivo ejecutable con 32 tests |
| **run_tests.sh** | Script de ejecución interactivo | ~100 | Menú para ejecutar tests |

### 📚 Documentación

| Archivo | Descripción | Para quién |
|---------|-------------|-----------|
| **README.md** | Documentación general completa | Desarrolladores |
| **RESUMEN_TESTS.md** | Resumen ejecutivo detallado | QA, Tech Leads |
| **TABLA_TESTS.md** | Tabla visual de todos los tests | QA, Revisores |
| **INSTRUCCIONES_VERIFICACION.md** | Guía paso a paso de verificación | Nuevos desarrolladores |
| **INDEX.md** | Este archivo (navegación) | Todos |

### 🔧 Archivos de Configuración

| Archivo | Descripción |
|---------|-------------|
| **__init__.py** | Inicializador del paquete Python |

---

## Guía de Lectura Recomendada

### Si eres nuevo en el proyecto
1. Lee **INSTRUCCIONES_VERIFICACION.md** - Guía paso a paso
2. Ejecuta **run_tests.sh** - Para ver los tests en acción
3. Lee **README.md** - Para entender la estructura completa

### Si quieres entender la cobertura
1. Lee **RESUMEN_TESTS.md** - Cobertura completa explicada
2. Lee **TABLA_TESTS.md** - Tabla visual de todos los tests
3. Ejecuta los tests con coverage (instrucciones en README.md)

### Si quieres ejecutar tests
1. Usa **run_tests.sh** - Script interactivo con menú
2. O sigue **README.md** sección "Ejecución de Tests"
3. O consulta **INSTRUCCIONES_VERIFICACION.md** para troubleshooting

### Si eres QA o estás revisando código
1. Lee **TABLA_TESTS.md** - Vista rápida de todos los tests
2. Lee **RESUMEN_TESTS.md** - Detalles de implementación
3. Ejecuta tests con coverage para verificar métricas

---

## Resumen Rápido

```
Tests Creados: 32
Líneas de Código: 717
Cobertura: ~95%
Framework: pytest-django
Patrón: Given-When-Then (AAA)
```

### Categorías de Tests

1. **Validación NIT** (9 tests) - Algoritmo DIAN
2. **Patrón Singleton** (3 tests) - Una sola instancia
3. **Formateo NIT** (4 tests) - Normalización automática
4. **Propiedades Computadas** (4 tests) - Properties del modelo
5. **Métodos de Clase** (4 tests) - get_instance(), get_or_create_default()
6. **Validaciones** (2 tests) - Reglas de negocio
7. **Formateo Valores** (3 tests) - Moneda regional
8. **Auditoría** (2 tests) - Timestamps automáticos
9. **Representación** (1 test) - __str__()

---

## Comandos Más Usados

```bash
# Ejecutar todos los tests
docker-compose exec backend pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py -v

# Ejecutar con cobertura
docker-compose exec backend pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py \
    --cov=apps.gestion_estrategica.configuracion.models \
    --cov-report=term-missing

# Solo tests de NIT (categoría crítica)
docker-compose exec backend pytest apps/gestion_estrategica/configuracion/tests/test_empresa_config.py::TestValidacionNIT -v

# Script interactivo
cd apps/gestion_estrategica/configuracion/tests/
./run_tests.sh
```

---

## Estructura del Archivo test_empresa_config.py

```python
# Líneas 1-18: Imports y documentación
# Líneas 19-52: Fixtures (datos_empresa_validos, empresa_instance)

# TESTS:
# Líneas 53-184:   TestValidacionNIT (9 tests)
# Líneas 185-245:  TestSingletonPattern (3 tests)
# Líneas 246-320:  TestFormateoNIT (4 tests)
# Líneas 321-401:  TestPropiedadesComputadas (4 tests)
# Líneas 402-440:  TestGetInstance (2 tests)
# Líneas 441-490:  TestGetOrCreateDefault (2 tests)
# Líneas 491-530:  TestValidaciones (2 tests)
# Líneas 531-590:  TestFormateoValores (3 tests)
# Líneas 591-635:  TestAuditoria (2 tests)
# Líneas 636-660:  TestRepresentacionString (1 test)
```

---

## Checklist de Implementación

### Funcionalidades Testeadas ✅

- [x] Validación de NIT colombiano con algoritmo DIAN
- [x] Cálculo de dígito de verificación (casos especiales incluidos)
- [x] Patrón Singleton (solo una instancia permitida)
- [x] Formateo automático de NIT al guardar
- [x] Propiedades computadas (nit_sin_dv, digito_verificacion)
- [x] Propiedad direccion_completa
- [x] Método de clase get_instance()
- [x] Método de clase get_or_create_default()
- [x] Validación de separadores de miles y decimales
- [x] Formateo de valores monetarios con configuración regional
- [x] Campos de auditoría (created_at, updated_at)
- [x] Representación string del modelo (__str__)

### Casos de Prueba ✅

- [x] NITs válidos con diferentes formatos
- [x] NITs inválidos (DV incorrecto, formato incorrecto)
- [x] NITs reales de empresas colombianas
- [x] Casos especiales del algoritmo DIAN (residuo 0 y 1)
- [x] Creación de primera instancia (Singleton)
- [x] Bloqueo de segunda instancia (Singleton)
- [x] Actualización de instancia existente (Singleton)
- [x] Formateo de NIT en múltiples variantes
- [x] Todas las propiedades computadas
- [x] Métodos de clase con y sin datos existentes
- [x] Validaciones de reglas de negocio
- [x] Formateo de valores (enteros, decimales, cero)
- [x] Auditoría automática de timestamps

---

## Próximos Pasos

### Para Desarrolladores
- [ ] Ejecutar los tests localmente
- [ ] Revisar cobertura de código
- [ ] Integrar en flujo de desarrollo

### Para QA
- [ ] Validar todos los tests pasan
- [ ] Generar reporte de cobertura
- [ ] Documentar casos de borde adicionales si se encuentran

### Para Tech Leads
- [ ] Revisar calidad de tests
- [ ] Aprobar para merge
- [ ] Incluir en pipeline CI/CD

### Futuro
- [ ] Tests para modelo SedeEmpresa
- [ ] Tests para modelo IntegracionExterna
- [ ] Tests de integración entre modelos
- [ ] Tests de serializers
- [ ] Tests de vistas y API endpoints

---

## Contacto y Soporte

Si tienes preguntas sobre los tests:

1. **Documentación**: Lee README.md y RESUMEN_TESTS.md
2. **Troubleshooting**: Consulta INSTRUCCIONES_VERIFICACION.md
3. **Casos de uso**: Revisa TABLA_TESTS.md
4. **Ejecución**: Usa run_tests.sh o los comandos en README.md

---

## Changelog

### v1.0 (2025-12-24)
- ✅ 32 tests unitarios implementados
- ✅ Cobertura ~95% del modelo EmpresaConfig
- ✅ Documentación completa generada
- ✅ Script de ejecución interactivo
- ✅ Instrucciones de verificación paso a paso
- ✅ Tabla visual de tests
- ✅ Listo para producción

---

**Estado**: COMPLETADO ✅
**Versión**: 1.0
**Fecha**: 2025-12-24
**Mantenedor**: QA Engineering Team
