/**
 * MS-003: Preferences API Client
 *
 * Handles all HTTP requests for user preferences management
 */

import apiClient from '@/api/axios-config';
import type { UserPreferences, UpdatePreferencesDTO } from '../types/preferences.types';

const PREFERENCES_BASE_URL = '/core/user-preferences/';

/**
 * Get current user preferences
 * If preferences don't exist, they will be created with default values
 */
export const getUserPreferences = async (): Promise<UserPreferences> => {
  const response = await apiClient.get<UserPreferences>(PREFERENCES_BASE_URL);
  return response.data;
};

/**
 * Update user preferences (full update)
 */
export const updateUserPreferences = async (
  data: UpdatePreferencesDTO
): Promise<UserPreferences> => {
  const response = await apiClient.put<UserPreferences>(PREFERENCES_BASE_URL, data);
  return response.data;
};

/**
 * Update user preferences (partial update)
 */
export const patchUserPreferences = async (
  data: Partial<UpdatePreferencesDTO>
): Promise<UserPreferences> => {
  const response = await apiClient.patch<UserPreferences>(PREFERENCES_BASE_URL, data);
  return response.data;
};
