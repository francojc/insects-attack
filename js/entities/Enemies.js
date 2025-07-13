class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = 16;
    this.active = true;
    this.speed = 100;
    this.direction = { x: 0, y: 0 };
    this.health = 1;
    this.pointValue = 200;
  }

  update(deltaTime) {
    // Override in subclasses
  }

  takeDamage() {
    this.health--;
    if (this.health <= 0) {
      this.active = false;
      return true; // Enemy destroyed
    }
    return false;
  }

  getBounds() {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      width: this.size,
      height: this.size
    };
  }

  render(renderer) {
    // Override in subclasses
  }

  isOffScreen(gameWidth, gameHeight) {
    return this.x < -this.size || 
           this.x > gameWidth + this.size || 
           this.y < -this.size || 
           this.y > gameHeight + this.size;
  }
}

class Spider extends Enemy {
  constructor(x, y) {
    super(x, y, 'spider');
    this.speed = 120;
    this.pointValue = 300; // Base value, varies by proximity to player
    this.bounceTimer = 0;
    this.bounceInterval = 500; // Change direction every 500ms
    this.targetX = x;
    this.targetY = y;
    this.gameWidth = 800;
    this.gameHeight = 600;
    this.minY = 300; // Stay in lower 2/3 of screen
    this.maxY = 550;
    
    this.setRandomTarget();
  }

  setRandomTarget() {
    // Choose a random point in the spider's movement area
    this.targetX = Math.random() * this.gameWidth;
    this.targetY = this.minY + Math.random() * (this.maxY - this.minY);
  }

  update(deltaTime) {
    if (!this.active) return;

    this.bounceTimer += deltaTime * 1000;
    
    // Change target periodically for bouncing movement
    if (this.bounceTimer >= this.bounceInterval) {
      this.setRandomTarget();
      this.bounceTimer = 0;
    }

    // Move toward target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      const normalizedX = dx / distance;
      const normalizedY = dy / distance;
      
      this.x += normalizedX * this.speed * deltaTime;
      this.y += normalizedY * this.speed * deltaTime;
    } else {
      // Reached target, set new one
      this.setRandomTarget();
    }

    // Keep within bounds
    this.x = Math.max(this.size, Math.min(this.gameWidth - this.size, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
  }

  // Calculate point value based on proximity to player
  getPointValue(playerX, playerY) {
    const distance = Math.sqrt((this.x - playerX) ** 2 + (this.y - playerY) ** 2);
    if (distance < 50) return 900;
    if (distance < 100) return 600;
    return 300;
  }

  render(renderer) {
    if (!this.active) return;
    renderer.drawSpider(this.x, this.y, this.size);
  }
}

class Flea extends Enemy {
  constructor(x, y) {
    super(x, y, 'flea');
    this.speed = 150;
    this.pointValue = 200;
    this.dropTimer = 0;
    this.dropInterval = 30; // Drop mushroom every 30 pixels
    this.gameHeight = 600;
  }

  update(deltaTime, mushroomField) {
    if (!this.active) return;

    // Move straight down
    this.y += this.speed * deltaTime;
    this.dropTimer += this.speed * deltaTime;

    // Drop mushrooms as it falls
    if (this.dropTimer >= this.dropInterval && mushroomField) {
      mushroomField.addMushroom(this.x, this.y);
      this.dropTimer = 0;
    }

    // Remove if off-screen
    if (this.y > this.gameHeight + this.size) {
      this.active = false;
    }
  }

  render(renderer) {
    if (!this.active) return;
    renderer.drawFlea(this.x, this.y, this.size);
  }
}

class Scorpion extends Enemy {
  constructor(x, y, direction = 1) {
    super(x, y, 'scorpion');
    this.speed = 80;
    this.pointValue = 1000;
    this.direction = { x: direction, y: 0 };
    this.gameWidth = 800;
    this.poisonTrail = []; // Track mushrooms poisoned
  }

  update(deltaTime, mushroomField) {
    if (!this.active) return;

    // Move horizontally
    this.x += this.direction.x * this.speed * deltaTime;

    // Poison mushrooms as it passes over them
    if (mushroomField) {
      const nearbyMushroom = mushroomField.getMushroomAt(this.x, this.y, 20);
      if (nearbyMushroom && !nearbyMushroom.poisoned) {
        nearbyMushroom.poison();
        this.poisonTrail.push(nearbyMushroom);
      }
    }

    // Remove if off-screen
    if (this.x < -this.size || this.x > this.gameWidth + this.size) {
      this.active = false;
    }
  }

  render(renderer) {
    if (!this.active) return;
    renderer.drawScorpion(this.x, this.y, this.size);
  }
}

class EnemyManager {
  constructor(gameWidth, gameHeight) {
    this.enemies = [];
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.spawnTimers = {
      spider: 0,
      flea: 0,
      scorpion: 0
    };
    this.spawnIntervals = {
      spider: 8000,   // 8 seconds
      flea: 12000,    // 12 seconds
      scorpion: 20000 // 20 seconds
    };
    this.level = 1;
  }

  update(deltaTime, mushroomField, player) {
    // Update spawn timers
    for (const enemyType in this.spawnTimers) {
      this.spawnTimers[enemyType] += deltaTime * 1000;
    }

    // Spawn enemies based on conditions
    this.trySpawnEnemies(mushroomField, player);

    // Update all enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (enemy.type === 'flea') {
        enemy.update(deltaTime, mushroomField);
      } else if (enemy.type === 'scorpion') {
        enemy.update(deltaTime, mushroomField);
      } else {
        enemy.update(deltaTime);
      }

      // Remove inactive enemies or those off-screen
      if (!enemy.active || enemy.isOffScreen(this.gameWidth, this.gameHeight)) {
        this.enemies.splice(i, 1);
      }
    }
  }

  trySpawnEnemies(mushroomField, player) {
    // Spawn Spider
    if (this.spawnTimers.spider >= this.spawnIntervals.spider) {
      if (Math.random() < 0.7) { // 70% chance when timer is ready
        this.spawnSpider();
      }
      this.spawnTimers.spider = 0;
    }

    // Spawn Flea (only if few mushrooms in bottom area)
    if (this.spawnTimers.flea >= this.spawnIntervals.flea) {
      if (mushroomField && mushroomField.getBottomAreaMushroomCount() < 3) {
        this.spawnFlea();
      }
      this.spawnTimers.flea = 0;
    }

    // Spawn Scorpion
    if (this.spawnTimers.scorpion >= this.spawnIntervals.scorpion) {
      if (Math.random() < 0.5) { // 50% chance when timer is ready
        this.spawnScorpion();
      }
      this.spawnTimers.scorpion = 0;
    }
  }

  spawnSpider() {
    // Spawn from random side
    const side = Math.random() < 0.5 ? 0 : this.gameWidth;
    const y = 350 + Math.random() * 200; // Bottom area
    
    const spider = new Spider(side, y);
    this.enemies.push(spider);
  }

  spawnFlea() {
    // Spawn from top at random x position
    const x = 50 + Math.random() * (this.gameWidth - 100);
    const flea = new Flea(x, -20);
    this.enemies.push(flea);
  }

  spawnScorpion() {
    // Spawn from random side, in upper area
    const side = Math.random() < 0.5 ? -20 : this.gameWidth + 20;
    const direction = side < 0 ? 1 : -1;
    const y = 100 + Math.random() * 200; // Upper-middle area
    
    const scorpion = new Scorpion(side, y, direction);
    this.enemies.push(scorpion);
  }

  getActiveEnemies() {
    return this.enemies.filter(enemy => enemy.active);
  }

  clear() {
    this.enemies = [];
  }

  setLevel(level) {
    this.level = level;
    
    // Increase spawn rates with level
    const spawnMultiplier = Math.max(0.5, 1 - (level - 1) * 0.1);
    this.spawnIntervals.spider = Math.max(3000, 8000 * spawnMultiplier);
    this.spawnIntervals.flea = Math.max(5000, 12000 * spawnMultiplier);
    this.spawnIntervals.scorpion = Math.max(8000, 20000 * spawnMultiplier);
  }

  render(renderer) {
    for (const enemy of this.enemies) {
      enemy.render(renderer);
    }
  }
}