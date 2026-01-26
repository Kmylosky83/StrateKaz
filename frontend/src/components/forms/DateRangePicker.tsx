import { forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';
import { Calendar } from 'lucide-react';

export interface DateRangePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  onChange?: (range: { startDate: string; endDate: string }) => void;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  showIcon?: boolean;
  startLabel?: string;
  endLabel?: string;
}

export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  (
    {
      label,
      error,
      helperText,
      startDate,
      endDate,
      onStartDateChange,
      onEndDateChange,
      onChange,
      minDate,
      maxDate,
      disabled = false,
      showIcon = true,
      startLabel = 'Fecha Inicio',
      endLabel = 'Fecha Fin',
    },
    ref
  ) => {
    const groupId = useId();

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStartDate = e.target.value;
      if (onStartDateChange) {
        onStartDateChange(newStartDate);
      }
      if (onChange && endDate) {
        onChange({ startDate: newStartDate, endDate });
      }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newEndDate = e.target.value;
      if (onEndDateChange) {
        onEndDateChange(newEndDate);
      }
      if (onChange && startDate) {
        onChange({ startDate, endDate: newEndDate });
      }
    };

    return (
      <div className="w-full" ref={ref}>
        {label && (
          <label
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            id={groupId}
          >
            {label}
          </label>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date */}
          <div>
            <label
              htmlFor={`${groupId}-start`}
              className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
            >
              {startLabel}
            </label>
            <div className="relative">
              {showIcon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <input
                type="date"
                id={`${groupId}-start`}
                value={startDate || ''}
                onChange={handleStartDateChange}
                min={minDate}
                max={endDate || maxDate}
                disabled={disabled}
                className={cn(
                  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-primary-400 dark:focus:ring-primary-400 [color-scheme:light] dark:[color-scheme:dark]',
                  showIcon && 'pl-10',
                  error &&
                    'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                )}
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label
              htmlFor={`${groupId}-end`}
              className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
            >
              {endLabel}
            </label>
            <div className="relative">
              {showIcon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <input
                type="date"
                id={`${groupId}-end`}
                value={endDate || ''}
                onChange={handleEndDateChange}
                min={startDate || minDate}
                max={maxDate}
                disabled={disabled}
                className={cn(
                  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-primary-400 dark:focus:ring-primary-400 [color-scheme:light] dark:[color-scheme:dark]',
                  showIcon && 'pl-10',
                  error &&
                    'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
                )}
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

DateRangePicker.displayName = 'DateRangePicker';
