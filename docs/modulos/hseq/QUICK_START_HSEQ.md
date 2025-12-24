# ⚡ QUICK START: HSEQ Modules

## Población de Módulos HSEQ en el Sidebar

### 1️⃣ Ejecutar (30 segundos)

```bash
cd backend
python manage.py seed_hseq_modules
```

### 2️⃣ Verificar (10 segundos)

```bash
python manage.py verify_hseq_modules
```

### 3️⃣ Ver en Browser

```bash
python manage.py runserver
```

Navega a `http://localhost:8000` → Ver sidebar → "HSEQ Management" 🛡️

---

## ✅ Resultado

**1 módulo creado**:
- HSEQ Management (color teal, icono ShieldCheck)

**11 tabs creados**:
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

---

## 📚 Documentación Completa

**START HERE**: [`INDEX_HSEQ_MODULES.md`](INDEX_HSEQ_MODULES.md)

**Documentos disponibles**:
- [`INDEX_HSEQ_MODULES.md`](INDEX_HSEQ_MODULES.md) - Índice navegable
- [`RESUMEN_HSEQ_MODULES.md`](RESUMEN_HSEQ_MODULES.md) - Documentación completa
- [`HSEQ_MODULES_SETUP.md`](HSEQ_MODULES_SETUP.md) - Setup técnico
- [`LUCIDE_ICONS_REFERENCE.md`](LUCIDE_ICONS_REFERENCE.md) - Iconos
- [`backend/EJECUTAR_SEED_HSEQ.md`](backend/EJECUTAR_SEED_HSEQ.md) - Guía rápida

---

## 🛠️ Comandos Útiles

```bash
# Crear/actualizar módulos
python manage.py seed_hseq_modules

# Verificar configuración
python manage.py verify_hseq_modules

# Cambiar icono de un tab
python manage.py update_hseq_icon emergencias Ambulance

# Verificación independiente (sin Django)
python check_hseq_db.py

# Queries SQL
mysql -u root -p < verify_hseq_modules.sql
```

---

## 🎨 Cambiar Iconos

```bash
python manage.py update_hseq_icon <tab_code> <nuevo_icono>
```

**Tabs disponibles**: sistema_documental, planificacion_sistema, calidad, medicina_laboral, seguridad_industrial, higiene_industrial, gestion_comites, accidentalidad, emergencias, gestion_ambiental, mejora_continua

**Iconos**: Ver [`LUCIDE_ICONS_REFERENCE.md`](LUCIDE_ICONS_REFERENCE.md)

---

## 🐛 Troubleshooting

### Módulo no aparece
```bash
python manage.py verify_hseq_modules  # Ver qué falta
python manage.py seed_hseq_modules    # Re-crear
```

### Verificar en BD
```bash
python check_hseq_db.py  # Script independiente
# O
mysql -u root -p < verify_hseq_modules.sql
```

---

## 📁 Archivos Creados

| Archivo | Propósito |
|---------|-----------|
| `backend/apps/core/management/commands/seed_hseq_modules.py` | Crear módulos |
| `backend/apps/core/management/commands/verify_hseq_modules.py` | Verificar |
| `backend/apps/core/management/commands/update_hseq_icon.py` | Cambiar iconos |
| `verify_hseq_modules.sql` | Queries SQL |
| `check_hseq_db.py` | Script independiente |
| `INDEX_HSEQ_MODULES.md` | Índice completo |

---

## 🚀 Próximos Pasos

1. ✅ Módulos creados
2. ⏭️ Crear views/viewsets de cada app HSEQ
3. ⏭️ Crear componentes React
4. ⏭️ Configurar rutas frontend
5. ⏭️ Asignar permisos RBAC

---

**Documentación completa**: [`INDEX_HSEQ_MODULES.md`](INDEX_HSEQ_MODULES.md)
