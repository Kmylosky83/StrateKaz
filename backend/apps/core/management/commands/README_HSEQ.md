# Management Commands - HSEQ Modules

Este directorio contiene 3 comandos para gestionar los módulos HSEQ Management en el sistema.

## 📋 Comandos Disponibles

### 1. `seed_hseq_modules.py`
**Propósito**: Crear/actualizar el módulo HSEQ Management y sus 11 tabs

**Uso**:
```bash
python manage.py seed_hseq_modules
```

**Función**:
- Crea el módulo padre "HSEQ Management"
- Crea 11 tabs correspondientes a las apps HSEQ
- Es idempotente (puede ejecutarse múltiples veces)
- Actualiza automáticamente si ya existe

**Output esperado**:
```
======================================================================
🏭 CREANDO MÓDULO HSEQ MANAGEMENT
======================================================================

📦 MÓDULO PRINCIPAL:
  ✓ Módulo creado: HSEQ Management

📑 TABS DEL MÓDULO:
  ✓ Tab creado: Sistema Documental (sistema_documental)
  ✓ Tab creado: Planificación del Sistema (planificacion_sistema)
  ... (9 más)
```

---

### 2. `verify_hseq_modules.py`
**Propósito**: Verificar la configuración de módulos HSEQ

**Uso**:
```bash
python manage.py verify_hseq_modules
```

**Función**:
- Verifica existencia del módulo
- Verifica los 11 tabs
- Valida iconos y configuración
- Detecta tabs faltantes o extra
- Simula estructura de API

**Output esperado**:
```
======================================================================
🔍 VERIFICACIÓN MÓDULO HSEQ MANAGEMENT
======================================================================

✅ MÓDULO PRINCIPAL ENCONTRADO
   - Nombre: HSEQ Management
   - Código: hseq_management
   ...

📊 TABS ENCONTRADOS: 11/11

======================================================================
✅ CONFIGURACIÓN COMPLETA Y CORRECTA
======================================================================
```

---

### 3. `update_hseq_icon.py`
**Propósito**: Actualizar el icono de un tab específico

**Uso**:
```bash
python manage.py update_hseq_icon <tab_code> <nuevo_icono>
```

**Ejemplos**:
```bash
python manage.py update_hseq_icon emergencias Ambulance
python manage.py update_hseq_icon calidad Star
python manage.py update_hseq_icon sistema_documental FileText
```

**Función**:
- Actualiza el icono de un tab
- Valida que el tab existe
- Muestra el cambio realizado
- Proporciona comando de reversión

**Output esperado**:
```
======================================================================
🎨 ACTUALIZAR ICONO HSEQ TAB
======================================================================

✅ Icono actualizado exitosamente

📋 Tab: Gestión de Emergencias
   - Código: emergencias
   - Icono anterior: Siren
   - Icono nuevo: Ambulance
   - Ruta: /hseq-management/emergencias
```

---

## 🔄 Flujo de Trabajo Típico

### Primera vez (Setup)
```bash
# 1. Crear módulos
python manage.py seed_hseq_modules

# 2. Verificar
python manage.py verify_hseq_modules
```

### Mantenimiento
```bash
# Cambiar un icono
python manage.py update_hseq_icon medicina_laboral Heart

# Verificar el cambio
python manage.py verify_hseq_modules
```

### Corrección de problemas
```bash
# Re-ejecutar seed (es idempotente)
python manage.py seed_hseq_modules

# Verificar estado
python manage.py verify_hseq_modules
```

---

## 📊 Tabs Disponibles

Los siguientes códigos de tabs están disponibles para `update_hseq_icon`:

1. `sistema_documental` - Sistema Documental
2. `planificacion_sistema` - Planificación del Sistema
3. `calidad` - Gestión de Calidad
4. `medicina_laboral` - Medicina Laboral
5. `seguridad_industrial` - Seguridad Industrial
6. `higiene_industrial` - Higiene Industrial
7. `gestion_comites` - Gestión de Comités HSEQ
8. `accidentalidad` - Accidentalidad
9. `emergencias` - Gestión de Emergencias
10. `gestion_ambiental` - Gestión Ambiental
11. `mejora_continua` - Mejora Continua

---

## 🎨 Iconos Comunes de Lucide React

Para `update_hseq_icon`, estos iconos están disponibles:

### Seguridad
`Shield`, `ShieldCheck`, `ShieldAlert`, `HardHat`, `Lock`

### Salud
`Stethoscope`, `Heart`, `HeartPulse`, `Activity`, `Cross`, `Pill`

### Emergencias
`Siren`, `Ambulance`, `Bell`, `AlertTriangle`, `AlertCircle`

### Documentos
`FileText`, `Folder`, `FolderTree`, `Archive`, `Files`

### Calidad
`Award`, `Star`, `Medal`, `CheckCircle`, `BadgeCheck`

### Ambiente
`Leaf`, `Trees`, `Recycle`, `Wind`, `Droplet`

### Análisis
`TrendingUp`, `BarChart`, `PieChart`, `Activity`

**Ver lista completa**: https://lucide.dev/icons/

---

## 🛠️ Desarrollo

### Agregar un nuevo tab

Si necesitas agregar un nuevo tab al módulo HSEQ:

1. **Editar**: `seed_hseq_modules.py`
2. **Agregar**: Nuevo diccionario en `tabs_data`
3. **Ejecutar**: `python manage.py seed_hseq_modules`
4. **Verificar**: `python manage.py verify_hseq_modules`

**Ejemplo**:
```python
{
    'code': 'nuevo_tab',
    'name': 'Nombre del Tab',
    'description': 'Descripción del tab',
    'icon': 'IconoDeLucide',
    'order': 12,
},
```

### Modificar un tab existente

1. **Editar**: El diccionario correspondiente en `seed_hseq_modules.py`
2. **Ejecutar**: `python manage.py seed_hseq_modules` (actualiza automáticamente)
3. **Verificar**: `python manage.py verify_hseq_modules`

---

## 📚 Documentación Adicional

Para más información, consulta:

- **Índice general**: `../../../../../INDEX_HSEQ_MODULES.md`
- **Guía rápida**: `../../../EJECUTAR_SEED_HSEQ.md`
- **Documentación completa**: `../../../../../RESUMEN_HSEQ_MODULES.md`
- **Referencia de iconos**: `../../../../../LUCIDE_ICONS_REFERENCE.md`

---

## ⚙️ Notas Técnicas

### Idempotencia
Todos los comandos son idempotentes y pueden ejecutarse múltiples veces sin efectos secundarios.

### Transacciones
- `seed_hseq_modules`: Usa `get_or_create` para evitar duplicados
- `update_hseq_icon`: Actualiza directamente el campo `icon`
- `verify_hseq_modules`: Solo lectura, sin modificaciones

### Base de datos
- **Tabla módulo**: `core_system_module`
- **Tabla tabs**: `core_module_tab`
- **Relación**: FK `module_id` en `core_module_tab`

### Código fuente relacionado
- **Modelos**: `apps/core/models.py` (líneas 1885-2155)
- **ViewSet**: `apps/core/viewsets_strategic.py` (líneas 434-634)
- **Serializers**: `apps/core/serializers_strategic.py`

---

## 🔍 Troubleshooting

### Módulo no se crea
```bash
# Verificar migraciones
python manage.py migrate

# Ver errores detallados
python manage.py seed_hseq_modules --verbosity 2
```

### Tab no se encuentra al actualizar icono
```bash
# Listar tabs disponibles
python manage.py verify_hseq_modules

# O intentar sin argumentos para ver ayuda
python manage.py update_hseq_icon
```

### Verificación falla
```bash
# Re-ejecutar seed
python manage.py seed_hseq_modules

# Verificar nuevamente
python manage.py verify_hseq_modules
```

---

**Última actualización**: 2025-12-23
**Versión**: 1.0.0
