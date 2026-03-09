/**
 * NPC Entity: Trabajadores que activan quizzes
 * Los Héroes de la Seguridad
 */
import Phaser from 'phaser';

export class NPC extends Phaser.Physics.Arcade.Sprite {
  public npcId: string;
  public npcName: string;
  public questionIds: number[];
  public interacted = false;

  private interactionZone: Phaser.GameObjects.Zone;
  private label: Phaser.GameObjects.Text;
  private exclamation: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: string,
    name: string,
    questionIds: number[]
  ) {
    super(scene, x, y, 'npc-worker');

    this.npcId = id;
    this.npcName = name;
    this.questionIds = questionIds;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body

    // Interaction zone (larger than sprite for easier triggering)
    this.interactionZone = scene.add.zone(x, y, 60, 60);
    scene.physics.add.existing(this.interactionZone, true);

    // Name label below NPC
    this.label = scene.add
      .text(x, y + 24, name, {
        fontSize: '9px',
        color: '#94a3b8',
        fontFamily: 'Inter, sans-serif',
      })
      .setOrigin(0.5);

    // Exclamation mark (pulsing)
    this.exclamation = scene.add
      .text(x, y - 28, '!', {
        fontSize: '18px',
        color: '#ef4444',
        fontFamily: 'Montserrat, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Pulse animation on exclamation
    scene.tweens.add({
      targets: this.exclamation,
      y: y - 34,
      alpha: 0.5,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  getInteractionZone(): Phaser.GameObjects.Zone {
    return this.interactionZone;
  }

  markInteracted(): void {
    this.interacted = true;
    this.exclamation.setText('✓');
    this.exclamation.setColor('#22c55e');
    this.exclamation.setFontSize(16);
    // Stop pulse
    this.scene.tweens.killTweensOf(this.exclamation);
    this.exclamation.setAlpha(1);
  }
}
