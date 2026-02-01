# Arquitectura de Base de Datos - ERP Multi-Empresa

## Metadatos

- **Motor**: MySQL 8.0
- **Charset**: utf8mb4
- **Collation**: utf8mb4_unicode_ci
- **Total Tablas**: 154
- **Estrategia Multi-Tenant**: Shared database, shared schema con row-level isolation
- **Fecha**: 2024-12-22

---

## 1. GESTION_ESTRATEGICA (Core Corporate)

### Descripción
Base del sistema, configuración corporativa y RBAC. Gestión de estructura organizacional, usuarios y permisos.

### Tablas (19)

#### 1.1 Estructura Organizacional

**empresa**
- PK: id (BIGINT, AUTO_INCREMENT)
- UK: nit (VARCHAR(20))
- Campos: razon_social, nombre_comercial, tipo_empresa, sector_economico, ciiu, clase_riesgo
- Campos Contacto: telefono, email, direccion, ciudad, departamento, pais
- Branding: logo, color_primario, color_secundario
- Audit: activo, created_at, updated_at
- **Nota**: NO tiene empresa_id (es la raíz del multi-tenant)

**sede**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: responsable_id → usuario.id
- UK: (empresa_id, codigo)
- Campos: nombre, codigo, tipo (principal/sucursal/bodega/planta)
- Ubicación: direccion, ciudad, departamento, latitud, longitud
- Indices: empresa_id, codigo

**area**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: area_padre_id → area.id (jerarquía)
- FK: responsable_id → usuario.id
- Campos: nombre, codigo, descripcion, orden
- Indices: empresa_id, area_padre_id

**cargo**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: area_id → area.id
- FK: cargo_superior_id → cargo.id (jerarquía)
- Campos: nombre, codigo, nivel_jerarquico (estrategico/tactico/operativo)
- Campos: numero_posiciones, descripcion, mision_cargo
- Indices: empresa_id, area_id

#### 1.2 Configuración del Sistema

**modulo_sistema**
- PK: id (BIGINT, AUTO_INCREMENT)
- UK: codigo
- Campos: nombre, descripcion, icono, orden, nivel
- **Nota**: Tabla global, NO tiene empresa_id

**empresa_modulo**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: modulo_id → modulo_sistema.id
- UK: (empresa_id, modulo_id)
- Campos: activo, fecha_activacion, configuracion (JSON)

**tipo_documento**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: codigo, nombre, descripcion, modulo
- Consecutivos: formato_consecutivo, consecutivo_actual, reinicia_anual
- Ejemplo formato: {COD}-{YYYY}-{####}

**consecutivo**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: tipo_documento_id → tipo_documento.id
- UK: codigo_generado
- Campos: anio, numero, codigo_generado
- Polimórfico: entidad (VARCHAR), entidad_id (BIGINT)
- Indices: tipo_documento_id, anio, entidad

#### 1.3 RBAC (Role-Based Access Control)

**rol**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id (NULL = rol global)
- Campos: nombre, codigo, descripcion, es_sistema
- Indices: empresa_id

**permiso**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: modulo_id → modulo_sistema.id
- UK: codigo
- Campos: nombre, descripcion, tipo (ver/crear/editar/eliminar/aprobar)
- Ejemplo codigo: hseq.nc.crear
- Indices: modulo_id

**rol_permiso**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: rol_id → rol.id
- FK: permiso_id → permiso.id
- UK: (rol_id, permiso_id)

**usuario**
- PK: id (BIGINT, AUTO_INCREMENT)
- UK: email
- Campos: password, nombre, documento, telefono, avatar
- Flags: is_active, is_staff, is_superuser
- Audit: last_login, created_at
- **Nota**: NO tiene empresa_id (multi-empresa)

**usuario_empresa**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: usuario_id → usuario.id
- FK: empresa_id → empresa.id
- FK: rol_id → rol.id
- FK: sede_id → sede.id
- UK: (usuario_id, empresa_id)
- Campos: activo, es_admin_empresa
- Indices: usuario_id, empresa_id, rol_id

#### 1.4 Gestión Estratégica

**politica**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: aprobado_por → usuario.id
- Campos: tipo (integral/calidad/sst/ambiental/pesv/otra)
- Campos: nombre, contenido (TEXT), version
- Campos: fecha_aprobacion, vigente

**proceso**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: lider_id → usuario.id
- FK: area_id → area.id
- Campos: codigo, nombre, tipo (estrategico/misional/apoyo/evaluacion)
- Campos: objetivo, alcance
- Indices: empresa_id, tipo

**objetivo_estrategico**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: estrategia_origen_id → estrategia_tows.id
- FK: responsable_id → usuario.id
- Campos: perspectiva (financiera/cliente/procesos/aprendizaje)
- Campos: codigo, nombre, descripcion, peso
- Campos: fecha_inicio, fecha_fin
- Indices: empresa_id, perspectiva

**proyecto**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: objetivo_id → objetivo_estrategico.id
- FK: sponsor_id → usuario.id
- FK: lider_id → usuario.id
- Campos: codigo, nombre, descripcion
- Campos: tipo (estrategico/operativo/mejora), estado, prioridad
- Fechas: fecha_inicio_plan, fecha_fin_plan, fecha_inicio_real, fecha_fin_real
- Campos: presupuesto, avance_porcentaje
- Indices: empresa_id, estado, lider_id

**revision_direccion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: acta_documento_id → documento.id
- FK: responsable_id → usuario.id
- Campos: codigo, fecha_programada, fecha_realizada
- Campos: estado (programada/realizada/cancelada)
- Campos: tipo (ordinaria/extraordinaria), periodo_evaluado, observaciones
- Indices: empresa_id, fecha_programada

---

## 2. MOTOR_CUMPLIMIENTO (Compliance Engine)

### Descripción
Motor de cumplimiento legal y normativo. Gestión de normas, requisitos legales y reglamentos internos.

### Tablas (10)

#### 2.1 Normas Legales

**tipo_norma**
- PK: id (BIGINT, AUTO_INCREMENT)
- UK: codigo
- Campos: nombre, descripcion
- **Nota**: Tabla global

**norma_legal**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: tipo_norma_id → tipo_norma.id
- Campos: numero, anio, titulo, entidad_emisora
- Fechas: fecha_expedicion, fecha_vigencia
- Campos: url_original, resumen, contenido (LONGTEXT)
- Flags: aplica_sst, aplica_ambiental, aplica_calidad, aplica_pesv, vigente
- Campos: fecha_scraping
- Indices: tipo_norma_id, vigente, fecha_vigencia

**empresa_norma**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: norma_id → norma_legal.id
- FK: responsable_id → usuario.id
- Campos: aplica, justificacion
- Campos: porcentaje_cumplimiento, fecha_evaluacion
- Indices: empresa_id, norma_id

#### 2.2 Requisitos Legales

**tipo_requisito**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre, descripcion
- Campos: requiere_vencimiento, dias_alerta
- Indices: empresa_id

**requisito_legal**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: sede_id → sede.id
- FK: tipo_requisito_id → tipo_requisito.id
- FK: responsable_id → usuario.id
- Campos: nombre, numero_documento, entidad_emisora
- Fechas: fecha_expedicion, fecha_vencimiento
- Campos: estado (vigente/vencido/en_tramite/no_aplica)
- Campos: documento_adjunto, observaciones
- Indices: empresa_id, tipo_requisito_id, estado, fecha_vencimiento

#### 2.3 Partes Interesadas

**parte_interesada**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre, tipo (interna/externa), categoria, descripcion
- Contacto: contacto_nombre, contacto_email, contacto_telefono
- Indices: empresa_id, tipo

**requisito_parte_interesada**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: parte_interesada_id → parte_interesada.id
- Campos: requisito, expectativa, como_cumplimos
- Campos: proceso_relacionado, prioridad (alta/media/baja)
- Indices: parte_interesada_id, prioridad

#### 2.4 Reglamentos Internos

**tipo_reglamento**
- PK: id (BIGINT, AUTO_INCREMENT)
- UK: codigo
- Campos: nombre, descripcion, obligatorio
- **Nota**: Tabla global

**reglamento**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: tipo_reglamento_id → tipo_reglamento.id
- FK: aprobado_por → usuario.id
- FK: documento_id → documento.id
- Campos: version, fecha_aprobacion, fecha_publicacion
- Campos: estado (borrador/vigente/obsoleto)
- Indices: empresa_id, tipo_reglamento_id, estado

---

## 3. MOTOR_RIESGOS (Risk Engine)

### Descripción
Motor de gestión de riesgos integral: contexto organizacional, análisis DOFA, matriz de riesgos, IPEVR (GTC-45) y aspectos ambientales.

### Tablas (14)

#### 3.1 Análisis de Contexto

**analisis_contexto**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: responsable_id → usuario.id
- Campos: tipo (pci/poam/pestel/5fuerzas)
- Campos: nombre, periodo, fecha_realizacion
- Campos: estado (borrador/aprobado), observaciones
- Indices: empresa_id, tipo, fecha_realizacion

**factor_analisis**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: analisis_id → analisis_contexto.id
- Campos: tipo_factor (fortaleza/debilidad/oportunidad/amenaza)
- Campos: categoria, descripcion
- Campos: impacto (alto/medio/bajo), calificacion (1-5), ponderacion
- Campos: orden
- Indices: analisis_id, tipo_factor

#### 3.2 Matriz DOFA y Estrategias TOWS

**matriz_dofa**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: analisis_pci_id → analisis_contexto.id
- FK: analisis_poam_id → analisis_contexto.id
- Campos: nombre, periodo, fecha_elaboracion
- Campos: estado (borrador/aprobado)
- Indices: empresa_id, fecha_elaboracion

**estrategia_tows**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: matriz_dofa_id → matriz_dofa.id
- FK: responsable_id → usuario.id
- FK: proyecto_id → proyecto.id
- Campos: tipo (FO/FA/DO/DA), codigo, descripcion
- Campos: prioridad, fecha_inicio, fecha_fin
- Campos: estado (pendiente/en_proceso/completada)
- Indices: matriz_dofa_id, tipo, estado

#### 3.3 Gestión de Riesgos

**riesgo**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: proceso_id → proceso.id
- FK: responsable_id → usuario.id
- Campos: codigo, tipo_riesgo (proceso/sst/ambiental/vial/seguridad_info/sagrilaft)
- Campos: nombre, descripcion, causa, consecuencia
- Inherente: probabilidad_inherente, impacto_inherente, nivel_riesgo_inherente
- Residual: probabilidad_residual, impacto_residual, nivel_riesgo_residual
- Campos: tratamiento (evitar/mitigar/transferir/aceptar)
- Campos: fecha_identificacion, estado (activo/cerrado/materializado)
- Indices: empresa_id, tipo_riesgo, nivel_riesgo_residual, estado

**control_operacional**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: riesgo_id → riesgo.id
- FK: responsable_id → usuario.id
- Campos: codigo, nombre, descripcion
- Campos: tipo_control (preventivo/detectivo/correctivo)
- Campos: naturaleza (manual/automatico), frecuencia
- Campos: evidencia, efectividad (alta/media/baja)
- Indices: riesgo_id, tipo_control

#### 3.4 Matriz IPEVR (GTC-45)

**peligro**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: clasificacion (biologico/fisico/quimico/psicosocial/biomecanico/condiciones_seguridad/fenomenos_naturales)
- Campos: descripcion, fuente, efectos_salud
- Indices: empresa_id, clasificacion

**matriz_ipevr**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: sede_id → sede.id
- FK: area_id → area.id
- FK: cargo_id → cargo.id
- FK: proceso_id → proceso.id
- FK: peligro_id → peligro.id
- FK: requisito_legal_id → norma_legal.id
- FK: responsable_id → usuario.id
- Campos: actividad, rutinaria
- Metodología GTC-45: nivel_deficiencia, nivel_exposicion, nivel_probabilidad
- Metodología GTC-45: nivel_consecuencia, nivel_riesgo
- Metodología GTC-45: interpretacion_nr (I/II/III/IV), aceptabilidad
- Campos: numero_expuestos, peor_consecuencia, medidas_existentes
- Campos: fecha_valoracion, estado (activo/revision/cerrado)
- Indices: empresa_id, sede_id, peligro_id, interpretacion_nr, estado

**control_ipevr**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: ipevr_id → matriz_ipevr.id
- FK: responsable_id → usuario.id
- Campos: jerarquia (eliminacion/sustitucion/ingenieria/administrativo/epp)
- Campos: descripcion, fecha_implementacion
- Campos: estado (pendiente/implementado/verificado), efectividad
- Indices: ipevr_id, jerarquia, estado

#### 3.5 Aspectos Ambientales

**aspecto_ambiental**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: proceso_id → proceso.id
- FK: requisito_legal_id → norma_legal.id
- FK: responsable_id → usuario.id
- Campos: actividad, aspecto, impacto
- Campos: tipo_impacto (positivo/negativo)
- Campos: recurso_afectado (agua/aire/suelo/fauna/flora/comunidad)
- Campos: condicion (normal/anormal/emergencia)
- Campos: temporalidad (pasado/presente/futuro)
- Valoración: frecuencia (1-5), severidad (1-5), alcance (1-5)
- Campos: significancia, es_significativo
- Campos: control, fecha_valoracion
- Indices: empresa_id, proceso_id, es_significativo, recurso_afectado

---

## 4. WORKFLOW_ENGINE

### Descripción
Motor de flujos de trabajo y gestión de procesos BPM. Tareas, aprobaciones y automatización.

### Tablas (8)

**workflow_template**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre, codigo, descripcion
- Campos: entidad_origen (VARCHAR), configuracion (JSON)
- Campos: activo
- Indices: empresa_id, codigo

**workflow_instancia**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: workflow_template_id → workflow_template.id
- FK: iniciado_por → usuario.id
- Polimórfico: entidad (VARCHAR), entidad_id (BIGINT)
- Campos: estado (pendiente/en_proceso/aprobado/rechazado/cancelado)
- Campos: fecha_inicio, fecha_fin
- Indices: workflow_template_id, estado, entidad

**workflow_paso**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: workflow_template_id → workflow_template.id
- Campos: nombre, orden, tipo (aprobacion/revision/notificacion/tarea)
- Campos: rol_responsable_id → rol.id
- Campos: usuario_responsable_id → usuario.id
- Campos: obligatorio, configuracion (JSON)
- Indices: workflow_template_id, orden

**workflow_paso_instancia**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: workflow_instancia_id → workflow_instancia.id
- FK: workflow_paso_id → workflow_paso.id
- FK: asignado_a → usuario.id
- FK: completado_por → usuario.id
- Campos: estado (pendiente/en_proceso/completado/omitido)
- Campos: fecha_asignacion, fecha_completado
- Campos: comentarios, datos_adicionales (JSON)
- Indices: workflow_instancia_id, asignado_a, estado

**tarea**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: asignado_a → usuario.id
- FK: creado_por → usuario.id
- FK: proceso_id → proceso.id
- Polimórfico: entidad_origen (VARCHAR), entidad_origen_id (BIGINT)
- Campos: titulo, descripcion, prioridad (alta/media/baja)
- Campos: estado (pendiente/en_proceso/completada/cancelada)
- Campos: fecha_vencimiento, fecha_completado
- Indices: empresa_id, asignado_a, estado, fecha_vencimiento

**notificacion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: usuario_id → usuario.id
- FK: empresa_id → empresa.id
- Polimórfico: entidad (VARCHAR), entidad_id (BIGINT)
- Campos: titulo, mensaje, tipo (info/warning/error/success)
- Campos: leida, fecha_leido
- Campos: accion_url
- Campos: created_at
- Indices: usuario_id, empresa_id, leida, created_at

**alerta_sistema**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: generada_por_regla_id → regla_alerta.id
- Polimórfico: entidad (VARCHAR), entidad_id (BIGINT)
- Campos: tipo, titulo, mensaje
- Campos: criticidad (baja/media/alta/critica)
- Campos: estado (activa/resuelta/ignorada)
- Campos: fecha_generacion, fecha_resolucion
- Indices: empresa_id, tipo, estado, criticidad

**regla_alerta**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre, descripcion, entidad_objetivo
- Campos: condiciones (JSON), acciones (JSON)
- Campos: activa
- Indices: empresa_id, entidad_objetivo, activa

---

## 5. HSEQ_MANAGEMENT (Torre de Control)

### Descripción
Torre de control HSEQ. Documentos, formularios dinámicos, no conformidades, acciones, auditorías, inspecciones, accidentes, comités y emergencias.

### Tablas (26)

#### 5.1 Documentos y Formularios

**documento**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- UK: codigo
- Campos: nombre, version, estado (borrador/revision/aprobado/obsoleto)
- Campos: archivo_url
- Indices: empresa_id, estado

**formulario_dinamico**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre, codigo, estructura_json (JSON)
- Campos: requiere_firma, activo
- Indices: empresa_id, codigo

**registro_formulario**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: formulario_id → formulario_dinamico.id
- FK: created_by → usuario.id
- Campos: datos_json (JSON), estado
- Indices: formulario_id, created_by, created_at

**firma_digital**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: registro_id → registro_formulario.id
- FK: usuario_id → usuario.id
- Campos: firma_imagen (LONGTEXT), hash_documento
- Campos: timestamp_firma
- Indices: registro_id, usuario_id

#### 5.2 No Conformidades y Acciones

**no_conformidad**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: codigo, tipo, origen, titulo, descripcion
- Campos: clasificacion (mayor/menor/observacion)
- Campos: estado
- Indices: empresa_id, clasificacion, estado

**accion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: responsable_id → usuario.id
- Polimórfico: origen (VARCHAR), origen_id (BIGINT)
- Campos: codigo, tipo (correctiva/preventiva/mejora)
- Campos: titulo, descripcion, analisis_causa, accion_propuesta
- Campos: fecha_compromiso, estado, eficaz
- Indices: empresa_id, tipo, responsable_id, estado, fecha_compromiso

#### 5.3 Comités

**tipo_comite**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre, codigo, periodicidad_reuniones
- Indices: empresa_id

**comite**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: tipo_comite_id → tipo_comite.id
- Campos: periodo, fecha_conformacion, fecha_vencimiento
- Campos: estado
- Indices: tipo_comite_id, estado

**miembro_comite**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: comite_id → comite.id
- FK: colaborador_id → colaborador.id
- Campos: rol_comite, representa (empresa/trabajadores)
- Campos: activo
- Indices: comite_id, colaborador_id

**reunion_comite**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: comite_id → comite.id
- Campos: numero_reunion, fecha_programada, estado
- Indices: comite_id, fecha_programada

#### 5.4 Accidentes e Investigaciones

**accidente_trabajo**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: colaborador_id → colaborador.id
- Campos: codigo, tipo, fecha_evento, descripcion
- Campos: dias_incapacidad, mortal
- Campos: estado
- Indices: empresa_id, colaborador_id, fecha_evento, mortal

**investigacion_at**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: accidente_id → accidente_trabajo.id
- Campos: fecha_investigacion, metodologia
- Campos: causas_inmediatas, causas_basicas, conclusiones
- Indices: accidente_id

#### 5.5 Inspecciones

**tipo_inspeccion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: formulario_id → formulario_dinamico.id
- Campos: nombre, codigo, activo
- Indices: empresa_id

**inspeccion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: tipo_inspeccion_id → tipo_inspeccion.id
- FK: responsable_id → usuario.id
- Campos: codigo, fecha_programada, estado
- Indices: empresa_id, tipo_inspeccion_id, fecha_programada, estado

**hallazgo_inspeccion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: inspeccion_id → inspeccion.id
- FK: accion_id → accion.id
- Campos: descripcion, tipo, criticidad, estado
- Indices: inspeccion_id, criticidad, estado

#### 5.6 Auditorías

**programa_auditoria**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre, anio, estado
- Indices: empresa_id, anio

**auditoria**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: programa_id → programa_auditoria.id
- FK: auditor_lider_id → usuario.id
- Campos: codigo, tipo, fecha_programada, estado
- Indices: programa_id, tipo, fecha_programada, estado

**hallazgo_auditoria**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: auditoria_id → auditoria.id
- FK: accion_id → accion.id
- Campos: tipo, descripcion, estado
- Indices: auditoria_id, tipo, estado

#### 5.7 Emergencias

**plan_emergencia**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: sede_id → sede.id
- FK: documento_id → documento.id
- Campos: version, fecha_aprobacion
- Indices: empresa_id, sede_id

**brigada**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: sede_id → sede.id
- Campos: nombre, tipo, activo
- Indices: empresa_id, sede_id

**miembro_brigada**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: brigada_id → brigada.id
- FK: colaborador_id → colaborador.id
- Campos: rol, activo
- Indices: brigada_id, colaborador_id

**simulacro**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: sede_id → sede.id
- Campos: tipo_emergencia, fecha_programada, fecha_realizada
- Campos: tiempo_evacuacion, participantes, calificacion, estado
- Indices: empresa_id, sede_id, fecha_programada

---

## 6. SUPPLY_CHAIN (Cadena de Suministro)

### Descripción
Gestión de proveedores, materia prima, órdenes de compra, inventarios y recepción de materiales.

### Tablas (12)

#### 6.1 Proveedores

**proveedor**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: codigo_interno, nit, razon_social, nombre_comercial
- Campos: tipo_proveedor (materia_prima/servicio/ambos)
- Contacto: telefono, email, direccion, ciudad, departamento
- Campos: contacto_nombre, contacto_telefono, contacto_email
- Campos: plazo_pago_dias, calificacion, activo
- Indices: empresa_id, nit, tipo_proveedor

**certificado_proveedor**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: proveedor_id → proveedor.id
- Campos: tipo_certificado, numero_certificado, entidad_emisora
- Campos: fecha_emision, fecha_vencimiento
- Campos: archivo_url, estado (vigente/vencido/por_vencer)
- Indices: proveedor_id, tipo_certificado, fecha_vencimiento

**evaluacion_proveedor**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: proveedor_id → proveedor.id
- FK: evaluado_por → usuario.id
- Campos: fecha_evaluacion, periodo_evaluado
- Criterios: calidad_producto, tiempo_entrega, precio, servicio
- Campos: puntaje_total, observaciones, estado
- Indices: proveedor_id, fecha_evaluacion

#### 6.2 Materia Prima

**categoria_materia_prima**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre, codigo, descripcion, activo
- Indices: empresa_id

**materia_prima**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: categoria_id → categoria_materia_prima.id
- Campos: codigo_interno, nombre, descripcion
- Campos: unidad_medida, tipo (directa/indirecta)
- Stock: stock_minimo, stock_maximo, punto_reorden
- Campos: precio_promedio, activo
- Indices: empresa_id, categoria_id, codigo_interno

**historial_precio_mp**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: materia_prima_id → materia_prima.id
- FK: proveedor_id → proveedor.id
- Campos: fecha_vigencia, precio_unitario
- Campos: moneda, observaciones
- Indices: materia_prima_id, proveedor_id, fecha_vigencia

#### 6.3 Órdenes de Compra

**orden_compra**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: proveedor_id → proveedor.id
- FK: creado_por → usuario.id
- FK: aprobado_por → usuario.id
- Campos: numero_orden, fecha_orden, fecha_entrega_esperada
- Campos: estado (borrador/enviada/aprobada/recibida/cancelada)
- Campos: subtotal, impuestos, total
- Campos: observaciones
- Indices: empresa_id, proveedor_id, numero_orden, estado, fecha_orden

**detalle_orden_compra**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: orden_compra_id → orden_compra.id
- FK: materia_prima_id → materia_prima.id
- Campos: cantidad_solicitada, cantidad_recibida
- Campos: precio_unitario, subtotal
- Campos: observaciones
- Indices: orden_compra_id, materia_prima_id

#### 6.4 Inventario

**bodega**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: sede_id → sede.id
- FK: responsable_id → usuario.id
- Campos: nombre, codigo, tipo (materia_prima/producto_terminado/general)
- Campos: activo
- Indices: empresa_id, sede_id, tipo

**inventario**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: bodega_id → bodega.id
- FK: materia_prima_id → materia_prima.id
- Campos: cantidad_disponible, cantidad_reservada
- Campos: lote, fecha_vencimiento
- Campos: ultima_actualizacion
- UK: (bodega_id, materia_prima_id, lote)
- Indices: bodega_id, materia_prima_id, fecha_vencimiento

**movimiento_inventario**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: bodega_id → bodega.id
- FK: materia_prima_id → materia_prima.id
- FK: usuario_id → usuario.id
- Polimórfico: origen (VARCHAR), origen_id (BIGINT)
- Campos: tipo_movimiento (entrada/salida/ajuste/traslado)
- Campos: cantidad, lote, fecha_movimiento
- Campos: costo_unitario, observaciones
- Indices: bodega_id, materia_prima_id, tipo_movimiento, fecha_movimiento

**recepcion_material**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: orden_compra_id → orden_compra.id
- FK: bodega_id → bodega.id
- FK: recibido_por → usuario.id
- Campos: numero_remision, fecha_recepcion
- Campos: estado (pendiente/parcial/completa), observaciones
- Indices: orden_compra_id, bodega_id, fecha_recepcion

---

## 7. PRODUCTION_OPS (Operaciones de Producción)

### Descripción
Gestión de producción: productos, fórmulas, órdenes de producción, lotes y control de calidad.

### Tablas (10)

#### 7.1 Productos

**categoria_producto**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre, codigo, descripcion, activo
- Indices: empresa_id

**producto**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: categoria_id → categoria_producto.id
- Campos: codigo, nombre, descripcion
- Campos: unidad_medida, tipo (terminado/semielaborado)
- Campos: precio_base, activo
- Indices: empresa_id, categoria_id, codigo

**formula_producto**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: producto_id → producto.id
- Campos: version, fecha_vigencia, cantidad_base
- Campos: tiempo_produccion_minutos, rendimiento_porcentaje
- Campos: observaciones, activa
- Indices: producto_id, activa

**ingrediente_formula**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: formula_id → formula_producto.id
- FK: materia_prima_id → materia_prima.id
- Campos: cantidad, unidad_medida, porcentaje
- Campos: orden, observaciones
- Indices: formula_id, materia_prima_id

#### 7.2 Órdenes de Producción

**orden_produccion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: producto_id → producto.id
- FK: formula_id → formula_producto.id
- FK: creado_por → usuario.id
- Campos: numero_orden, fecha_orden, fecha_programada
- Campos: cantidad_programada, cantidad_producida
- Campos: estado (programada/en_proceso/completada/cancelada)
- Campos: prioridad (alta/media/baja)
- Indices: empresa_id, producto_id, numero_orden, estado, fecha_programada

**lote_produccion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: orden_produccion_id → orden_produccion.id
- FK: producto_id → producto.id
- FK: bodega_destino_id → bodega.id
- Campos: numero_lote, fecha_produccion, fecha_vencimiento
- Campos: cantidad_producida, estado_calidad
- Campos: observaciones
- UK: numero_lote
- Indices: orden_produccion_id, producto_id, fecha_produccion

**consumo_material**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: orden_produccion_id → orden_produccion.id
- FK: materia_prima_id → materia_prima.id
- Campos: cantidad_teorica, cantidad_real, diferencia
- Campos: lote_mp, costo_unitario, costo_total
- Indices: orden_produccion_id, materia_prima_id

#### 7.3 Control de Calidad

**inspeccion_calidad**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: lote_produccion_id → lote_produccion.id
- FK: inspector_id → usuario.id
- Campos: fecha_inspeccion, tipo_inspeccion
- Campos: resultado (aprobado/rechazado/condicional)
- Campos: observaciones
- Indices: lote_produccion_id, resultado, fecha_inspeccion

**parametro_calidad**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: inspeccion_calidad_id → inspeccion_calidad.id
- Campos: nombre_parametro, valor_esperado, valor_obtenido
- Campos: unidad_medida, cumple
- Campos: observaciones
- Indices: inspeccion_calidad_id

**no_conformidad_produccion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: lote_produccion_id → lote_produccion.id
- FK: reportado_por → usuario.id
- Campos: descripcion, tipo_nc, gravedad
- Campos: accion_inmediata, estado
- Indices: lote_produccion_id, tipo_nc, estado

---

## 8. LOGISTICS_FLEET (Logística y Flota)

### Descripción
Gestión de flota vehicular, conductores, rutas, viajes y mantenimiento (PESV).

### Tablas (12)

#### 8.1 Vehículos

**vehiculo**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: sede_id → sede.id
- Campos: placa, tipo_vehiculo, marca, modelo, año
- Campos: color, numero_chasis, numero_motor
- Campos: capacidad_carga_kg, capacidad_pasajeros
- Campos: propietario (propio/tercero), estado (activo/mantenimiento/inactivo)
- Indices: empresa_id, placa, tipo_vehiculo, estado

**documento_vehiculo**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: vehiculo_id → vehiculo.id
- Campos: tipo_documento (soat/tecnomecanica/seguro/tarjeta_propiedad)
- Campos: numero_documento, fecha_expedicion, fecha_vencimiento
- Campos: entidad_emisora, archivo_url, estado
- Indices: vehiculo_id, tipo_documento, fecha_vencimiento

**mantenimiento_vehiculo**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: vehiculo_id → vehiculo.id
- FK: taller (VARCHAR), responsable_id → usuario.id
- Campos: tipo_mantenimiento (preventivo/correctivo/emergencia)
- Campos: fecha_programada, fecha_realizada, kilometraje
- Campos: descripcion_trabajo, costo, estado
- Indices: vehiculo_id, tipo_mantenimiento, fecha_programada, estado

#### 8.2 Conductores

**conductor**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: colaborador_id → colaborador.id
- Campos: numero_licencia, categoria_licencia, fecha_expedicion_licencia
- Campos: fecha_vencimiento_licencia
- Campos: fecha_vencimiento_examen_medico
- Campos: estado (activo/suspendido/inactivo)
- Indices: empresa_id, colaborador_id, numero_licencia, estado

**capacitacion_conductor**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: conductor_id → conductor.id
- Campos: tipo_capacitacion, nombre_capacitacion, entidad
- Campos: fecha_capacitacion, fecha_vencimiento
- Campos: numero_certificado, archivo_url
- Indices: conductor_id, tipo_capacitacion, fecha_vencimiento

**incidente_conductor**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: conductor_id → conductor.id
- FK: vehiculo_id → vehiculo.id
- Campos: fecha_incidente, tipo_incidente, descripcion
- Campos: gravedad, hubo_lesionados, costo_estimado
- Campos: estado_investigacion
- Indices: conductor_id, vehiculo_id, fecha_incidente, gravedad

#### 8.3 Rutas y Viajes

**ruta**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: codigo, nombre, origen, destino
- Campos: distancia_km, tiempo_estimado_minutos
- Campos: peajes_cantidad, costo_peajes, activa
- Indices: empresa_id, codigo

**viaje**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: vehiculo_id → vehiculo.id
- FK: conductor_id → conductor.id
- FK: ruta_id → ruta.id
- Polimórfico: origen_carga (VARCHAR), origen_carga_id (BIGINT)
- Campos: numero_viaje, fecha_salida_programada, fecha_salida_real
- Campos: fecha_llegada_programada, fecha_llegada_real
- Campos: kilometraje_inicial, kilometraje_final
- Campos: estado (programado/en_curso/completado/cancelado)
- Indices: empresa_id, vehiculo_id, conductor_id, fecha_salida_programada, estado

**inspeccion_preoperacional**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: vehiculo_id → vehiculo.id
- FK: conductor_id → conductor.id
- FK: viaje_id → viaje.id
- Campos: fecha_inspeccion, kilometraje
- Campos: datos_inspeccion (JSON), apto_circulacion
- Campos: observaciones
- Indices: vehiculo_id, conductor_id, fecha_inspeccion

**gasto_viaje**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: viaje_id → viaje.id
- Campos: tipo_gasto (combustible/peajes/parqueadero/alimentacion/otro)
- Campos: descripcion, monto, fecha_gasto
- Campos: comprobante_url
- Indices: viaje_id, tipo_gasto

**novedad_viaje**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: viaje_id → viaje.id
- FK: reportado_por → usuario.id
- Campos: tipo_novedad, descripcion, fecha_novedad
- Campos: latitud, longitud, estado
- Indices: viaje_id, tipo_novedad, fecha_novedad

---

## 9. SALES_CRM (Ventas y CRM)

### Descripción
Gestión de clientes, cotizaciones, pedidos, facturación y cartera.

### Tablas (11)

#### 9.1 Clientes

**cliente**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: codigo_cliente, tipo_documento, numero_documento
- Campos: razon_social, nombre_comercial, tipo_cliente (empresa/persona_natural)
- Contacto: telefono, email, direccion, ciudad, departamento
- Campos: contacto_nombre, contacto_cargo, contacto_telefono, contacto_email
- Comercial: plazo_pago_dias, cupo_credito, estado (activo/inactivo/bloqueado)
- Indices: empresa_id, codigo_cliente, numero_documento, estado

**segmento_cliente**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre, codigo, descripcion, criterios (JSON)
- Indices: empresa_id

**cliente_segmento**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: cliente_id → cliente.id
- FK: segmento_id → segmento_cliente.id
- UK: (cliente_id, segmento_id)

#### 9.2 Proceso Comercial

**cotizacion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: cliente_id → cliente.id
- FK: vendedor_id → usuario.id
- Campos: numero_cotizacion, fecha_cotizacion, fecha_vencimiento
- Campos: estado (borrador/enviada/aprobada/rechazada/vencida)
- Campos: subtotal, descuento, impuestos, total
- Campos: observaciones, terminos_condiciones
- Indices: empresa_id, cliente_id, numero_cotizacion, estado, fecha_cotizacion

**detalle_cotizacion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: cotizacion_id → cotizacion.id
- FK: producto_id → producto.id
- Campos: cantidad, precio_unitario, descuento_porcentaje
- Campos: subtotal, observaciones
- Indices: cotizacion_id, producto_id

**pedido**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: cliente_id → cliente.id
- FK: cotizacion_id → cotizacion.id
- FK: vendedor_id → usuario.id
- Campos: numero_pedido, fecha_pedido, fecha_entrega_solicitada
- Campos: estado (pendiente/aprobado/produccion/despachado/entregado/cancelado)
- Campos: subtotal, descuento, impuestos, total
- Campos: observaciones
- Indices: empresa_id, cliente_id, numero_pedido, estado, fecha_pedido

**detalle_pedido**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: pedido_id → pedido.id
- FK: producto_id → producto.id
- Campos: cantidad_solicitada, cantidad_despachada, cantidad_entregada
- Campos: precio_unitario, descuento_porcentaje, subtotal
- Indices: pedido_id, producto_id

#### 9.3 Facturación

**factura**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: cliente_id → cliente.id
- FK: pedido_id → pedido.id
- Campos: numero_factura, fecha_factura, fecha_vencimiento
- Campos: estado (emitida/pagada/vencida/anulada)
- Campos: subtotal, descuento, impuestos, total, saldo_pendiente
- Campos: medio_pago, observaciones
- Indices: empresa_id, cliente_id, numero_factura, estado, fecha_factura, fecha_vencimiento

**detalle_factura**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: factura_id → factura.id
- FK: producto_id → producto.id
- Campos: cantidad, precio_unitario, descuento_porcentaje, subtotal
- Indices: factura_id, producto_id

**pago_factura**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: factura_id → factura.id
- FK: registrado_por → usuario.id
- Campos: fecha_pago, monto_pago, metodo_pago
- Campos: numero_referencia, banco, observaciones
- Indices: factura_id, fecha_pago

**nota_credito**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: factura_id → factura.id
- FK: cliente_id → cliente.id
- Campos: numero_nota, fecha_nota, motivo
- Campos: monto, estado, observaciones
- Indices: empresa_id, factura_id, numero_nota, fecha_nota

---

## 10. TALENT_HUB (Gestión Humana)

### Descripción
Gestión de talento humano: colaboradores, nómina, capacitación, evaluación de desempeño.

### Tablas (14)

#### 10.1 Colaboradores

**colaborador**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: usuario_id → usuario.id
- FK: sede_id → sede.id
- FK: area_id → area.id
- FK: cargo_id → cargo.id
- Personal: tipo_documento, numero_documento, primer_nombre, segundo_nombre
- Personal: primer_apellido, segundo_apellido, fecha_nacimiento, genero
- Contacto: telefono_personal, email_personal, direccion, ciudad
- Laboral: fecha_ingreso, fecha_retiro, tipo_contrato, salario_base
- Laboral: estado (activo/incapacidad/vacaciones/suspendido/retirado)
- Indices: empresa_id, numero_documento, sede_id, area_id, cargo_id, estado

**documento_colaborador**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: colaborador_id → colaborador.id
- Campos: tipo_documento (cedula/hoja_vida/contrato/examen_medico/eps)
- Campos: nombre_documento, fecha_expedicion, fecha_vencimiento
- Campos: archivo_url, estado
- Indices: colaborador_id, tipo_documento, fecha_vencimiento

**contacto_emergencia**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: colaborador_id → colaborador.id
- Campos: nombre_completo, parentesco, telefono, direccion
- Indices: colaborador_id

#### 10.2 Nómina

**periodo_nomina**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre_periodo, fecha_inicio, fecha_fin
- Campos: fecha_pago, estado (abierto/cerrado/pagado)
- Indices: empresa_id, fecha_inicio, estado

**nomina**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: periodo_nomina_id → periodo_nomina.id
- FK: colaborador_id → colaborador.id
- Campos: salario_base, dias_trabajados, total_devengado
- Campos: total_deducciones, total_aportes_empresa, neto_pagar
- Campos: estado (calculada/aprobada/pagada)
- Indices: periodo_nomina_id, colaborador_id, estado

**concepto_nomina**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: codigo, nombre, tipo (devengado/deduccion/aporte_empresa)
- Campos: base_calculo, porcentaje, activo
- Indices: empresa_id, tipo, codigo

**detalle_nomina**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: nomina_id → nomina.id
- FK: concepto_nomina_id → concepto_nomina.id
- Campos: cantidad, valor_unitario, valor_total
- Indices: nomina_id, concepto_nomina_id

#### 10.3 Capacitación

**plan_capacitacion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre_plan, anio, presupuesto, estado
- Indices: empresa_id, anio

**capacitacion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: plan_capacitacion_id → plan_capacitacion.id
- Campos: nombre_capacitacion, tipo, modalidad
- Campos: fecha_inicio, fecha_fin, duracion_horas
- Campos: instructor, lugar, costo, estado
- Indices: empresa_id, plan_capacitacion_id, fecha_inicio, estado

**asistencia_capacitacion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: capacitacion_id → capacitacion.id
- FK: colaborador_id → colaborador.id
- Campos: asistio, calificacion, certificado_url
- UK: (capacitacion_id, colaborador_id)

#### 10.4 Evaluación de Desempeño

**periodo_evaluacion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre_periodo, fecha_inicio, fecha_fin, estado
- Indices: empresa_id, fecha_inicio

**evaluacion_desempenio**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: periodo_evaluacion_id → periodo_evaluacion.id
- FK: colaborador_id → colaborador.id
- FK: evaluador_id → usuario.id
- Campos: fecha_evaluacion, puntaje_total, resultado
- Campos: fortalezas, oportunidades_mejora, estado
- Indices: periodo_evaluacion_id, colaborador_id, evaluador_id

**criterio_evaluacion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre_criterio, descripcion, peso_porcentaje
- Indices: empresa_id

**detalle_evaluacion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: evaluacion_desempenio_id → evaluacion_desempenio.id
- FK: criterio_evaluacion_id → criterio_evaluacion.id
- Campos: puntaje, observaciones
- Indices: evaluacion_desempenio_id, criterio_evaluacion_id

---

## 11. ADMIN_FINANCE (Administración y Finanzas)

### Descripción
Gestión financiera: presupuestos, gastos, ingresos, flujo de caja y tesorería.

### Tablas (10)

#### 11.1 Presupuesto

**presupuesto**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: area_id → area.id
- FK: centro_costo_id → centro_costo.id
- Campos: anio, periodo, tipo (ingresos/gastos)
- Campos: monto_presupuestado, estado (borrador/aprobado/cerrado)
- Indices: empresa_id, area_id, anio, tipo, estado

**rubro_presupuesto**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: presupuesto_id → presupuesto.id
- FK: cuenta_contable_id → cuenta_contable.id
- Campos: nombre_rubro, monto_presupuestado, monto_ejecutado
- Campos: porcentaje_ejecucion
- Indices: presupuesto_id, cuenta_contable_id

**centro_costo**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: area_id → area.id
- Campos: codigo, nombre, descripcion, activo
- Indices: empresa_id, codigo

#### 11.2 Gastos e Ingresos

**gasto**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: centro_costo_id → centro_costo.id
- FK: proveedor_id → proveedor.id
- FK: solicitante_id → usuario.id
- FK: aprobado_por → usuario.id
- Campos: numero_gasto, fecha_gasto, concepto, descripcion
- Campos: monto, estado (pendiente/aprobado/pagado/rechazado)
- Campos: comprobante_url
- Indices: empresa_id, centro_costo_id, numero_gasto, estado, fecha_gasto

**ingreso**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: factura_id → factura.id
- Campos: numero_ingreso, fecha_ingreso, concepto, descripcion
- Campos: monto, metodo_pago, estado
- Campos: comprobante_url
- Indices: empresa_id, factura_id, numero_ingreso, fecha_ingreso

#### 11.3 Tesorería

**cuenta_bancaria**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: banco, tipo_cuenta, numero_cuenta
- Campos: moneda, saldo_actual, activa
- Indices: empresa_id, numero_cuenta

**movimiento_bancario**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: cuenta_bancaria_id → cuenta_bancaria.id
- Polimórfico: origen (VARCHAR), origen_id (BIGINT)
- Campos: fecha_movimiento, tipo (ingreso/egreso/transferencia)
- Campos: monto, descripcion, numero_referencia
- Campos: saldo_anterior, saldo_posterior
- Indices: cuenta_bancaria_id, fecha_movimiento, tipo

**conciliacion_bancaria**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: cuenta_bancaria_id → cuenta_bancaria.id
- FK: realizada_por → usuario.id
- Campos: periodo, fecha_conciliacion
- Campos: saldo_sistema, saldo_extracto, diferencia
- Campos: estado (borrador/conciliado)
- Indices: cuenta_bancaria_id, periodo, estado

#### 11.4 Flujo de Caja

**flujo_caja**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: fecha, tipo (real/proyectado)
- Campos: saldo_inicial, total_ingresos, total_egresos, saldo_final
- Indices: empresa_id, fecha, tipo

**detalle_flujo_caja**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: flujo_caja_id → flujo_caja.id
- Campos: concepto, tipo_movimiento (ingreso/egreso)
- Campos: monto, categoria
- Indices: flujo_caja_id, tipo_movimiento

---

## 12. ACCOUNTING (Contabilidad)

### Descripción
Gestión contable: plan de cuentas, asientos contables, libros, cierre contable.

### Tablas (9)

#### 12.1 Plan de Cuentas

**cuenta_contable**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: cuenta_padre_id → cuenta_contable.id
- Campos: codigo_cuenta, nombre, tipo_cuenta (activo/pasivo/patrimonio/ingreso/gasto)
- Campos: naturaleza (debito/credito), nivel, acepta_movimientos
- Campos: activa
- Indices: empresa_id, codigo_cuenta, tipo_cuenta

**tercero**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: tipo_documento, numero_documento, nombre_completo
- Campos: tipo_tercero (cliente/proveedor/empleado/otro)
- Campos: telefono, email, direccion
- Indices: empresa_id, numero_documento, tipo_tercero

#### 12.2 Asientos Contables

**comprobante_contable**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: tipo_comprobante_id → tipo_comprobante.id
- FK: elaborado_por → usuario.id
- Campos: numero_comprobante, fecha_comprobante, periodo
- Campos: concepto, total_debito, total_credito
- Campos: estado (borrador/aprobado/anulado)
- Indices: empresa_id, numero_comprobante, fecha_comprobante, estado

**tipo_comprobante**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: codigo, nombre, prefijo, consecutivo_actual
- Indices: empresa_id, codigo

**detalle_comprobante**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: comprobante_contable_id → comprobante_contable.id
- FK: cuenta_contable_id → cuenta_contable.id
- FK: centro_costo_id → centro_costo.id
- FK: tercero_id → tercero.id
- Campos: descripcion, debito, credito
- Indices: comprobante_contable_id, cuenta_contable_id

#### 12.3 Libros Contables

**libro_mayor**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: cuenta_contable_id → cuenta_contable.id
- FK: comprobante_contable_id → comprobante_contable.id
- Campos: fecha_movimiento, periodo, descripcion
- Campos: debito, credito, saldo
- Indices: cuenta_contable_id, fecha_movimiento, periodo

**balance_prueba**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: periodo, fecha_corte
- Campos: total_debitos, total_creditos, estado
- Indices: empresa_id, periodo, fecha_corte

**cierre_contable**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: comprobante_cierre_id → comprobante_contable.id
- FK: realizado_por → usuario.id
- Campos: periodo, fecha_cierre, tipo_cierre (mensual/anual)
- Campos: estado (proceso/cerrado)
- Indices: empresa_id, periodo, tipo_cierre

---

## 13. ANALYTICS (Análisis y Reportes)

### Descripción
Módulo de inteligencia de negocios: KPIs, reportes, dashboards y análisis.

### Tablas (8)

#### 13.1 KPIs e Indicadores

**tipo_indicador**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nombre, codigo, categoria (financiero/operativo/calidad/hseq)
- Campos: descripcion, activo
- Indices: empresa_id, codigo, categoria

**indicador**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: tipo_indicador_id → tipo_indicador.id
- FK: proceso_id → proceso.id
- FK: responsable_id → usuario.id
- Campos: nombre, descripcion, formula
- Campos: unidad_medida, meta, frecuencia_medicion
- Campos: tipo_tendencia (ascendente/descendente)
- Campos: activo
- Indices: empresa_id, tipo_indicador_id, proceso_id

**medicion_indicador**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: indicador_id → indicador.id
- FK: medido_por → usuario.id
- Campos: periodo, fecha_medicion, valor_obtenido, meta
- Campos: porcentaje_cumplimiento, estado (cumple/no_cumple)
- Campos: observaciones
- Indices: indicador_id, periodo, fecha_medicion

#### 13.2 Reportes

**reporte**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: creado_por → usuario.id
- Campos: nombre, descripcion, tipo (operativo/gerencial/regulatorio)
- Campos: query_sql, parametros (JSON)
- Campos: frecuencia (diario/semanal/mensual/anual)
- Campos: activo
- Indices: empresa_id, tipo, frecuencia

**ejecucion_reporte**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: reporte_id → reporte.id
- FK: ejecutado_por → usuario.id
- Campos: fecha_ejecucion, parametros_usados (JSON)
- Campos: tiempo_ejecucion_ms, archivo_generado_url
- Campos: estado (exitoso/error)
- Indices: reporte_id, fecha_ejecucion, estado

#### 13.3 Dashboards

**dashboard**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: creado_por → usuario.id
- Campos: nombre, descripcion, tipo (gerencial/operativo/hseq)
- Campos: configuracion_widgets (JSON)
- Campos: es_publico, activo
- Indices: empresa_id, tipo, es_publico

**widget_dashboard**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: dashboard_id → dashboard.id
- FK: indicador_id → indicador.id
- Campos: tipo_widget (grafico/tabla/kpi/gauge)
- Campos: posicion_x, posicion_y, ancho, alto
- Campos: configuracion (JSON)
- Indices: dashboard_id, indicador_id

**favorito_usuario**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: usuario_id → usuario.id
- Polimórfico: entidad (VARCHAR), entidad_id (BIGINT)
- Campos: tipo (dashboard/reporte/indicador)
- UK: (usuario_id, entidad, entidad_id)

---

## 14. AUDIT_SYSTEM (Sistema de Auditoría)

### Descripción
Sistema de auditoría y trazabilidad completa de operaciones del sistema.

### Tablas (5)

**auditoria_sistema**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: usuario_id → usuario.id
- Campos: accion (crear/editar/eliminar/ver/exportar)
- Polimórfico: tabla_afectada (VARCHAR), registro_id (BIGINT)
- Campos: valores_anteriores (JSON), valores_nuevos (JSON)
- Campos: ip_address, user_agent
- Campos: timestamp
- Indices: empresa_id, usuario_id, tabla_afectada, accion, timestamp

**sesion_usuario**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: usuario_id → usuario.id
- FK: empresa_id → empresa.id
- Campos: token_sesion, ip_address, user_agent
- Campos: fecha_inicio, fecha_ultimo_acceso, fecha_cierre
- Campos: activa
- Indices: usuario_id, token_sesion, activa

**log_sistema**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- Campos: nivel (debug/info/warning/error/critical)
- Campos: modulo, mensaje, stack_trace
- Campos: contexto_adicional (JSON)
- Campos: timestamp
- Indices: empresa_id, nivel, modulo, timestamp

**cambio_configuracion**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: usuario_id → usuario.id
- Campos: categoria (sistema/empresa/modulo/usuario)
- Campos: clave_configuracion, valor_anterior, valor_nuevo
- Campos: fecha_cambio
- Indices: empresa_id, usuario_id, categoria, fecha_cambio

**exportacion_datos**
- PK: id (BIGINT, AUTO_INCREMENT)
- FK: empresa_id → empresa.id
- FK: usuario_id → usuario.id
- Campos: tipo_exportacion (reporte/backup/integracion)
- Campos: entidad_exportada, registros_cantidad
- Campos: formato (excel/pdf/csv/json), archivo_url
- Campos: fecha_exportacion
- Indices: empresa_id, usuario_id, tipo_exportacion, fecha_exportacion

---

## ÍNDICES RECOMENDADOS GLOBALES

### Índices Multi-Tenant Críticos
Todas las tablas con empresa_id DEBEN tener:
```sql
CREATE INDEX idx_empresa_id ON {tabla}(empresa_id);
CREATE INDEX idx_empresa_created ON {tabla}(empresa_id, created_at);
```

### Índices de Auditoría
Para todas las tablas auditables:
```sql
CREATE INDEX idx_audit_trail ON {tabla}(empresa_id, created_at, created_by);
CREATE INDEX idx_soft_delete ON {tabla}(empresa_id, deleted_at) WHERE deleted_at IS NULL;
```

### Índices de Búsqueda
Para campos de búsqueda frecuente:
```sql
CREATE FULLTEXT INDEX idx_ft_nombre ON {tabla}(nombre, descripcion);
CREATE INDEX idx_codigo ON {tabla}(empresa_id, codigo);
CREATE INDEX idx_numero ON {tabla}(empresa_id, numero_{documento});
```

### Índices de Estado
Para workflow y estados:
```sql
CREATE INDEX idx_estado ON {tabla}(empresa_id, estado, fecha_{relevante});
```

### Índices de Fechas
Para reportes y consultas temporales:
```sql
CREATE INDEX idx_fecha_range ON {tabla}(empresa_id, fecha_{evento});
CREATE INDEX idx_vencimiento ON {tabla}(empresa_id, fecha_vencimiento)
  WHERE fecha_vencimiento >= CURDATE();
```

---

## CONSTRAINTS Y REGLAS DE INTEGRIDAD

### Foreign Keys
Todas las FKs deben tener:
```sql
CONSTRAINT fk_{tabla}_{campo}
  FOREIGN KEY ({campo}_id)
  REFERENCES {tabla_referencia}(id)
  ON DELETE RESTRICT
  ON UPDATE CASCADE
```

### Unique Constraints
```sql
-- Códigos únicos por empresa
CONSTRAINT uk_codigo UNIQUE (empresa_id, codigo)

-- Números de documento únicos
CONSTRAINT uk_numero UNIQUE (empresa_id, numero_{documento})

-- Email único
CONSTRAINT uk_email UNIQUE (email)
```

### Check Constraints
```sql
-- Rangos de valores
CONSTRAINT chk_calificacion CHECK (calificacion BETWEEN 1 AND 5)
CONSTRAINT chk_porcentaje CHECK (porcentaje_cumplimiento BETWEEN 0 AND 100)

-- Estados válidos
CONSTRAINT chk_estado CHECK (estado IN ('activo', 'inactivo', 'suspendido'))

-- Fechas lógicas
CONSTRAINT chk_fechas CHECK (fecha_fin >= fecha_inicio)
```

---

## ESTRATEGIA DE PARTICIONAMIENTO

### Tablas Candidatas para Particionamiento
Por volumen y naturaleza temporal:

**auditoria_sistema** - Particionar por año
```sql
PARTITION BY RANGE (YEAR(timestamp)) (
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

**log_sistema** - Particionar por mes
**movimiento_inventario** - Particionar por año
**movimiento_bancario** - Particionar por año
**detalle_comprobante** - Particionar por periodo contable

---

## MANTENIMIENTO Y OPTIMIZACIÓN

### Mantenimiento Periódico

**Diario:**
- Actualizar estadísticas de tablas críticas
- Revisar logs de errores
- Monitorear tamaño de tablas de auditoría

**Semanal:**
- OPTIMIZE TABLE para tablas con alto UPDATE/DELETE
- Revisar índices no utilizados
- Análisis de queries lentas

**Mensual:**
- Archivar datos históricos (>2 años)
- Revisar y ajustar configuración de buffer pool
- Auditoría de permisos y accesos

**Anual:**
- Cierre contable y archivado
- Purga de logs antiguos
- Revisión completa de arquitectura

### Queries de Monitoreo

**Tablas más grandes:**
```sql
SELECT
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
  table_rows
FROM information_schema.TABLES
WHERE table_schema = DATABASE()
ORDER BY (data_length + index_length) DESC
LIMIT 20;
```

**Índices no utilizados:**
```sql
SELECT
  object_schema,
  object_name,
  index_name,
  count_star
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE object_schema = DATABASE()
  AND count_star = 0
  AND index_name IS NOT NULL
ORDER BY object_name;
```

---

## BACKUP Y RECUPERACIÓN

### Estrategia de Backup

**Nivel 1 - Crítico (Backup cada hora):**
- empresa, usuario, usuario_empresa
- factura, pedido, orden_produccion
- comprobante_contable

**Nivel 2 - Importante (Backup diario):**
- Todas las transaccionales
- auditoria_sistema

**Nivel 3 - Referencia (Backup semanal):**
- Catálogos y maestros
- Configuración

### Point-in-Time Recovery
Habilitar binary logging:
```sql
SET GLOBAL binlog_format = 'ROW';
SET GLOBAL binlog_row_image = 'FULL';
```

---

## SEGURIDAD

### Cifrado en Reposo
Tablas con datos sensibles:
- usuario (password debe estar hasheado)
- colaborador
- cuenta_bancaria
- firma_digital

### Enmascaramiento de Datos
Para ambientes no productivos:
```sql
-- Enmascarar emails
UPDATE usuario SET email = CONCAT('user', id, '@test.local');

-- Enmascarar documentos
UPDATE colaborador SET numero_documento = LPAD(id, 10, '0');
```

### Auditoría Reforzada
Triggers de auditoría para tablas críticas:
```sql
CREATE TRIGGER trg_audit_factura_update
AFTER UPDATE ON factura
FOR EACH ROW
BEGIN
  INSERT INTO auditoria_sistema (
    empresa_id, usuario_id, accion, tabla_afectada, registro_id,
    valores_anteriores, valores_nuevos, timestamp
  ) VALUES (
    NEW.empresa_id, @current_user_id, 'editar', 'factura', NEW.id,
    JSON_OBJECT('total', OLD.total, 'estado', OLD.estado),
    JSON_OBJECT('total', NEW.total, 'estado', NEW.estado),
    NOW()
  );
END;
```

---

## NOTAS FINALES

### Convenciones de Nombres
- **Tablas**: snake_case, singular
- **PKs**: id (BIGINT AUTO_INCREMENT)
- **FKs**: {tabla_referencia}_id
- **Fechas**: fecha_{contexto} (DATE), {contexto}_at (DATETIME)
- **Flags**: is_{condicion}, tiene_{caracteristica}
- **Códigos**: codigo_{contexto}, numero_{documento}

### Campos Estándar de Auditoría
Todas las tablas transaccionales deben incluir:
```sql
empresa_id BIGINT NOT NULL,
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
created_by BIGINT NOT NULL,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
updated_by BIGINT,
deleted_at DATETIME,  -- Soft delete
deleted_by BIGINT,
FOREIGN KEY (empresa_id) REFERENCES empresa(id),
FOREIGN KEY (created_by) REFERENCES usuario(id),
FOREIGN KEY (updated_by) REFERENCES usuario(id),
FOREIGN KEY (deleted_by) REFERENCES usuario(id)
```

### Consideraciones de Rendimiento
- Evitar SELECT * en queries
- Usar LIMIT en queries de reporting
- Implementar paginación en APIs
- Cachear resultados de consultas frecuentes
- Usar prepared statements
- Monitorear slow query log

### Escalabilidad
- Diseñado para soportar:
  - 1000+ empresas concurrentes
  - 100,000+ usuarios
  - 10M+ registros transaccionales/mes
  - 99.9% uptime
  - RPO < 1 hora
  - RTO < 4 horas
