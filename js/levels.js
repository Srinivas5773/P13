/* ==========================================================================
   BRICK BREAKER DELUXE - LEVEL LOADER & PROCEDURAL GENERATOR
   Translates grid maps into Brick entities and generates procedural boards.
   ========================================================================== */

class LevelManager {
  constructor(game) {
    this.game = game;
    this.canvasWidth = 800;
    this.canvasHeight = 600;
    this.brickCols = 10;
    this.brickRows = 8;
    this.brickPadding = 8;
    this.offsetTop = 60;
    this.offsetLeft = 35;
  }

  calculateBrickDimensions(cols = 10) {
    const totalPadding = this.brickPadding * (cols - 1);
    const availableWidth = this.canvasWidth - this.offsetLeft * 2 - totalPadding;
    const brickWidth = Math.floor(availableWidth / cols);
    const brickHeight = 22;
    return { brickWidth, brickHeight };
  }

  loadLevel(levelIndex, mode = "campaign") {
    const bricks = [];
    let mapData = null;

    if (mode === "campaign") {
      // Check for handcrafted map dataset from window.ARCADE_CAMPAIGN_MAPS or window.LEVELS_DATASET_1
      if (window.ARCADE_CAMPAIGN_MAPS && window.ARCADE_CAMPAIGN_MAPS[levelIndex]) {
        mapData = window.ARCADE_CAMPAIGN_MAPS[levelIndex].layout;
      } else if (window.LEVELS_DATASET_1 && window.LEVELS_DATASET_1[levelIndex]) {
        mapData = window.LEVELS_DATASET_1[levelIndex].grid;
      }
    }

    // If no preset dataset found or in endless mode, generate procedural pattern
    if (!mapData) {
      mapData = this.generateProceduralGrid(levelIndex, mode);
    }

    const rows = mapData.length;
    const cols = mapData[0].length;
    const { brickWidth, brickHeight } = this.calculateBrickDimensions(cols);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const typeCode = mapData[r][c];
        if (typeCode > 0) {
          const brickX = this.offsetLeft + c * (brickWidth + this.brickPadding);
          const brickY = this.offsetTop + r * (brickHeight + this.brickPadding);
          bricks.push(new Brick(brickX, brickY, brickWidth, brickHeight, typeCode, r, c));
        }
      }
    }

    return bricks;
  }

  generateProceduralGrid(levelIndex, mode) {
    const rows = Math.min(10, 5 + Math.floor(levelIndex / 4));
    const cols = 10;
    const grid = [];
    const patternType = (levelIndex + 1) % 6;

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        let code = 0;

        switch (patternType) {
          case 0: // Checkerboard
            if ((r + c) % 2 === 0) {
              code = 1 + (r % 3);
            }
            break;

          case 1: // Pyramidal
            const centerDist = Math.abs(c - (cols - 1) / 2);
            if (r >= centerDist) {
              code = 1 + (r % 4);
            }
            break;

          case 2: // Columns with mystery center
            if (c % 2 === 0) {
              code = 1 + (c % 3);
            } else if (r === 2 && (c === 3 || c === 5)) {
              code = 6; // Mystery
            }
            break;

          case 3: // Fortress with TNT core
            if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
              code = r === 0 ? 3 : 2;
            } else if (r === Math.floor(rows / 2) && (c === 4 || c === 5)) {
              code = 5; // Explosive TNT
            } else {
              code = 1;
            }
            break;

          case 4: // Symmetrical Wave
            if ((r + Math.sin(c * 0.8) * 2) > 2) {
              code = 1 + ((r + c) % 3);
            }
            break;

          default: // Standard tiered
            code = Math.min(3, Math.floor(r / 2) + 1);
            if (r === 1 && c === 4) code = 5; // TNT
            if (r === 2 && c === 5) code = 6; // Star
            break;
        }

        // Add mystery or explosive chance
        if (code > 0 && code < 4) {
          const rand = Math.random();
          if (rand < 0.05) code = 5; // TNT
          else if (rand < 0.10) code = 6; // Mystery powerup
        }

        row.push(code);
      }
      grid.push(row);
    }

    return grid;
  }
}

window.LevelManager = LevelManager;
