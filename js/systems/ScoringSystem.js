class ScoringSystem {
  constructor() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.extraLifeThreshold = 10000;
    this.nextExtraLifeScore = this.extraLifeThreshold;
    this.highScores = this.loadHighScores();
    
    // Point values
    this.pointValues = {
      centipedeHead: 100,
      centipedeBody: 10,
      spider: 300, // Base value, can be 300-900
      flea: 200,
      scorpion: 1000,
      mushroom: 1 // When destroyed by player
    };

    // UI elements
    this.scoreElement = document.getElementById('scoreValue');
    this.livesElement = document.getElementById('livesValue');
    this.levelElement = document.getElementById('levelValue');
    this.finalScoreElement = document.getElementById('finalScore');
    
    this.updateUI();
  }

  addScore(points, x = null, y = null) {
    this.score += points;
    
    // Check for extra life
    if (this.score >= this.nextExtraLifeScore) {
      this.lives++;
      this.nextExtraLifeScore += this.extraLifeThreshold;
      
      // Play level complete sound for extra life
      if (window.audioManager) {
        window.audioManager.playSound('levelComplete');
      }
      
      // Show extra life message
      this.showFloatingText('EXTRA LIFE!', x || 400, y || 300, '#00ff00');
    }
    
    // Show floating points if position provided
    if (x !== null && y !== null) {
      this.showFloatingText(`+${points}`, x, y, '#ffff00');
    }
    
    this.updateUI();
  }

  scoreDestroyed(entityType, entity = null, playerX = null, playerY = null) {
    let points = 0;
    let x = entity ? entity.x : null;
    let y = entity ? entity.y : null;

    switch (entityType) {
      case 'centipedeHead':
        points = this.pointValues.centipedeHead;
        break;
      case 'centipedeBody':
        points = this.pointValues.centipedeBody;
        break;
      case 'spider':
        // Spider points vary by proximity to player
        if (entity && playerX !== null && playerY !== null) {
          points = entity.getPointValue(playerX, playerY);
        } else {
          points = this.pointValues.spider;
        }
        break;
      case 'flea':
        points = this.pointValues.flea;
        break;
      case 'scorpion':
        points = this.pointValues.scorpion;
        break;
      case 'mushroom':
        points = this.pointValues.mushroom;
        break;
    }

    if (points > 0) {
      this.addScore(points, x, y);
    }
  }

  loseLife() {
    this.lives--;
    this.updateUI();
    
    if (this.lives <= 0) {
      return true; // Game over
    }
    
    return false;
  }

  nextLevel() {
    this.level++;
    this.updateUI();
    
    // Bonus points for level completion
    const levelBonus = this.level * 100;
    this.addScore(levelBonus, 400, 200);
  }

  showFloatingText(text, x, y, color = '#ffffff') {
    // This would ideally be handled by a particle system
    // For now, we'll store the floating text data for the game to render
    if (!window.floatingTexts) {
      window.floatingTexts = [];
    }
    
    window.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      color: color,
      life: 2000, // 2 seconds
      velocity: { x: 0, y: -50 } // Float upward
    });
  }

  updateFloatingTexts(deltaTime) {
    if (!window.floatingTexts) return;
    
    for (let i = window.floatingTexts.length - 1; i >= 0; i--) {
      const floatingText = window.floatingTexts[i];
      
      floatingText.life -= deltaTime * 1000;
      floatingText.x += floatingText.velocity.x * deltaTime;
      floatingText.y += floatingText.velocity.y * deltaTime;
      
      if (floatingText.life <= 0) {
        window.floatingTexts.splice(i, 1);
      }
    }
  }

  renderFloatingTexts(renderer) {
    if (!window.floatingTexts) return;
    
    for (const floatingText of window.floatingTexts) {
      const alpha = Math.max(0, floatingText.life / 2000); // Fade out
      const color = this.hexToRgba(floatingText.color, alpha);
      
      renderer.drawText(
        floatingText.text,
        floatingText.x,
        floatingText.y,
        16,
        color,
        'center'
      );
    }
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  updateUI() {
    if (this.scoreElement) this.scoreElement.textContent = this.score.toLocaleString();
    if (this.livesElement) this.livesElement.textContent = this.lives;
    if (this.levelElement) this.levelElement.textContent = this.level;
  }

  gameOver() {
    // Save high score if applicable
    this.saveHighScore();
    
    // Update final score display
    if (this.finalScoreElement) {
      this.finalScoreElement.textContent = this.score.toLocaleString();
    }
  }

  saveHighScore() {
    this.highScores.push({
      score: this.score,
      level: this.level,
      date: new Date().toLocaleDateString()
    });
    
    // Keep only top 10 scores
    this.highScores.sort((a, b) => b.score - a.score);
    this.highScores = this.highScores.slice(0, 10);
    
    // Save to localStorage
    try {
      localStorage.setItem('insectsAttackHighScores', JSON.stringify(this.highScores));
    } catch (error) {
      console.warn('Could not save high scores:', error);
    }
  }

  loadHighScores() {
    try {
      const saved = localStorage.getItem('insectsAttackHighScores');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Could not load high scores:', error);
      return [];
    }
  }

  getHighScores() {
    return this.highScores;
  }

  isHighScore() {
    return this.highScores.length < 10 || this.score > this.highScores[this.highScores.length - 1].score;
  }

  reset() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.nextExtraLifeScore = this.extraLifeThreshold;
    this.updateUI();
    
    // Clear floating texts
    if (window.floatingTexts) {
      window.floatingTexts = [];
    }
  }

  // Getters for game state
  getScore() { return this.score; }
  getLives() { return this.lives; }
  getLevel() { return this.level; }
  isGameOver() { return this.lives <= 0; }
}