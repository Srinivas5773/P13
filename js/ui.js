/* ==========================================================================
   BRICK BREAKER DELUXE - UI & SCREEN CONTROLLER
   Manages HUD state, modal transitions, level select populator & achievements.
   Clean, human-engineered interface with zero emoji symbols.
   ========================================================================== */

class UIController {
  constructor(game) {
    this.game = game;
    this.bindElements();
    this.attachEventListeners();
  }

  bindElements() {
    this.hudLevel = document.getElementById("hud-level");
    this.hudScore = document.getElementById("hud-score");
    this.hudHighScore = document.getElementById("hud-highscore");
    this.hudCombo = document.getElementById("hud-combo");
    this.hudComboBox = document.getElementById("hud-combo-box");
    this.hudLives = document.getElementById("hud-lives");
    this.activePowerupsHud = document.getElementById("active-powerups-hud");

    // Screen overlays
    this.screenStart = document.getElementById("screen-start");
    this.screenPause = document.getElementById("screen-pause");
    this.screenLevelComplete = document.getElementById("screen-level-complete");
    this.screenGameOver = document.getElementById("screen-game-over");
    this.screenLevelSelect = document.getElementById("screen-level-select");
    this.screenAchievements = document.getElementById("screen-achievements");
    this.screenHelp = document.getElementById("screen-help");
    this.screenSettings = document.getElementById("screen-settings");

    // Modal buttons
    this.btnPlay = document.getElementById("btn-play-game");
    this.btnSound = document.getElementById("btn-sound-toggle");
    this.btnPause = document.getElementById("btn-pause-toggle");
    this.btnResume = document.getElementById("btn-resume-game");
    this.btnRestart = document.getElementById("btn-restart-level");
    this.btnQuit = document.getElementById("btn-quit-to-menu");
    this.btnNextLevel = document.getElementById("btn-next-level");
    this.btnReplay = document.getElementById("btn-replay-level");
    this.btnTryAgain = document.getElementById("btn-try-again");
    this.btnGameOverMenu = document.getElementById("btn-gameover-menu");

    // Containers
    this.levelsGridContainer = document.getElementById("levels-grid-container");
    this.achievementsContainer = document.getElementById("achievements-list-container");
    this.toastContainer = document.getElementById("toast-container");
  }

  attachEventListeners() {
    this.btnPlay.addEventListener("click", () => {
      this.game.startNewGame();
    });

    this.btnSound.addEventListener("click", () => {
      const muted = window.soundEngine.toggleMute();
      this.btnSound.textContent = muted ? "AUDIO: OFF" : "AUDIO: ON";
      this.showToast(muted ? "Audio Muted" : "Audio Enabled");
    });

    this.btnPause.addEventListener("click", () => {
      this.game.togglePause();
    });

    this.btnResume.addEventListener("click", () => {
      this.game.togglePause();
    });

    this.btnRestart.addEventListener("click", () => {
      this.game.restartCurrentLevel();
    });

    this.btnQuit.addEventListener("click", () => {
      this.game.quitToMenu();
    });

    this.btnNextLevel.addEventListener("click", () => {
      this.game.loadNextLevel();
    });

    this.btnReplay.addEventListener("click", () => {
      this.game.restartCurrentLevel();
    });

    this.btnTryAgain.addEventListener("click", () => {
      this.game.startNewGame();
    });

    this.btnGameOverMenu.addEventListener("click", () => {
      this.game.quitToMenu();
    });

    // Modal triggers
    document.getElementById("btn-open-levels").addEventListener("click", () => {
      this.populateLevelSelectGrid();
      this.showScreen("screen-level-select");
    });
    document.getElementById("btn-close-levels").addEventListener("click", () => {
      this.hideScreen("screen-level-select");
    });

    document.getElementById("btn-open-achievements").addEventListener("click", () => {
      this.populateAchievementsList();
      this.showScreen("screen-achievements");
    });
    document.getElementById("btn-close-achievements").addEventListener("click", () => {
      this.hideScreen("screen-achievements");
    });

    document.getElementById("btn-open-help").addEventListener("click", () => {
      this.showScreen("screen-help");
    });
    document.getElementById("btn-close-help").addEventListener("click", () => {
      this.hideScreen("screen-help");
    });

    document.getElementById("btn-settings").addEventListener("click", () => {
      this.showScreen("screen-settings");
    });
    document.getElementById("btn-open-settings-paused").addEventListener("click", () => {
      this.showScreen("screen-settings");
    });
    document.getElementById("btn-close-settings").addEventListener("click", () => {
      this.hideScreen("screen-settings");
    });

    // Game mode selectors
    const modeCards = document.querySelectorAll(".mode-card");
    modeCards.forEach((card) => {
      card.addEventListener("click", () => {
        modeCards.forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
        this.game.gameMode = card.dataset.mode;
      });
    });

    // Theme selector
    const themeSelect = document.getElementById("setting-theme");
    themeSelect.addEventListener("change", (e) => {
      document.body.className = e.target.value;
      window.storageManager.updateSettings({ theme: e.target.value });
    });

    // Volume slider
    const volumeSlider = document.getElementById("setting-sound-vol");
    volumeSlider.addEventListener("input", (e) => {
      const vol = parseInt(e.target.value, 10) / 100;
      window.soundEngine.setVolume(vol);
      window.storageManager.updateSettings({ volume: parseInt(e.target.value, 10) });
    });

    // Reset progress
    document.getElementById("btn-reset-data").addEventListener("click", () => {
      if (confirm("Reset all stored high scores and progress telemetry?")) {
        window.storageManager.resetAll();
        this.updateHUD(0, 0, 3, 1, 1);
        this.showToast("Telemetry reset complete.");
      }
    });

    // Load initial settings
    const initialSettings = window.storageManager.getSettings();
    if (initialSettings) {
      if (initialSettings.theme) {
        document.body.className = initialSettings.theme;
        themeSelect.value = initialSettings.theme;
      }
      if (initialSettings.volume !== undefined) {
        volumeSlider.value = initialSettings.volume;
        window.soundEngine.setVolume(initialSettings.volume / 100);
      }
    }
  }

  showScreen(screenId) {
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.remove("hidden");
      screen.classList.add("active");
    }
  }

  hideScreen(screenId) {
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add("hidden");
      screen.classList.remove("active");
    }
  }

  hideAllOverlays() {
    const overlays = document.querySelectorAll(".overlay-screen");
    overlays.forEach((o) => {
      o.classList.add("hidden");
      o.classList.remove("active");
    });
  }

  updateHUD(score, highScore, lives, level, combo) {
    this.hudScore.textContent = String(score).padStart(6, "0");
    this.hudHighScore.textContent = String(highScore).padStart(6, "0");
    this.hudLevel.textContent = level;
    this.hudCombo.textContent = `${combo.toFixed(1)}x`;

    if (combo > 1) {
      this.hudComboBox.classList.add("pop");
      setTimeout(() => this.hudComboBox.classList.remove("pop"), 150);
    }

    // Render Health Pips
    this.hudLives.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      if (i < lives) {
        this.hudLives.innerHTML += '<span class="pip full"></span>';
      } else if (i < 3) {
        this.hudLives.innerHTML += '<span class="pip lost"></span>';
      }
    }
  }

  renderActivePowerups(activeEffects) {
    this.activePowerupsHud.innerHTML = "";
    const now = Date.now();

    for (const [key, val] of activeEffects.entries()) {
      const remainingMs = Math.max(0, val.expireAt - now);
      const percent = Math.min(100, (remainingMs / val.totalDuration) * 100);
      
      const pill = document.createElement("div");
      pill.className = "powerup-pill";
      pill.style.borderColor = val.info.color;
      pill.innerHTML = `
        <span style="color:${val.info.color}">${val.info.symbol}</span>
        <span>${val.info.name}</span>
        <div class="meter" style="width: ${percent}%; background: ${val.info.color};"></div>
      `;
      this.activePowerupsHud.appendChild(pill);
    }
  }

  showLevelComplete(stageScore, maxCombo, bricksCount) {
    document.getElementById("summary-stage-score").textContent = stageScore;
    document.getElementById("summary-max-combo").textContent = `${maxCombo.toFixed(1)}x`;
    document.getElementById("summary-bricks-smashed").textContent = bricksCount;
    document.getElementById("summary-accuracy").textContent = "+500";
    this.showScreen("screen-level-complete");
  }

  showGameOver(finalScore, stage, totalBricks, highscore) {
    document.getElementById("gameover-final-score").textContent = finalScore;
    document.getElementById("gameover-stage").textContent = stage;
    document.getElementById("gameover-total-bricks").textContent = totalBricks;
    document.getElementById("gameover-highscore").textContent = highscore;
    this.showScreen("screen-game-over");
  }

  populateLevelSelectGrid() {
    this.levelsGridContainer.innerHTML = "";
    const unlocked = window.storageManager.getUnlockedLevel();
    const totalStages = 50;

    for (let i = 1; i <= totalStages; i++) {
      const btn = document.createElement("button");
      btn.className = "level-btn";
      btn.textContent = String(i).padStart(2, "0");

      if (i <= unlocked) {
        btn.addEventListener("click", () => {
          this.hideScreen("screen-level-select");
          this.game.startLevelFromSelect(i);
        });
        if (i < unlocked) {
          btn.classList.add("completed");
        }
      } else {
        btn.classList.add("locked");
        btn.title = "Locked Sector";
      }

      this.levelsGridContainer.appendChild(btn);
    }
  }

  populateAchievementsList() {
    this.achievementsContainer.innerHTML = "";
    const bank = window.ACHIEVEMENTS_DATA || [
      { id: "FIRST_BLOOD", title: "First Brick Smashed", desc: "Break your very first brick.", badgeCategory: "COMBAT" },
      { id: "COMBO_MASTER", title: "Combo Master", desc: "Reach a 5.0x combo streak.", badgeCategory: "SKILL" },
      { id: "POWERUP_HOARDER", title: "Power Fiend", desc: "Collect 10 powerup capsules.", badgeCategory: "TACTICAL" },
      { id: "STAGE_10_CLEARED", title: "Sector 1 Cleared", desc: "Beat Stage 10 in Campaign Mode.", badgeCategory: "CAMPAIGN" },
      { id: "UNTOUCHABLE", title: "Laser Sharpshooter", desc: "Destroy 20 bricks using Laser Blaster.", badgeCategory: "COMBAT" }
    ];

    for (const ach of bank) {
      const isUnlocked = window.storageManager.isAchievementUnlocked(ach.id);
      const card = document.createElement("div");
      card.className = `achievement-card ${isUnlocked ? "unlocked" : ""}`;
      card.innerHTML = `
        <div class="ach-category-tag">[${ach.badgeCategory || "RECORD"}]</div>
        <div class="ach-info">
          <div class="ach-title">${ach.title} ${isUnlocked ? "[UNLOCKED]" : "[LOCKED]"}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
      `;
      this.achievementsContainer.appendChild(card);
    }
  }

  showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2800);
  }
}

window.UIController = UIController;
