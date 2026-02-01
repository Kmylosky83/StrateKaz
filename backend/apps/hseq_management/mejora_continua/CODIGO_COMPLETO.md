# Código Completo - App Mejora Continua

## Estructura de Archivos

```
backend/apps/hseq_management/mejora_continua/
├── __init__.py
├── apps.py
├── models.py (REEMPLAZAR COMPLETAMENTE)
├── serializers.py (REEMPLAZAR COMPLETAMENTE)
├── views.py (REEMPLAZAR COMPLETAMENTE)
├── urls.py (REEMPLAZAR COMPLETAMENTE)
└── admin.py (REEMPLAZAR COMPLETAMENTE)
```

## IMPORTANTE: Instrucciones de Instalación

Debido a limitaciones técnicas, no puedo escribir directamente archivos tan grandes.
Debes copiar manualmente el código de los siguientes archivos:

### 1. models.py

**UBICACIÓN:** `backend/apps/hseq_management/mejora_continua/models.py`

**REEMPLAZAR COMPLETAMENTE** el contenido actual con el código que se encuentra en el siguiente archivo:
- Ver `models_codigo.txt` en esta misma carpeta

**Incluye 10 modelos:**
1. OrigenAccion - Catálogo de orígenes
2. AccionMejora - Acciones correctivas/preventivas/mejora
3. ProgramaAuditoria - Programas anuales de auditorías
4. AuditorInterno - Pool de auditores internos calificados
5. Auditoria - Auditorías internas/externas
6. EquipoAuditor - Equipos asignados a auditorías
7. Hallazgo - Hallazgos de auditoría
8. EvaluacionCumplimiento - Evaluaciones de cumplimiento legal
9. RequisitoEvaluado - Requisitos legales evaluados
10. SeguimientoAccion - Seguimientos a acciones

### 2. serializers.py

**UBICACIÓN:** `backend/apps/hseq_management/mejora_continua/serializers.py`

**Incluye serializadores para:**
- OrigenAccionSerializer
- AccionMejoraSerializer + AccionMejoraCreateSerializer (con autogeneración de número)
- ProgramaAuditoriaSerializer
- AuditorInternoSerializer
- AuditoriaSerializer + EquipoAuditorSerializer
- HallazgoSerializer + HallazgoCreateSerializer (con autogeneración de número)
- EvaluacionCumplimientoSerializer + RequisitoEvaluadoSerializer
- SeguimientoAccionSerializer
- AccionMejoraDetailSerializer (con seguimientos anidados)

### 3. views.py

**UBICACIÓN:** `backend/apps/hseq_management/mejora_continua/views.py`

**Incluye ViewSets con actions personalizadas:**
- AccionMejoraViewSet (con actions: cambiar_estado, verificar_eficacia, registrar_seguimiento)
- ProgramaAuditoriaViewSet (con action: aprobar)
- AuditorInternoViewSet (con action: calificar)
- AuditoriaViewSet (con actions: asignar_auditor, registrar_hallazgo, emitir_informe)
- HallazgoViewSet (con actions: crear_accion, verificar)
- EvaluacionCumplimientoViewSet (con action: calcular_cumplimiento)

### 4. urls.py

**UBICACIÓN:** `backend/apps/hseq_management/mejora_continua/urls.py`

Registra todos los viewsets en el router DRF.

### 5. admin.py

**UBICACIÓN:** `backend/apps/hseq_management/mejora_continua/admin.py`

Registra todos los modelos en el admin de Django.

### 6. apps.py

**UBICACIÓN:** `backend/apps/hseq_management/mejora_continua/apps.py`

Configuración de la app.

---

## Características Principales

### Multi-Tenant
- Todos los modelos tienen `empresa_id`
- Filtrado automático en vistas
- Aislamiento de datos por empresa

### Estados de Acciones de Mejora
1. **ABIERTA** - Recién registrada
2. **EN_EJECUCION** - En proceso de implementación
3. **VERIFICACION_EFICACIA** - Implementada, esperando verificación
4. **CERRADA_EFICAZ** - Verificada como eficaz
5. **CERRADA_NO_EFICAZ** - No eficaz, requiere nueva acción

### Autogeneración de Números
- **Acciones Correctivas:** AC-2024-0001
- **Acciones Preventivas:** AP-2024-0001
- **Acciones de Mejora:** AM-2024-0001
- **Hallazgos:** HALL-2024-0001
- **Auditorías:** AUD-INT-2024-001, AUD-EXT-2024-001

### Ciclo PHVA (Planear-Hacer-Verificar-Actuar)
- Planear: Registro de acción con análisis de causa raíz
- Hacer: Ejecución del plan de acción
- Verificar: Verificación de eficacia
- Actuar: Cierre o replanteamiento

### Integración ISO
- **ISO 9001:2015** - Gestión de calidad
- **ISO 14001:2015** - Gestión ambiental
- **ISO 45001:2018** - Seguridad y salud ocupacional
- Cumple con requisitos de mejora continua de las tres normas

---

## Después de Copiar los Archivos

1. Ejecutar migraciones:
```bash
python manage.py makemigrations mejora_continua
python manage.py migrate mejora_continua
```

2. Crear superusuario si no existe:
```bash
python manage.py createsuperuser
```

3. Acceder al admin en:
```
http://localhost:8000/admin/
```

4. API endpoints disponibles en:
```
http://localhost:8000/api/hseq/mejora-continua/
```

---

## Endpoints de API

```
GET/POST    /api/hseq/mejora-continua/origenes-accion/
GET/POST    /api/hseq/mejora-continua/acciones-mejora/
POST        /api/hseq/mejora-continua/acciones-mejora/{id}/cambiar_estado/
POST        /api/hseq/mejora-continua/acciones-mejora/{id}/verificar_eficacia/
POST        /api/hseq/mejora-continua/acciones-mejora/{id}/registrar_seguimiento/

GET/POST    /api/hseq/mejora-continua/programas-auditoria/
POST        /api/hseq/mejora-continua/programas-auditoria/{id}/aprobar/

GET/POST    /api/hseq/mejora-continua/auditores-internos/
POST        /api/hseq/mejora-continua/auditores-internos/{id}/calificar/

GET/POST    /api/hseq/mejora-continua/auditorias/
POST        /api/hseq/mejora-continua/auditorias/{id}/asignar_auditor/
POST        /api/hseq/mejora-continua/auditorias/{id}/registrar_hallazgo/
POST        /api/hseq/mejora-continua/auditorias/{id}/emitir_informe/

GET/POST    /api/hseq/mejora-continua/hallazgos/
POST        /api/hseq/mejora-continua/hallazgos/{id}/crear_accion/
POST        /api/hseq/mejora-continua/hallazgos/{id}/verificar/

GET/POST    /api/hseq/mejora-continua/evaluaciones-cumplimiento/
POST        /api/hseq/mejora-continua/evaluaciones-cumplimiento/{id}/calcular_cumplimiento/

GET/POST    /api/hseq/mejora-continua/requisitos-evaluados/
GET/POST    /api/hseq/mejora-continua/seguimientos-accion/
```

---

## Próximos Pasos

Los archivos de código completo se encuentran en:

1. `models_codigo.txt` - Código completo de models.py
2. `serializers_codigo.txt` - Código completo de serializers.py
3. `views_codigo.txt` - Código completo de views.py
4. `urls_codigo.txt` - Código completo de urls.py
5. `admin_codigo.txt` - Código completo de admin.py
6. `apps_codigo.txt` - Código completo de apps.py

Copiar cada archivo en su ubicación correspondiente y ejecutar migraciones.
