/* ==========================================================================
   BRICK BREAKER DELUXE - MAIN GAME ENGINE
   Central game coordinator, 60fps loop, collision mathematics & state machine.
   ========================================================================== */

class BrickBreakerGame {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");

    this.state = "MENU"; // MENU, PLAYING, PAUSED, LEVEL_COMPLETE, GAME_OVER
    this.gameMode = "campaign"; // campaign, endless, chaos

    this.score = 0;
    this.highScore = window.storageManager ? window.storageManager.getHighScore() : 0;
    this.level = 1;
    this.lives = 3;
    this.combo = 1;
    this.comboTimer = 0;
    this.maxComboThisLevel = 1;
    this.stageScore = 0;
    this.totalBricksSmashed = 0;

    this.paddle = new Paddle(this);
    this.balls = [];
    this.bricks = [];
    
    this.powerups = new PowerUpManager(this);
    this.levels = new LevelManager(this);
    this.ui = new UIController(this);

    this.keys = {};
    this.mousePos = { x: 400, y: 300 };

    this.screenShakeTimer = 0;
    this.screenShakeIntensity = 0;

    this.setupInputListeners();
    this.initTouchControls();
    
    // Setup initial ball
    this.resetBall();
    this.ui.updateHUD(this.score, this.highScore, this.lives, this.level, this.combo);

    // Start 60fps Animation Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  setupInputListeners() {
    // Keyboard events
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;

      if (e.code === "Space") {
        e.preventDefault();
        this.handleActionLaunchOrFire();
      }

      if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault();
        this.togglePause();
      }

      if (e.code === "KeyM") {
        const muted = window.soundEngine.toggleMute();
        this.ui.btnSound.textContent = muted ? "🔇" : "🔊";
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // Mouse movement
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      this.mousePos.x = mouseX;

      if (this.state === "PLAYING") {
        this.paddle.moveTo(mouseX);
      }
    });

    // Mouse click launch/fire
    this.canvas.addEventListener("mousedown", (e) => {
      if (this.state === "PLAYING") {
        this.handleActionLaunchOrFire();
      }
    });

    // Touch support on canvas
    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const touchX = (e.touches[0].clientX - rect.left) * scaleX;
        if (this.state === "PLAYING") {
          this.paddle.moveTo(touchX);
        }
      }
    }, { passive: false });

    this.canvas.addEventListener("touchstart", (e) => {
      if (this.state === "PLAYING") {
        this.handleActionLaunchOrFire();
      }
    });
  }

  initTouchControls() {
    const leftBtn = document.getElementById("touch-left");
    const rightBtn = document.getElementById("touch-right");
    const actionBtn = document.getElementById("touch-action");

    let leftInterval = null;
    let rightInterval = null;

    if (leftBtn) {
      leftBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.paddle.moveLeft();
        leftInterval = setInterval(() => this.paddle.moveLeft(), 20);
      });
      leftBtn.addEventListener("touchend", () => clearInterval(leftInterval));
    }

    if (rightBtn) {
      rightBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.paddle.moveRight();
        rightInterval = setInterval(() => this.paddle.moveRight(), 20);
      });
      rightBtn.addEventListener("touchend", () => clearInterval(rightInterval));
    }

    if (actionBtn) {
      actionBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.handleActionLaunchOrFire();
      });
    }
  }

  handleActionLaunchOrFire() {
    if (this.state !== "PLAYING") return;

    // Launch any attached balls
    let launchedAny = false;
    for (const ball of this.balls) {
      if (ball.isAttached) {
        ball.launch();
        launchedAny = true;
      }
    }

    // If no ball attached, fire paddle lasers
    if (!launchedAny) {
      this.paddle.fireLasers();
    }
  }

  startNewGame() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.combo = 1;
    this.comboTimer = 0;
    this.maxComboThisLevel = 1;
    this.stageScore = 0;
    this.totalBricksSmashed = 0;

    this.state = "PLAYING";
    this.ui.hideAllOverlays();
    this.loadLevelData(this.level);
    this.resetBall();

    if (this.gameMode === "chaos") {
      this.powerups.apply("WIDE_PADDLE");
      this.powerups.apply("LASER");
    }

    this.ui.updateHUD(this.score, this.highScore, this.lives, this.level, this.combo);
    if (window.soundEngine) window.soundEngine.ensureContext();
  }

  startLevelFromSelect(lvl) {
    this.level = lvl;
    this.lives = 3;
    this.combo = 1;
    this.comboTimer = 0;
    this.maxComboThisLevel = 1;
    this.stageScore = 0;

    this.state = "PLAYING";
    this.ui.hideAllOverlays();
    this.loadLevelData(this.level);
    this.resetBall();
    this.ui.updateHUD(this.score, this.highScore, this.lives, this.level, this.combo);
  }

  loadLevelData(lvl) {
    this.powerups.clear();
    this.paddle.reset();
    this.bricks = this.levels.loadLevel(lvl, this.gameMode);
  }

  resetBall() {
    this.balls = [new Ball(this)];
    this.balls[0].attachToPaddle(this.paddle, 0);
  }

  spawnMultiBalls(count = 2) {
    const mainBall = this.balls[0] || new Ball(this);
    for (let i = 0; i < count; i++) {
      const newBall = new Ball(this, mainBall.x, mainBall.y);
      newBall.isAttached = false;
      const angle = (Math.random() * Math.PI * 0.7) - Math.PI * 0.85; // Upward fan
      newBall.vx = Math.cos(angle) * newBall.getCurrentSpeed();
      newBall.vy = Math.sin(angle) * newBall.getCurrentSpeed();
      this.balls.push(newBall);
    }
  }

  addScore(points) {
    const scored = points * this.combo;
    this.score += scored;
    this.stageScore += scored;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      if (window.storageManager) window.storageManager.updateHighScore(this.score);
    }

    this.ui.updateHUD(this.score, this.highScore, this.lives, this.level, this.combo);
  }

  addLife(amt = 1) {
    this.lives = Math.min(5, this.lives + amt);
    this.ui.updateHUD(this.score, this.highScore, this.lives, this.level, this.combo);
  }

  triggerScreenShake(intensity = 6, duration = 12) {
    const settings = window.storageManager ? window.storageManager.getSettings() : { screenShake: true };
    if (!settings.screenShake) return;

    this.screenShakeIntensity = intensity;
    this.screenShakeTimer = duration;
    this.canvas.parentElement.classList.add("shake");
    setTimeout(() => {
      this.canvas.parentElement.classList.remove("shake");
    }, duration * 16);
  }

  handleBrickHit(brick, damage = 1) {
    const result = brick.hit(damage);

    if (result.points > 0) {
      this.comboTimer = 180; // 3 seconds to maintain combo
      this.combo++;
      if (this.combo > this.maxComboThisLevel) {
        this.maxComboThisLevel = this.combo;
      }
      if (window.storageManager) window.storageManager.recordCombo(this.combo);
      this.addScore(result.points);
    }

    if (result.destroyed) {
      this.totalBricksSmashed++;
      if (window.storageManager) window.storageManager.incrementStat("totalBricksBroken", 1);
      if (window.soundEngine) window.soundEngine.playBrickHit(true, this.combo);
      if (window.particleSystem) {
        window.particleSystem.createSparks(result.x, result.y, brick.baseColor, 12);
        window.particleSystem.createFloatingText(result.x, result.y - 10, `+${result.points * (this.combo - 1 || 1)}`, brick.baseColor);
      }

      if (result.isExplosive) {
        this.explodeAdjacentBricks(brick);
      }

      if (result.powerupDrop) {
        this.powerups.spawn(result.x, result.y);
      }

      this.checkLevelCompletion();
    } else {
      if (window.soundEngine) window.soundEngine.playBrickHit(false, this.combo);
      if (window.particleSystem) {
        window.particleSystem.createSparks(brick.x + brick.width / 2, brick.y + brick.height / 2, "#ffffff", 5);
      }
    }
  }

  explodeAdjacentBricks(centerBrick) {
    if (window.soundEngine) window.soundEngine.playExplosion();
    this.triggerScreenShake(8, 15);
    const radius = 65;

    for (const brick of this.bricks) {
      if (brick.destroyed || brick === centerBrick) continue;
      const bCenterX = brick.x + brick.width / 2;
      const bCenterY = brick.y + brick.height / 2;
      const dist = Math.hypot(bCenterX - (centerBrick.x + centerBrick.width / 2), bCenterY - (centerBrick.y + centerBrick.height / 2));

      if (dist <= radius) {
        this.handleBrickHit(brick, 3); // Full damage destruction
      }
    }
  }

  checkLevelCompletion() {
    const breakableRemaining = this.bricks.some((b) => !b.destroyed && b.canBreak);
    if (!breakableRemaining) {
      this.state = "LEVEL_COMPLETE";
      if (window.soundEngine) window.soundEngine.playVictory();
      if (window.storageManager) window.storageManager.unlockLevel(this.level + 1);

      this.ui.showLevelComplete(this.stageScore, this.maxComboThisLevel, this.bricks.length);
    }
  }

  loadNextLevel() {
    this.level++;
    this.stageScore = 0;
    this.combo = 1;
    this.maxComboThisLevel = 1;
    this.state = "PLAYING";
    this.ui.hideAllOverlays();
    this.loadLevelData(this.level);
    this.resetBall();
    this.ui.updateHUD(this.score, this.highScore, this.lives, this.level, this.combo);
  }

  restartCurrentLevel() {
    this.stageScore = 0;
    this.combo = 1;
    this.maxComboThisLevel = 1;
    this.state = "PLAYING";
    this.ui.hideAllOverlays();
    this.loadLevelData(this.level);
    this.resetBall();
    this.ui.updateHUD(this.score, this.highScore, this.lives, this.level, this.combo);
  }

  togglePause() {
    if (this.state === "PLAYING") {
      this.state = "PAUSED";
      this.ui.showScreen("screen-pause");
    } else if (this.state === "PAUSED") {
      this.state = "PLAYING";
      this.ui.hideScreen("screen-pause");
    }
  }

  quitToMenu() {
    this.state = "MENU";
    this.ui.hideAllOverlays();
    this.ui.showScreen("screen-start");
    this.powerups.clear();
    this.resetBall();
  }

  update() {
    if (this.state !== "PLAYING") return;

    // Keyboard movement handling
    if (this.keys["ArrowLeft"] || this.keys["KeyA"]) {
      this.paddle.moveLeft();
    }
    if (this.keys["ArrowRight"] || this.keys["KeyD"]) {
      this.paddle.moveRight();
    }

    // Update Paddle & Powerups
    this.paddle.update();
    this.powerups.update();

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.combo = 1;
        this.ui.updateHUD(this.score, this.highScore, this.lives, this.level, this.combo);
      }
    }

    // Update Balls & Collisions
    const isFireball = this.powerups.isActive("FIREBALL");

    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      ball.update();

      // Check paddle collision
      ball.handlePaddleCollision(this.paddle);

      // Check Brick collisions
      if (!ball.isAttached) {
        for (const brick of this.bricks) {
          if (brick.destroyed) continue;

          // Circle to AABB test
          const nearestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
          const nearestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
          const deltaX = ball.x - nearestX;
          const deltaY = ball.y - nearestY;

          if (deltaX * deltaX + deltaY * deltaY < ball.radius * ball.radius) {
            // Collision occurred!
            this.handleBrickHit(brick, isFireball && brick.canBreak ? brick.hp : 1);

            // If fireball and breakable brick, blast through without reflection!
            if (isFireball && brick.canBreak) {
              // No velocity bounce, continue straight through
            } else {
              // Determine collision normal for bounce
              const overlapLeft = (ball.x + ball.radius) - brick.x;
              const overlapRight = (brick.x + brick.width) - (ball.x - ball.radius);
              const overlapTop = (ball.y + ball.radius) - brick.y;
              const overlapBottom = (brick.y + brick.height) - (ball.y - ball.radius);

              const minOverlapX = Math.min(overlapLeft, overlapRight);
              const minOverlapY = Math.min(overlapTop, overlapBottom);

              if (minOverlapX < minOverlapY) {
                ball.vx = -ball.vx;
                ball.x += ball.vx > 0 ? minOverlapX : -minOverlapX;
              } else {
                ball.vy = -ball.vy;
                ball.y += ball.vy > 0 ? minOverlapY : -minOverlapY;
              }
            }
            break; // Handle one brick per frame per ball
          }
        }
      }

      // Check bottom pit loss
      if (ball.isOutOfBounds(this.canvas.height)) {
        // Check if shield can save the ball
        if (this.powerups.consumeShield()) {
          ball.vy = -Math.abs(ball.vy);
          ball.y = this.canvas.height - ball.radius - 8;
          if (window.soundEngine) window.soundEngine.playWallHit();
        } else {
          this.balls.splice(i, 1);
        }
      }
    }

    // Check if all balls were lost
    if (this.balls.length === 0) {
      this.lives--;
      this.combo = 1;
      this.ui.updateHUD(this.score, this.highScore, this.lives, this.level, this.combo);

      if (window.soundEngine) window.soundEngine.playLifeLost();

      if (this.lives <= 0) {
        this.state = "GAME_OVER";
        if (window.soundEngine) window.soundEngine.playGameOver();
        this.ui.showGameOver(this.score, this.level, this.totalBricksSmashed, this.highScore);
      } else {
        this.resetBall();
      }
    }

    // Update Particle System
    if (window.particleSystem) {
      window.particleSystem.update();
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Background Grid
    this.drawBackgroundGrid();

    // Draw Bricks
    for (const brick of this.bricks) {
      brick.draw(this.ctx);
    }

    // Draw Power-ups
    this.powerups.draw(this.ctx);

    // Draw Paddle
    this.paddle.draw(this.ctx);

    // Draw Balls
    for (const ball of this.balls) {
      ball.draw(this.ctx);
    }

    // Draw Particles & Floating Texts
    if (window.particleSystem) {
      window.particleSystem.draw(this.ctx);
    }
  }

  drawBackgroundGrid() {
    this.ctx.save();
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
    this.ctx.lineWidth = 1;

    const gridSize = 40;
    for (let x = 0; x < this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    for (let y = 0; y < this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  gameLoop(currentTime) {
    this.update();
    this.draw();
    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Instantiate game on DOMContentLoaded
window.addEventListener("DOMContentLoaded", () => {
  window.game = new BrickBreakerGame();
});
