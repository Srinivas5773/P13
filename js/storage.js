/* ==========================================================================
   BRICK BREAKER DELUXE - STORAGE & STATE MANAGER
   Local storage persistence for high scores, achievements, settings & progress.
   ========================================================================== */

class StorageManager {
  constructor() {
    this.STORAGE_KEY = "BRICK_BREAKER_DELUXE_SAVE";
    this.data = this.load();
  }

  getDefaultData() {
    return {
      highScore: 0,
      unlockedLevel: 1,
      totalBricksBroken: 0,
      totalGamesPlayed: 0,
      totalPowerupsCollected: 0,
      maxCombo: 0,
      achievements: {},
      settings: {
        theme: "theme-neon",
        volume: 80,
        particles: true,
        screenShake: true
      }
    };
  }

  load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return { ...this.getDefaultData(), ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn("Could not read from localStorage, using default state", e);
    }
    return this.getDefaultData();
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  }

  getHighScore() {
    return this.data.highScore || 0;
  }

  updateHighScore(score) {
    if (score > this.data.highScore) {
      this.data.highScore = score;
      this.save();
      return true;
    }
    return false;
  }

  getUnlockedLevel() {
    return this.data.unlockedLevel || 1;
  }

  unlockLevel(levelNum) {
    if (levelNum > this.data.unlockedLevel) {
      this.data.unlockedLevel = levelNum;
      this.save();
      return true;
    }
    return false;
  }

  incrementStat(statKey, amount = 1) {
    if (this.data[statKey] !== undefined) {
      this.data[statKey] += amount;
      this.save();
    }
  }

  recordCombo(combo) {
    if (combo > (this.data.maxCombo || 0)) {
      this.data.maxCombo = combo;
      this.save();
    }
  }

  unlockAchievement(id) {
    if (!this.data.achievements[id]) {
      this.data.achievements[id] = {
        unlockedAt: new Date().toISOString()
      };
      this.save();
      return true;
    }
    return false;
  }

  isAchievementUnlocked(id) {
    return !!this.data.achievements[id];
  }

  getSettings() {
    return this.data.settings;
  }

  updateSettings(partialSettings) {
    this.data.settings = { ...this.data.settings, ...partialSettings };
    this.save();
  }

  resetAll() {
    this.data = this.getDefaultData();
    this.save();
  }
}

window.storageManager = new StorageManager();
