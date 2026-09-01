/* ==========================================================================
   BRICK BREAKER DELUXE - POWER-UPS SYSTEM
   Handles falling powerup capsules, collections, durations, and buffs.
   Clean, human-engineered technical design with zero emoji symbols.
   ========================================================================== */

const POWERUP_TYPES = {
  MULTIBALL: {
    id: "multiball",
    name: "Multi-Ball",
    symbol: "[MULTI]",
    color: "#ffe600",
    duration: 0,
    isBuff: true
  },
  LASER: {
    id: "laser",
    name: "Laser Cannons",
    symbol: "[LASER]",
    color: "#ff0055",
    duration: 12000,
    isBuff: true
  },
  FIREBALL: {
    id: "fireball",
    name: "Pierce Ball",
    symbol: "[PIERCE]",
    color: "#ff5500",
    duration: 10000,
    isBuff: true
  },
  WIDE_PADDLE: {
    id: "wide_paddle",
    name: "Wide Chassis",
    symbol: "[WIDE]",
    color: "#00f0ff",
    duration: 14000,
    isBuff: true
  },
  SHIELD: {
    id: "shield",
    name: "Energy Shield",
    symbol: "[SHIELD]",
    color: "#38bdf8",
    duration: 0,
    isBuff: true
  },
  MAGNET: {
    id: "magnet",
    name: "Magnetic Grip",
    symbol: "[CATCH]",
    color: "#a855f7",
    duration: 12000,
    isBuff: true
  },
  SLOWMO: {
    id: "slowmo",
    name: "Dilation",
    symbol: "[SLOW]",
    color: "#00ff88",
    duration: 8000,
    isBuff: true
  },
  EXTRA_LIFE: {
    id: "extra_life",
    name: "Hull Repair",
    symbol: "[HULL+]",
    color: "#ff3366",
    duration: 0,
    isBuff: true
  },
  BONUS_SCORE: {
    id: "bonus_score",
    name: "Bonus Score",
    symbol: "[+500]",
    color: "#3b82f6",
    duration: 0,
    isBuff: true
  }
};

class PowerUpItem {
  constructor(x, y, typeKey) {
    this.x = x;
    this.y = y;
    this.typeKey = typeKey;
    this.type = POWERUP_TYPES[typeKey] || POWERUP_TYPES.BONUS_SCORE;
    this.width = 44;
    this.height = 16;
    this.vy = 2.2;
    this.pulse = 0;
  }

  update() {
    this.y += this.vy;
    this.pulse += 0.08;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    const glow = Math.sin(this.pulse) * 3 + 6;
    ctx.shadowColor = this.type.color;
    ctx.shadowBlur = glow;
    
    ctx.fillStyle = "#0c1020";
    ctx.strokeStyle = this.type.color;
    ctx.lineWidth = 1.5;

    const w = this.width;
    const h = this.height;

    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8.5px 'Orbitron', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.type.symbol, 0, 1);

    ctx.restore();
  }

  isOutOfBounds(canvasHeight) {
    return this.y - this.height > canvasHeight;
  }
}

class PowerUpManager {
  constructor(game) {
    this.game = game;
    this.fallingItems = [];
    this.activeEffects = new Map();
    this.hasShield = false;
  }

  spawn(x, y, specificType = null) {
    let typeKey = specificType;
    if (!typeKey) {
      const roll = Math.random();
      if (roll < 0.20) typeKey = "MULTIBALL";
      else if (roll < 0.35) typeKey = "WIDE_PADDLE";
      else if (roll < 0.50) typeKey = "LASER";
      else if (roll < 0.65) typeKey = "FIREBALL";
      else if (roll < 0.78) typeKey = "MAGNET";
      else if (roll < 0.88) typeKey = "SLOWMO";
      else if (roll < 0.94) typeKey = "SHIELD";
      else if (roll < 0.98) typeKey = "BONUS_SCORE";
      else typeKey = "EXTRA_LIFE";
    }

    this.fallingItems.push(new PowerUpItem(x, y, typeKey));
  }

  apply(typeKey) {
    const power = POWERUP_TYPES[typeKey];
    if (!power) return;

    if (window.soundEngine) window.soundEngine.playPowerupCollect();
    if (window.particleSystem) {
      window.particleSystem.createSparks(this.game.paddle.x, this.game.paddle.y, power.color, 14);
      window.particleSystem.createFloatingText(this.game.paddle.x, this.game.paddle.y - 20, power.name.toUpperCase(), power.color, 14);
    }
    if (window.storageManager) {
      window.storageManager.incrementStat("totalPowerupsCollected", 1);
    }

    switch (typeKey) {
      case "MULTIBALL":
        this.game.spawnMultiBalls(2);
        break;

      case "EXTRA_LIFE":
        this.game.addLife(1);
        break;

      case "BONUS_SCORE":
        this.game.addScore(500);
        break;

      case "SHIELD":
        this.hasShield = true;
        break;

      case "WIDE_PADDLE":
      case "LASER":
      case "FIREBALL":
      case "MAGNET":
      case "SLOWMO":
        const now = Date.now();
        const existing = this.activeEffects.get(typeKey);
        const duration = power.duration;
        const expireAt = (existing && existing.expireAt > now ? existing.expireAt : now) + duration;
        this.activeEffects.set(typeKey, { expireAt, totalDuration: duration, info: power });
        break;
    }

    this.updateHUD();
  }

  isActive(typeKey) {
    if (typeKey === "SHIELD") return this.hasShield;
    const effect = this.activeEffects.get(typeKey);
    if (!effect) return false;
    return effect.expireAt > Date.now();
  }

  consumeShield() {
    if (this.hasShield) {
      this.hasShield = false;
      if (window.particleSystem) {
        window.particleSystem.createExplosion(this.game.canvas.width / 2, this.game.canvas.height - 10, "#38bdf8", 25);
      }
      return true;
    }
    return false;
  }

  update() {
    const now = Date.now();
    for (const [key, val] of this.activeEffects.entries()) {
      if (val.expireAt <= now) {
        this.activeEffects.delete(key);
        this.onEffectExpired(key);
      }
    }

    for (let i = this.fallingItems.length - 1; i >= 0; i--) {
      const item = this.fallingItems[i];
      item.update();

      const paddle = this.game.paddle;
      if (
        item.x + item.width / 2 >= paddle.x - paddle.width / 2 &&
        item.x - item.width / 2 <= paddle.x + paddle.width / 2 &&
        item.y + item.height / 2 >= paddle.y - paddle.height / 2 &&
        item.y - item.height / 2 <= paddle.y + paddle.height / 2
      ) {
        this.apply(item.typeKey);
        this.fallingItems.splice(i, 1);
        continue;
      }

      if (item.isOutOfBounds(this.game.canvas.height)) {
        this.fallingItems.splice(i, 1);
      }
    }

    this.updateHUD();
  }

  onEffectExpired(typeKey) {
    this.updateHUD();
  }

  updateHUD() {
    if (this.game && this.game.ui) {
      this.game.ui.renderActivePowerups(this.activeEffects);
    }
  }

  draw(ctx) {
    for (const item of this.fallingItems) {
      item.draw(ctx);
    }
  }

  clear() {
    this.fallingItems = [];
    this.activeEffects.clear();
    this.hasShield = false;
    this.updateHUD();
  }
}

window.PowerUpManager = PowerUpManager;
