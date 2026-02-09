# Diagrama Entidad-Relación - StrateKaz

> **Versión:** 4.0.0
> **Última actualización:** 2026-02-03
> **Base de datos:** PostgreSQL 15+ con django-tenants

---

## Diagrama General por Niveles

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           NIVEL 0: CORE                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │      User       │───▶│      Role       │───▶│   Permission    │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ email           │    │ name            │    │ codename        │      │
│  │ first_name      │    │ description     │    │ name            │      │
│  │ last_name       │    │ type            │    │ content_type    │      │
│  │ is_active       │    │ level           │    └─────────────────┘      │
│  │ cargo_id ───────┼───▶└─────────────────┘                              │
│  └─────────────────┘                                                      │
│           │                                                               │
│           ▼                                                               │
│  ┌─────────────────┐    ┌─────────────────┐                              │
│  │   UserProfile   │    │    MenuItem     │                              │
│  ├─────────────────┤    ├─────────────────┤                              │
│  │ avatar          │    │ name            │                              │
│  │ phone           │    │ url             │                              │
│  │ preferences     │    │ icon            │                              │
│  │ 2fa_enabled     │    │ parent_id       │                              │
│  └─────────────────┘    │ order           │                              │
│                         │ permissions     │                              │
│                         └─────────────────┘                              │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                         NIVEL 0: TENANT                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │     Tenant      │───▶│      Plan       │    │     Domain      │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ name            │    │ name            │    │ domain          │      │
│  │ schema_name     │    │ max_users       │    │ tenant_id ──────┼─┐    │
│  │ plan_id ────────┼───▶│ features        │    │ is_primary      │ │    │
│  │ is_active       │    │ price           │    └─────────────────┘ │    │
│  │ on_trial        │    └─────────────────┘                        │    │
│  └─────────────────┘◀──────────────────────────────────────────────┘    │
│           │                                                               │
│           ▼                                                               │
│  ┌─────────────────┐                                                      │
│  │   TenantUser    │                                                      │
│  ├─────────────────┤                                                      │
│  │ email           │                                                      │
│  │ tenant_id       │                                                      │
│  │ is_owner        │                                                      │
│  └─────────────────┘                                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Nivel 1: Estratégico

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    NIVEL 1: GESTIÓN ESTRATÉGICA                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │ EmpresaConfig   │    │      Area       │───▶│      Cargo      │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ nombre          │    │ nombre          │    │ nombre          │      │
│  │ nit             │    │ codigo          │    │ area_id         │      │
│  │ logo            │    │ responsable_id  │    │ nivel           │      │
│  │ colores         │    │ parent_id       │    │ competencias    │      │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘      │
│                                │                                          │
│                                ▼                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │    Politica     │    │ ObjetivoEstrat. │───▶│      Meta       │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ tipo            │    │ nombre          │    │ nombre          │      │
│  │ contenido       │    │ perspectiva     │    │ valor_meta      │      │
│  │ version         │    │ indicador       │    │ fecha_limite    │      │
│  │ estado          │    │ responsable_id  │    │ estado          │      │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘      │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │   Documento     │───▶│    Version      │    │   Aprobacion    │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ codigo          │    │ numero          │    │ version_id      │      │
│  │ titulo          │    │ documento_id    │    │ aprobador_id    │      │
│  │ tipo            │    │ archivo         │    │ fecha           │      │
│  │ proceso_id      │    │ estado          │    │ comentario      │      │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Nivel 2: Cumplimiento

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    NIVEL 2: MOTOR DE RIESGOS                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │     Riesgo      │───▶│   Valoracion    │───▶│     Control     │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ codigo          │    │ probabilidad    │    │ descripcion     │      │
│  │ descripcion     │    │ impacto         │    │ tipo            │      │
│  │ tipo            │    │ nivel_riesgo    │    │ responsable_id  │      │
│  │ proceso_id      │    │ riesgo_id       │    │ eficacia        │      │
│  │ area_id         │    └─────────────────┘    └─────────────────┘      │
│  └─────────────────┘                                                      │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐                              │
│  │     Peligro     │───▶│ RiesgoOcupacion │    (IPEVR - SST)            │
│  ├─────────────────┤    ├─────────────────┤                              │
│  │ clasificacion   │    │ peligro_id      │                              │
│  │ fuente          │    │ actividad       │                              │
│  │ efectos_salud   │    │ grado_peligro   │                              │
│  └─────────────────┘    │ medidas_control │                              │
│                         └─────────────────┘                              │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐                              │
│  │ AspectoAmbiental│───▶│ ImpactoAmbiental│    (ISO 14001)              │
│  ├─────────────────┤    ├─────────────────┤                              │
│  │ actividad       │    │ aspecto_id      │                              │
│  │ aspecto         │    │ descripcion     │                              │
│  │ condicion       │    │ significancia   │                              │
│  └─────────────────┘    └─────────────────┘                              │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                    NIVEL 2: WORKFLOW ENGINE                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │    Workflow     │───▶│      Nodo       │───▶│   Transicion    │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ nombre          │    │ tipo            │    │ nodo_origen_id  │      │
│  │ version         │    │ workflow_id     │    │ nodo_destino_id │      │
│  │ estado          │    │ configuracion   │    │ condicion       │      │
│  │ content_type    │    │ posicion_x/y    │    │ accion          │      │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘      │
│           │                                                               │
│           ▼                                                               │
│  ┌─────────────────┐    ┌─────────────────┐                              │
│  │   Instancia     │───▶│  TareaWorkflow  │                              │
│  ├─────────────────┤    ├─────────────────┤                              │
│  │ workflow_id     │    │ instancia_id    │                              │
│  │ object_id       │    │ nodo_id         │                              │
│  │ estado          │    │ asignado_a_id   │                              │
│  │ nodo_actual_id  │    │ estado          │                              │
│  └─────────────────┘    │ fecha_limite    │                              │
│                         └─────────────────┘                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Nivel 3: Torre de Control (HSEQ)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    NIVEL 3: HSEQ MANAGEMENT                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │   Accidente     │───▶│  Investigacion  │───▶│ AccionCorrectiva│      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ fecha           │    │ accidente_id    │    │ descripcion     │      │
│  │ tipo            │    │ causa_raiz      │    │ responsable_id  │      │
│  │ severidad       │    │ metodologia     │    │ fecha_limite    │      │
│  │ colaborador_id  │    │ investigador_id │    │ estado          │      │
│  │ area_id         │    │ conclusiones    │    │ eficaz          │      │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘      │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │   Inspeccion    │    │  ExamenMedico   │    │   Simulacro     │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ tipo            │    │ tipo            │    │ tipo            │      │
│  │ fecha           │    │ colaborador_id  │    │ escenario       │      │
│  │ area_id         │    │ fecha           │    │ fecha           │      │
│  │ hallazgos       │    │ resultado       │    │ participantes   │      │
│  │ inspector_id    │    │ restricciones   │    │ evaluacion      │      │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘      │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐                              │
│  │  NoConformidad  │───▶│   PlanAccion    │                              │
│  ├─────────────────┤    ├─────────────────┤                              │
│  │ codigo          │    │ nc_id           │                              │
│  │ descripcion     │    │ accion          │                              │
│  │ origen          │    │ responsable_id  │                              │
│  │ proceso_id      │    │ fecha_limite    │                              │
│  │ clasificacion   │    │ estado          │                              │
│  └─────────────────┘    └─────────────────┘                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Nivel 4: Cadena de Valor

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    NIVEL 4: SUPPLY CHAIN                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │   Proveedor     │◀───│   OrdenCompra   │◀───│   Requisicion   │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ razon_social    │    │ numero          │    │ numero          │      │
│  │ nit             │    │ proveedor_id    │    │ solicitante_id  │      │
│  │ evaluacion      │    │ fecha           │    │ fecha           │      │
│  │ estado          │    │ estado          │    │ estado          │      │
│  └─────────────────┘    │ total           │    │ urgencia        │      │
│                         └─────────────────┘    └─────────────────┘      │
│           │                     │                                        │
│           ▼                     ▼                                        │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │   Producto      │◀───│ DetalleOrden    │    │     Kardex      │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ codigo          │    │ orden_id        │    │ producto_id     │      │
│  │ nombre          │    │ producto_id     │    │ movimiento      │      │
│  │ categoria_id    │    │ cantidad        │    │ cantidad        │      │
│  │ unidad_medida   │    │ precio_unit     │    │ saldo           │      │
│  │ stock_minimo    │    └─────────────────┘    │ costo_promedio  │      │
│  └─────────────────┘                           └─────────────────┘      │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                    NIVEL 4: LOGISTICS FLEET                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │    Vehiculo     │───▶│   Conductor     │    │    Despacho     │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ placa           │    │ colaborador_id  │    │ vehiculo_id     │      │
│  │ tipo            │    │ licencia        │    │ conductor_id    │      │
│  │ modelo          │    │ categoria       │    │ fecha           │      │
│  │ estado          │    │ vencimiento     │    │ destino         │      │
│  │ km_actual       │    │ estado          │    │ estado          │      │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘      │
│           │                                            │                 │
│           ▼                                            ▼                 │
│  ┌─────────────────┐                          ┌─────────────────┐       │
│  │  InspeccionPre  │                          │  GuiaRemision   │       │
│  ├─────────────────┤                          ├─────────────────┤       │
│  │ vehiculo_id     │                          │ despacho_id     │       │
│  │ fecha           │                          │ numero          │       │
│  │ conductor_id    │                          │ destinatario    │       │
│  │ checklist       │                          │ productos       │       │
│  │ resultado       │                          └─────────────────┘       │
│  └─────────────────┘                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Nivel 5: Habilitadores

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    NIVEL 5: TALENT HUB                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │   Colaborador   │◀───│    Contrato     │◀───│    Vacante      │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ user_id         │    │ colaborador_id  │    │ cargo_id        │      │
│  │ cargo_id        │    │ tipo            │    │ area_id         │      │
│  │ area_id         │    │ fecha_inicio    │    │ estado          │      │
│  │ fecha_ingreso   │    │ fecha_fin       │    │ requisitos      │      │
│  │ estado          │    │ salario         │    │ candidatos      │      │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘      │
│           │                                                               │
│           ├───────────────────────┬───────────────────────┐              │
│           ▼                       ▼                       ▼              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │  Capacitacion   │    │ EvalDesempeno   │    │    Asistencia   │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ colaborador_id  │    │ colaborador_id  │    │ colaborador_id  │      │
│  │ curso_id        │    │ periodo         │    │ fecha           │      │
│  │ fecha           │    │ evaluador_id    │    │ hora_entrada    │      │
│  │ calificacion    │    │ calificacion    │    │ hora_salida     │      │
│  │ certificado     │    │ competencias    │    │ tipo            │      │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘      │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐                              │
│  │     Nomina      │───▶│   Liquidacion   │                              │
│  ├─────────────────┤    ├─────────────────┤                              │
│  │ periodo         │    │ nomina_id       │                              │
│  │ fecha_pago      │    │ colaborador_id  │                              │
│  │ estado          │    │ devengado       │                              │
│  │ total           │    │ deducciones     │                              │
│  └─────────────────┘    │ neto_pagar      │                              │
│                         └─────────────────┘                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Nivel 6: Inteligencia

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    NIVEL 6: ANALYTICS                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │  CatalogoKPI    │───▶│    ValorKPI     │───▶│   TendenciaKPI  │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ codigo          │    │ kpi_id          │    │ kpi_id          │      │
│  │ nombre          │    │ periodo         │    │ periodo         │      │
│  │ formula         │    │ valor           │    │ tendencia       │      │
│  │ unidad          │    │ meta            │    │ prediccion      │      │
│  │ perspectiva_bsc │    │ semaforo        │    │ anomalia        │      │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘      │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐                              │
│  │   Dashboard     │───▶│     Widget      │                              │
│  ├─────────────────┤    ├─────────────────┤                              │
│  │ nombre          │    │ dashboard_id    │                              │
│  │ perspectiva     │    │ tipo            │                              │
│  │ usuario_id      │    │ configuracion   │                              │
│  │ es_publico      │    │ posicion        │                              │
│  └─────────────────┘    │ kpis            │                              │
│                         └─────────────────┘                              │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                    NIVEL 6: AUDIT SYSTEM                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
│  │   LogAcceso     │    │    LogCambio    │    │  Notificacion   │      │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤      │
│  │ usuario_id      │    │ usuario_id      │    │ tipo            │      │
│  │ fecha           │    │ fecha           │    │ titulo          │      │
│  │ accion          │    │ modelo          │    │ mensaje         │      │
│  │ ip_address      │    │ objeto_id       │    │ destinatario_id │      │
│  │ user_agent      │    │ cambios         │    │ leida           │      │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘      │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐                              │
│  │     Tarea       │    │   Recordatorio  │                              │
│  ├─────────────────┤    ├─────────────────┤                              │
│  │ titulo          │    │ titulo          │                              │
│  │ descripcion     │    │ fecha_hora      │                              │
│  │ asignado_a_id   │    │ usuario_id      │                              │
│  │ fecha_limite    │    │ repetir         │                              │
│  │ estado          │    │ content_type    │                              │
│  │ prioridad       │    │ object_id       │                              │
│  └─────────────────┘    └─────────────────┘                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Relaciones Clave Entre Niveles

```
User (N0) ◀──────┬───────────────────────────────────────────────────────┐
                 │                                                        │
                 ├──▶ Colaborador (N5) ◀── Cargo (N1)                    │
                 │         │                   │                          │
                 │         ├──▶ Accidente (N3) │                          │
                 │         ├──▶ Capacitacion   │                          │
                 │         └──▶ Asistencia     │                          │
                 │                             │                          │
                 ├──▶ Area (N1) ◀─────────────┘                          │
                 │         │                                              │
                 │         ├──▶ Riesgo (N2)                              │
                 │         ├──▶ Inspeccion (N3)                          │
                 │         └──▶ NoConformidad (N3)                       │
                 │                                                        │
                 ├──▶ Documento (N1) ◀── Workflow (N2)                   │
                 │                                                        │
                 └──▶ LogAcceso (N6)                                     │
                     LogCambio (N6)                                       │
                     Notificacion (N6)                                    │
```

---

## Referencias

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Arquitectura general
- [DATABASE-ARCHITECTURE.md](DATABASE-ARCHITECTURE.md) - Arquitectura de BD
- [CATALOGO-MODULOS.md](CATALOGO-MODULOS.md) - Catálogo de módulos
