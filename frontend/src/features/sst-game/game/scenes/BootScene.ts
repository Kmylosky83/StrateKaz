/**
 * BootScene: Precarga de assets del juego
 * Los Héroes de la Seguridad
 */
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Progress bar
    const { width, height } = this.cameras.main;
    const barWidth = 300;
    const barHeight = 20;
    const barX = (width - barWidth) / 2;
    const barY = height / 2;

    // Background
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0f);
    bg.setOrigin(0.5);

    // Title
    this.add
      .text(width / 2, barY - 60, 'LOS HÉROES DE LA SEGURIDAD', {
        fontSize: '16px',
        color: '#f59e0b',
        fontFamily: 'Montserrat, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, barY - 30, 'Cargando...', {
        fontSize: '12px',
        color: '#94a3b8',
        fontFamily: 'Inter, sans-serif',
      })
      .setOrigin(0.5);

    // Bar outline
    const barOutline = this.add.rectangle(barX + barWidth / 2, barY, barWidth, barHeight);
    barOutline.setStrokeStyle(2, 0xf59e0b);

    // Bar fill
    const barFill = this.add.rectangle(barX + 2, barY, 0, barHeight - 4, 0xf59e0b);
    barFill.setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      barFill.width = (barWidth - 4) * value;
    });

    // =============================================
    // LOAD GAME ASSETS
    // =============================================

    // Generate placeholder sprites programmatically (no external files needed for POC)
    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start('Level1Scene');
  }

  private createPlaceholderTextures(): void {
    // --- PLAYER SPRITE ---
    const playerGraphics = this.make.graphics({ x: 0, y: 0 });
    // 4 frames: down, left, right, up (each 32x40)
    const frameW = 32;
    const frameH = 40;
    const directions = [0, 1, 2, 3]; // down, left, right, up

    directions.forEach((dir) => {
      const ox = dir * frameW;

      // Body (orange vest)
      playerGraphics.fillStyle(0xf97316);
      playerGraphics.fillRect(ox + 6, 14, 20, 18);

      // Vest stripes
      playerGraphics.fillStyle(0xfbbf24);
      playerGraphics.fillRect(ox + 6, 18, 20, 3);
      playerGraphics.fillRect(ox + 6, 24, 20, 3);

      // Head (skin)
      playerGraphics.fillStyle(0xfde68a);
      playerGraphics.fillRect(ox + 8, 4, 16, 12);

      // Helmet (yellow)
      playerGraphics.fillStyle(0xf59e0b);
      playerGraphics.fillRect(ox + 6, 0, 20, 8);
      playerGraphics.fillRect(ox + 4, 5, 24, 4);

      // Eyes
      playerGraphics.fillStyle(0x1e293b);
      if (dir === 0) {
        // facing down
        playerGraphics.fillRect(ox + 10, 10, 3, 3);
        playerGraphics.fillRect(ox + 19, 10, 3, 3);
      } else if (dir === 3) {
        // facing up — no eyes visible
      } else {
        // side
        playerGraphics.fillRect(ox + 14, 10, 3, 3);
      }

      // Legs
      playerGraphics.fillStyle(0x1e293b);
      playerGraphics.fillRect(ox + 8, 32, 7, 8);
      playerGraphics.fillRect(ox + 17, 32, 7, 8);

      // Boots
      playerGraphics.fillStyle(0x78350f);
      playerGraphics.fillRect(ox + 7, 36, 8, 4);
      playerGraphics.fillRect(ox + 17, 36, 8, 4);
    });

    playerGraphics.generateTexture('inspector', frameW * 4, frameH);
    playerGraphics.destroy();

    // --- NPC SPRITE ---
    const npcGraphics = this.make.graphics({ x: 0, y: 0 });
    // Worker NPC (blue uniform)
    npcGraphics.fillStyle(0x3b82f6);
    npcGraphics.fillRect(6, 14, 20, 18);
    npcGraphics.fillStyle(0xfde68a);
    npcGraphics.fillRect(8, 4, 16, 12);
    npcGraphics.fillStyle(0x60a5fa);
    npcGraphics.fillRect(6, 0, 20, 8);
    npcGraphics.fillStyle(0x1e293b);
    npcGraphics.fillRect(10, 10, 3, 3);
    npcGraphics.fillRect(19, 10, 3, 3);
    npcGraphics.fillStyle(0x1e293b);
    npcGraphics.fillRect(8, 32, 7, 8);
    npcGraphics.fillRect(17, 32, 7, 8);

    // Exclamation mark above NPC
    npcGraphics.fillStyle(0xef4444);
    npcGraphics.fillTriangle(16, -10, 12, -2, 20, -2);

    npcGraphics.generateTexture('npc-worker', 32, 40);
    npcGraphics.destroy();

    // --- EPP ITEMS ---
    const eppItems = [
      { key: 'epp-casco', color: 0xf59e0b, label: '⛑' },
      { key: 'epp-guantes', color: 0x22c55e, label: '🧤' },
      { key: 'epp-gafas', color: 0x3b82f6, label: '🥽' },
      { key: 'epp-botas', color: 0x78350f, label: '🥾' },
      { key: 'epp-overol', color: 0xf97316, label: '🦺' },
    ];

    eppItems.forEach(({ key, color }) => {
      const g = this.make.graphics({ x: 0, y: 0 });
      // Glowing circle background
      g.fillStyle(color, 0.3);
      g.fillCircle(16, 16, 14);
      g.fillStyle(color, 0.7);
      g.fillCircle(16, 16, 10);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(16, 16, 6);
      g.generateTexture(key, 32, 32);
      g.destroy();
    });

    // --- HAZARD WARNING ---
    const hazardGraphics = this.make.graphics({ x: 0, y: 0 });
    hazardGraphics.fillStyle(0xef4444, 0.6);
    hazardGraphics.fillCircle(16, 16, 14);
    hazardGraphics.lineStyle(2, 0xef4444);
    hazardGraphics.strokeCircle(16, 16, 14);
    hazardGraphics.fillStyle(0xffffff);
    hazardGraphics.fillTriangle(16, 6, 8, 24, 24, 24);
    hazardGraphics.generateTexture('hazard', 32, 32);
    hazardGraphics.destroy();

    // --- TILES ---
    // Ground tile
    const groundG = this.make.graphics({ x: 0, y: 0 });
    groundG.fillStyle(0x374151);
    groundG.fillRect(0, 0, 48, 48);
    groundG.fillStyle(0x3d4654);
    groundG.fillRect(2, 2, 44, 44);
    // Add subtle grid
    groundG.lineStyle(1, 0x4b5563, 0.3);
    groundG.strokeRect(0, 0, 48, 48);
    groundG.generateTexture('tile-ground', 48, 48);
    groundG.destroy();

    // Wall tile
    const wallG = this.make.graphics({ x: 0, y: 0 });
    wallG.fillStyle(0x1e293b);
    wallG.fillRect(0, 0, 48, 48);
    wallG.fillStyle(0x334155);
    wallG.fillRect(2, 2, 20, 20);
    wallG.fillRect(26, 2, 20, 20);
    wallG.fillRect(2, 26, 20, 20);
    wallG.fillRect(26, 26, 20, 20);
    wallG.lineStyle(1, 0x475569);
    wallG.strokeRect(0, 0, 48, 48);
    wallG.generateTexture('tile-wall', 48, 48);
    wallG.destroy();

    // Floor tile (inside areas)
    const floorG = this.make.graphics({ x: 0, y: 0 });
    floorG.fillStyle(0x44403a);
    floorG.fillRect(0, 0, 48, 48);
    floorG.fillStyle(0x4d4639, 0.5);
    floorG.fillRect(12, 0, 24, 48);
    floorG.fillRect(0, 12, 48, 24);
    floorG.lineStyle(1, 0x57534e, 0.2);
    floorG.strokeRect(0, 0, 48, 48);
    floorG.generateTexture('tile-floor', 48, 48);
    floorG.destroy();

    // Danger zone tile
    const dangerG = this.make.graphics({ x: 0, y: 0 });
    dangerG.fillStyle(0x44403a);
    dangerG.fillRect(0, 0, 48, 48);
    // Yellow/black stripes
    for (let i = 0; i < 6; i++) {
      dangerG.fillStyle(i % 2 === 0 ? 0xf59e0b : 0x1e293b, 0.4);
      dangerG.fillRect(i * 8, 0, 8, 48);
    }
    dangerG.generateTexture('tile-danger', 48, 48);
    dangerG.destroy();

    // Exit zone tile
    const exitG = this.make.graphics({ x: 0, y: 0 });
    exitG.fillStyle(0x052e16);
    exitG.fillRect(0, 0, 48, 48);
    exitG.fillStyle(0x22c55e, 0.3);
    exitG.fillRect(4, 4, 40, 40);
    exitG.lineStyle(2, 0x22c55e, 0.6);
    exitG.strokeRect(2, 2, 44, 44);
    exitG.generateTexture('tile-exit', 48, 48);
    exitG.destroy();
  }
}
