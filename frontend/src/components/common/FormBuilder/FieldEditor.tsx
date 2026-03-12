/**
 * FieldEditor - Panel de propiedades del campo seleccionado
 *
 * Secciones colapsables: Basico, Opciones, Validaciones, Layout, Tabla, Visibilidad
 */
import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '../Button';
import type { CampoFormulario, ColumnaTabla, TipoCampoFormulario } from './types';

interface FieldEditorProps {
  campo: Partial<CampoFormulario>;
  onChange: (campo: Partial<CampoFormulario>) => void;
  allCampos?: Partial<CampoFormulario>[];
}

// ==================== COLLAPSIBLE SECTION ====================

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {title}
      </button>
      {open && <div className="px-3 pb-3 space-y-3">{children}</div>}
    </div>
  );
}

// ==================== FORM CONTROLS ====================

function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string | number | null | undefined;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
}

function FieldToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
}

// ==================== HELPERS ====================

const SELECTION_TYPES: TipoCampoFormulario[] = ['SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX'];
const TABLA_COLUMN_TYPES: TipoCampoFormulario[] = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'CHECKBOX'];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

// ==================== MAIN COMPONENT ====================

export function FieldEditor({ campo, onChange, allCampos }: FieldEditorProps) {
  const [autoSlug, setAutoSlug] = useState(!campo.id);

  // Auto-generate nombre_campo from etiqueta
  const handleEtiquetaChange = useCallback(
    (val: string) => {
      const updates: Partial<CampoFormulario> = { ...campo, etiqueta: val };
      if (autoSlug) {
        updates.nombre_campo = slugify(val);
      }
      onChange(updates);
    },
    [campo, onChange, autoSlug]
  );

  // Reset autoSlug when selecting a new field
  useEffect(() => {
    setAutoSlug(!campo.id);
  }, [campo.id]);

  const update = (partial: Partial<CampoFormulario>) => {
    onChange({ ...campo, ...partial });
  };

  const isSelection = campo.tipo_campo && SELECTION_TYPES.includes(campo.tipo_campo);
  const isTabla = campo.tipo_campo === 'TABLA';
  const isSeccion = campo.tipo_campo === 'SECCION';

  return (
    <div className="overflow-y-auto">
      {/* ======== BASICO ======== */}
      <Section title="Basico" defaultOpen>
        <FieldInput
          label="Etiqueta *"
          value={campo.etiqueta}
          onChange={handleEtiquetaChange}
          placeholder="Nombre visible del campo"
        />
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Nombre campo (slug)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={campo.nombre_campo ?? ''}
              onChange={(e) => {
                setAutoSlug(false);
                update({ nombre_campo: e.target.value });
              }}
              className="flex-1 px-2.5 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        {!isSeccion && (
          <>
            <FieldInput
              label="Descripcion"
              value={campo.descripcion}
              onChange={(v) => update({ descripcion: v })}
              placeholder="Texto de ayuda"
            />
            <FieldInput
              label="Placeholder"
              value={campo.placeholder}
              onChange={(v) => update({ placeholder: v })}
            />
            <FieldInput
              label="Valor por defecto"
              value={campo.valor_por_defecto}
              onChange={(v) => update({ valor_por_defecto: v })}
            />
          </>
        )}
      </Section>

      {/* ======== OPCIONES (SELECT/MULTI/RADIO/CHECK) ======== */}
      {isSelection && (
        <Section title="Opciones" defaultOpen>
          <div className="space-y-2">
            {(campo.opciones || []).map((opt, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={opt.value}
                  onChange={(e) => {
                    const opciones = [...(campo.opciones || [])];
                    opciones[idx] = { ...opt, value: e.target.value };
                    update({ opciones });
                  }}
                  placeholder="valor"
                  className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                />
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => {
                    const opciones = [...(campo.opciones || [])];
                    opciones[idx] = { ...opt, label: e.target.value };
                    update({ opciones });
                  }}
                  placeholder="etiqueta"
                  className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const opciones = (campo.opciones || []).filter((_, i) => i !== idx);
                    update({ opciones });
                  }}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Plus className="w-3 h-3" />}
              onClick={() => {
                const n = (campo.opciones?.length || 0) + 1;
                update({
                  opciones: [
                    ...(campo.opciones || []),
                    { value: `opcion_${n}`, label: `Opcion ${n}` },
                  ],
                });
              }}
            >
              Agregar opcion
            </Button>
          </div>
        </Section>
      )}

      {/* ======== VALIDACIONES ======== */}
      {!isSeccion && (
        <Section title="Validaciones" defaultOpen={false}>
          <FieldToggle
            label="Obligatorio"
            checked={campo.es_obligatorio ?? false}
            onChange={(v) => update({ es_obligatorio: v })}
          />
          <FieldInput
            label="Regex de validacion"
            value={campo.validacion_regex}
            onChange={(v) => update({ validacion_regex: v })}
            placeholder="^[A-Z].*"
          />
          <FieldInput
            label="Mensaje de error"
            value={campo.mensaje_validacion}
            onChange={(v) => update({ mensaje_validacion: v })}
            placeholder="Este campo no es valido"
          />
          {(campo.tipo_campo === 'NUMBER' ||
            campo.tipo_campo === 'TEXT' ||
            campo.tipo_campo === 'TEXTAREA') && (
            <div className="grid grid-cols-2 gap-2">
              {campo.tipo_campo === 'NUMBER' ? (
                <>
                  <FieldInput
                    label="Valor minimo"
                    value={campo.valor_minimo}
                    onChange={(v) => update({ valor_minimo: v ? Number(v) : null })}
                    type="number"
                  />
                  <FieldInput
                    label="Valor maximo"
                    value={campo.valor_maximo}
                    onChange={(v) => update({ valor_maximo: v ? Number(v) : null })}
                    type="number"
                  />
                </>
              ) : (
                <>
                  <FieldInput
                    label="Long. minima"
                    value={campo.longitud_minima}
                    onChange={(v) => update({ longitud_minima: v ? Number(v) : null })}
                    type="number"
                  />
                  <FieldInput
                    label="Long. maxima"
                    value={campo.longitud_maxima}
                    onChange={(v) => update({ longitud_maxima: v ? Number(v) : null })}
                    type="number"
                  />
                </>
              )}
            </div>
          )}
        </Section>
      )}

      {/* ======== LAYOUT ======== */}
      <Section title="Layout" defaultOpen={false}>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Ancho ({campo.ancho_columna || 12}/12 columnas)
          </label>
          <input
            type="range"
            min={1}
            max={12}
            value={campo.ancho_columna || 12}
            onChange={(e) => update({ ancho_columna: Number(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>1</span>
            <span>6</span>
            <span>12</span>
          </div>
        </div>
        <FieldInput
          label="Clase CSS"
          value={campo.clase_css}
          onChange={(v) => update({ clase_css: v })}
          placeholder="custom-class"
        />
      </Section>

      {/* ======== TABLA (columnas) ======== */}
      {isTabla && (
        <Section title="Columnas de tabla" defaultOpen>
          <div className="space-y-2">
            {(campo.columnas_tabla || []).map((col, idx) => (
              <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-md space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={col.etiqueta}
                    onChange={(e) => {
                      const cols = [...(campo.columnas_tabla || [])];
                      cols[idx] = {
                        ...col,
                        etiqueta: e.target.value,
                        nombre_campo: slugify(e.target.value),
                      };
                      update({ columnas_tabla: cols });
                    }}
                    placeholder="Etiqueta"
                    className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <select
                    value={col.tipo_campo}
                    onChange={(e) => {
                      const cols = [...(campo.columnas_tabla || [])];
                      cols[idx] = { ...col, tipo_campo: e.target.value as TipoCampoFormulario };
                      update({ columnas_tabla: cols });
                    }}
                    className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {TABLA_COLUMN_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const cols = (campo.columnas_tabla || []).filter((_, i) => i !== idx);
                      update({ columnas_tabla: cols });
                    }}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <FieldToggle
                  label="Obligatoria"
                  checked={col.es_obligatorio ?? false}
                  onChange={(v) => {
                    const cols = [...(campo.columnas_tabla || [])];
                    cols[idx] = { ...col, es_obligatorio: v };
                    update({ columnas_tabla: cols });
                  }}
                />
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Plus className="w-3 h-3" />}
              onClick={() => {
                const n = (campo.columnas_tabla?.length || 0) + 1;
                const newCol: ColumnaTabla = {
                  nombre_campo: `columna_${n}`,
                  etiqueta: `Columna ${n}`,
                  tipo_campo: 'TEXT',
                };
                update({ columnas_tabla: [...(campo.columnas_tabla || []), newCol] });
              }}
            >
              Agregar columna
            </Button>
          </div>
        </Section>
      )}

      {/* ======== VISIBILIDAD (basico) ======== */}
      {!isSeccion && allCampos && allCampos.length > 1 && (
        <Section title="Visibilidad condicional" defaultOpen={false}>
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Campo dependiente
              </label>
              <select
                value={campo.condicion_visible?.campo_dependiente || ''}
                onChange={(e) =>
                  update({
                    condicion_visible: {
                      ...campo.condicion_visible,
                      campo_dependiente: e.target.value || undefined,
                    },
                  })
                }
                className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Siempre visible</option>
                {allCampos
                  .filter(
                    (c) => c.nombre_campo !== campo.nombre_campo && c.tipo_campo !== 'SECCION'
                  )
                  .map((c) => (
                    <option key={c.nombre_campo} value={c.nombre_campo}>
                      {c.etiqueta}
                    </option>
                  ))}
              </select>
            </div>
            {campo.condicion_visible?.campo_dependiente && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Operador
                  </label>
                  <select
                    value={campo.condicion_visible?.operador || 'igual'}
                    onChange={(e) =>
                      update({
                        condicion_visible: {
                          ...campo.condicion_visible,
                          operador: e.target.value as 'igual' | 'diferente' | 'contiene',
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="igual">Es igual a</option>
                    <option value="diferente">Es diferente de</option>
                    <option value="contiene">Contiene</option>
                    <option value="mayor_que">Mayor que</option>
                    <option value="menor_que">Menor que</option>
                  </select>
                </div>
                <FieldInput
                  label="Valor"
                  value={String(campo.condicion_visible?.valor ?? '')}
                  onChange={(v) =>
                    update({
                      condicion_visible: {
                        ...campo.condicion_visible,
                        valor: v,
                      },
                    })
                  }
                  placeholder="Valor esperado"
                />
              </>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
