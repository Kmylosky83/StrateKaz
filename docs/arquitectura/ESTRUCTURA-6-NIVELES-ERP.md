# Estructura de 6 Niveles del ERP - Referencia para Sidebar

## Arquitectura Jerárquica del Sistema

El ERP está organizado en **6 niveles estratégicos** según la Pirámide de Gestión Empresarial. Esta estructura se refleja en el Sidebar dinámico del frontend.

---

## NIVEL 1: ESTRATÉGICO (Dirección)

**Color:** `purple`
**Icono:** `Target`

### Módulo: Dirección Estratégica (GESTION_ESTRATEGICA)

**Código:** `GESTION_ESTRATEGICA`
**Ruta:** `/direccion-estrategica`

#### Tabs (6):

1. **Identidad Corporativa** (`identidad`)
   - Misión, Visión, Valores
   - Política Integral
   - Mapa de Procesos
   - Organigrama
   - Icono: `Building2`

2. **Planeación Estratégica** (`planeacion`)
   - Análisis de Contexto (PESTEL, 5 Fuerzas)
   - Matriz DOFA
   - Estrategias TOWS
   - Objetivos Estratégicos (BSC)
   - Proyectos Estratégicos
   - Icono: `Target`

3. **Gestión de Proyectos** (`proyectos`)
   - Proyectos
   - Hitos y Entregables
   - Recursos y Presupuesto
   - Seguimiento
   - Icono: `Briefcase`

4. **Revisión por la Dirección** (`revision`)
   - Programación de Revisiones
   - Actas
   - Seguimiento de Decisiones
   - Eficacia del Sistema
   - Icono: `FileCheck`

5. **Organización** (`organizacion`)
   - Áreas
   - Cargos
   - Manuales de Funciones
   - Estructura Organizacional
   - Icono: `Network`

6. **Configuración** (`configuracion`)
   - Datos de Empresa
   - Sedes
   - Módulos del Sistema
   - Branding
   - Integraciones
   - Icono: `Settings`

---

## NIVEL 2: CUMPLIMIENTO Y CONTROL (Governance)

**Color:** `orange`

### 2.1 Motor de Cumplimiento (MOTOR_CUMPLIMIENTO)

**Código:** `MOTOR_CUMPLIMIENTO`
**Ruta:** `/cumplimiento`
**Icono:** `ShieldCheck`

#### Tabs (4):

1. **Normas Legales** (`normas`)
   - Biblioteca de Normas
   - Matriz de Requisitos Legales
   - Evaluación de Cumplimiento
   - Icono: `FileText`

2. **Requisitos Aplicables** (`requisitos`)
   - Licencias y Permisos
   - Certificaciones
   - Alertas de Vencimiento
   - Icono: `FileCheck`

3. **Partes Interesadas** (`partes-interesadas`)
   - Identificación
   - Requisitos y Expectativas
   - Comunicación
   - Icono: `Users`

4. **Reglamentos Internos** (`reglamentos`)
   - Reglamento de Trabajo
   - Políticas
   - Procedimientos
   - Icono: `BookOpen`

### 2.2 Motor de Riesgos (MOTOR_RIESGOS)

**Código:** `MOTOR_RIESGOS`
**Ruta:** `/riesgos`
**Icono:** `AlertTriangle`

#### Tabs (7):

1. **Contexto Organizacional** (`contexto`)
   - PCI (Perfil de Capacidad Interna)
   - POAM (Perfil de Oportunidades y Amenazas)
   - PESTEL
   - 5 Fuerzas de Porter
   - Icono: `Radar`

2. **Matriz de Riesgos** (`matriz`)
   - Identificación de Riesgos
   - Valoración (Inherente/Residual)
   - Mapa de Calor
   - Icono: `TrendingDown`

3. **Controles Operacionales** (`controles`)
   - Controles Preventivos
   - Controles Detectivos
   - Controles Correctivos
   - Efectividad
   - Icono: `Shield`

4. **IPEVR (GTC-45)** (`ipevr`)
   - Matriz de Peligros y Riesgos
   - Valoración GTC-45
   - Controles SST
   - Icono: `AlertOctagon`

5. **Aspectos Ambientales** (`ambiental`)
   - Identificación de Aspectos
   - Evaluación de Impactos
   - Significancia Ambiental
   - Icono: `Leaf`

6. **Tratamiento de Riesgos** (`tratamiento`)
   - Planes de Tratamiento
   - Seguimiento
   - Indicadores de Gestión
   - Icono: `ClipboardCheck`

7. **Dashboard de Riesgos** (`dashboard`)
   - KPIs
   - Gráficos
   - Tendencias
   - Icono: `BarChart3`

### 2.3 Motor de Flujos (WORKFLOW_ENGINE)

**Código:** `WORKFLOW_ENGINE`
**Ruta:** `/flujos`
**Icono:** `GitBranch`

#### Tabs (3):

1. **Plantillas de Flujo** (`plantillas`)
   - Diseñador de Workflows
   - Aprobaciones
   - Automatizaciones
   - Icono: `Workflow`

2. **Mis Tareas** (`tareas`)
   - Tareas Pendientes
   - Tareas Asignadas
   - Tareas Completadas
   - Icono: `CheckSquare`

3. **Notificaciones** (`notificaciones`)
   - Alertas del Sistema
   - Recordatorios
   - Configuración
   - Icono: `Bell`

---

## NIVEL 3: TORRE DE CONTROL (HSEQ)

**Color:** `blue`

### Gestión HSEQ (HSEQ_MANAGEMENT)

**Código:** `HSEQ_MANAGEMENT`
**Ruta:** `/hseq`
**Icono:** `Shield`

#### Tabs (11):

1. **Documentos** (`documentos`)
   - Control de Documentos
   - Versionamiento
   - Distribución
   - Icono: `FileText`

2. **Formularios Dinámicos** (`formularios`)
   - Diseñador de Formularios
   - Formularios Diligenciados
   - Reportes
   - Icono: `FileInput`

3. **No Conformidades** (`nc`)
   - Reporte de NC
   - Clasificación
   - Seguimiento
   - Icono: `AlertCircle`

4. **Acciones Correctivas** (`acciones`)
   - Plan de Acción
   - 5 Porqués
   - Ishikawa
   - Verificación de Eficacia
   - Icono: `Tool`

5. **Auditorías** (`auditorias`)
   - Programación
   - Listas de Chequeo
   - Hallazgos
   - Informes
   - Icono: `Search`

6. **Inspecciones** (`inspecciones`)
   - Inspecciones Planeadas
   - Reportes de Campo
   - Seguimiento
   - Icono: `Eye`

7. **Accidentes e Incidentes** (`accidentes`)
   - Reporte de Accidentes
   - Investigación
   - Estadísticas
   - Indicadores (IF, IS, ILI)
   - Icono: `AlertTriangle`

8. **Comités** (`comites`)
   - COPASST
   - Convivencia
   - Otros Comités
   - Actas
   - Icono: `Users`

9. **Plan de Emergencias** (`emergencias`)
   - Brigadas
   - Simulacros
   - Plan de Evacuación
   - Icono: `Siren`

10. **Capacitaciones** (`capacitaciones`)
    - Programación
    - Registro de Asistencia
    - Evaluaciones
    - Icono: `GraduationCap`

11. **Entrega de EPP** (`epp`)
    - Inventario de EPP
    - Entregas
    - Reposiciones
    - Icono: `HardHat`

---

## NIVEL 4: CADENA DE VALOR (Operaciones)

**Color:** `green`

### 4.1 Cadena de Suministro (SUPPLY_CHAIN)

**Código:** `SUPPLY_CHAIN`
**Ruta:** `/suministro`
**Icono:** `Package`

#### Tabs (5):

1. **Proveedores** (`proveedores`)
   - Gestión de Proveedores
   - Evaluación
   - Homologación
   - Icono: `Users`

2. **Compras** (`compras`)
   - Solicitudes
   - Órdenes de Compra
   - Recepción
   - Icono: `ShoppingCart`

3. **Inventarios** (`inventarios`)
   - Control de Stock
   - Kardex
   - Ajustes
   - Icono: `Package`

4. **Almacenes** (`almacenes`)
   - Ubicaciones
   - Movimientos
   - Transferencias
   - Icono: `Warehouse`

5. **Planificación** (`planificacion`)
   - Pronósticos
   - Plan de Abastecimiento
   - Icono: `Calendar`

### 4.2 Operaciones y Producción (PRODUCTION_OPS)

**Código:** `PRODUCTION_OPS`
**Ruta:** `/produccion`
**Icono:** `Cog`

#### Tabs (4):

1. **Órdenes de Producción** (`ordenes`)
   - Planificación
   - Ejecución
   - Control
   - Icono: `ClipboardList`

2. **Control de Calidad** (`calidad`)
   - Inspecciones
   - No Conformes
   - Liberación
   - Icono: `CheckCircle`

3. **Mantenimiento** (`mantenimiento`)
   - Preventivo
   - Correctivo
   - Predictivo
   - Icono: `Wrench`

4. **Trazabilidad** (`trazabilidad`)
   - Lotes
   - Seguimiento
   - Retiros (Recall)
   - Icono: `GitCommit`

### 4.3 Logística y Flota (LOGISTICS_FLEET)

**Código:** `LOGISTICS_FLEET`
**Ruta:** `/logistica`
**Icono:** `Truck`

#### Tabs (4):

1. **Vehículos** (`vehiculos`)
   - Flota
   - Documentación
   - Mantenimiento
   - Icono: `Truck`

2. **Conductores** (`conductores`)
   - Gestión de Conductores
   - Licencias
   - Capacitaciones
   - Icono: `UserCheck`

3. **Rutas** (`rutas`)
   - Programación
   - Optimización
   - Seguimiento GPS
   - Icono: `Route`

4. **PESV** (`pesv`)
   - Plan Estratégico de Seguridad Vial
   - Inspecciones Preoperacionales
   - Icono: `ShieldCheck`

### 4.4 Ventas y CRM (SALES_CRM)

**Código:** `SALES_CRM`
**Ruta:** `/ventas`
**Icono:** `TrendingUp`

#### Tabs (4):

1. **Clientes** (`clientes`)
   - Gestión de Clientes
   - Segmentación
   - Historial
   - Icono: `Users`

2. **Cotizaciones** (`cotizaciones`)
   - Crear Cotizaciones
   - Seguimiento
   - Conversión
   - Icono: `FileText`

3. **Pedidos** (`pedidos`)
   - Órdenes de Venta
   - Despachos
   - Facturación
   - Icono: `ShoppingBag`

4. **Postventa** (`postventa`)
   - PQR
   - Encuestas de Satisfacción
   - Fidelización
   - Icono: `Star`

---

## NIVEL 5: HABILITADORES (Soporte)

**Color:** `gray`

### 5.1 Centro de Talento (TALENT_HUB)

**Código:** `TALENT_HUB`
**Ruta:** `/talento`
**Icono:** `Users2`

#### Tabs (11):

1. **Colaboradores** (`colaboradores`)
   - Gestión de Personal
   - Hojas de Vida
   - Documentos
   - Icono: `User`

2. **Selección** (`seleccion`)
   - Reclutamiento
   - Entrevistas
   - Contratación
   - Icono: `UserPlus`

3. **Nómina** (`nomina`)
   - Liquidaciones
   - Deducciones
   - Prestaciones
   - Icono: `DollarSign`

4. **Capacitación** (`capacitacion`)
   - Plan de Capacitación
   - Registro
   - Evaluación
   - Icono: `BookOpen`

5. **Evaluación de Desempeño** (`desempeno`)
   - Evaluaciones
   - Planes de Mejora
   - Icono: `BarChart`

6. **Clima Laboral** (`clima`)
   - Encuestas
   - Análisis
   - Planes de Acción
   - Icono: `Smile`

7. **Bienestar** (`bienestar`)
   - Programas
   - Actividades
   - Beneficios
   - Icono: `Heart`

8. **Medicina Laboral** (`medicina`)
   - Exámenes Médicos
   - Restricciones
   - Seguimiento
   - Icono: `Stethoscope`

9. **Dotación** (`dotacion`)
   - Entregas de Dotación
   - Tallas
   - Reposiciones
   - Icono: `ShoppingBag`

10. **Disciplinario** (`disciplinario`)
    - Sanciones
    - Procesos
    - Historial
    - Icono: `Gavel`

11. **Retiro** (`retiro`)
    - Liquidaciones
    - Paz y Salvo
    - Entrevistas de Salida
    - Icono: `LogOut`

### 5.2 Administración y Finanzas (ADMIN_FINANCE)

**Código:** `ADMIN_FINANCE`
**Ruta:** `/admin-finanzas`
**Icono:** `Wallet`

#### Tabs (4):

1. **Presupuesto** (`presupuesto`)
   - Planeación Presupuestal
   - Ejecución
   - Control
   - Icono: `PieChart`

2. **Flujo de Caja** (`flujo`)
   - Proyección
   - Ingresos
   - Egresos
   - Icono: `TrendingUp`

3. **Tesorería** (`tesoreria`)
   - Cuentas Bancarias
   - Conciliaciones
   - Pagos
   - Icono: `Landmark`

4. **Activos Fijos** (`activos`)
   - Registro
   - Depreciación
   - Mantenimiento
   - Icono: `Building`

### 5.3 Contabilidad (ACCOUNTING) - Módulo Activable

**Código:** `ACCOUNTING`
**Ruta:** `/contabilidad`
**Icono:** `Calculator`
**Nota:** Módulo opcional que se activa según licencia

#### Tabs (4):

1. **Plan de Cuentas** (`plan-cuentas`)
   - PUC Colombia
   - Personalización
   - Icono: `List`

2. **Comprobantes** (`comprobantes`)
   - Registro Contable
   - Comprobantes de Egreso/Ingreso
   - Notas Contables
   - Icono: `Receipt`

3. **Informes Financieros** (`informes`)
   - Balance General
   - Estado de Resultados
   - Flujo de Efectivo
   - Icono: `FileBarChart`

4. **Impuestos** (`impuestos`)
   - IVA
   - Retenciones
   - Declaraciones
   - Icono: `Percent`

---

## NIVEL 6: INTELIGENCIA (Analytics)

**Color:** `purple`

### 6.1 Analítica (ANALYTICS)

**Código:** `ANALYTICS`
**Ruta:** `/analitica`
**Icono:** `BarChart4`

#### Tabs (7):

1. **Dashboard Ejecutivo** (`dashboard`)
   - KPIs Generales
   - Balanced Scorecard
   - Semáforos
   - Icono: `LayoutDashboard`

2. **Indicadores de Gestión** (`indicadores`)
   - Definición de KPIs
   - Metas
   - Seguimiento
   - Icono: `Target`

3. **Reportes Operacionales** (`reportes`)
   - Generador de Reportes
   - Plantillas
   - Exportación
   - Icono: `FileOutput`

4. **Análisis de Tendencias** (`tendencias`)
   - Series de Tiempo
   - Proyecciones
   - Icono: `TrendingUp`

5. **Tableros Personalizados** (`tableros`)
   - Diseñador de Dashboards
   - Widgets
   - Icono: `Layout`

6. **Data Mining** (`mining`)
   - Patrones
   - Correlaciones
   - Insights
   - Icono: `Database`

7. **Exportación de Datos** (`exportacion`)
   - Excel
   - PDF
   - API
   - Icono: `Download`

### 6.2 Sistema de Auditoría (AUDIT_SYSTEM)

**Código:** `AUDIT_SYSTEM`
**Ruta:** `/auditoria-sistema`
**Icono:** `FileSearch`

#### Tabs (4):

1. **Logs de Actividad** (`logs`)
   - Registro de Cambios
   - Trazabilidad
   - Búsqueda Avanzada
   - Icono: `FileText`

2. **Auditoría de Acceso** (`acceso`)
   - Inicios de Sesión
   - Intentos Fallidos
   - Sesiones Activas
   - Icono: `Lock`

3. **Cambios en Datos** (`cambios`)
   - Quién cambió qué
   - Antes/Después
   - Reversión
   - Icono: `GitCompare`

4. **Reportes de Auditoría** (`reportes`)
   - Informes de Cumplimiento
   - Exportación
   - Icono: `FileCheck`

---

## Implementación en el Backend

### Estructura de Datos

```python
# backend/apps/core/fixtures/system_modules.json

{
  "modules": [
    {
      "code": "NIVEL_1_ESTRATEGICO",
      "name": "NIVEL 1: ESTRATÉGICO",
      "is_category": true,
      "icon": "Layers",
      "color": "purple",
      "order": 1,
      "children": [
        {
          "code": "GESTION_ESTRATEGICA",
          "name": "Dirección Estratégica",
          "icon": "Target",
          "route": "/direccion-estrategica",
          "color": "purple",
          "order": 1,
          "tabs": [
            {
              "code": "IDENTIDAD",
              "name": "Identidad Corporativa",
              "icon": "Building2",
              "route": "/direccion-estrategica/identidad",
              "order": 1
            },
            {
              "code": "PLANEACION",
              "name": "Planeación Estratégica",
              "icon": "Target",
              "route": "/direccion-estrategica/planeacion",
              "order": 2
            }
            // ... más tabs
          ]
        }
      ]
    },
    {
      "code": "NIVEL_2_CUMPLIMIENTO",
      "name": "NIVEL 2: CUMPLIMIENTO Y CONTROL",
      "is_category": true,
      "icon": "Shield",
      "color": "orange",
      "order": 2,
      "children": [
        {
          "code": "MOTOR_CUMPLIMIENTO",
          "name": "Cumplimiento",
          "icon": "ShieldCheck",
          "route": "/cumplimiento",
          "color": "orange",
          "order": 1,
          "tabs": [...]
        },
        {
          "code": "MOTOR_RIESGOS",
          "name": "Riesgos",
          "icon": "AlertTriangle",
          "route": "/riesgos",
          "color": "orange",
          "order": 2,
          "tabs": [...]
        },
        {
          "code": "WORKFLOW_ENGINE",
          "name": "Flujos de Trabajo",
          "icon": "GitBranch",
          "route": "/flujos",
          "color": "orange",
          "order": 3,
          "tabs": [...]
        }
      ]
    }
    // ... más niveles
  ]
}
```

### Vista del Backend

```python
# backend/apps/core/views/modules.py

from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def sidebar_modules(request):
    """
    Retorna la estructura de módulos habilitados para el sidebar
    con jerarquía de 6 niveles
    """

    # Obtener módulos habilitados para la empresa actual
    empresa_id = request.user.empresa_actual_id

    modules = SystemModule.objects.filter(
        empresa_modulo__empresa_id=empresa_id,
        empresa_modulo__activo=True,
        is_enabled=True
    ).prefetch_related('tabs__sections')

    # Construir estructura jerárquica
    tree = build_hierarchy_tree(modules)

    return Response(tree)
```

---

## Renderizado en el Sidebar

El componente `Sidebar.tsx` actual ya soporta esta estructura jerárquica. Solo necesita que el backend retorne los datos en el formato correcto:

```typescript
interface SidebarModule {
  code: string;
  name: string;
  icon: string;
  color?: 'purple' | 'blue' | 'green' | 'orange' | 'gray';
  route?: string;
  is_category: boolean;
  children?: SidebarModule[];
}
```

### Ejemplo de Renderizado

```
📊 NIVEL 1: ESTRATÉGICO
  └─ 🎯 Dirección Estratégica
      ├─ Identidad Corporativa
      ├─ Planeación Estratégica
      ├─ Gestión de Proyectos
      ├─ Revisión por la Dirección
      ├─ Organización
      └─ Configuración

🛡️ NIVEL 2: CUMPLIMIENTO Y CONTROL
  ├─ ✅ Cumplimiento
  │   ├─ Normas Legales
  │   ├─ Requisitos Aplicables
  │   ├─ Partes Interesadas
  │   └─ Reglamentos Internos
  ├─ ⚠️ Riesgos
  │   ├─ Contexto Organizacional
  │   ├─ Matriz de Riesgos
  │   └─ ...
  └─ 🔀 Flujos de Trabajo
      └─ ...
```

---

## Próximos Pasos

1. **Backend**: Crear fixture con la estructura completa de módulos
2. **Backend**: Implementar endpoints que retornen la jerarquía
3. **Frontend**: El Sidebar actual ya soporta la estructura
4. **Testing**: Verificar que todos los niveles se rendericen correctamente

---

**Fecha de actualización:** 2024-12-23
**Versión:** 1.0
