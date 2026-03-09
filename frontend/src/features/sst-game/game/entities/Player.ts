/**
 * Player Entity: Inspector SST
 * Los Héroes de la Seguridad
 */
import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private speed = 160;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasd: Record<string, Phaser.Input.Keyboard.Key> | null = null;
  private facing: 'down' | 'left' | 'right' | 'up' = 'down';

  // External joystick input (from nipplejs via eventBridge)
  public joystickAngle = -1;
  public joystickForce = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'inspector', 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Physics body
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 24);
    body.setOffset(6, 14);

    // Create animations from spritesheet frames
    this.createAnimations();

    // Input
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        w: scene.input.keyboard.addKey('W'),
        a: scene.input.keyboard.addKey('A'),
        s: scene.input.keyboard.addKey('S'),
        d: scene.input.keyboard.addKey('D'),
      };
    }
  }

  private createAnimations(): void {
    // Since we have a simple 4-frame spritesheet (one row, 32px each frame)
    // Frame 0 = down, 1 = left, 2 = right, 3 = up
    // For the POC, we use static frames per direction (no walk animation)
    this.setFrame(0); // Default facing down
  }

  update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let vx = 0;
    let vy = 0;

    // Keyboard input
    if (this.cursors && this.wasd) {
      if (this.cursors.left.isDown || this.wasd.a.isDown) vx = -1;
      else if (this.cursors.right.isDown || this.wasd.d.isDown) vx = 1;
      if (this.cursors.up.isDown || this.wasd.w.isDown) vy = -1;
      else if (this.cursors.down.isDown || this.wasd.s.isDown) vy = 1;
    }

    // Joystick input (mobile)
    if (this.joystickForce > 0.1) {
      const rad = (this.joystickAngle * Math.PI) / 180;
      vx = Math.cos(rad);
      vy = -Math.sin(rad); // nipplejs Y is inverted
    }

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const norm = 1 / Math.sqrt(2);
      vx *= norm;
      vy *= norm;
    }

    // Apply velocity
    body.setVelocity(vx * this.speed, vy * this.speed);

    // Update facing direction and frame
    if (vx < 0) {
      this.facing = 'left';
      this.setFrame(1);
    } else if (vx > 0) {
      this.facing = 'right';
      this.setFrame(2);
    } else if (vy < 0) {
      this.facing = 'up';
      this.setFrame(3);
    } else if (vy > 0) {
      this.facing = 'down';
      this.setFrame(0);
    }
  }

  getFacing(): string {
    return this.facing;
  }
}
