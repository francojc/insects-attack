class AudioManager {
  constructor() {
    this.audioContext = null;
    this.sounds = new Map();
    this.masterVolume = 0.5;
    this.enabled = true;
    
    this.initializeAudioContext();
  }

  async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume context on user interaction (required by browsers)
      const resumeContext = () => {
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }
        document.removeEventListener('click', resumeContext);
        document.removeEventListener('keydown', resumeContext);
        document.removeEventListener('touchstart', resumeContext);
      };

      document.addEventListener('click', resumeContext);
      document.addEventListener('keydown', resumeContext);
      document.addEventListener('touchstart', resumeContext);

      this.createSounds();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.enabled = false;
    }
  }

  createSounds() {
    if (!this.audioContext) return;

    // Create synthesized sound effects
    this.sounds.set('shoot', this.createShootSound());
    this.sounds.set('explosion', this.createExplosionSound());
    this.sounds.set('enemyHit', this.createEnemyHitSound());
    this.sounds.set('playerHit', this.createPlayerHitSound());
    this.sounds.set('levelComplete', this.createLevelCompleteSound());
    this.sounds.set('gameOver', this.createGameOverSound());
    this.sounds.set('spiderBounce', this.createSpiderBounceSound());
  }

  createShootSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.1);
    };
  }

  createExplosionSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);

      oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);

      gainNode.gain.setValueAtTime(this.masterVolume * 0.5, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.3);
    };
  }

  createEnemyHitSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.2);
    };
  }

  createPlayerHitSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(100, this.audioContext.currentTime + 0.5);

      gainNode.gain.setValueAtTime(this.masterVolume * 0.6, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.5);
    };
  }

  createLevelCompleteSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;

      const notes = [262, 330, 392, 523]; // C, E, G, C (major chord)
      
      notes.forEach((freq, index) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.15);
        gainNode.gain.setValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + index * 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + index * 0.15 + 0.3);

        oscillator.start(this.audioContext.currentTime + index * 0.15);
        oscillator.stop(this.audioContext.currentTime + index * 0.15 + 0.3);
      });
    };
  }

  createGameOverSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;

      const notes = [392, 349, 311, 262]; // G, F, Eb, C (descending)
      
      notes.forEach((freq, index) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.2);
        gainNode.gain.setValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime + index * 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + index * 0.2 + 0.4);

        oscillator.start(this.audioContext.currentTime + index * 0.2);
        oscillator.stop(this.audioContext.currentTime + index * 0.2 + 0.4);
      });
    };
  }

  createSpiderBounceSound() {
    return () => {
      if (!this.enabled || !this.audioContext) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Create a quick chittering/clicking sound like a spider
      oscillator.type = 'square';
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(400, this.audioContext.currentTime);

      // Quick frequency bounce for spider-like sound
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.05);
      oscillator.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.1);

      // Short, quiet sound so it doesn't become annoying
      gainNode.gain.setValueAtTime(this.masterVolume * 0.15, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.1);
    };
  }

  playSound(name) {
    const soundFunction = this.sounds.get(name);
    if (soundFunction) {
      soundFunction();
    }
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}