# Configuración de Módulos HSEQ Management

## Descripción

Este documento describe cómo se poblaron los módulos HSEQ Management en el sidebar dinámico del sistema.

## Estructura Creada

### Módulo Padre
- **Código**: `hseq_management`
- **Nombre**: HSEQ Management
- **Categoría**: INTEGRAL (Gestión Integral)
- **Color**: `teal` (verde azulado)
- **Icono**: `ShieldCheck`
- **Orden**: 20

### 11 Tabs Hijos

| # | Código | Nombre | Icono | Ruta |
|---|--------|--------|-------|------|
| 1 | `sistema_documental` | Sistema Documental | `FolderTree` | `/hseq-management/sistema-documental` |
| 2 | `planificacion_sistema` | Planificación del Sistema | `Calendar` | `/hseq-management/planificacion-sistema` |
| 3 | `calidad` | Gestión de Calidad | `Award` | `/hseq-management/calidad` |
| 4 | `medicina_laboral` | Medicina Laboral | `Stethoscope` | `/hseq-management/medicina-laboral` |
| 5 | `seguridad_industrial` | Seguridad Industrial | `HardHat` | `/hseq-management/seguridad-industrial` |
| 6 | `higiene_industrial` | Higiene Industrial | `Droplet` | `/hseq-management/higiene-industrial` |
| 7 | `gestion_comites` | Gestión de Comités HSEQ | `Users` | `/hseq-management/gestion-comites` |
| 8 | `accidentalidad` | Accidentalidad | `AlertTriangle` | `/hseq-management/accidentalidad` |
| 9 | `emergencias` | Gestión de Emergencias | `Siren` | `/hseq-management/emergencias` |
| 10 | `gestion_ambiental` | Gestión Ambiental | `Leaf` | `/hseq-management/gestion-ambiental` |
| 11 | `mejora_continua` | Mejora Continua | `TrendingUp` | `/hseq-management/mejora-continua` |

## Uso del Management Command

### Ejecutar el comando

```bash
cd backend
python manage.py seed_hseq_modules
```

### Características

- **Idempotente**: Puede ejecutarse múltiples veces sin duplicar datos
- **Actualización automática**: Si ya existen, actualiza los campos
- **Resumen detallado**: Muestra el resultado de la operación

### Salida esperada

```
======================================================================
🏭 CREANDO MÓDULO HSEQ MANAGEMENT
======================================================================

📦 MÓDULO PRINCIPAL:
  ✓ Módulo creado: HSEQ Management

📑 TABS DEL MÓDULO:
  ✓ Tab creado: Sistema Documental (sistema_documental)
  ✓ Tab creado: Planificación del Sistema (planificacion_sistema)
  ✓ Tab creado: Gestión de Calidad (calidad)
  ✓ Tab creado: Medicina Laboral (medicina_laboral)
  ✓ Tab creado: Seguridad Industrial (seguridad_industrial)
  ✓ Tab creado: Higiene Industrial (higiene_industrial)
  ✓ Tab creado: Gestión de Comités HSEQ (gestion_comites)
  ✓ Tab creado: Accidentalidad (accidentalidad)
  ✓ Tab creado: Gestión de Emergencias (emergencias)
  ✓ Tab creado: Gestión Ambiental (gestion_ambiental)
  ✓ Tab creado: Mejora Continua (mejora_continua)

======================================================================
RESUMEN FINAL
======================================================================

📦 Módulo: HSEQ Management
   - Código: hseq_management
   - Categoría: Gestión Integral
   - Color: teal
   - Icono: ShieldCheck
   - Habilitado: Sí
   - Orden: 20

📑 Tabs creados: 11
📊 Total tabs: 11

🌐 Rutas generadas:
   - /hseq-management/sistema-documental → Sistema Documental
   - /hseq-management/planificacion-sistema → Planificación del Sistema
   - /hseq-management/calidad → Gestión de Calidad
   - /hseq-management/medicina-laboral → Medicina Laboral
   - /hseq-management/seguridad-industrial → Seguridad Industrial
   - /hseq-management/higiene-industrial → Higiene Industrial
   - /hseq-management/gestion-comites → Gestión de Comités HSEQ
   - /hseq-management/accidentalidad → Accidentalidad
   - /hseq-management/emergencias → Gestión de Emergencias
   - /hseq-management/gestion-ambiental → Gestión Ambiental
   - /hseq-management/mejora-continua → Mejora Continua

======================================================================
✓ Módulo HSEQ Management configurado exitosamente
======================================================================
```

## Verificación en el Frontend

### 1. Verificar endpoint API

```bash
curl http://localhost:8000/api/core/system-modules/sidebar/
```

### 2. Verificar en el navegador

1. Inicia sesión en el sistema
2. Observa el sidebar izquierdo
3. Deberías ver "HSEQ Management" con icono de escudo
4. Al expandir, verás los 11 tabs con sus iconos correspondientes

### 3. Estructura JSON esperada

```json
[
  {
    "code": "hseq_management",
    "name": "HSEQ Management",
    "icon": "ShieldCheck",
    "color": "teal",
    "route": null,
    "is_category": false,
    "children": [
      {
        "code": "sistema_documental",
        "name": "Sistema Documental",
        "icon": "FolderTree",
        "color": "teal",
        "route": "/hseq-management/sistema-documental",
        "is_category": false,
        "children": null
      },
      // ... 10 tabs más
    ]
  }
]
```

## Iconos de Lucide React Utilizados

Todos los iconos son componentes válidos de `lucide-react`:

- `ShieldCheck` - Módulo principal
- `FolderTree` - Sistema Documental
- `Calendar` - Planificación
- `Award` - Calidad
- `Stethoscope` - Medicina Laboral
- `HardHat` - Seguridad Industrial
- `Droplet` - Higiene Industrial
- `Users` - Comités
- `AlertTriangle` - Accidentalidad
- `Siren` - Emergencias
- `Leaf` - Gestión Ambiental
- `TrendingUp` - Mejora Continua

## Base de Datos

### Tablas afectadas

- `core_system_module` - 1 registro nuevo
- `core_module_tab` - 11 registros nuevos

### Consultas SQL de verificación

```sql
-- Ver el módulo HSEQ
SELECT * FROM core_system_module WHERE code = 'hseq_management';

-- Ver todos los tabs
SELECT
    mt.id,
    mt.code,
    mt.name,
    mt.icon,
    mt.order,
    mt.is_enabled
FROM core_module_tab mt
INNER JOIN core_system_module sm ON mt.module_id = sm.id
WHERE sm.code = 'hseq_management'
ORDER BY mt.order;

-- Contar tabs habilitados
SELECT COUNT(*) as tabs_habilitados
FROM core_module_tab mt
INNER JOIN core_system_module sm ON mt.module_id = sm.id
WHERE sm.code = 'hseq_management' AND mt.is_enabled = TRUE;
```

## Próximos Pasos

1. **Frontend**: Crear los componentes de página para cada tab
2. **Rutas**: Configurar React Router para las 11 rutas
3. **Permisos**: Asignar permisos RBAC para cada módulo
4. **UI/UX**: Diseñar las interfaces de cada submódulo

## Notas Técnicas

### Modelo SystemModule
- `is_core=False`: No es un módulo core, puede desactivarse
- `is_enabled=True`: Habilitado por defecto
- `requires_license=False`: No requiere licencia adicional
- `category='INTEGRAL'`: Categoría de Gestión Integral

### Modelo ModuleTab
- Todos tienen `is_core=False`
- Todos están `is_enabled=True`
- El `order` define el orden en el sidebar (1-11)
- El `icon` debe coincidir con componentes de Lucide React

### Convenciones de nombres
- **Código módulo**: `snake_case` (para código Python)
- **Código tab**: `snake_case` (consistente con apps)
- **Rutas**: `kebab-case` (estándar web)
- **Conversión automática**: `replace('_', '-')`

## Troubleshooting

### El módulo no aparece en el sidebar

1. Verificar que `is_enabled=True`
2. Verificar la API: `/api/core/system-modules/sidebar/`
3. Limpiar caché del navegador
4. Verificar que el usuario tenga permisos

### Los iconos no se muestran

1. Verificar que los nombres coincidan con Lucide React
2. Verificar importación en `Sidebar.tsx`
3. Verificar que el componente de iconos maneje el nombre correctamente

### Error al ejecutar el comando

1. Verificar migraciones aplicadas: `python manage.py migrate`
2. Verificar que las apps estén en `INSTALLED_APPS`
3. Revisar logs de Django para errores específicos

## Referencias

- [Lucide React Icons](https://lucide.dev/icons/)
- [Django Management Commands](https://docs.djangoproject.com/en/4.2/howto/custom-management-commands/)
- API Endpoint: `GET /api/core/system-modules/sidebar/`
- ViewSet: `backend/apps/core/viewsets_strategic.py:SystemModuleViewSet`
