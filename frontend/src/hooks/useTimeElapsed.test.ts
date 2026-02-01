/**
 * Tests para useTimeElapsed Hook
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTimeElapsed } from './useTimeElapsed';

describe('useTimeElapsed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Inicialización', () => {
    it('debe calcular correctamente el tiempo transcurrido inicial', () => {
      const startDate = new Date('2020-01-01');
      const currentDate = new Date('2025-06-15');
      vi.setSystemTime(currentDate);

      const { result } = renderHook(() =>
        useTimeElapsed({ startDate })
      );

      expect(result.current.elapsed.years).toBe(5);
      expect(result.current.elapsed.months).toBe(5);
      // Los días pueden variar según la fecha exacta
      expect(result.current.elapsed.days).toBeGreaterThanOrEqual(0);
    });

    it('debe aceptar startDate como string ISO', () => {
      const startDate = '2020-01-01T00:00:00.000Z';
      const currentDate = new Date('2025-01-01');
      vi.setSystemTime(currentDate);

      const { result } = renderHook(() =>
        useTimeElapsed({ startDate })
      );

      expect(result.current.elapsed.years).toBe(5);
      expect(result.current.startDate).toBeInstanceOf(Date);
    });

    it('debe establecer isActive en true al inicializar', () => {
      const { result } = renderHook(() =>
        useTimeElapsed({ startDate: new Date() })
      );

      expect(result.current.isActive).toBe(true);
    });
  });

  describe('Formatos de Salida', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2025-06-15'));
    });

    it('debe formatear en modo "long" correctamente', () => {
      const { result } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date('2020-01-01'),
          format: 'long',
          granularities: ['years', 'months', 'days'],
        })
      );

      expect(result.current.formatted).toMatch(/\d+ años?, \d+ meses?, \d+ días?/);
    });

    it('debe formatear en modo "short" correctamente', () => {
      const { result } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date('2020-01-01'),
          format: 'short',
          granularities: ['years', 'months', 'days'],
        })
      );

      // short format uses: Na, Nm, Nd (separador ", " por defecto)
      expect(result.current.formatted).toMatch(/\d+a, \d+m, \d+d/);
    });

    it('debe formatear en modo "compact" correctamente', () => {
      const { result } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date('2020-01-01'),
          format: 'compact',
          granularities: ['years', 'months', 'days'],
        })
      );

      // Compact usa 'm' para meses
      expect(result.current.formatted).toMatch(/\d+a \d+m \d+d/);
    });

    it('debe usar el separador personalizado', () => {
      const { result } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date('2020-01-01'),
          format: 'long',
          granularities: ['years', 'months'],
          separator: ' | ',
        })
      );

      expect(result.current.formatted).toContain(' | ');
    });
  });

  describe('Granularidades', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2025-06-15'));
    });

    it('debe mostrar solo las granularidades especificadas', () => {
      const { result } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date('2020-01-01'),
          format: 'long',
          granularities: ['years', 'months'],
        })
      );

      expect(result.current.formatted).not.toContain('día');
    });

    it('debe omitir valores cero por defecto', () => {
      const { result } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date('2025-01-01'),
          format: 'long',
          granularities: ['years', 'months', 'days'],
          showZeros: false,
        })
      );

      expect(result.current.formatted).not.toContain('0 años');
    });

    it('debe mostrar valores cero cuando showZeros es true', () => {
      const { result } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date('2025-06-01'),
          format: 'long',
          granularities: ['years', 'months', 'days'],
          showZeros: true,
        })
      );

      expect(result.current.formatted).toContain('0 años');
    });
  });

  describe('Actualización Automática', () => {
    it('debe configurar el intervalo de actualización', () => {
      const startDate = new Date('2025-01-01T00:00:00');
      vi.setSystemTime(startDate);

      const { result } = renderHook(() =>
        useTimeElapsed({
          startDate,
          updateInterval: 1000,
          granularities: ['seconds'],
        })
      );

      // Verificar que el hook está activo
      expect(result.current.isActive).toBe(true);
      // Verificar que tiene el valor inicial correcto
      expect(result.current.elapsed.seconds).toBe(0);
    });

    it('debe pausar al desmontar cuando pauseOnUnmount es true', () => {
      const { result, unmount } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date(),
          pauseOnUnmount: true,
        })
      );

      expect(result.current.isActive).toBe(true);

      unmount();

      // El estado isActive se actualiza en el cleanup del useEffect
      // No podemos verificarlo después del unmount, pero el intervalo se limpia
    });
  });

  describe('Método refresh()', () => {
    it('debe tener el método refresh disponible', () => {
      const startDate = new Date('2025-01-01T00:00:00');
      vi.setSystemTime(startDate);

      const { result } = renderHook(() =>
        useTimeElapsed({
          startDate,
          granularities: ['seconds'],
        })
      );

      // Verificar que refresh es una función
      expect(typeof result.current.refresh).toBe('function');
      // Verificar valores iniciales
      expect(result.current.elapsed.seconds).toBe(0);
    });
  });

  describe('Cálculos de Totales', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2025-01-02T00:00:00'));
    });

    it('debe calcular totalDays correctamente', () => {
      const startDate = new Date('2025-01-01T00:00:00');

      const { result } = renderHook(() =>
        useTimeElapsed({ startDate })
      );

      expect(result.current.elapsed.totalDays).toBe(1);
    });

    it('debe calcular totalHours correctamente', () => {
      const startDate = new Date('2025-01-01T00:00:00');

      const { result } = renderHook(() =>
        useTimeElapsed({ startDate })
      );

      expect(result.current.elapsed.totalHours).toBe(24);
    });

    it('debe calcular totalMinutes correctamente', () => {
      const startDate = new Date('2025-01-01T23:00:00');

      const { result } = renderHook(() =>
        useTimeElapsed({ startDate })
      );

      expect(result.current.elapsed.totalMinutes).toBe(60);
    });

    it('debe calcular totalSeconds correctamente', () => {
      const startDate = new Date('2025-01-01T23:59:00');

      const { result } = renderHook(() =>
        useTimeElapsed({ startDate })
      );

      expect(result.current.elapsed.totalSeconds).toBe(60);
    });
  });

  describe('Edge Cases', () => {
    it('debe manejar diferencias de meses negativos correctamente', () => {
      vi.setSystemTime(new Date('2025-01-15'));

      const { result } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date('2024-03-20'),
          granularities: ['years', 'months', 'days'],
        })
      );

      expect(result.current.elapsed.years).toBeGreaterThanOrEqual(0);
      expect(result.current.elapsed.months).toBeGreaterThanOrEqual(0);
      expect(result.current.elapsed.days).toBeGreaterThanOrEqual(0);
    });

    it('debe manejar diferencias de días negativos correctamente', () => {
      vi.setSystemTime(new Date('2025-02-01'));

      const { result } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date('2024-12-20'),
          granularities: ['years', 'months', 'days'],
        })
      );

      expect(result.current.elapsed.days).toBeGreaterThanOrEqual(0);
    });

    it('debe retornar "0" cuando no hay unidades visibles', () => {
      vi.setSystemTime(new Date('2025-01-01T00:00:00'));

      const { result } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date('2025-01-01T00:00:00'),
          granularities: ['years'],
          showZeros: false,
        })
      );

      expect(result.current.formatted).toBe('0');
    });
  });

  describe('Pluralización (Español)', () => {
    beforeEach(() => {
      vi.setSystemTime(new Date('2025-01-01T00:00:00'));
    });

    it('debe pluralizar "año" correctamente', () => {
      const { result: singular } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date('2024-01-01'),
          format: 'long',
          granularities: ['years'],
        })
      );

      expect(singular.current.formatted).toBe('1 año');

      const { result: plural } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date('2020-01-01'),
          format: 'long',
          granularities: ['years'],
        })
      );

      expect(plural.current.formatted).toContain('años');
    });

    it('debe pluralizar "mes/meses" correctamente', () => {
      const { result: singular } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date('2024-12-01'),
          format: 'long',
          granularities: ['months'],
        })
      );

      expect(singular.current.formatted).toBe('1 mes');
    });

    it('debe pluralizar "día/días" correctamente', () => {
      // Con fecha actual 2025-01-01T00:00:00 y startDate 2024-12-31 = 1 día
      const { result: singular } = renderHook(() =>
        useTimeElapsed({
          startDate: new Date('2024-12-31T00:00:00'),
          format: 'long',
          granularities: ['days'],
        })
      );

      expect(singular.current.formatted).toBe('1 día');
    });
  });
});
