# GUÍA RÁPIDA: Poblar Módulos HSEQ

## ⚡ Ejecución Rápida

```bash
cd backend
python manage.py seed_hseq_modules
```

## ✅ Verificación

```bash
python manage.py verify_hseq_modules
```

## 📊 Resultado Esperado

- **1 módulo creado**: HSEQ Management
- **11 tabs creados**:
  1. Sistema Documental
  2. Planificación del Sistema
  3. Gestión de Calidad
  4. Medicina Laboral
  5. Seguridad Industrial
  6. Higiene Industrial
  7. Gestión de Comités HSEQ
  8. Accidentalidad
  9. Gestión de Emergencias
  10. Gestión Ambiental
  11. Mejora Continua

## 🌐 Verificar en API

```bash
# Windows (PowerShell)
Invoke-WebRequest http://localhost:8000/api/core/system-modules/sidebar/

# Windows (curl)
curl http://localhost:8000/api/core/system-modules/sidebar/

# Linux/Mac
curl http://localhost:8000/api/core/system-modules/sidebar/ | jq
```

## 🎨 Sidebar

El módulo aparecerá en el sidebar con:
- 🎨 Color: Teal (verde azulado)
- 🛡️ Icono: ShieldCheck
- 📁 11 tabs desplegables

## 🔧 Troubleshooting

### Módulo no aparece
```bash
# Verificar en DB
python manage.py dbshell
SELECT * FROM core_system_module WHERE code = 'hseq_management';
```

### Ejecutar manualmente
```bash
python manage.py seed_hseq_modules --verbosity 2
```

### Re-crear desde cero
```sql
DELETE FROM core_module_tab WHERE module_id IN (
    SELECT id FROM core_system_module WHERE code = 'hseq_management'
);
DELETE FROM core_system_module WHERE code = 'hseq_management';
```

Luego ejecutar: `python manage.py seed_hseq_modules`

## 📁 Archivos Creados

- `backend/apps/core/management/commands/seed_hseq_modules.py` - Script de población
- `backend/apps/core/management/commands/verify_hseq_modules.py` - Script de verificación
- `verify_hseq_modules.sql` - Queries SQL de verificación
- `HSEQ_MODULES_SETUP.md` - Documentación completa
