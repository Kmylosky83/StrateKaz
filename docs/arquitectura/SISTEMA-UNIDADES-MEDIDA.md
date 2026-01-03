# Sistema de Unidades de Medida Dinámico

## Descripción General

Sistema configurable y dinámico de unidades de medida para ERP multi-industria, eliminando completamente el hardcoding de unidades específicas (kg, ton, etc.) y permitiendo adaptación a diferentes sectores industriales.

## Problema Resuelto

**Antes (Hardcoded):**
```python
# En models.py
capacidad_almacenamiento_kg = models.DecimalField(...)  # ❌ Hardcoded

# En stats_views.py
if capacidad_total >= 1000:
    cap_text = f'{capacidad_total/1000:.1f} ton'  # ❌ Hardcoded
else:
    cap_text = f'{capacidad_total:.0f} kg'  # ❌ Hardcoded
```

**Después (Dinámico):**
```python
# En models.py
capacidad_almacenamiento = models.DecimalField(...)  # ✅ Valor genérico
unidad_capacidad = models.ForeignKey('UnidadMedida', ...)  # ✅ Unidad configurable

# En stats_views.py
cap_text = unidad_default.formatear(capacidad_total)  # ✅ Formateo dinámico
```

## Arquitectura

### 1. Modelo de Datos

#### UnidadMedida (Catálogo)

```python
class UnidadMedida:
    # Identificación
    codigo: str              # KG, TON, M3, UND, HR, etc.
    nombre: str              # Kilogramo, Tonelada, etc.
    nombre_plural: str       # Kilogramos, Toneladas, etc.
    simbolo: str             # kg, ton, m³, hr, etc.
    categoria: str           # MASA, VOLUMEN, CANTIDAD, TIEMPO, etc.

    # Conversión
    unidad_base: FK          # Unidad base para conversión
    factor_conversion: Decimal  # Factor para convertir a base

    # Presentación
    decimales_display: int   # Decimales para mostrar
    usar_separador_miles: bool
    prefiere_notacion_cientifica: bool

    # Metadatos
    es_sistema: bool         # Unidad predefinida del sistema
    orden_display: int       # Orden en listas
```

#### Categorías de Unidades

| Categoría | Ejemplos | Uso |
|-----------|----------|-----|
| **MASA** | kg, ton, lb, gr | Procesamiento de grasas, manufactura pesada |
| **VOLUMEN** | m³, L | Líquidos, gases, almacenamiento |
| **CANTIDAD** | unidades, piezas, docenas | Manufactura, retail |
| **TIEMPO** | horas, días | Servicios profesionales |
| **CONTENEDOR** | pallets, cajas, contenedores | Logística, almacenamiento |

#### EmpresaConfig (Configuración Global)

```python
class EmpresaConfig:
    # ... campos existentes ...

    # Nueva configuración
    unidad_capacidad_default: FK -> UnidadMedida  # Unidad por defecto
```

#### SedeEmpresa (Capacidad Dinámica)

```python
class SedeEmpresa:
    # NUEVO: Sistema dinámico
    capacidad_almacenamiento: Decimal         # Valor numérico
    unidad_capacidad: FK -> UnidadMedida     # Unidad de la capacidad

    # DEPRECATED: Mantener temporalmente
    capacidad_almacenamiento_kg: Decimal     # Para migración
```

### 2. Sistema de Conversión

#### Conversión Entre Unidades

```
Unidad Origen → Unidad Base → Unidad Destino

Ejemplo: TON → KG → LB
5 ton × 1000 = 5000 kg
5000 kg ÷ 0.453592 = 11023.11 lb
```

#### Implementación

```python
# Backend
def convertir_a(self, valor, unidad_destino):
    # Convertir a base
    valor_base = valor * self.factor_conversion

    # Convertir a destino
    return valor_base / unidad_destino.factor_conversion
```

```typescript
// Frontend
function convertirCapacidad(
  valor: number,
  unidadOrigen: UnidadMedida,
  unidadDestino: UnidadMedida
): number {
  const valorBase = valor * parseFloat(unidadOrigen.factor_conversion);
  return valorBase / parseFloat(unidadDestino.factor_conversion);
}
```

### 3. Sistema de Formateo

#### Backend (Python)

```python
from apps.gestion_estrategica.configuracion.utils_unidades import (
    formatear_capacidad,
    formatear_capacidad_auto,
    convertir_capacidad,
)

# Formateo simple
texto = formatear_capacidad(5200, 'KG')  # "5,200 kg"

# Auto-escalado (5000 kg → 5 ton)
texto = formatear_capacidad_auto(5000, 'KG')  # "5 ton"

# Conversión
valor = convertir_capacidad(5, 'TON', 'KG')  # 5000
```

#### Frontend (TypeScript)

```typescript
import {
  formatearCapacidad,
  formatearCapacidadAuto,
  convertirCapacidad,
} from '@/features/gestion-estrategica/utils/formatearCapacidad';

// Formateo simple
const texto = formatearCapacidad(5200, unidadKg);  // "5.200 kg"

// Auto-escalado
const texto = formatearCapacidadAuto(5000, [unidadKg, unidadTon]);  // "5 ton"

// Conversión
const valor = convertirCapacidad(5, unidadTon, unidadKg);  // 5000
```

## Unidades Predefinidas del Sistema

### MASA / PESO

| Código | Nombre | Símbolo | Factor | Base |
|--------|--------|---------|--------|------|
| GR | Gramo | g | 0.001 | KG |
| KG | Kilogramo | kg | 1.0 | - |
| LB | Libra | lb | 0.453592 | KG |
| TON | Tonelada | ton | 1000 | KG |

### VOLUMEN

| Código | Nombre | Símbolo | Factor | Base |
|--------|--------|---------|--------|------|
| LT | Litro | L | 0.001 | M3 |
| M3 | Metro Cúbico | m³ | 1.0 | - |

### CANTIDAD

| Código | Nombre | Símbolo | Factor | Base |
|--------|--------|---------|--------|------|
| UND | Unidad | und | 1.0 | - |
| PZA | Pieza | pza | 1.0 | - |
| DOC | Docena | doc | 12 | UND |
| CIENTO | Ciento | cto | 100 | UND |

### TIEMPO

| Código | Nombre | Símbolo | Factor | Base |
|--------|--------|---------|--------|------|
| HORA | Hora | hr | 1.0 | - |
| DIA | Día | día | 24 | HORA |

### CONTENEDOR / EMBALAJE

| Código | Nombre | Símbolo | Factor | Base |
|--------|--------|---------|--------|------|
| PALLET | Pallet | plt | 1.0 | - |
| CAJA | Caja | cja | 1.0 | - |
| CONTENEDOR | Contenedor | cont | 1.0 | - |

## Migración de Datos Existentes

### 1. Cargar Unidades del Sistema

```bash
python manage.py cargar_unidades_sistema
```

Carga las 15 unidades predefinidas del sistema.

### 2. Migrar Capacidades

```bash
# Dry-run (sin guardar)
python manage.py migrar_capacidades_kg --dry-run --verbose

# Migración real
python manage.py migrar_capacidades_kg

# Migrar a otra unidad
python manage.py migrar_capacidades_kg --unidad-destino TON
```

### 3. Configurar Unidad Default

```python
# En Django Admin o shell
from apps.gestion_estrategica.configuracion.models import EmpresaConfig
from apps.gestion_estrategica.configuracion.models_unidades import UnidadMedida

empresa = EmpresaConfig.get_instance()
unidad_kg = UnidadMedida.obtener_por_codigo('KG')
empresa.unidad_capacidad_default = unidad_kg
empresa.save()
```

## Uso por Industria

### Procesamiento de Grasas/Sebo

```python
# Configurar empresa
empresa.unidad_capacidad_default = UnidadMedida.obtener_por_codigo('TON')

# Configurar sedes
sede.capacidad_almacenamiento = 50
sede.unidad_capacidad = UnidadMedida.obtener_por_codigo('TON')
# Display: "50 ton"
```

### Manufactura de Piezas

```python
empresa.unidad_capacidad_default = UnidadMedida.obtener_por_codigo('UND')

sede.capacidad_almacenamiento = 10000
sede.unidad_capacidad = UnidadMedida.obtener_por_codigo('UND')
# Display: "10,000 unidades"
```

### Servicios Profesionales

```python
empresa.unidad_capacidad_default = UnidadMedida.obtener_por_codigo('HORA')

sede.capacidad_almacenamiento = 2000
sede.unidad_capacidad = UnidadMedida.obtener_por_codigo('HORA')
# Display: "2,000 horas"
```

### Logística

```python
empresa.unidad_capacidad_default = UnidadMedida.obtener_por_codigo('PALLET')

sede.capacidad_almacenamiento = 500
sede.unidad_capacidad = UnidadMedida.obtener_por_codigo('PALLET')
# Display: "500 pallets"
```

## API REST

### Endpoints

```
GET  /api/strategic/configuracion/unidades/
POST /api/strategic/configuracion/unidades/
GET  /api/strategic/configuracion/unidades/{id}/
PUT  /api/strategic/configuracion/unidades/{id}/
DELETE /api/strategic/configuracion/unidades/{id}/

GET  /api/strategic/configuracion/unidades/por-categoria/?categoria=MASA
GET  /api/strategic/configuracion/unidades/convertir/?valor=5&origen=TON&destino=KG
```

### Ejemplos de Uso

```typescript
// Listar unidades por categoría
const response = await fetch('/api/strategic/configuracion/unidades/?categoria=MASA');
const unidades = await response.json();

// Crear unidad personalizada
const response = await fetch('/api/strategic/configuracion/unidades/', {
  method: 'POST',
  body: JSON.stringify({
    codigo: 'SACO',
    nombre: 'Saco',
    simbolo: 'saco',
    categoria: 'CONTENEDOR',
    decimales_display: 0,
  })
});

// Convertir
const response = await fetch(
  '/api/strategic/configuracion/unidades/convertir/?valor=5&origen=TON&destino=KG'
);
const { resultado } = await response.json();  // 5000
```

## Frontend - Componentes

### Selector de Unidades

```typescript
import { UnidadSelector } from '@/features/gestion-estrategica/components/UnidadSelector';

<UnidadSelector
  categoria="MASA"
  value={selectedUnidad}
  onChange={setSelectedUnidad}
/>
```

### Input de Capacidad

```typescript
import { CapacidadInput } from '@/features/gestion-estrategica/components/CapacidadInput';

<CapacidadInput
  value={capacidad}
  onChange={setCapacidad}
  unidad={unidadSeleccionada}
  unidades={unidadesDisponibles}
  allowUnitChange
/>
```

### Display de Capacidad

```typescript
import { CapacidadDisplay } from '@/features/gestion-estrategica/components/CapacidadDisplay';

<CapacidadDisplay
  valor={sede.capacidad_almacenamiento}
  unidad={sede.unidad_capacidad}
  autoEscalar
/>
```

## Extensibilidad

### Agregar Unidades Personalizadas

```python
from apps.gestion_estrategica.configuracion.models_unidades import UnidadMedida

# Crear unidad personalizada
saco = UnidadMedida.objects.create(
    codigo='SACO',
    nombre='Saco',
    nombre_plural='Sacos',
    simbolo='saco',
    categoria='CONTENEDOR',
    decimales_display=0,
    es_sistema=False,  # No es del sistema
)

# Crear unidad con conversión
arroba = UnidadMedida.objects.create(
    codigo='ARROBA',
    nombre='Arroba',
    nombre_plural='Arrobas',
    simbolo='@',
    categoria='MASA',
    unidad_base=UnidadMedida.obtener_por_codigo('KG'),
    factor_conversion=Decimal('11.502'),  # 1 arroba = 11.502 kg
    decimales_display=2,
    es_sistema=False,
)
```

### Agregar Categorías Nuevas

En `models_unidades.py`:

```python
CATEGORIA_UNIDAD_CHOICES = [
    # ... existentes ...
    ('ENERGIA', 'Energía'),
    ('PRESION', 'Presión'),
    ('TEMPERATURA', 'Temperatura'),
]
```

## Validaciones

### Backend

```python
# En SedeEmpresa.clean()
def clean(self):
    super().clean()

    # Validar que capacidad y unidad sean consistentes
    if self.capacidad_almacenamiento and not self.unidad_capacidad:
        raise ValidationError({
            'unidad_capacidad': 'Debe especificar la unidad de la capacidad'
        })

    # Validar capacidad positiva
    if self.capacidad_almacenamiento and self.capacidad_almacenamiento < 0:
        raise ValidationError({
            'capacidad_almacenamiento': 'La capacidad debe ser positiva'
        })
```

### Frontend

```typescript
const validarCapacidad = (valor: number, unidad: UnidadMedida) => {
  if (valor < 0) {
    return 'La capacidad debe ser positiva';
  }

  if (!unidad) {
    return 'Debe seleccionar una unidad';
  }

  return null;
};
```

## Pruebas

### Backend

```python
# tests/test_unidades.py
def test_conversion_ton_a_kg():
    ton = UnidadMedida.obtener_por_codigo('TON')
    kg = UnidadMedida.obtener_por_codigo('KG')

    resultado = ton.convertir_a(Decimal('5'), kg)
    assert resultado == Decimal('5000')

def test_formateo_capacidad():
    kg = UnidadMedida.obtener_por_codigo('KG')
    locale = {'separador_miles': '.', 'separador_decimales': ','}

    resultado = kg.formatear(Decimal('1234.56'), locale_config=locale)
    assert resultado == '1.234,56 kg'
```

### Frontend

```typescript
// tests/formatearCapacidad.test.ts
test('formatea capacidad correctamente', () => {
  const unidadKg: UnidadMedida = {
    simbolo: 'kg',
    decimales_display: 2,
    // ...
  };

  const resultado = formatearCapacidad(1234.56, unidadKg);
  expect(resultado).toBe('1.234,56 kg');
});

test('convierte ton a kg', () => {
  const resultado = convertirCapacidad(5, unidadTon, unidadKg);
  expect(resultado).toBe(5000);
});
```

## Beneficios

### 1. **Zero Hardcoding**
- ✅ No hay referencias hardcoded a kg, ton, etc.
- ✅ Totalmente configurable por base de datos
- ✅ Fácil agregar nuevas unidades

### 2. **Multi-Industria**
- ✅ Procesamiento: ton, kg, lb
- ✅ Manufactura: unidades, piezas, docenas
- ✅ Logística: m³, pallets, contenedores
- ✅ Servicios: horas, días, proyectos
- ✅ Retail: cajas, paquetes

### 3. **Escalabilidad**
- ✅ Agregar categorías nuevas
- ✅ Unidades personalizadas por empresa
- ✅ Conversiones automáticas
- ✅ Auto-escalado inteligente

### 4. **Mantenibilidad**
- ✅ Lógica centralizada
- ✅ Helpers reutilizables
- ✅ Formateo consistente
- ✅ Fácil testear

## Roadmap

### Fase 1: Base (Completado)
- [x] Modelo UnidadMedida
- [x] Migración de datos
- [x] Helpers backend
- [x] Helpers frontend

### Fase 2: UI (Próximo)
- [ ] Componentes React
- [ ] Selector de unidades
- [ ] Input de capacidad
- [ ] Display de capacidad

### Fase 3: Extensiones
- [ ] Unidades compuestas (kg/m³)
- [ ] Conversión de temperatura (°C, °F, K)
- [ ] Unidades de energía (kWh, cal)
- [ ] Prefijos SI (kilo, mega, giga)

### Fase 4: Analytics
- [ ] Reportes por unidad
- [ ] Dashboards consolidados
- [ ] Exportación multi-unidad
- [ ] Gráficos con auto-escalado

## Referencias

- **Archivo**: `c:\Proyectos\Grasas y Huesos del Norte\backend\apps\gestion_estrategica\configuracion\models_unidades.py`
- **Helpers Backend**: `utils_unidades.py`
- **Helpers Frontend**: `formatearCapacidad.ts`
- **Migración**: `0003_add_unidades_medida_dinamicas.py`
- **Comandos**: `cargar_unidades_sistema.py`, `migrar_capacidades_kg.py`
