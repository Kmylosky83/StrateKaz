/**
 * API para EmpresaConfig - Datos Fiscales y Legales de la Empresa
 * Sistema de Gestión StrateKaz
 */
import axiosInstance from '@/api/axios-config';
import type {
  EmpresaConfig,
  EmpresaConfigResponse,
  EmpresaConfigFormData,
  EmpresaConfigChoices,
} from '../types/empresa.types';

const BASE_URL = '/configuracion/empresa-config';

/**
 * API para gestionar la configuración de la empresa (Singleton)
 */
export const empresaApi = {
  /**
   * Obtiene la configuración actual de la empresa
   * @returns Configuración de la empresa o null si no existe
   */
  async get(): Promise<EmpresaConfigResponse | null> {
    try {
      const { data } = await axiosInstance.get<EmpresaConfigResponse>(`${BASE_URL}/`);
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Crea la configuración de la empresa (solo si no existe)
   * @param formData - Datos del formulario
   * @returns Configuración creada
   */
  async create(formData: EmpresaConfigFormData): Promise<EmpresaConfig> {
    const { data } = await axiosInstance.post<EmpresaConfig>(`${BASE_URL}/`, formData);
    return data;
  },

  /**
   * Actualiza la configuración de la empresa
   * @param formData - Datos del formulario
   * @returns Configuración actualizada
   */
  async update(formData: Partial<EmpresaConfigFormData>): Promise<EmpresaConfig> {
    // Usamos PATCH para actualización parcial
    const { data } = await axiosInstance.patch<EmpresaConfig>(`${BASE_URL}/1/`, formData);
    return data;
  },

  /**
   * Obtiene las opciones para los campos select (choices)
   * @returns Objeto con arrays de opciones para cada campo
   */
  async getChoices(): Promise<EmpresaConfigChoices> {
    const { data } = await axiosInstance.get<EmpresaConfigChoices>(`${BASE_URL}/choices/`);
    return data;
  },

  /**
   * Inicializa la configuración con valores por defecto
   * Solo se usa en el setup inicial del sistema
   * @returns Configuración inicializada
   */
  async initialize(): Promise<{ created: boolean; data: EmpresaConfig }> {
    const { data } = await axiosInstance.post<{ created: boolean; data: EmpresaConfig }>(
      `${BASE_URL}/initialize/`
    );
    return data;
  },
};
