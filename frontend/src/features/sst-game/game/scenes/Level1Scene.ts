/**
 * Level1Scene: Planta Industrial RISKORP
 * Los Héroes de la Seguridad — Proof of Concept
 *
 * Mapa procedural con tiles, NPCs, EPP items y zona de salida.
 */
import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { Collectible } from '../entities/Collectible';
import { ProgressSystem } from '../systems/ProgressSystem';
import { eventBridge } from '../utils/eventBridge';

// Map dimensions (tiles)
const COLS = 20;
const ROWS = 12;
const TILE_SIZE = 48;

// Map: 0=floor, 1=wall, 2=danger, 3=exit
const MAP_DATA: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 1, 0, 0, 0, 2, 2, 0, 0, 1, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 1, 0, 0, 0, 2, 2, 0, 0, 1, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export class Level1Scene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private collectibles: Collectible[] = [];
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;
  private progress!: ProgressSystem;
  private interactKey: Phaser.Input.Keyboard.Key | null = null;
  private quizActive = false;
  private startTime = 0;
  private nearNPCText: Phaser.GameObjects.Text | null = null;
  private levelCompleted = false;

  constructor() {
    super({ key: 'Level1Scene' });
  }

  create(): void {
    this.progress = new ProgressSystem();
    this.startTime = Date.now();
    this.quizActive = false;
    this.levelCompleted = false;

    // Build map
    this.buildMap();

    // Create player at spawn point
    this.player = new Player(this, TILE_SIZE * 2, TILE_SIZE * 2);

    // Create NPCs
    this.createNPCs();

    // Create EPP collectibles
    this.createCollectibles();

    // Collisions
    this.physics.add.collider(this.player, this.wallGroup);

    // EPP overlap detection
    this.collectibles.forEach((item) => {
      this.physics.add.overlap(this.player, item, () => {
        if (!item.collected) {
          item.collect();
          this.progress.collectEPP(item.itemId, item.itemName, item.emoji);
        }
      });
    });

    // Interact key (E or Space)
    if (this.input.keyboard) {
      this.interactKey = this.input.keyboard.addKey('E');
      this.input.keyboard.addKey('SPACE').on('down', () => this.tryInteract());
    }

    // Camera follows player
    this.cameras.main.setBounds(0, 0, COLS * TILE_SIZE, ROWS * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1);

    // World bounds
    this.physics.world.setBounds(0, 0, COLS * TILE_SIZE, ROWS * TILE_SIZE);

    // Event bridge listeners
    this.setupEventBridge();

    // Title text
    this.add
      .text((COLS * TILE_SIZE) / 2, 16, 'PLANTA INDUSTRIAL RISKORP', {
        fontSize: '11px',
        color: '#f59e0b',
        fontFamily: 'Montserrat, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);

    // Hint text at bottom
    this.nearNPCText = this.add
      .text((COLS * TILE_SIZE) / 2, ROWS * TILE_SIZE - 20, '', {
        fontSize: '10px',
        color: '#fbbf24',
        fontFamily: 'Inter, sans-serif',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100);

    // Notify React that game is ready
    eventBridge.emit('game:ready');
  }

  update(): void {
    if (this.quizActive || this.levelCompleted) return;

    this.player.update();

    // Check proximity to NPCs for hint
    let nearNPC = false;
    this.npcs.forEach((npc) => {
      if (npc.interacted) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist < 60) {
        nearNPC = true;
      }
    });

    if (this.nearNPCText) {
      this.nearNPCText.setText(nearNPC ? '[E / ESPACIO] Investigar riesgo' : '');
    }

    // Check interact key
    if (this.interactKey?.isDown) {
      this.interactKey.reset();
      this.tryInteract();
    }

    // Check if player is on exit zone
    this.checkExitZone();
  }

  private buildMap(): void {
    this.wallGroup = this.physics.add.staticGroup();

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = MAP_DATA[row][col];
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        let textureKey = 'tile-floor';

        switch (tile) {
          case 0:
            textureKey = 'tile-floor';
            break;
          case 1:
            textureKey = 'tile-wall';
            break;
          case 2:
            textureKey = 'tile-danger';
            break;
          case 3:
            textureKey = 'tile-exit';
            break;
        }

        const tileSprite = this.add.image(x, y, textureKey);
        tileSprite.setDisplaySize(TILE_SIZE, TILE_SIZE);

        // Walls are solid
        if (tile === 1) {
          const wallBlock = this.wallGroup.create(x, y, textureKey);
          wallBlock.setDisplaySize(TILE_SIZE, TILE_SIZE);
          wallBlock.refreshBody();
          tileSprite.destroy(); // Remove the image, we use the physics sprite
        }
      }
    }
  }

  private createNPCs(): void {
    const npcConfigs = [
      {
        id: 'npc-1',
        x: TILE_SIZE * 5,
        y: TILE_SIZE * 2,
        name: 'Técnico Carlos',
        questionIds: [1, 2],
      },
      {
        id: 'npc-2',
        x: TILE_SIZE * 12,
        y: TILE_SIZE * 6,
        name: 'Operaria María',
        questionIds: [3, 4],
      },
      {
        id: 'npc-3',
        x: TILE_SIZE * 16,
        y: TILE_SIZE * 3,
        name: 'Supervisor Andrés',
        questionIds: [5, 6],
      },
    ];

    npcConfigs.forEach((config) => {
      const npc = new NPC(this, config.x, config.y, config.id, config.name, config.questionIds);
      this.npcs.push(npc);
      this.physics.add.collider(this.player, npc);
    });
  }

  private createCollectibles(): void {
    const eppConfigs = [
      {
        id: 'casco',
        x: TILE_SIZE * 3,
        y: TILE_SIZE * 5,
        name: 'Casco SST',
        emoji: '⛑',
        texture: 'epp-casco',
      },
      {
        id: 'guantes',
        x: TILE_SIZE * 9,
        y: TILE_SIZE * 2,
        name: 'Guantes',
        emoji: '🧤',
        texture: 'epp-guantes',
      },
      {
        id: 'gafas',
        x: TILE_SIZE * 15,
        y: TILE_SIZE * 8,
        name: 'Gafas',
        emoji: '🥽',
        texture: 'epp-gafas',
      },
      {
        id: 'botas',
        x: TILE_SIZE * 11,
        y: TILE_SIZE * 9,
        name: 'Botas',
        emoji: '🥾',
        texture: 'epp-botas',
      },
      {
        id: 'overol',
        x: TILE_SIZE * 6,
        y: TILE_SIZE * 9,
        name: 'Overol',
        emoji: '🦺',
        texture: 'epp-overol',
      },
    ];

    eppConfigs.forEach((config) => {
      const item = new Collectible(
        this,
        config.x,
        config.y,
        config.id,
        config.name,
        config.emoji,
        config.texture
      );
      this.collectibles.push(item);
    });
  }

  private tryInteract(): void {
    if (this.quizActive) return;

    this.npcs.forEach((npc) => {
      if (npc.interacted) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist < 60) {
        this.quizActive = true;
        eventBridge.emit('quiz:start', {
          npcId: npc.npcId,
          questionIds: npc.questionIds,
        });
      }
    });
  }

  private setupEventBridge(): void {
    // Quiz answered from React
    eventBridge.on('quiz:answer', (payload: unknown) => {
      const { correct } = payload as { questionId: number; answerId: string; correct: boolean };
      this.progress.answerQuiz(correct, 100);
    });

    // Quiz closed from React
    eventBridge.on('quiz:close', () => {
      this.quizActive = false;

      // Mark the NPC as interacted (find which one was active)
      this.npcs.forEach((npc) => {
        if (!npc.interacted) {
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
          if (dist < 80) {
            npc.markInteracted();
          }
        }
      });
    });

    // Joystick input from mobile
    eventBridge.on('input:joystick', (payload: unknown) => {
      const { angle, force } = payload as { angle: number; force: number };
      this.player.joystickAngle = angle;
      this.player.joystickForce = force;
    });

    eventBridge.on('input:joystick-end', () => {
      this.player.joystickForce = 0;
    });

    // Action button from mobile
    eventBridge.on('input:action', () => {
      this.tryInteract();
    });

    // Game pause/resume
    eventBridge.on('game:pause', () => {
      this.scene.pause();
    });

    eventBridge.on('game:resume', () => {
      this.scene.resume();
    });
  }

  private checkExitZone(): void {
    // Exit zone is at bottom-right (tiles with value 3)
    const playerTileCol = Math.floor(this.player.x / TILE_SIZE);
    const playerTileRow = Math.floor(this.player.y / TILE_SIZE);

    if (
      playerTileRow >= 0 &&
      playerTileRow < ROWS &&
      playerTileCol >= 0 &&
      playerTileCol < COLS &&
      MAP_DATA[playerTileRow]?.[playerTileCol] === 3
    ) {
      // Check if enough objectives completed
      const state = this.progress.getState();
      const allNPCsInteracted = this.npcs.every((n) => n.interacted);
      const enoughEPP = state.eppsCollected.length >= 3;

      if (allNPCsInteracted && enoughEPP && !this.levelCompleted) {
        this.levelCompleted = true;
        const duration = Math.floor((Date.now() - this.startTime) / 1000);

        eventBridge.emit('level:complete', {
          score: state.score,
          xp: state.xp,
          epps: state.eppsCollected,
          correctAnswers: state.quizzesCorrect,
          totalQuestions: state.quizzesAnswered,
          duration,
        });
      } else if (!allNPCsInteracted || !enoughEPP) {
        // Show hint
        if (this.nearNPCText) {
          const hints: string[] = [];
          if (!allNPCsInteracted) hints.push('Investiga todos los riesgos');
          if (!enoughEPP) hints.push('Recolecta más EPP');
          this.nearNPCText.setText(hints.join(' | '));
        }
      }
    }
  }
}
