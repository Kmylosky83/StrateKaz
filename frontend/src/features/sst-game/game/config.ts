/**
 * Phaser Game Configuration
 * Los Héroes de la Seguridad
 */
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { Level1Scene } from './scenes/Level1Scene';

export function createGameConfig(
  parent: HTMLElement,
  isMobile: boolean
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 800,
    height: 480,
    backgroundColor: '#150f07',
    pixelArt: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, Level1Scene],
    render: {
      antialias: true,
      roundPixels: false,
      // Reduce quality on mobile for performance
      pixelArt: false,
    },
    input: {
      keyboard: !isMobile,
      touch: isMobile,
    },
  };
}
