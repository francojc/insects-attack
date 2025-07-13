class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 16;
    this.speed = 200; // pixels per second
    this.bullets = [];
    this.maxBullets = 4;
    this.shootCooldown = 0;
    this.shootDelay = 150; // milliseconds
    this.alive = true;
    this.invulnerable = false;
    this.invulnerabilityTime = 0;
    this.maxInvulnerabilityTime = 2000; // 2 seconds

    // Movement boundaries (constrained to bottom third of screen)
    this.minX = this.size / 2;
    this.maxX = 800 - this.size / 2;
    this.minY = 400; // Bottom third starts at y=400
    this.maxY = 600 - this.size / 2;
  }

  update(deltaTime, inputManager) {
    if (!this.alive) return;

    // Update invulnerability
    if (this.invulnerable) {
      this.invulnerabilityTime -= deltaTime * 1000;
      if (this.invulnerabilityTime <= 0) {
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
      }
    }

    // Handle movement
    const movement = inputManager.getMovementInput();
    
    if (movement.x !== 0 || movement.y !== 0) {
      // Normalize diagonal movement
      const magnitude = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
      const normalizedX = movement.x / magnitude;
      const normalizedY = movement.y / magnitude;

      this.x += normalizedX * this.speed * deltaTime;
      this.y += normalizedY * this.speed * deltaTime;

      // Clamp to boundaries
      this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
      this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
    }

    // Update shoot cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime * 1000;
    }

    // Handle shooting
    if (inputManager.isShootPressed()) {
      if (this.canShoot()) {
        this.shoot();
      }
    }

    // Update bullets
    this.updateBullets(deltaTime);
  }

  shoot() {
    if (!this.canShoot()) return;

    this.bullets.push(new Bullet(this.x, this.y - this.size / 2, 0, -300)); // Speed: 300px/s upward
    this.shootCooldown = this.shootDelay;
    
    // Play shoot sound
    if (window.audioManager) {
      window.audioManager.playSound('shoot');
    }
  }

  canShoot() {
    return this.alive && 
           this.bullets.length < this.maxBullets && 
           this.shootCooldown <= 0;
  }

  updateBullets(deltaTime) {
    // Update all bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(deltaTime);

      // Remove bullets that are off-screen
      if (bullet.y < -bullet.size || 
          bullet.x < -bullet.size || 
          bullet.x > 800 + bullet.size) {
        this.bullets.splice(i, 1);
      }
    }
  }

  takeDamage() {
    if (this.invulnerable || !this.alive) return false;

    this.alive = false;
    
    // Play player hit sound
    if (window.audioManager) {
      window.audioManager.playSound('playerHit');
    }

    return true;
  }

  respawn(x, y) {
    this.x = x;
    this.y = y;
    this.alive = true;
    this.invulnerable = true;
    this.invulnerabilityTime = this.maxInvulnerabilityTime;
    this.bullets = []; // Clear all bullets
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
    if (!this.alive) return;

    // Blink during invulnerability
    if (this.invulnerable) {
      const blinkRate = 100; // milliseconds
      const shouldShow = Math.floor(this.invulnerabilityTime / blinkRate) % 2 === 0;
      if (!shouldShow) return;
    }

    renderer.drawPlayer(this.x, this.y, this.size);

    // Render bullets
    for (const bullet of this.bullets) {
      bullet.render(renderer);
    }
  }
}

class Bullet {
  constructor(x, y, velocityX, velocityY) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.size = 4;
    this.active = true;
  }

  update(deltaTime) {
    if (!this.active) return;

    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
  }

  getBounds() {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      width: this.size,
      height: this.size
    };
  }

  destroy() {
    this.active = false;
  }

  render(renderer) {
    if (!this.active) return;
    renderer.drawBullet(this.x, this.y, this.size);
  }
}