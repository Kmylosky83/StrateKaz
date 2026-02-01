/**
 * MS-003: Types for User Preferences
 *
 * Manages user personal configuration:
 * - Interface language
 * - Timezone
 * - Date format
 */

/**
 * Language options
 */
export enum Language {
  SPANISH = 'es',
  ENGLISH = 'en',
}

/**
 * Date format options
 */
export enum DateFormat {
  DD_MM_YYYY = 'DD/MM/YYYY',
  MM_DD_YYYY = 'MM/DD/YYYY',
  YYYY_MM_DD = 'YYYY-MM-DD',
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  language: Language;
  language_display: string;
  timezone: string;
  date_format: DateFormat;
  date_format_display: string;
  created_at: string;
  updated_at: string;
}

/**
 * DTO for updating preferences
 */
export interface UpdatePreferencesDTO {
  language?: Language;
  timezone?: string;
  date_format?: DateFormat;
}

/**
 * Timezone option for select
 */
export interface TimezoneOption {
  value: string;
  label: string;
}

/**
 * Language option for select
 */
export interface LanguageOption {
  value: Language;
  label: string;
}

/**
 * Date format option for select
 */
export interface DateFormatOption {
  value: DateFormat;
  label: string;
  example: string;
}
