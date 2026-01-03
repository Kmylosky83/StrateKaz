/**
 * Utilidades para Formateo de Unidades de Medida
 * Sistema de Gestión StrateKaz
 *
 * Helpers para formatear valores con unidades de medida dinámicas en el frontend.
 */

/**
 * Configuración de unidad de medida (desde API)
 */
export interface UnidadMedida {
  id: number;
  codigo: string;
  nombre: string;
  nombre_plural: string;
  simbolo: string;
  categoria: 'MASA' | 'VOLUMEN' | 'LONGITUD' | 'AREA' | 'CANTIDAD' | 'TIEMPO' | 'CONTENEDOR' | 'OTRO';
  factor_conversion: string; // Decimal como string
  decimales_display: number;
  prefiere_notacion_cientifica: boolean;
  usar_separador_miles: boolean;
  descripcion?: string;
  es_sistema: boolean;
  orden_display: number;
  unidad_base?: number; // ID de la unidad base
  is_active: boolean;
}

/**
 * Configuración regional para formateo
 */
export interface LocaleConfig {
  separador_miles: string;
  separador_decimales: string;
}

/**
 * Configuración por defecto (Colombia)
 */
const DEFAULT_LOCALE: LocaleConfig = {
  separador_miles: '.',
  separador_decimales: ',',
};

/**
 * Formatea un número con separadores de miles y decimales.
 *
 * @param valor - Valor numérico a formatear
 * @param decimales - Cantidad de decimales
 * @param locale - Configuración regional
 * @returns Número formateado
 *
 * @example
 * formatearNumero(1234.56, 2, { separador_miles: '.', separador_decimales: ',' })
 * // Retorna: "1.234,56"
 */
export function formatearNumero(
  valor: number,
  decimales: number = 2,
  locale: LocaleConfig = DEFAULT_LOCALE
): string {
  // Redondear
  const valorRedondeado = Number(valor.toFixed(decimales));

  // Separar parte entera y decimal
  const partes = valorRedondeado.toString().split('.');
  const parteEntera = parseInt(partes[0]);
  const parteDecimal = partes[1] || '';

  // Formatear parte entera con separador de miles
  const enteroFormateado = parteEntera
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, locale.separador_miles);

  // Construir resultado
  if (decimales > 0 && parteDecimal) {
    const decimalFormateado = parteDecimal.padEnd(decimales, '0').substring(0, decimales);
    return `${enteroFormateado}${locale.separador_decimales}${decimalFormateado}`;
  }

  return enteroFormateado;
}

/**
 * Formatea un valor con su unidad de medida.
 *
 * @param valor - Valor numérico
 * @param unidad - Configuración de la unidad
 * @param incluirSimbolo - Si incluir el símbolo/nombre de la unidad
 * @param locale - Configuración regional
 * @returns Valor formateado con unidad
 *
 * @example
 * const unidadKg: UnidadMedida = { simbolo: 'kg', decimales_display: 2, ... };
 * formatearCapacidad(1234.56, unidadKg)
 * // Retorna: "1.234,56 kg"
 */
export function formatearCapacidad(
  valor: number | null | undefined,
  unidad: UnidadMedida,
  incluirSimbolo: boolean = true,
  locale: LocaleConfig = DEFAULT_LOCALE
): string {
  if (valor === null || valor === undefined) {
    return '';
  }

  // Notación científica si es necesario
  if (unidad.prefiere_notacion_cientifica) {
    if (Math.abs(valor) >= 1e6 || (Math.abs(valor) < 1e-3 && valor !== 0)) {
      const texto = valor.toExponential(unidad.decimales_display);
      return incluirSimbolo ? `${texto} ${unidad.simbolo}` : texto;
    }
  }

  // Formatear número con configuración de la unidad
  let texto: string;

  if (unidad.usar_separador_miles) {
    texto = formatearNumero(valor, unidad.decimales_display, locale);
  } else {
    texto = valor.toFixed(unidad.decimales_display);
  }

  // Agregar símbolo/nombre
  if (incluirSimbolo) {
    // Usar nombre singular/plural según el valor
    if (valor === 1) {
      return `${texto} ${unidad.nombre}`;
    } else {
      return `${texto} ${unidad.nombre_plural || unidad.simbolo}`;
    }
  }

  return texto;
}

/**
 * Convierte un valor de una unidad a otra (asumiendo misma categoría).
 *
 * @param valor - Valor a convertir
 * @param unidadOrigen - Unidad origen
 * @param unidadDestino - Unidad destino
 * @returns Valor convertido
 *
 * @example
 * convertirCapacidad(5, unidadTon, unidadKg)
 * // Retorna: 5000
 */
export function convertirCapacidad(
  valor: number,
  unidadOrigen: UnidadMedida,
  unidadDestino: UnidadMedida
): number {
  if (unidadOrigen.categoria !== unidadDestino.categoria) {
    throw new Error(
      `No se puede convertir ${unidadOrigen.categoria} a ${unidadDestino.categoria}`
    );
  }

  // Convertir a valor base
  const factorOrigen = parseFloat(unidadOrigen.factor_conversion);
  const valorBase = valor * factorOrigen;

  // Convertir a unidad destino
  const factorDestino = parseFloat(unidadDestino.factor_conversion);
  return valorBase / factorDestino;
}

/**
 * Formatea una capacidad con auto-escalado a la mejor unidad.
 *
 * @param valor - Valor numérico
 * @param unidades - Lista de unidades disponibles de la misma categoría
 * @param locale - Configuración regional
 * @returns Valor formateado con la mejor unidad
 *
 * @example
 * formatearCapacidadAuto(5000, [unidadKg, unidadTon])
 * // Retorna: "5 ton" (en lugar de "5.000 kg")
 */
export function formatearCapacidadAuto(
  valor: number,
  unidades: UnidadMedida[],
  locale: LocaleConfig = DEFAULT_LOCALE
): string {
  if (!valor || unidades.length === 0) {
    return '';
  }

  // Ordenar unidades por factor de conversión (menor a mayor)
  const unidadesOrdenadas = [...unidades].sort((a, b) => {
    const factorA = parseFloat(a.factor_conversion);
    const factorB = parseFloat(b.factor_conversion);
    return factorA - factorB;
  });

  // Unidad base (menor factor)
  const unidadBase = unidadesOrdenadas[0];
  const factorBase = parseFloat(unidadBase.factor_conversion);
  const valorBase = valor * factorBase;

  // Encontrar la mejor unidad
  let mejorUnidad = unidadBase;
  let mejorValor = valor;
  let mejorScore = Infinity;

  for (const unidad of unidadesOrdenadas) {
    const factor = parseFloat(unidad.factor_conversion);
    const valorEnUnidad = valorBase / factor;

    // Calcular score (preferir valores entre 0.1 y 10000)
    const absValor = Math.abs(valorEnUnidad);
    let score: number;

    if (absValor < 0.1) {
      score = 1000 / absValor; // Muy pequeño
    } else if (absValor > 10000) {
      score = absValor / 10; // Muy grande
    } else if (absValor >= 1 && absValor <= 1000) {
      score = 1; // Óptimo
    } else if (absValor >= 0.1 && absValor < 1) {
      score = 2; // Aceptable (decimales)
    } else {
      score = absValor / 100; // Grande pero aceptable
    }

    if (score < mejorScore) {
      mejorScore = score;
      mejorUnidad = unidad;
      mejorValor = valorEnUnidad;
    }
  }

  return formatearCapacidad(mejorValor, mejorUnidad, true, locale);
}

/**
 * Parsea un string de capacidad (ej: "5.2 ton") a objeto con valor y unidad.
 *
 * @param texto - Texto a parsear
 * @param unidades - Lista de unidades disponibles
 * @returns Objeto con valor numérico y código de unidad
 *
 * @example
 * parsearCapacidad("5.2 ton", unidades)
 * // Retorna: { valor: 5.2, unidadCodigo: 'TON' }
 */
export function parsearCapacidad(
  texto: string,
  unidades: UnidadMedida[]
): { valor: number; unidadCodigo: string } | null {
  const textoLimpio = texto.trim();

  // Buscar unidad en el texto
  let unidadEncontrada: UnidadMedida | undefined;

  for (const unidad of unidades) {
    // Buscar por símbolo, nombre o código
    const patterns = [
      unidad.simbolo,
      unidad.nombre.toLowerCase(),
      unidad.nombre_plural.toLowerCase(),
      unidad.codigo.toLowerCase(),
    ];

    for (const pattern of patterns) {
      if (textoLimpio.toLowerCase().includes(pattern)) {
        unidadEncontrada = unidad;
        break;
      }
    }

    if (unidadEncontrada) break;
  }

  if (!unidadEncontrada) {
    return null;
  }

  // Extraer número (remover todo excepto dígitos, punto y coma)
  const numeroStr = textoLimpio
    .replace(/[^\d.,]/g, '')
    .replace(',', '.'); // Normalizar a punto decimal

  const valor = parseFloat(numeroStr);

  if (isNaN(valor)) {
    return null;
  }

  return {
    valor,
    unidadCodigo: unidadEncontrada.codigo,
  };
}

/**
 * Hook React para formatear capacidades (opcional, si usan React Query).
 *
 * @example
 * const { formatear } = useFormatearCapacidad();
 * const texto = formatear(5000, unidadKg);
 */
export function useFormatearCapacidad(locale?: LocaleConfig) {
  const localeConfig = locale || DEFAULT_LOCALE;

  return {
    formatear: (valor: number | null | undefined, unidad: UnidadMedida) =>
      formatearCapacidad(valor, unidad, true, localeConfig),
    formatearAuto: (valor: number, unidades: UnidadMedida[]) =>
      formatearCapacidadAuto(valor, unidades, localeConfig),
    convertir: convertirCapacidad,
    parsear: parsearCapacidad,
  };
}

/**
 * Formatea capacidad para display en tablas/cards (más compacto).
 *
 * @param valor - Valor numérico
 * @param unidad - Configuración de la unidad
 * @param locale - Configuración regional
 * @returns Valor formateado compacto
 *
 * @example
 * formatearCapacidadCompacto(5234.56, unidadKg)
 * // Retorna: "5.2k kg" (en lugar de "5.234,56 kg")
 */
export function formatearCapacidadCompacto(
  valor: number | null | undefined,
  unidad: UnidadMedida,
  locale: LocaleConfig = DEFAULT_LOCALE
): string {
  if (valor === null || valor === undefined) {
    return '';
  }

  const absValor = Math.abs(valor);
  let valorDisplay = valor;
  let sufijo = '';

  // Aplicar sufijos para valores grandes
  if (absValor >= 1_000_000) {
    valorDisplay = valor / 1_000_000;
    sufijo = 'M';
  } else if (absValor >= 1_000) {
    valorDisplay = valor / 1_000;
    sufijo = 'k';
  }

  const texto = formatearNumero(valorDisplay, 1, locale);

  return `${texto}${sufijo} ${unidad.simbolo}`;
}
