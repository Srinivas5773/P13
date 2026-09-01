/* ==========================================================================
   BRICK BREAKER DELUXE - PARTICLE & FLOATING TEXT ENGINE
   Renders physical spark particles, debris, explosions, and floating combo text.
   ========================================================================== */

class Particle {
  constructor(x, y, color, speed, size, life, angle = null) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.alpha = 1.0;
    
    const dir = angle !== null ? angle : Math.random() * Math.PI * 2;
    const spd = (Math.random() * 0.7 + 0.3) * speed;
    this.vx = Math.cos(dir) * spd;
    this.vy = Math.sin(dir) * spd;
    this.gravity = 0.08;
    this.friction = 0.98;
  }

  update() {
    this.vy += this.gravity;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.5, this.size * this.alpha), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() {
    return this.life <= 0 || this.alpha <= 0;
  }
}

class FloatingText {
  constructor(x, y, text, color = "#00f0ff", size = 16, duration = 40) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.maxDuration = duration;
    this.duration = duration;
    this.vy = -1.2;
  }

  update() {
    this.y += this.vy;
    this.duration--;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.duration / this.maxDuration);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.font = `bold ${this.size}px 'Orbitron', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }

  isDead() {
    return this.duration <= 0;
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.enabled = true;
  }

  createSparks(x, y, color = "#00f0ff", count = 12, speed = 4) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color, speed, Math.random() * 3 + 2, 25 + Math.random() * 15));
    }
  }

  createExplosion(x, y, color = "#ff5500", count = 35) {
    if (!this.enabled) return;
    const colors = [color, "#ffe600", "#ff0055", "#ffffff"];
    for (let i = 0; i < count; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(new Particle(x, y, col, 6 + Math.random() * 4, Math.random() * 4 + 2, 35 + Math.random() * 20));
    }
  }

  createLaserSparks(x, y, color = "#ff007f") {
    if (!this.enabled) return;
    for (let i = 0; i < 6; i++) {
      this.particles.push(new Particle(x, y, color, 3, 2, 15));
    }
  }

  createFloatingText(x, y, text, color = "#ffe600", size = 16) {
    this.floatingTexts.push(new FloatingText(x, y, text, color, size));
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].update();
      if (this.floatingTexts[i].isDead()) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
    for (const t of this.floatingTexts) {
      t.draw(ctx);
    }
  }

  clear() {
    this.particles = [];
    this.floatingTexts = [];
  }
}

window.particleSystem = new ParticleSystem();
