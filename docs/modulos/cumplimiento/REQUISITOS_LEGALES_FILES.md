# Archivos para requisitos_legales

## Resumen de implementación

Se ha creado la app completa `requisitos_legales` en `backend/apps/motor_cumplimiento/requisitos_legales/` con:

### Modelos (4):
1. **TipoRequisito** - Catálogo de tipos (Licencia, Permiso, Concepto, Certificado)
2. **RequisitoLegal** - Requisitos con flags SST/Ambiental/Calidad/PESV
3. **EmpresaRequisito** - Relación empresa-requisito con vencimientos y documentos
4. **AlertaVencimiento** - Sistema de alertas configurables (30, 60, 90 días)

### Serializers (8):
- TipoRequisitoSerializer
- RequisitoLegalSerializer + CreateUpdate + List
- EmpresaRequisitoSerializer + CreateUpdate
- AlertaVencimientoSerializer

### ViewSets (4):
- TipoRequisitoViewSet
- RequisitoLegalViewSet con acciones: `por_vencer`, `vencidos`, `estadisticas`, `calendario_vencimientos`
- EmpresaRequisitoViewSet con acciones: `por_vencer`, `vencidos`, `renovar`, `matriz_vencimientos`
- AlertaVencimientoViewSet con acción: `pendientes_envio`

### Admin (4):
- TipoRequisitoAdmin
- RequisitoLegalAdmin
- EmpresaRequisitoAdmin
- AlertaVencimientoAdmin

## Estado actual

Los archivos `__init__.py` y `apps.py` ya están listos.

Los archivos `models.py`, `serializers.py`, `views.py`, `admin.py` y `urls.py` necesitan ser actualizados con el contenido completo.

## Próximos pasos

1. Copiar el contenido de cada archivo (que se encuentra más abajo)
2. Ejecutar las migraciones: `python manage.py makemigrations requisitos_legales`
3. Aplicar migraciones: `python manage.py migrate`
4. Registrar la app en `INSTALLED_APPS` si no está ya
5. Incluir las URLs en el router principal

