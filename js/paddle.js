/* ==========================================================================
   BRICK BREAKER DELUXE - PADDLE & LASER CANNONS
   Player-controlled platform with motion smoothing, width buffs & laser blasters.
   ========================================================================== */

class LaserBullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 3;
    this.height = 12;
    this.vy = -11;
  }

  update() {
    this.y += this.vy;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ff0055";
    ctx.shadowBlur = 10;
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
    
    // Core glow line
    ctx.strokeStyle = "#ff0055";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x - this.width / 2, this.y, this.width, this.height);
    ctx.restore();
  }

  isOutOfBounds() {
    return this.y + this.height < 0;
  }
}

class Paddle {
  constructor(game) {
    this.game = game;
    this.baseWidth = 100;
    this.width = this.baseWidth;
    this.height = 14;
    
    this.x = game.canvas.width / 2;
    this.y = game.canvas.height - 35;
    
    this.targetX = this.x;
    this.speed = 10;
    this.vx = 0;
    
    this.lasers = [];
    this.laserCooldown = 0;
    this.thrusterAnim = 0;
  }

  reset() {
    this.x = this.game.canvas.width / 2;
    this.targetX = this.x;
    this.vx = 0;
    this.lasers = [];
    this.laserCooldown = 0;
  }

  moveTo(targetX) {
    this.targetX = Math.max(this.width / 2, Math.min(this.game.canvas.width - this.width / 2, targetX));
  }

  moveLeft() {
    this.moveTo(this.x - this.speed);
  }

  moveRight() {
    this.moveTo(this.x + this.speed);
  }

  fireLasers() {
    if (!this.game.powerups.isActive("LASER")) return;
    if (this.laserCooldown > 0) return;

    this.laserCooldown = 15; // frames between laser bursts
    const leftGunX = this.x - this.width / 2 + 8;
    const rightGunX = this.x + this.width / 2 - 8;
    const gunY = this.y - this.height / 2 - 4;

    this.lasers.push(new LaserBullet(leftGunX, gunY));
    this.lasers.push(new LaserBullet(rightGunX, gunY));

    if (window.soundEngine) window.soundEngine.playLaserFire();
    if (window.particleSystem) {
      window.particleSystem.createLaserSparks(leftGunX, gunY);
      window.particleSystem.createLaserSparks(rightGunX, gunY);
    }
  }

  update() {
    // Dynamic width expansion based on active buff
    const isWide = this.game.powerups.isActive("WIDE_PADDLE");
    const targetWidth = isWide ? this.baseWidth * 1.45 : this.baseWidth;
    this.width += (targetWidth - this.width) * 0.15;

    // Smooth movement lerp
    const prevX = this.x;
    this.x += (this.targetX - this.x) * 0.35;
    this.vx = this.x - prevX;

    // Keep within bounds
    const halfW = this.width / 2;
    if (this.x - halfW < 0) {
      this.x = halfW;
      this.targetX = halfW;
    } else if (this.x + halfW > this.game.canvas.width) {
      this.x = this.game.canvas.width - halfW;
      this.targetX = this.game.canvas.width - halfW;
    }

    // Laser bullets update
    if (this.laserCooldown > 0) {
      this.laserCooldown--;
    }

    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.update();

      // Check collision with bricks
      let hit = false;
      for (const brick of this.game.bricks) {
        if (brick.destroyed) continue;
        if (
          laser.x >= brick.x &&
          laser.x <= brick.x + brick.width &&
          laser.y >= brick.y &&
          laser.y <= brick.y + brick.height
        ) {
          hit = true;
          this.game.handleBrickHit(brick, 1);
          if (window.particleSystem) {
            window.particleSystem.createLaserSparks(laser.x, laser.y);
          }
          break;
        }
      }

      if (hit || laser.isOutOfBounds()) {
        this.lasers.splice(i, 1);
      }
    }

    this.thrusterAnim += 0.1;
  }

  draw(ctx) {
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    const x = this.x - halfW;
    const y = this.y - halfH;
    const w = this.width;
    const h = this.height;

    ctx.save();

    // Bottom shield bar if shield is active
    if (this.game.powerups.isActive("SHIELD")) {
      ctx.save();
      ctx.strokeStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, this.game.canvas.height - 4);
      ctx.lineTo(this.game.canvas.width, this.game.canvas.height - 4);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Laser Cannons if Laser Powerup is active
    if (this.game.powerups.isActive("LASER")) {
      ctx.fillStyle = "#ff0055";
      ctx.shadowColor = "#ff0055";
      ctx.shadowBlur = 8;
      // Left gun
      ctx.fillRect(x + 4, y - 6, 6, 8);
      // Right gun
      ctx.fillRect(x + w - 10, y - 6, 6, 8);
    }

    // Draw Lasers
    for (const laser of this.lasers) {
      laser.draw(ctx);
    }

    // Draw Paddle Main Chassis
    const isMagnet = this.game.powerups.isActive("MAGNET");
    const mainThemeColor = isMagnet ? "#a855f7" : "#00f0ff";

    ctx.fillStyle = "#0c1022";
    ctx.strokeStyle = mainThemeColor;
    ctx.shadowColor = mainThemeColor;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();

    // Center Core Light / Power Crystal
    const coreW = Math.min(30, w * 0.3);
    ctx.fillStyle = mainThemeColor;
    ctx.beginPath();
    ctx.roundRect(this.x - coreW / 2, y + 3, coreW, h - 6, 3);
    ctx.fill();

    // Top Reflex Strip
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillRect(x + 6, y + 2, w - 12, 2);

    ctx.restore();
  }
}

window.Paddle = Paddle;
