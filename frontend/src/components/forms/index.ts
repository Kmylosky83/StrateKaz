/**
 * Form Components
 *
 * Componentes de formulario reutilizables con soporte para:
 * - Labels y mensajes de error
 * - Dark mode
 * - Accesibilidad (ARIA)
 * - React Hook Form compatible (forwardRef)
 *
 * Uso tipico:
 *
 * ```tsx
 * import { Input, Select, Textarea, Checkbox, Switch, RadioGroup, DatePicker, DateRangePicker } from '@/components/forms';
 *
 * <Input label="Nombre" error={errors.nombre?.message} {...register('nombre')} />
 * <Textarea label="Descripcion" rows={4} />
 * <Checkbox label="Acepto terminos" />
 * <Switch label="Activo" size="md" />
 * <RadioGroup name="tipo" options={[...]} value={tipo} onChange={setTipo} />
 * <DatePicker label="Fecha" />
 * <DateRangePicker startDate={start} endDate={end} onChange={...} />
 * ```
 */

export { Input } from './Input';
export type { InputProps } from './Input';

export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

// Textarea exporta TextareaWithAI como default — incluye asistente IA
// cuando hay integración configurada, fallback a Textarea normal si no.
export { TextareaWithAI as Textarea } from './TextareaWithAI';
export type { TextareaWithAIProps as TextareaProps } from './TextareaWithAI';

// Exportación explícita para casos que necesiten el componente con otro nombre
export { TextareaWithAI } from './TextareaWithAI';
export type { TextareaWithAIProps } from './TextareaWithAI';

// Exportación del Textarea base sin IA (uso interno)
export { Textarea as TextareaBase } from './Textarea';
export type { TextareaProps as TextareaBaseProps } from './Textarea';

export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';

export { Switch } from './Switch';
export type { SwitchProps } from './Switch';

export { RadioGroup } from './RadioGroup';
export type { RadioGroupProps, RadioOption } from './RadioGroup';

export { DatePicker } from './DatePicker';
export type { DatePickerProps } from './DatePicker';

export { DateRangePicker } from './DateRangePicker';
export type { DateRangePickerProps } from './DateRangePicker';

export { RichTextEditor } from './RichTextEditor';
export type { RichTextEditorProps, RichTextEditorRef } from './RichTextEditor';

export { SignaturePad } from './SignaturePad';
export type { SignaturePadProps, SignaturePadRef } from './SignaturePad';

export { MultiSelectCombobox } from './MultiSelectCombobox';
export type { MultiSelectOption } from './MultiSelectCombobox';

// Re-export SignatureModal from modals for convenience
export { SignatureModal } from '../modals/SignatureModal';
export type { SignatureModalProps, SignatureData } from '../modals/SignatureModal';
