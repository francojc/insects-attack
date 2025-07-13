class Mushroom {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 16;
    this.health = 4; // Takes 4 hits to destroy
    this.maxHealth = 4;
    this.poisoned = false;
    this.active = true;
  }

  takeDamage() {
    if (!this.active) return false;

    this.health--;
    
    if (this.health <= 0) {
      this.active = false;
      return true; // Mushroom destroyed
    }
    
    return false; // Mushroom damaged but still active
  }

  poison() {
    this.poisoned = true;
  }

  unpoison() {
    this.poisoned = false;
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
    if (!this.active) return;

    // Different rendering for poisoned mushrooms
    if (this.poisoned) {
      // Purple tint for poisoned mushrooms
      renderer.drawMushroom(this.x, this.y, this.size, this.health);
      // Add purple overlay
      renderer.drawCircle(this.x, this.y - this.size / 4, this.size / 2 - 2, 'rgba(128, 0, 128, 0.5)');
    } else {
      renderer.drawMushroom(this.x, this.y, this.size, this.health);
    }
  }
}

class MushroomField {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.mushrooms = [];
    this.gridSize = 20; // Grid spacing for mushroom placement
    this.playableAreaTop = 100; // Top of mushroom area
    this.playableAreaBottom = 400; // Bottom of mushroom area (player area starts here)
    
    this.generateField();
  }

  generateField() {
    this.mushrooms = [];
    
    // Generate mushrooms in a grid pattern with some randomness
    const rows = Math.floor((this.playableAreaBottom - this.playableAreaTop) / this.gridSize);
    const cols = Math.floor(this.width / this.gridSize);
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Random chance to place a mushroom (about 15% density)
        if (Math.random() < 0.15) {
          const x = col * this.gridSize + this.gridSize / 2;
          const y = this.playableAreaTop + row * this.gridSize + this.gridSize / 2;
          
          // Make sure mushroom is within bounds
          if (x >= 16 && x <= this.width - 16 && y >= this.playableAreaTop && y <= this.playableAreaBottom - 16) {
            this.mushrooms.push(new Mushroom(x, y));
          }
        }
      }
    }
  }

  addMushroom(x, y) {
    // Snap to grid
    const gridX = Math.round(x / this.gridSize) * this.gridSize;
    const gridY = Math.round(y / this.gridSize) * this.gridSize;
    
    // Check if position is valid and not occupied
    if (gridX >= 16 && gridX <= this.width - 16 && 
        gridY >= this.playableAreaTop && gridY <= this.playableAreaBottom - 16) {
      
      // Check if there's already a mushroom at this position
      const existing = this.mushrooms.find(m => 
        m.active && Math.abs(m.x - gridX) < 10 && Math.abs(m.y - gridY) < 10
      );
      
      if (!existing) {
        this.mushrooms.push(new Mushroom(gridX, gridY));
      }
    }
  }

  getMushroomAt(x, y, tolerance = 16) {
    return this.mushrooms.find(mushroom => 
      mushroom.active &&
      Math.abs(mushroom.x - x) < tolerance &&
      Math.abs(mushroom.y - y) < tolerance
    );
  }

  checkCollision(bounds) {
    return this.mushrooms.find(mushroom => {
      if (!mushroom.active) return false;
      
      const mushroomBounds = mushroom.getBounds();
      return this.rectsIntersect(bounds, mushroomBounds);
    });
  }

  rectsIntersect(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  poisonMushroom(x, y) {
    const mushroom = this.getMushroomAt(x, y);
    if (mushroom) {
      mushroom.poison();
    }
  }

  getPoisonedMushrooms() {
    return this.mushrooms.filter(m => m.active && m.poisoned);
  }

  getActiveMushrooms() {
    return this.mushrooms.filter(m => m.active);
  }

  // Check how many mushrooms are in the bottom area (for flea spawning)
  getBottomAreaMushroomCount() {
    const bottomAreaTop = this.playableAreaBottom - 60; // Bottom 60 pixels of mushroom area
    return this.mushrooms.filter(m => 
      m.active && m.y >= bottomAreaTop && m.y <= this.playableAreaBottom
    ).length;
  }

  render(renderer) {
    for (const mushroom of this.mushrooms) {
      mushroom.render(renderer);
    }
  }

  clear() {
    this.mushrooms = [];
  }

  regeneratePartial() {
    // Remove some destroyed mushrooms and add new ones for next level
    const destroyedCount = this.mushrooms.filter(m => !m.active).length;
    const newMushroomsToAdd = Math.min(destroyedCount, Math.floor(destroyedCount * 0.3));
    
    // Remove destroyed mushrooms
    this.mushrooms = this.mushrooms.filter(m => m.active);
    
    // Add some new mushrooms
    for (let i = 0; i < newMushroomsToAdd; i++) {
      const attempts = 50; // Limit attempts to prevent infinite loop
      for (let attempt = 0; attempt < attempts; attempt++) {
        const x = Math.random() * (this.width - 32) + 16;
        const y = Math.random() * (this.playableAreaBottom - this.playableAreaTop - 32) + this.playableAreaTop + 16;
        
        if (!this.getMushroomAt(x, y, 20)) {
          this.addMushroom(x, y);
          break;
        }
      }
    }
  }
}