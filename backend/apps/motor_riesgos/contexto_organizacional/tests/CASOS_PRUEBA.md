# Casos de Prueba - Contexto Organizacional

Documentación detallada de casos de prueba para el módulo de Contexto Organizacional.

## Índice

1. [Análisis DOFA](#análisis-dofa)
2. [Estrategias TOWS](#estrategias-tows)
3. [Análisis PESTEL](#análisis-pestel)
4. [5 Fuerzas de Porter](#5-fuerzas-de-porter)
5. [Casos de Uso Completos](#casos-de-uso-completos)

---

## Análisis DOFA

### Caso 1: Crear Análisis DOFA Trimestral

**Objetivo**: Crear un análisis DOFA completo para el primer trimestre de 2025.

**Precondiciones**:
- Usuario autenticado con permisos
- Empresa configurada

**Pasos**:
1. Crear AnalisisDOFA con periodo "2025-Q1"
2. Agregar 3 Fortalezas
3. Agregar 3 Debilidades
4. Agregar 3 Oportunidades
5. Agregar 3 Amenazas
6. Agregar observaciones generales
7. Aprobar el análisis

**Resultado Esperado**:
- Análisis creado con 12 factores
- Estado cambiado a "aprobado"
- Fecha de aprobación registrada

**Test Relacionado**: `test_analisis_dofa_con_aprobacion`

---

### Caso 2: Análisis DOFA con Impacto Alto

**Objetivo**: Identificar y priorizar factores de alto impacto.

**Escenario**:
```python
# Fortalezas de alto impacto
F1: "Equipo técnico certificado ISO 9001" - Impacto: Alto
F2: "Tecnología de punta en producción" - Impacto: Alto

# Amenazas de alto impacto
A1: "Competidores con economías de escala" - Impacto: Alto
A2: "Cambios regulatorios ambientales" - Impacto: Alto
```

**Validación**:
- Todos los factores deben tener nivel de impacto especificado
- Factores de alto impacto priorizados en estrategias

**Test Relacionado**: `test_crear_fortaleza`, `test_crear_amenaza`

---

## Estrategias TOWS

### Caso 3: Generar Estrategias FO (Ofensivas)

**Objetivo**: Crear estrategias que aprovechen fortalezas para capitalizar oportunidades.

**Ejemplo**:

**Fortaleza**: Equipo técnico altamente capacitado
**Oportunidad**: Creciente demanda de productos sostenibles
**Estrategia FO**: "Desarrollar línea premium de productos ecológicos"

**Métricas**:
- Prioridad: Alta
- Fecha límite: 12 meses
- Recursos: $50M, 5 especialistas
- Indicador: 15% market share en productos verdes

**Test Relacionado**: `test_crear_estrategia_fo`

---

### Caso 4: Estrategias DA (Supervivencia)

**Objetivo**: Minimizar debilidades y evitar amenazas.

**Ejemplo**:

**Debilidad**: Infraestructura tecnológica obsoleta
**Amenaza**: Competidores con sistemas integrados
**Estrategia DA**: "Modernización acelerada de IT y migración cloud"

**Características**:
- Tipo: DA (supervivencia)
- Prioridad: Alta (crítico)
- Estado: En ejecución
- Progreso: 25%

**Test Relacionado**: `test_crear_estrategia_da`, `test_estrategia_transicion_estados`

---

### Caso 5: Seguimiento de Estrategias

**Objetivo**: Monitorear progreso de implementación de estrategias.

**Flujo**:
1. Estrategia creada → Estado: "propuesta", Progreso: 0%
2. Estrategia aprobada → Estado: "aprobada", Progreso: 0%
3. Inicio ejecución → Estado: "en_ejecucion", Progreso: 25%
4. Avance → Estado: "en_ejecucion", Progreso: 50%
5. Finalización → Estado: "completada", Progreso: 100%

**Validaciones**:
- Progreso entre 0-100%
- Estados válidos según workflow
- Fechas límite coherentes

**Test Relacionado**: `test_estrategia_transicion_estados`, `test_actualizar_progreso_estrategia`

---

## Análisis PESTEL

### Caso 6: Análisis PESTEL Completo

**Objetivo**: Analizar los 6 factores externos que afectan a la organización.

**Factores a Evaluar**:

1. **Político (P)**
   - Estabilidad gubernamental
   - Políticas de incentivos industriales
   - Regulaciones comerciales

2. **Económico (E)**
   - Tasas de interés
   - Inflación
   - Tipo de cambio
   - Crecimiento PIB

3. **Social (S)**
   - Cambios demográficos
   - Preferencias del consumidor
   - Tendencias culturales

4. **Tecnológico (T)**
   - Automatización
   - Digitalización
   - I+D sector

5. **Ecológico (E)**
   - Normativa ambiental
   - Sostenibilidad
   - Huella de carbono

6. **Legal (L)**
   - Ley laboral
   - Normativa tributaria
   - Protección de datos

**Resultado Esperado**:
- 6 factores creados (uno por dimensión mínimo)
- Cada factor con tendencia, impacto y probabilidad
- Conclusiones generales del entorno

**Test Relacionado**: `test_factores_pestel_completos`

---

### Caso 7: Factor PESTEL de Alto Riesgo

**Objetivo**: Identificar factores externos de alto impacto y alta probabilidad.

**Ejemplo**:

```python
Factor: "Nueva normativa ambiental de residuos industriales"
Tipo: Legal
Tendencia: Empeorando (más restrictiva)
Impacto: Alto
Probabilidad: Alta
Implicaciones: "Requiere inversión $30M en planta de tratamiento"
Fuentes: "MinAmbiente Resolución 2184/2023"
```

**Acción Requerida**:
- Estrategia de adaptación en DOFA
- Presupuesto de inversión
- Plan de cumplimiento

**Test Relacionado**: `test_crear_factor_legal`, `test_filtrar_factores_por_impacto_y_probabilidad`

---

## 5 Fuerzas de Porter

### Caso 8: Análisis de Rivalidad Competitiva

**Objetivo**: Evaluar la intensidad de la competencia en el sector.

**Factores de Rivalidad**:
```python
[
    "15 competidores principales en el mercado",
    "Productos altamente commoditizados",
    "Bajas barreras de salida",
    "Crecimiento lento del sector (2% anual)",
    "Alta capacidad instalada (85% utilización)"
]
```

**Nivel**: Alto (desfavorable)

**Implicaciones Estratégicas**:
- Necesidad de diferenciación
- Competencia por precio
- Innovación en producto/servicio

**Test Relacionado**: `test_crear_fuerza_rivalidad`

---

### Caso 9: Análisis de Poder de Negociación

**Objetivo**: Evaluar poder de proveedores y clientes.

**Proveedores**:
- Nivel: Bajo
- Factores: Múltiples opciones, materia prima estándar
- Estrategia: Negociación de volumen

**Clientes**:
- Nivel: Alto
- Factores: Concentración (5 clientes = 70% ventas)
- Estrategia: Diversificación de cartera

**Test Relacionado**: `test_crear_fuerza_poder_proveedores`, `test_crear_fuerza_poder_clientes`

---

### Caso 10: Matriz Completa Porter

**Objetivo**: Crear análisis completo de las 5 fuerzas para un periodo.

**Resultado Esperado**:

| Fuerza | Nivel | Implicación |
|--------|-------|-------------|
| Rivalidad | Alto | Diferenciación necesaria |
| Nuevos Entrantes | Medio | Mantener barreras |
| Sustitutos | Bajo | Posición defendible |
| Poder Proveedores | Bajo | Oportunidad negociación |
| Poder Clientes | Alto | Diversificar cartera |

**Conclusión**:
- Sector competitivo pero defendible
- Foco en diferenciación y diversificación

**Test Relacionado**: `test_cinco_fuerzas_completas`

---

## Casos de Uso Completos

### Caso 11: Planeación Estratégica Anual

**Objetivo**: Realizar análisis estratégico completo para planeación anual.

**Secuencia**:

1. **Mes 1-2: Análisis de Contexto**
   - Crear AnalisisPESTEL
   - Identificar factores externos (mínimo 2 por dimensión)
   - Crear análisis FuerzaPorter (5 fuerzas)
   - Documentar conclusiones

2. **Mes 3: Análisis DOFA**
   - Crear AnalisisDOFA
   - Identificar factores internos (3-5 por cuadrante)
   - Validar con evidencias
   - Aprobar análisis

3. **Mes 4: Formulación Estratégica**
   - Generar estrategias TOWS
   - Definir objetivos SMART
   - Asignar responsables
   - Establecer indicadores

4. **Mes 5-12: Ejecución y Seguimiento**
   - Actualizar progreso mensual
   - Ajustar estrategias según contexto
   - Medir indicadores

**Entregables**:
- 1 Análisis PESTEL aprobado
- 5 Fuerzas de Porter documentadas
- 1 Análisis DOFA con 12-20 factores
- 8-12 Estrategias TOWS priorizadas

---

### Caso 12: Respuesta a Crisis Sectorial

**Objetivo**: Ajustar estrategia ante cambio drástico en el entorno.

**Escenario**:
Entrada inesperada de competidor internacional con precios 30% menores.

**Análisis de Impacto**:

1. **Actualizar PESTEL**:
   - Factor Económico: Presión deflacionaria
   - Factor Competitivo: Nueva amenaza

2. **Revisar Porter**:
   - Rivalidad: Aumenta de Medio → Alto
   - Nuevos entrantes: Materializada la amenaza

3. **Ajustar DOFA**:
   - Nueva Amenaza: "Competidor con economías escala"
   - Nueva Debilidad: "Estructura costos no competitiva"

4. **Estrategias Emergentes**:
   - DA: Optimización de costos (prioridad alta)
   - FA: Diferenciación por calidad/servicio
   - DO: Modernización tecnológica

**Timeline**: 30 días para análisis y formulación, 90 días implementación inicial.

---

### Caso 13: Multi-Tenancy y Aislamiento

**Objetivo**: Verificar que empresas no acceden a datos de otras.

**Escenario**:
- Empresa A: "Grasas y Huesos del Norte"
- Empresa B: "Competidor S.A."

**Validaciones**:
1. Usuario de Empresa A solo ve análisis de Empresa A
2. Usuario de Empresa A no puede modificar análisis de Empresa B
3. Análisis DOFA filtrados por empresa automáticamente
4. FuerzaPorter con constraint unicidad por empresa-tipo-periodo

**Test Relacionado**: `test_analisis_dofa_filtro_por_empresa`, `test_usuario_solo_ve_su_empresa`

---

### Caso 14: Workflow de Aprobación

**Objetivo**: Implementar proceso de aprobación de análisis.

**Roles**:
- Analista: Crea análisis (estado: borrador)
- Coordinador: Revisa análisis (estado: en_revision)
- Director: Aprueba análisis (estado: aprobado)

**Flujo**:
```
[Borrador] → [En Revisión] → [Aprobado] → [Vigente] → [Archivado]
    ↓            ↓              ↓
  Analista   Coordinador    Director
```

**Validaciones**:
- Solo Director puede aprobar
- Análisis aprobado incluye aprobador y fecha
- No se puede editar análisis aprobado

**Test Relacionado**: `test_analisis_dofa_con_aprobacion`

---

## Matriz de Trazabilidad

| Requisito | Caso de Prueba | Test Automatizado | Estado |
|-----------|----------------|-------------------|--------|
| REQ-001: Crear DOFA | Caso 1 | test_crear_analisis_dofa_basico | ✓ |
| REQ-002: Factores DOFA | Caso 2 | test_crear_fortaleza, test_crear_amenaza | ✓ |
| REQ-003: Estrategias FO | Caso 3 | test_crear_estrategia_fo | ✓ |
| REQ-004: Estrategias DA | Caso 4 | test_crear_estrategia_da | ✓ |
| REQ-005: Seguimiento | Caso 5 | test_estrategia_transicion_estados | ✓ |
| REQ-006: PESTEL Completo | Caso 6 | test_factores_pestel_completos | ✓ |
| REQ-007: PESTEL Alto Riesgo | Caso 7 | test_crear_factor_legal | ✓ |
| REQ-008: Porter Rivalidad | Caso 8 | test_crear_fuerza_rivalidad | ✓ |
| REQ-009: Porter Poder Negoc. | Caso 9 | test_crear_fuerza_poder_* | ✓ |
| REQ-010: Porter Completo | Caso 10 | test_cinco_fuerzas_completas | ✓ |
| REQ-011: Planeación Anual | Caso 11 | Múltiples tests integración | ✓ |
| REQ-012: Crisis Sectorial | Caso 12 | Tests de actualización | ✓ |
| REQ-013: Multi-Tenancy | Caso 13 | test_usuario_solo_ve_su_empresa | ✓ |
| REQ-014: Workflow Aprobación | Caso 14 | test_analisis_dofa_con_aprobacion | ✓ |

---

## Datos de Prueba Recomendados

### Ejemplo Real: Grasas y Huesos del Norte

#### Fortalezas
1. Planta con certificación ISO 9001:2015
2. 25 años de experiencia en el sector
3. Relaciones comerciales sólidas con 50+ clientes
4. Ubicación estratégica cerca de proveedores

#### Debilidades
1. Dependencia de 3 clientes principales (60% ventas)
2. Tecnología de producción con 10 años antigüedad
3. Equipo comercial reducido (3 personas)
4. Sistema de gestión no integrado

#### Oportunidades
1. Demanda creciente productos sostenibles (+35% anual)
2. Tratados comerciales con países vecinos
3. Programas gubernamentales de financiación verde
4. Digitalización del sector industrial

#### Amenazas
1. Entrada competidores internacionales
2. Volatilidad precio materias primas
3. Regulación ambiental más estricta
4. Recesión económica sectorial

---

## Ejecución de Casos de Prueba

### Manual
1. Crear análisis según caso de prueba
2. Verificar resultado esperado
3. Documentar hallazgos

### Automatizada
```bash
# Ejecutar test específico
pytest test_models.py::TestAnalisisDOFA::test_crear_analisis_dofa_basico -v

# Ejecutar suite completa
pytest test_models.py -v
```

---

**Última actualización**: 2025-12-26
**Autor**: Sistema ERP StrateKaz - QA Team
**Versión**: 1.0.0
