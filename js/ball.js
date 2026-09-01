/* ==========================================================================
   BRICK BREAKER DELUXE - BALL PHYSICS & RENDERING
   Manages ball velocities, angle calculations, sticky paddle attachment & trails.
   ========================================================================== */

class Ball {
  constructor(game, x = 400, y = 540, radius = 7) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.radius = radius;
    
    this.baseSpeed = 6.0;
    this.speed = this.baseSpeed;
    this.vx = 0;
    this.vy = 0;
    
    this.isAttached = true; // Attached to paddle at start or by magnet
    this.attachedOffsetX = 0;
    
    this.trail = [];
    this.maxTrailLength = 8;
  }

  attachToPaddle(paddle, offsetX = 0) {
    this.isAttached = true;
    this.attachedOffsetX = offsetX;
    this.vx = 0;
    this.vy = 0;
    this.x = paddle.x + this.attachedOffsetX;
    this.y = paddle.y - paddle.height / 2 - this.radius - 1;
  }

  launch(angle = -Math.PI / 2 + (Math.random() * 0.4 - 0.2)) {
    if (!this.isAttached) return;
    this.isAttached = false;
    const currentSpeed = this.getCurrentSpeed();
    this.vx = Math.cos(angle) * currentSpeed;
    this.vy = Math.sin(angle) * currentSpeed;
    
    // Ensure minimal vertical movement
    if (Math.abs(this.vy) < 2) {
      this.vy = -3;
    }
  }

  getCurrentSpeed() {
    let spd = this.baseSpeed;
    if (this.game.powerups.isActive("SLOWMO")) {
      spd *= 0.65;
    }
    return spd;
  }

  update() {
    if (this.isAttached) {
      this.x = this.game.paddle.x + this.attachedOffsetX;
      this.y = this.game.paddle.y - this.game.paddle.height / 2 - this.radius - 1;
      this.trail = [];
      return;
    }

    // Adjust velocity to match current active buffs (e.g. slowmo)
    const targetSpeed = this.getCurrentSpeed();
    const currentLength = Math.hypot(this.vx, this.vy);
    if (currentLength > 0.01) {
      const scale = targetSpeed / currentLength;
      this.vx *= scale;
      this.vy *= scale;
    }

    // Save trail position
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.pop();
    }

    // Movement
    this.x += this.vx;
    this.y += this.vy;

    // Wall collision - Left & Right
    if (this.x - this.radius <= 0) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx);
      if (window.soundEngine) window.soundEngine.playWallHit();
      if (window.particleSystem) window.particleSystem.createSparks(this.x, this.y, "#00f0ff", 6);
    } else if (this.x + this.radius >= this.game.canvas.width) {
      this.x = this.game.canvas.width - this.radius;
      this.vx = -Math.abs(this.vx);
      if (window.soundEngine) window.soundEngine.playWallHit();
      if (window.particleSystem) window.particleSystem.createSparks(this.x, this.y, "#00f0ff", 6);
    }

    // Wall collision - Top
    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.vy = Math.abs(this.vy);
      if (window.soundEngine) window.soundEngine.playWallHit();
      if (window.particleSystem) window.particleSystem.createSparks(this.x, this.y, "#00f0ff", 6);
    }

    // Ensure ball never gets stuck horizontally
    if (Math.abs(this.vy) < 1.0) {
      this.vy = this.vy >= 0 ? 1.5 : -1.5;
    }
  }

  handlePaddleCollision(paddle) {
    if (this.isAttached) return false;

    // AABB vs Circle
    const nearestX = Math.max(paddle.x - paddle.width / 2, Math.min(this.x, paddle.x + paddle.width / 2));
    const nearestY = Math.max(paddle.y - paddle.height / 2, Math.min(this.y, paddle.y + paddle.height / 2));
    const deltaX = this.x - nearestX;
    const deltaY = this.y - nearestY;

    if (deltaX * deltaX + deltaY * deltaY < this.radius * this.radius && this.vy > 0) {
      // If magnet is active, stick to paddle
      if (this.game.powerups.isActive("MAGNET")) {
        this.attachToPaddle(paddle, this.x - paddle.x);
        if (window.soundEngine) window.soundEngine.playPaddleHit();
        return true;
      }

      // Calculate reflection angle based on offset from center of paddle (-1 to +1)
      const hitOffset = (this.x - paddle.x) / (paddle.width / 2);
      const clampedOffset = Math.max(-0.95, Math.min(0.95, hitOffset));

      // Max bounce angle = 65 degrees from vertical
      const maxBounceAngle = (65 * Math.PI) / 180;
      const bounceAngle = clampedOffset * maxBounceAngle;

      const currentSpeed = this.getCurrentSpeed();
      this.vx = Math.sin(bounceAngle) * currentSpeed;
      this.vy = -Math.cos(bounceAngle) * currentSpeed;

      // Position out of paddle
      this.y = paddle.y - paddle.height / 2 - this.radius - 1;

      if (window.soundEngine) window.soundEngine.playPaddleHit();
      if (window.particleSystem) {
        window.particleSystem.createSparks(this.x, this.y, "#00f0ff", 10);
      }
      return true;
    }
    return false;
  }

  isOutOfBounds(canvasHeight) {
    return this.y - this.radius > canvasHeight;
  }

  draw(ctx) {
    const isFireball = this.game.powerups.isActive("FIREBALL");
    const mainColor = isFireball ? "#ff3700" : "#00f0ff";

    // Draw glowing motion trail
    if (this.trail.length > 1) {
      for (let i = 0; i < this.trail.length; i++) {
        const pt = this.trail[i];
        const alpha = (1 - i / this.trail.length) * 0.45;
        const r = this.radius * (1 - i / this.trail.length * 0.5);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = isFireball ? "#ffaa00" : mainColor;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Draw Main Ball
    ctx.save();
    ctx.shadowColor = mainColor;
    ctx.shadowBlur = isFireball ? 16 : 10;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer glow aura
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = isFireball ? 3 : 2;
    ctx.stroke();
    ctx.restore();
  }
}

window.Ball = Ball;
