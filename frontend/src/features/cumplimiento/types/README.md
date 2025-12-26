# Tipos TypeScript - Módulo Cumplimiento

Este directorio contiene las definiciones de tipos TypeScript para el módulo Motor de Cumplimiento, que coinciden exactamente con los serializers del backend Django.

## Principios de Diseño

### 1. Enums en Minúsculas
Todos los enums están en **minúsculas** para coincidir exactamente con el backend Django:

```typescript
// ✅ CORRECTO
type EstadoRequisito = 'vigente' | 'vencido' | 'en_tramite';

// ❌ INCORRECTO
type EstadoRequisito = 'VIGENTE' | 'VENCIDO' | 'EN_TRAMITE';
```

### 2. Nombres de Campos Exactos
Los nombres de campos coinciden exactamente con el backend (snake_case):

```typescript
interface EmpresaNorma {
  porcentaje_cumplimiento: number;  // ✅ snake_case
  fecha_evaluacion: string;         // ✅ snake_case
}
```

### 3. Campos Opcionales
Los campos opcionales están marcados con `?` o `| null`:

```typescript
interface NormaLegal {
  fecha_vigencia?: string | null;
  resumen?: string | null;
}
```

### 4. Fechas como Strings
Las fechas se representan como strings en formato ISO:

```typescript
interface EmpresaNorma {
  fecha_evaluacion?: string | null;  // ISO date: "2025-01-15"
  created_at: string;                // ISO datetime: "2025-01-15T10:30:00Z"
}
```

## Estructura de Archivos

```
types/
├── index.ts                    # Barrel export - punto de entrada principal
├── matrizLegal.ts             # Matriz Legal (TipoNorma, NormaLegal, EmpresaNorma)
├── requisitosLegales.ts       # Requisitos Legales (Licencias, Permisos, Alertas)
├── partesInteresadas.ts       # Partes Interesadas (PI, Requisitos PI, Matriz Comunicación)
├── reglamentos.ts             # Reglamentos Internos (Versiones, Publicaciones, Socializaciones)
└── README.md                  # Esta documentación
```

## Uso

### Importación desde el Barrel

```typescript
// Importar desde el punto de entrada principal
import {
  NormaLegal,
  EmpresaNorma,
  CUMPLIMIENTO_CHOICES,
  EstadoRequisito,
  ParteInteresada,
  Reglamento,
} from '@/features/cumplimiento/types';
```

### Importación Específica

```typescript
// Importar desde archivos específicos
import { NormaLegal, NormaLegalCreate } from '@/features/cumplimiento/types/matrizLegal';
import { EmpresaRequisito } from '@/features/cumplimiento/types/requisitosLegales';
```

## Tipos por Módulo

### 1. Matriz Legal (matrizLegal.ts)

**Modelos:**
- `TipoNorma` - Catálogo de tipos de norma (Ley, Decreto, Resolución)
- `NormaLegal` - Normas legales colombianas
- `EmpresaNorma` - Relación empresa-norma con cumplimiento

**Enums:**
- `CumplimientoLevel`: 0 | 25 | 50 | 75 | 100
- `EstadoCumplimiento`: 'No evaluado' | 'Bajo' | 'Medio' | 'Alto' | 'Cumple'
- `SistemaGestion`: 'SST' | 'Ambiental' | 'Calidad' | 'PESV'

**Ejemplo de uso:**
```typescript
import { NormaLegal, CumplimientoLevel, CUMPLIMIENTO_CHOICES } from '@/features/cumplimiento/types';

const norma: NormaLegal = {
  id: 1,
  tipo_norma: { id: 1, codigo: 'DEC', nombre: 'Decreto', ... },
  numero: '1072',
  anio: 2015,
  titulo: 'Decreto Único Reglamentario del Sector Trabajo',
  vigente: true,
  aplica_sst: true,
  // ...
};

const cumplimiento: CumplimientoLevel = 75;
```

### 2. Requisitos Legales (requisitosLegales.ts)

**Modelos:**
- `TipoRequisito` - Catálogo de tipos de requisito
- `RequisitoLegal` - Catálogo de requisitos (Licencias, Permisos)
- `EmpresaRequisito` - Requisitos por empresa con vencimientos
- `AlertaVencimiento` - Alertas de vencimiento

**Enums:**
- `EstadoRequisito`: 'vigente' | 'proximo_vencer' | 'vencido' | 'en_tramite' | 'renovando' | 'no_aplica'
- `TipoAlerta`: 'email' | 'sistema' | 'ambos'

**Ejemplo de uso:**
```typescript
import { EmpresaRequisito, EstadoRequisito, ESTADOS_REQUISITO } from '@/features/cumplimiento/types';

const requisito: EmpresaRequisito = {
  id: 1,
  empresa_id: 1,
  requisito: 1,
  requisito_nombre: 'Licencia Ambiental',
  estado: 'vigente',  // ✅ minúsculas
  fecha_vencimiento: '2025-12-31',
  dias_para_vencer: 365,
  // ...
};
```

### 3. Partes Interesadas (partesInteresadas.ts)

**Modelos:**
- `TipoParteInteresada` - Catálogo de tipos de PI
- `ParteInteresada` - Identificación de partes interesadas
- `RequisitoParteInteresada` - Necesidades y expectativas
- `MatrizComunicacion` - Plan de comunicación

**Enums:**
- `CategoriaPI`: 'interna' | 'externa'
- `NivelInfluencia`: 'alta' | 'media' | 'baja'
- `NivelInteres`: 'alto' | 'medio' | 'bajo'
- `TipoRequisitoPI`: 'necesidad' | 'expectativa' | 'requisito_legal' | 'requisito_contractual'
- `FrecuenciaComunicacion`: 'diaria' | 'semanal' | 'mensual' | ...
- `MedioComunicacion`: 'email' | 'reunion' | 'informe' | ...

**Ejemplo de uso:**
```typescript
import {
  ParteInteresada,
  NivelInfluencia,
  NIVELES_INFLUENCIA
} from '@/features/cumplimiento/types';

const parteInteresada: ParteInteresada = {
  id: 1,
  empresa_id: 1,
  tipo: 1,
  tipo_nombre: 'Cliente',
  nombre: 'Empresa ABC',
  nivel_influencia: 'alta',  // ✅ minúsculas
  nivel_interes: 'alto',
  relacionado_sst: true,
  // ...
};
```

### 4. Reglamentos Internos (reglamentos.ts)

**Modelos:**
- `TipoReglamento` - Catálogo de tipos de reglamento
- `Reglamento` - Reglamento interno
- `VersionReglamento` - Historial de versiones
- `PublicacionReglamento` - Registro de publicaciones
- `SocializacionReglamento` - Registro de socializaciones

**Enums:**
- `EstadoReglamento`: 'borrador' | 'en_revision' | 'aprobado' | 'vigente' | 'obsoleto'
- `MedioPublicacion`: 'cartelera' | 'email' | 'intranet' | 'reunion' | 'impreso'
- `TipoSocializacion`: 'induccion' | 'reinduccion' | 'capacitacion' | 'reunion' | 'virtual'

**Ejemplo de uso:**
```typescript
import { Reglamento, EstadoReglamento, ESTADOS_REGLAMENTO } from '@/features/cumplimiento/types';

const reglamento: Reglamento = {
  id: 1,
  empresa_id: 1,
  tipo: 1,
  tipo_nombre: 'Reglamento Interno de Trabajo',
  codigo: 'RIT-001',
  nombre: 'Reglamento Interno de Trabajo',
  estado: 'vigente',  // ✅ minúsculas
  version_actual: '2.0',
  aplica_sst: true,
  // ...
};
```

## Tipos Create vs Read

Cada modelo tiene versiones para lectura y creación:

```typescript
// Para lectura (incluye read-only fields)
interface NormaLegal {
  id: number;
  codigo_completo: string;  // read-only
  sistemas_aplicables: SistemaGestion[];  // SerializerMethodField
  created_at: string;  // auto
  // ...
}

// Para creación/actualización (solo campos editables)
interface NormaLegalCreateUpdate {
  tipo_norma: number;
  numero: string;
  titulo: string;
  // NO incluye: id, codigo_completo, created_at
}
```

## Arrays de Utilidades

Cada módulo exporta arrays con las opciones de los enums para usar en select/dropdowns:

```typescript
import { CUMPLIMIENTO_CHOICES, ESTADOS_REQUISITO, NIVELES_INFLUENCIA } from '@/features/cumplimiento/types';

// Usar en un select
<select>
  {CUMPLIMIENTO_CHOICES.map(choice => (
    <option key={choice.value} value={choice.value}>
      {choice.label}
    </option>
  ))}
</select>
```

## Validación de Tipos

Los tipos están diseñados para atrapar errores en tiempo de compilación:

```typescript
import { EstadoRequisito } from '@/features/cumplimiento/types';

// ✅ TypeScript acepta
const estadoValido: EstadoRequisito = 'vigente';

// ❌ TypeScript rechaza (error de compilación)
const estadoInvalido: EstadoRequisito = 'VIGENTE';  // Error: debe ser minúsculas
const estadoInvalido2: EstadoRequisito = 'activo';  // Error: no existe ese estado
```

## Sincronización con Backend

Estos tipos se generaron a partir de los serializers del backend en:
- `backend/apps/motor_cumplimiento/matriz_legal/serializers.py`
- `backend/apps/motor_cumplimiento/requisitos_legales/serializers.py`
- `backend/apps/motor_cumplimiento/partes_interesadas/serializers.py`
- `backend/apps/motor_cumplimiento/reglamentos_internos/serializers.py`

**IMPORTANTE:** Si los serializers del backend cambian, estos tipos DEBEN actualizarse para mantener la sincronización.

## Contribuir

Al actualizar estos tipos:

1. Mantener los enums en minúsculas
2. Usar snake_case para nombres de campos
3. Marcar campos opcionales con `?` o `| null`
4. Documentar con JSDoc los campos no obvios
5. Actualizar este README si hay cambios significativos
