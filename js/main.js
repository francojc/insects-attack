class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.gameWidth = 800;
    this.gameHeight = 600;
    
    // Initialize core systems
    this.renderer = new Renderer(this.canvas);
    this.gameLoop = new GameLoop();
    this.inputManager = new InputManager(this.canvas);
    this.audioManager = new AudioManager();
    this.collisionSystem = new CollisionSystem();
    
    // Initialize game systems
    this.scoringSystem = new ScoringSystem();
    this.levelManager = new LevelManager(this.gameWidth, this.gameHeight);
    
    // Initialize game entities
    this.player = new Player(this.gameWidth / 2, this.gameHeight - 50);
    this.mushroomField = new MushroomField(this.gameWidth, this.gameHeight);
    this.centipedeManager = new CentipedeManager(this.gameWidth, this.gameHeight);
    this.enemyManager = new EnemyManager(this.gameWidth, this.gameHeight);
    
    // Game state
    this.gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver'
    this.debugMode = false;
    
    // Make audio manager globally available
    window.audioManager = this.audioManager;
    
    this.setupEventListeners();
    this.setupOrientationHandling();
    this.showStartScreen();
  }

  setupEventListeners() {
    // Start button
    document.getElementById('startBtn').addEventListener('click', () => {
      this.startGame();
    });

    // Restart button
    document.getElementById('restartBtn').addEventListener('click', () => {
      this.restartGame();
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyP':
          if (this.gameState === 'playing') {
            this.pauseGame();
          } else if (this.gameState === 'paused') {
            this.resumeGame();
          }
          break;
        case 'KeyR':
          if (this.gameState === 'gameOver') {
            this.restartGame();
          }
          break;
        case 'KeyD':
          this.debugMode = !this.debugMode;
          break;
        case 'Escape':
          if (this.gameState === 'playing') {
            this.pauseGame();
          }
          break;
      }
    });

    // Prevent context menu on canvas
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  startGame() {
    this.gameState = 'playing';
    this.hideAllScreens();
    
    // Reset all systems
    this.scoringSystem.reset();
    this.levelManager.reset();
    this.levelManager.startGame();
    
    // Reset entities
    this.player = new Player(this.gameWidth / 2, this.gameHeight - 50);
    this.centipedeManager.clear();
    this.enemyManager.clear();
    
    // Start first level
    this.levelManager.startLevel(
      1, 
      this.centipedeManager, 
      this.mushroomField, 
      this.enemyManager, 
      this.scoringSystem
    );
    
    // Start game loop
    this.gameLoop.start(
      (deltaTime) => this.update(deltaTime),
      (interpolation) => this.render(interpolation)
    );
  }

  restartGame() {
    this.startGame();
  }

  pauseGame() {
    this.gameState = 'paused';
    this.levelManager.pauseGame();
    this.gameLoop.stop();
  }

  resumeGame() {
    this.gameState = 'playing';
    this.levelManager.resumeGame();
    this.gameLoop.start(
      (deltaTime) => this.update(deltaTime),
      (interpolation) => this.render(interpolation)
    );
  }

  update(deltaTime) {
    if (this.gameState !== 'playing') return;

    // Update input manager
    this.inputManager.update();
    
    // Update level manager
    this.levelManager.update(deltaTime, this.centipedeManager, this.player, this.scoringSystem);
    
    // Check if we need to start next level
    if (this.levelManager.shouldStartNextLevel()) {
      this.levelManager.startLevel(
        this.levelManager.getCurrentLevel(),
        this.centipedeManager,
        this.mushroomField,
        this.enemyManager,
        this.scoringSystem
      );
      this.levelManager.levelStarted();
    }
    
    // Update entities
    if (this.levelManager.isPlaying()) {
      this.player.update(deltaTime, this.inputManager);
      this.centipedeManager.update(deltaTime, this.mushroomField);
      this.enemyManager.update(deltaTime, this.mushroomField, this.player);
    }
    
    // Handle collisions
    this.handleCollisions();
    
    // Update scoring system (for floating text animations)
    this.scoringSystem.updateFloatingTexts(deltaTime);
    
    // Check game over condition
    if (this.scoringSystem.isGameOver() && !this.levelManager.isGameOver()) {
      this.levelManager.gameOver();
      this.gameOver();
    }
  }

  handleCollisions() {
    const entities = {
      player: this.player,
      centipedes: this.centipedeManager.getAllCentipedes(),
      enemies: this.enemyManager.getActiveEnemies(),
      mushroomField: this.mushroomField
    };

    const collisions = this.collisionSystem.checkCollisions(entities);

    for (const collision of collisions) {
      this.processCollision(collision);
    }
  }

  processCollision(collision) {
    switch (collision.type) {
      case 'bullet-mushroom':
        if (collision.destroyed) {
          this.scoringSystem.scoreDestroyed('mushroom', collision.mushroom);
        }
        break;

      case 'bullet-centipede':
        const isHead = collision.segment.isHead;
        const centipedeIndex = this.centipedeManager.centipedes.indexOf(collision.centipede);
        const segmentIndex = collision.centipede.segments.indexOf(collision.segment);
        
        this.centipedeManager.handleSegmentHit(centipedeIndex, segmentIndex);
        this.scoringSystem.scoreDestroyed(
          isHead ? 'centipedeHead' : 'centipedeBody',
          collision.segment
        );
        break;

      case 'bullet-enemy':
        if (collision.enemy.takeDamage()) {
          let entityType = collision.enemy.type;
          
          // Special handling for spider proximity scoring
          if (entityType === 'spider') {
            const points = collision.enemy.getPointValue(this.player.x, this.player.y);
            this.scoringSystem.addScore(points, collision.enemy.x, collision.enemy.y);
          } else {
            this.scoringSystem.scoreDestroyed(entityType, collision.enemy);
          }
          
          // Remove enemy from manager
          const enemyIndex = this.enemyManager.enemies.indexOf(collision.enemy);
          if (enemyIndex > -1) {
            this.enemyManager.enemies.splice(enemyIndex, 1);
          }
        }
        break;

      case 'player-centipede':
      case 'player-enemy':
        if (this.player.takeDamage()) {
          const gameOver = this.scoringSystem.loseLife();
          
          if (gameOver) {
            // Game over - handled by main update loop
          } else {
            // Respawn player after brief delay
            setTimeout(() => {
              if (!this.scoringSystem.isGameOver()) {
                this.player.respawn(this.gameWidth / 2, this.gameHeight - 50);
              }
            }, 1000);
          }
        }
        break;

      case 'centipede-mushroom':
        // Centipede changes direction when hitting mushroom
        // This is handled in the centipede's own update logic
        break;

      case 'spider-mushroom':
        // Spider destroys mushrooms
        collision.mushroom.takeDamage();
        collision.mushroom.takeDamage();
        collision.mushroom.takeDamage();
        collision.mushroom.takeDamage(); // Destroy in one hit
        break;
    }
  }

  render(interpolation) {
    // Clear canvas
    this.renderer.clear();
    
    // Render game entities
    this.mushroomField.render(this.renderer);
    this.player.render(this.renderer);
    this.centipedeManager.render(this.renderer);
    this.enemyManager.render(this.renderer);
    
    // Render floating text
    this.scoringSystem.renderFloatingTexts(this.renderer);
    
    // Render level progress text
    const progressText = this.levelManager.getLevelProgressText();
    if (progressText) {
      this.renderer.drawText(
        progressText,
        this.gameWidth / 2,
        this.gameHeight / 2,
        24,
        '#00ff00',
        'center'
      );
    }
    
    // Render virtual joystick on mobile
    this.renderVirtualJoystick();
    
    // Debug information
    if (this.debugMode) {
      this.renderDebugInfo();
    }
  }

  renderVirtualJoystick() {
    const joystickData = this.inputManager.getVirtualJoystickData();
    if (!joystickData) return;

    // Draw joystick base
    this.renderer.drawCircle(
      joystickData.baseX,
      joystickData.baseY,
      joystickData.radius,
      'rgba(255, 255, 255, 0.3)'
    );

    // Draw joystick stick
    this.renderer.drawCircle(
      joystickData.stickX,
      joystickData.stickY,
      joystickData.radius / 3,
      'rgba(255, 255, 255, 0.8)'
    );
  }

  renderDebugInfo() {
    const fps = this.gameLoop.getFPS();
    const centipedeCount = this.centipedeManager.getAllCentipedes().length;
    const totalSegments = this.centipedeManager.getAllSegments().length;
    const enemyCount = this.enemyManager.getActiveEnemies().length;
    const bulletCount = this.player.bullets.length;
    
    const debugText = [
      `FPS: ${fps}`,
      `Centipedes: ${centipedeCount}`,
      `Segments: ${totalSegments}`,
      `Enemies: ${enemyCount}`,
      `Bullets: ${bulletCount}`,
      `Level: ${this.levelManager.getCurrentLevel()}`,
      `State: ${this.gameState}`,
      `LevelState: ${this.levelManager.getGameState()}`
    ];

    for (let i = 0; i < debugText.length; i++) {
      this.renderer.drawText(
        debugText[i],
        10,
        20 + i * 20,
        14,
        '#ffff00'
      );
    }
  }

  gameOver() {
    this.gameState = 'gameOver';
    this.gameLoop.stop();
    this.scoringSystem.gameOver();
    this.showGameOverScreen();
  }

  showStartScreen() {
    document.getElementById('startScreen').classList.remove('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    this.updateControlsForDevice();
  }

  updateControlsForDevice() {
    // Better touch device detection including iPads
    const isTouchDevice = 'ontouchstart' in window || 
                         navigator.maxTouchPoints > 0 || 
                         navigator.msMaxTouchPoints > 0 ||
                         window.innerWidth <= 768;
    
    // Update instruction text based on device
    const instructionText = document.querySelector('#startScreen p');
    if (instructionText) {
      if (isTouchDevice) {
        instructionText.textContent = 'Use the LEFT and RIGHT buttons to move, SHOOT button to fire!';
      } else {
        instructionText.textContent = 'Use WASD or arrow keys to move, SPACE to shoot';
      }
    }

    // Show/hide mobile controls based on device
    const mobileControls = document.getElementById('mobileControls');
    if (mobileControls) {
      if (isTouchDevice) {
        mobileControls.style.display = 'flex';
      } else {
        // Let CSS media queries handle this for better device detection
        mobileControls.style.display = '';
      }
    }

    console.log('Touch device detected:', isTouchDevice);
  }

  setupOrientationHandling() {
    // Handle orientation changes for mobile devices
    const handleOrientationChange = () => {
      setTimeout(() => {
        this.updateControlsForDevice();
      }, 100); // Small delay to ensure orientation change is complete
    };

    // Listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // iOS specific handling
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // Prevent zoom on double tap
      document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      });
      
      let lastTouchEnd = 0;
      document.addEventListener('touchend', (e) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
    }
  }

  showGameOverScreen() {
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('startScreen').classList.add('hidden');
  }

  hideAllScreens() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
  }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  window.game = game; // Make game globally accessible for debugging
});