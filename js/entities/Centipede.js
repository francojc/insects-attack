class CentipedeSegment {
  constructor(x, y, isHead = false) {
    this.x = x;
    this.y = y;
    this.size = 16;
    this.isHead = isHead;
    this.active = true;
    this.direction = 1; // 1 for right, -1 for left
    this.dropDistance = 20; // How far to drop when hitting obstacle
    this.nextSegment = null; // Linked list structure
    this.previousSegment = null;
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
    renderer.drawCentipedeSegment(this.x, this.y, this.size, this.isHead);
  }
}

class Centipede {
  constructor(x, y, segmentCount = 12) {
    this.segments = [];
    this.speed = 60; // pixels per second
    this.direction = 1; // 1 for right, -1 for left
    this.dropDistance = 20;
    this.gameWidth = 800;
    this.gameHeight = 600;
    this.mushroomField = null;
    this.straightDown = false; // For poisoned mushroom behavior
    this.straightDownTimer = 0;
    
    this.createSegments(x, y, segmentCount);
  }

  createSegments(startX, startY, count) {
    this.segments = [];
    
    for (let i = 0; i < count; i++) {
      const segment = new CentipedeSegment(
        startX - i * 16, // Space segments 16 pixels apart horizontally
        startY,
        i === 0 // First segment is the head
      );
      
      // Link segments
      if (i > 0) {
        this.segments[i - 1].nextSegment = segment;
        segment.previousSegment = this.segments[i - 1];
      }
      
      this.segments.push(segment);
    }
  }

  update(deltaTime, mushroomField) {
    this.mushroomField = mushroomField;
    
    // Update straight down timer
    if (this.straightDown) {
      this.straightDownTimer -= deltaTime * 1000;
      if (this.straightDownTimer <= 0) {
        this.straightDown = false;
      }
    }

    // Calculate speed increase based on remaining segments
    const speedMultiplier = Math.max(0.5, 1 + (12 - this.segments.length) * 0.1);
    const currentSpeed = this.speed * speedMultiplier;

    // Update head segment first
    if (this.segments.length > 0 && this.segments[0].active) {
      this.updateHeadSegment(deltaTime, currentSpeed);
    }

    // Update following segments
    for (let i = 1; i < this.segments.length; i++) {
      if (this.segments[i].active) {
        this.updateFollowingSegment(i, deltaTime, currentSpeed);
      }
    }

    // Remove inactive segments
    this.segments = this.segments.filter(segment => segment.active);
    
    // If no head, promote the first segment to head
    if (this.segments.length > 0 && !this.segments[0].isHead) {
      this.segments[0].isHead = true;
    }
  }

  updateHeadSegment(deltaTime, speed) {
    const head = this.segments[0];
    let moveX = 0;
    let moveY = 0;

    if (this.straightDown) {
      // Move straight down when affected by poisoned mushroom
      moveY = speed * deltaTime;
    } else {
      // Normal horizontal movement
      moveX = this.direction * speed * deltaTime;
      
      // Check for edge collision or mushroom collision
      const futureX = head.x + moveX;
      const futureY = head.y;
      
      let shouldTurn = false;
      
      // Check screen edges
      if (futureX <= head.size / 2 || futureX >= this.gameWidth - head.size / 2) {
        shouldTurn = true;
      }
      
      // Check mushroom collision
      if (this.mushroomField) {
        const futureBounds = {
          x: futureX - head.size / 2,
          y: futureY - head.size / 2,
          width: head.size,
          height: head.size
        };
        
        const collidedMushroom = this.mushroomField.checkCollision(futureBounds);
        if (collidedMushroom) {
          shouldTurn = true;
          
          // Check if mushroom is poisoned
          if (collidedMushroom.poisoned) {
            this.straightDown = true;
            this.straightDownTimer = 1000; // 1 second of straight down movement
          }
        }
      }
      
      if (shouldTurn) {
        // Change direction and drop down
        this.direction *= -1;
        moveX = 0;
        moveY = this.dropDistance;
        
        // Update direction for all segments
        for (const segment of this.segments) {
          segment.direction = this.direction;
        }
      }
    }

    head.x += moveX;
    head.y += moveY;
  }

  updateFollowingSegment(index, deltaTime, speed) {
    const segment = this.segments[index];
    const previousSegment = this.segments[index - 1];
    
    if (!previousSegment || !previousSegment.active) return;

    // Calculate target position (follow the previous segment)
    const targetDistance = 16; // Distance to maintain from previous segment
    const dx = previousSegment.x - segment.x;
    const dy = previousSegment.y - segment.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > targetDistance) {
      // Move toward the previous segment
      const moveRatio = Math.min(1, (speed * deltaTime) / distance);
      const targetX = segment.x + dx * moveRatio;
      const targetY = segment.y + dy * moveRatio;
      
      // Ensure we don't overshoot
      const newDx = targetX - previousSegment.x;
      const newDy = targetY - previousSegment.y;
      const newDistance = Math.sqrt(newDx * newDx + newDy * newDy);
      
      if (newDistance <= targetDistance) {
        segment.x = targetX;
        segment.y = targetY;
      } else {
        // Position at exact target distance
        const normalizedX = dx / distance;
        const normalizedY = dy / distance;
        segment.x = previousSegment.x - normalizedX * targetDistance;
        segment.y = previousSegment.y - normalizedY * targetDistance;
      }
    }
  }

  removeSegment(segmentIndex) {
    if (segmentIndex < 0 || segmentIndex >= this.segments.length) return [];

    const removedSegment = this.segments[segmentIndex];
    removedSegment.active = false;

    // If we hit the head or a middle segment, split the centipede
    const newCentipedes = [];
    
    if (segmentIndex === 0) {
      // Head was hit - remaining segments continue as one centipede
      this.segments.splice(0, 1);
      if (this.segments.length > 0) {
        this.segments[0].isHead = true;
        this.segments[0].previousSegment = null;
      }
    } else if (segmentIndex === this.segments.length - 1) {
      // Tail was hit - just remove it
      this.segments.splice(segmentIndex, 1);
      if (this.segments.length > 0) {
        this.segments[this.segments.length - 1].nextSegment = null;
      }
    } else {
      // Middle segment was hit - split into two centipedes
      const secondPartSegments = this.segments.splice(segmentIndex + 1);
      this.segments.splice(segmentIndex, 1); // Remove the hit segment
      
      // Create new centipede from the second part
      if (secondPartSegments.length > 0) {
        const newCentipede = new Centipede(0, 0, 0); // Empty centipede
        newCentipede.segments = secondPartSegments;
        newCentipede.segments[0].isHead = true;
        newCentipede.segments[0].previousSegment = null;
        newCentipede.direction = this.direction;
        newCentipede.speed = this.speed;
        newCentipede.mushroomField = this.mushroomField;
        newCentipedes.push(newCentipede);
      }
      
      // Fix the first part
      if (this.segments.length > 0) {
        this.segments[this.segments.length - 1].nextSegment = null;
      }
    }

    // Add mushroom where segment was destroyed
    if (this.mushroomField) {
      this.mushroomField.addMushroom(removedSegment.x, removedSegment.y);
    }

    return newCentipedes;
  }

  isEmpty() {
    return this.segments.length === 0 || this.segments.every(segment => !segment.active);
  }

  render(renderer) {
    for (const segment of this.segments) {
      segment.render(renderer);
    }
  }

  // Check if centipede has reached the player area
  hasReachedPlayerArea() {
    return this.segments.some(segment => segment.active && segment.y >= 400);
  }
}

class CentipedeManager {
  constructor(gameWidth, gameHeight) {
    this.centipedes = [];
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.spawnY = 50; // Top of screen
    this.level = 1;
  }

  spawnCentipede(segmentCount = 12) {
    const startX = this.gameWidth / 2;
    const centipede = new Centipede(startX, this.spawnY, segmentCount);
    this.centipedes.push(centipede);
    console.log(`Spawned centipede with ${segmentCount} segments at (${startX}, ${this.spawnY})`);
    return centipede;
  }

  update(deltaTime, mushroomField) {
    // Update all centipedes
    for (let i = this.centipedes.length - 1; i >= 0; i--) {
      const centipede = this.centipedes[i];
      centipede.update(deltaTime, mushroomField);
      
      // Remove empty centipedes
      if (centipede.isEmpty()) {
        this.centipedes.splice(i, 1);
      }
    }
  }

  handleSegmentHit(centipedeIndex, segmentIndex) {
    if (centipedeIndex < 0 || centipedeIndex >= this.centipedes.length) return;
    
    const centipede = this.centipedes[centipedeIndex];
    const newCentipedes = centipede.removeSegment(segmentIndex);
    
    // Add any new centipedes created by splitting
    this.centipedes.push(...newCentipedes);
    
    // Play enemy hit sound
    if (window.audioManager) {
      window.audioManager.playSound('enemyHit');
    }
  }

  getAllSegments() {
    const allSegments = [];
    for (const centipede of this.centipedes) {
      allSegments.push(...centipede.segments.filter(segment => segment.active));
    }
    return allSegments;
  }

  getAllCentipedes() {
    return this.centipedes.filter(c => !c.isEmpty());
  }

  isEmpty() {
    return this.centipedes.length === 0 || this.centipedes.every(c => c.isEmpty());
  }

  clear() {
    this.centipedes = [];
  }

  render(renderer) {
    for (const centipede of this.centipedes) {
      centipede.render(renderer);
    }
  }

  // Check if any centipede has reached the player area
  hasReachedPlayerArea() {
    return this.centipedes.some(centipede => centipede.hasReachedPlayerArea());
  }
}