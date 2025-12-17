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

export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

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
