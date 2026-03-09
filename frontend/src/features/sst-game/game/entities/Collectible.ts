/**
 * Collectible Entity: Items EPP recolectables
 * Los Héroes de la Seguridad
 */
import Phaser from 'phaser';

export class Collectible extends Phaser.Physics.Arcade.Sprite {
  public itemId: string;
  public itemName: string;
  public emoji: string;
  public collected = false;

  private label: Phaser.GameObjects.Text;
  private glowCircle: Phaser.GameObjects.Arc;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: string,
    name: string,
    emoji: string,
    textureKey: string
  ) {
    super(scene, x, y, textureKey);

    this.itemId = id;
    this.itemName = name;
    this.emoji = emoji;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body

    // Glow effect circle behind
    this.glowCircle = scene.add.circle(x, y, 18, 0xf59e0b, 0.15);
    this.setDepth(2);
    this.glowCircle.setDepth(1);

    // Bobbing animation
    scene.tweens.add({
      targets: this,
      y: y - 4,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Glow pulse
    scene.tweens.add({
      targets: this.glowCircle,
      alpha: 0.35,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Label
    this.label = scene.add
      .text(x, y + 20, name, {
        fontSize: '8px',
        color: '#fbbf24',
        fontFamily: 'Inter, sans-serif',
      })
      .setOrigin(0.5)
      .setDepth(2);
  }

  collect(): void {
    if (this.collected) return;
    this.collected = true;

    // Collection animation
    this.scene.tweens.add({
      targets: [this, this.glowCircle, this.label],
      alpha: 0,
      y: this.y - 30,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
        this.glowCircle.destroy();
        this.label.destroy();
      },
    });
  }
}
