class LevelManager {
  constructor(gameWidth, gameHeight) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.currentLevel = 1;
    this.gameState = 'start'; // 'start', 'playing', 'gameOver', 'levelComplete'
    this.levelCompleteTimer = 0;
    this.levelCompleteDelay = 2000; // 2 seconds
    this.needsLevelStart = false;
    
    // Level progression settings
    this.baseCentipedeSegments = 12;
    this.centipedeSpeedIncrease = 0.1; // 10% speed increase per level
    this.enemySpawnRateIncrease = 0.15; // 15% faster spawn rate per level
  }

  startLevel(level, centipedeManager, mushroomField, enemyManager, scoringSystem) {
    this.currentLevel = level;
    this.gameState = 'playing';
    
    // Clear existing entities
    centipedeManager.clear();
    enemyManager.clear();
    
    // Regenerate mushroom field (partial regeneration after level 1)
    if (level === 1) {
      mushroomField.generateField();
    } else {
      mushroomField.regeneratePartial();
    }
    
    // Spawn centipede(s) based on level
    const centipedeCount = Math.min(3, Math.floor((level - 1) / 3) + 1); // More centipedes every 3 levels
    const segmentsPerCentipede = Math.max(6, this.baseCentipedeSegments - Math.floor(level / 2));
    
    for (let i = 0; i < centipedeCount; i++) {
      const centipede = centipedeManager.spawnCentipede(segmentsPerCentipede);
      // Stagger spawn positions and speeds for multiple centipedes
      centipede.speed = 60 + (level - 1) * 8; // Increase speed with level
      
      if (i > 0) {
        // Offset additional centipedes
        for (const segment of centipede.segments) {
          segment.y += i * 40;
        }
      }
    }
    
    // Configure enemy manager for this level
    enemyManager.setLevel(level);
    
    // Update scoring system
    scoringSystem.level = level;
    scoringSystem.updateUI();
    
    console.log(`Level ${level} started with ${centipedeCount} centipede(s), segments: ${segmentsPerCentipede}`);
  }

  update(deltaTime, centipedeManager, player, scoringSystem) {
    switch (this.gameState) {
      case 'playing':
        this.updatePlaying(deltaTime, centipedeManager, player, scoringSystem);
        break;
      case 'levelComplete':
        this.updateLevelComplete(deltaTime, scoringSystem);
        break;
    }
  }

  updatePlaying(deltaTime, centipedeManager, player, scoringSystem) {
    // Check for level completion (all centipedes destroyed)
    if (centipedeManager.isEmpty()) {
      this.completeLevel(scoringSystem);
      return;
    }
    
    // Player death from centipede reaching bottom is now handled by collision system
    // This prevents the death loop issue
  }

  updateLevelComplete(deltaTime, scoringSystem) {
    this.levelCompleteTimer += deltaTime * 1000;
    
    if (this.levelCompleteTimer >= this.levelCompleteDelay) {
      this.currentLevel++;
      scoringSystem.nextLevel();
      this.levelCompleteTimer = 0;
      // Level will be started by checking in main update
      this.needsLevelStart = true;
    }
  }

  completeLevel(scoringSystem) {
    this.gameState = 'levelComplete';
    this.levelCompleteTimer = 0;
    
    // Play level complete sound
    if (window.audioManager) {
      window.audioManager.playSound('levelComplete');
    }
    
    // Award level completion bonus
    const levelBonus = this.currentLevel * 100;
    scoringSystem.addScore(levelBonus, this.gameWidth / 2, this.gameHeight / 2);
    
    console.log(`Level ${this.currentLevel} completed!`);
  }

  gameOver() {
    this.gameState = 'gameOver';
    
    // Play game over sound
    if (window.audioManager) {
      window.audioManager.playSound('gameOver');
    }
    
    console.log('Game Over!');
  }

  startGame() {
    this.gameState = 'playing';
    this.currentLevel = 1;
  }

  pauseGame() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
    }
  }

  resumeGame() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
    }
  }

  reset() {
    this.currentLevel = 1;
    this.gameState = 'start';
    this.levelCompleteTimer = 0;
    this.needsLevelStart = false;
  }

  // Getters for game state
  getCurrentLevel() { return this.currentLevel; }
  getGameState() { return this.gameState; }
  isPlaying() { return this.gameState === 'playing'; }
  isGameOver() { return this.gameState === 'gameOver'; }
  isLevelComplete() { return this.gameState === 'levelComplete'; }
  isPaused() { return this.gameState === 'paused'; }
  
  shouldStartNextLevel() {
    return this.needsLevelStart;
  }

  levelStarted() {
    this.needsLevelStart = false;
    this.gameState = 'playing';
  }

  getLevelProgressText() {
    if (this.gameState === 'levelComplete') {
      const timeLeft = Math.ceil((this.levelCompleteDelay - this.levelCompleteTimer) / 1000);
      return `Level Complete! Next level in ${timeLeft}...`;
    }
    return null;
  }

  // Calculate difficulty modifiers for current level
  getCentipedeSpeedMultiplier() {
    return 1 + (this.currentLevel - 1) * this.centipedeSpeedIncrease;
  }

  getEnemySpawnRateMultiplier() {
    return Math.max(0.3, 1 - (this.currentLevel - 1) * this.enemySpawnRateIncrease);
  }

  getCentipedeCount() {
    return Math.min(3, Math.floor((this.currentLevel - 1) / 3) + 1);
  }

  getCentipedeSegmentCount() {
    return Math.max(6, this.baseCentipedeSegments - Math.floor(this.currentLevel / 2));
  }
}