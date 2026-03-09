/**
 * Event Bridge: Comunicación bidireccional Phaser <-> React
 *
 * Phaser scenes y React components se comunican via este EventEmitter.
 * Phaser emite eventos de gameplay, React emite respuestas de UI.
 */

type EventCallback = (...args: unknown[]) => void;

class GameEventBridge {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(...args);
      } catch (err) {
        console.error(`[EventBridge] Error in "${event}" handler:`, err);
      }
    });
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

// Singleton — shared between React and Phaser
export const eventBridge = new GameEventBridge();
