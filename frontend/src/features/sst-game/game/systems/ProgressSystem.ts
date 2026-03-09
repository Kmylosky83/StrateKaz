/**
 * Progress System: XP, puntaje, EPP tracking
 * Los Héroes de la Seguridad
 */
import type { GameState } from '../../types/game.types';
import { eventBridge } from '../utils/eventBridge';

export class ProgressSystem {
  private state: GameState;

  constructor() {
    this.state = {
      hp: 100,
      maxHp: 100,
      xp: 0,
      level: 1,
      xpToNext: 100,
      score: 0,
      eppsCollected: [],
      quizzesAnswered: 0,
      quizzesCorrect: 0,
      running: true,
      paused: false,
    };

    this.emitAll();
  }

  getState(): GameState {
    return { ...this.state };
  }

  collectEPP(eppId: string, name: string, emoji: string): void {
    if (this.state.eppsCollected.includes(eppId)) return;

    this.state.eppsCollected.push(eppId);
    this.state.score += 50;
    this.addXP(15);

    eventBridge.emit('epp:collected', { eppId, name, emoji });
    this.emitXP();
  }

  answerQuiz(correct: boolean, points: number): void {
    this.state.quizzesAnswered++;
    if (correct) {
      this.state.quizzesCorrect++;
      this.state.score += points;
      this.addXP(25);
    } else {
      this.state.hp = Math.max(10, this.state.hp - 15);
      eventBridge.emit('player:health', {
        hp: this.state.hp,
        maxHp: this.state.maxHp,
      });
    }
  }

  private addXP(amount: number): void {
    this.state.xp += amount;

    // Level up check
    while (this.state.xp >= this.state.xpToNext) {
      this.state.xp -= this.state.xpToNext;
      this.state.level++;
      this.state.xpToNext = Math.floor(this.state.xpToNext * 1.5);
    }

    this.emitXP();
  }

  private emitXP(): void {
    eventBridge.emit('player:xp', {
      xp: this.state.xp,
      level: this.state.level,
      xpToNext: this.state.xpToNext,
    });
  }

  private emitAll(): void {
    eventBridge.emit('player:health', {
      hp: this.state.hp,
      maxHp: this.state.maxHp,
    });
    this.emitXP();
  }
}
