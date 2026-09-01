/* ==========================================================================
   BRICK BREAKER DELUXE - BRICK CLASSES & GRID LOGIC
   Manages brick types, hit points, destruction events, explosive cascades & scoring.
   Clean technical visuals with zero emoji symbols.
   ========================================================================== */

const BRICK_TYPES = {
  1: { id: "STANDARD", maxHp: 1, color: "#00f0ff", points: 100, canBreak: true, dropChance: 0.18 },
  2: { id: "HARDENED", maxHp: 2, color: "#ffaa00", points: 200, canBreak: true, dropChance: 0.25 },
  3: { id: "ARMORED",  maxHp: 3, color: "#ff007f", points: 350, canBreak: true, dropChance: 0.35 },
  4: { id: "STEEL",    maxHp: Infinity, color: "#8899aa", points: 0, canBreak: false, dropChance: 0 },
  5: { id: "EXPLOSIVE",maxHp: 1, color: "#ff2200", points: 250, canBreak: true, dropChance: 0.40, isExplosive: true },
  6: { id: "MYSTERY",  maxHp: 1, color: "#ffe600", points: 300, canBreak: true, dropChance: 1.0 },
  7: { id: "EMERALD",  maxHp: 2, color: "#00ff88", points: 250, canBreak: true, dropChance: 0.22 },
  8: { id: "PURPLE",   maxHp: 2, color: "#a855f7", points: 250, canBreak: true, dropChance: 0.22 },
  9: { id: "CYAN_DEEP",maxHp: 1, color: "#0099ff", points: 120, canBreak: true, dropChance: 0.15 }
};

class Brick {
  constructor(x, y, width, height, typeCode = 1, row = 0, col = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.typeCode = typeCode;
    this.row = row;
    this.col = col;

    const config = BRICK_TYPES[typeCode] || BRICK_TYPES[1];
    this.typeId = config.id;
    this.maxHp = config.maxHp;
    this.hp = config.maxHp;
    this.baseColor = config.color;
    this.points = config.points;
    this.canBreak = config.canBreak;
    this.dropChance = config.dropChance;
    this.isExplosive = !!config.isExplosive;
    
    this.destroyed = false;
    this.flashTimer = 0;
    this.pulse = Math.random() * Math.PI * 2;
  }

  hit(damage = 1) {
    if (!this.canBreak) {
      if (window.soundEngine) window.soundEngine.playWallHit();
      if (window.particleSystem) {
        window.particleSystem.createSparks(this.x + this.width / 2, this.y + this.height / 2, "#ffffff", 6);
      }
      return { destroyed: false, points: 0, powerupDrop: false };
    }

    this.hp -= damage;
    this.flashTimer = 4;

    if (this.hp <= 0) {
      this.destroyed = true;
      const willDrop = Math.random() < this.dropChance;
      return {
        destroyed: true,
        points: this.points,
        powerupDrop: willDrop,
        isExplosive: this.isExplosive,
        x: this.x + this.width / 2,
        y: this.y + this.height / 2
      };
    }

    return { destroyed: false, points: 50, powerupDrop: false };
  }

  draw(ctx) {
    if (this.destroyed) return;

    ctx.save();
    this.pulse += 0.04;

    const cornerRadius = 3;
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;

    // Flash on hit
    if (this.flashTimer > 0) {
      this.flashTimer--;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = this.getColorForHp();
      ctx.shadowColor = this.baseColor;
      ctx.shadowBlur = this.typeId === "MYSTERY" || this.typeId === "EXPLOSIVE" ? Math.sin(this.pulse) * 3 + 6 : 3;
    }

    // Draw rounded rectangle
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, cornerRadius);
    ctx.fill();

    // Top bevel line
    ctx.fillStyle = "rgba(255, 255, 255, 0.24)";
    ctx.fillRect(x + 2, y + 1, w - 4, 2);

    // Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw typography markers instead of emojis
    if (this.typeId === "EXPLOSIVE") {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px 'Orbitron', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TNT", x + w / 2, y + h / 2 + 1);
    } else if (this.typeId === "MYSTERY") {
      ctx.fillStyle = "#0c1020";
      ctx.font = "bold 9px 'Orbitron', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ITEM", x + w / 2, y + h / 2 + 1);
    } else if (this.typeId === "STEEL") {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 4);
      ctx.lineTo(x + w - 4, y + h - 4);
      ctx.moveTo(x + w - 4, y + 4);
      ctx.lineTo(x + 4, y + h - 4);
      ctx.stroke();
    } else if (this.hp < this.maxHp) {
      // Crack fracture lines
      ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, y + 2);
      ctx.lineTo(x + w * 0.5, y + h * 0.6);
      ctx.lineTo(x + w * 0.8, y + h - 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  getColorForHp() {
    if (this.typeId === "ARMORED") {
      if (this.hp === 2) return "#d9006c";
      if (this.hp === 1) return "#940049";
    }
    if (this.typeId === "HARDENED" && this.hp === 1) {
      return "#cc8800";
    }
    return this.baseColor;
  }
}

window.BRICK_TYPES = BRICK_TYPES;
window.Brick = Brick;
