class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 800;
    this.height = 600;
    this.scale = 1;
    this.currentLevel = 1;
    
    this.setupCanvas();
    this.setupViewport();
    this.setupColorThemes();
    
    // Rendering optimization
    this.ctx.imageSmoothingEnabled = false;
  }

  setupColorThemes() {
    this.colorThemes = {
      1: { // Forest green
        background: '#001100',
        player: '#00ff00',
        bullets: '#ffff00',
        mushrooms: ['#ff0000', '#ff4444', '#ff8888', '#ffaaaa'],
        centipedeHead: '#ffff00',
        centipedeBody: '#ff6600',
        spider: { body: '#ff4500', legs: '#cc3300', accent: '#ffaa00' },
        flea: '#00ffff',
        scorpion: '#ffaa00'
      },
      2: { // Ocean blue
        background: '#000033',
        player: '#00ffff',
        bullets: '#ffffff',
        mushrooms: ['#0066ff', '#3388ff', '#66aaff', '#99ccff'],
        centipedeHead: '#ffffff',
        centipedeBody: '#0088ff',
        spider: { body: '#ff6600', legs: '#dd4400', accent: '#ffcc00' },
        flea: '#ff00ff',
        scorpion: '#00ff88'
      },
      3: { // Purple twilight
        background: '#220044',
        player: '#ff00ff',
        bullets: '#ffff88',
        mushrooms: ['#8800ff', '#aa44ff', '#cc88ff', '#eeccff'],
        centipedeHead: '#ffff88',
        centipedeBody: '#ff4488',
        spider: { body: '#ff8800', legs: '#ee6600', accent: '#ffdd00' },
        flea: '#00ff00',
        scorpion: '#ff8844'
      },
      4: { // Fiery red
        background: '#330000',
        player: '#ffff00',
        bullets: '#ffffff',
        mushrooms: ['#ff8800', '#ffaa44', '#ffcc88', '#ffeedd'],
        centipedeHead: '#ffffff',
        centipedeBody: '#ff0044',
        spider: { body: '#00ff88', legs: '#00dd66', accent: '#88ffaa' },
        flea: '#8888ff',
        scorpion: '#ff4400'
      },
      5: { // Electric neon
        background: '#004400',
        player: '#00ffff',
        bullets: '#ff00ff',
        mushrooms: ['#ff0088', '#ff44aa', '#ff88cc', '#ffccee'],
        centipedeHead: '#ff00ff',
        centipedeBody: '#00ff88',
        spider: { body: '#ffff00', legs: '#dddd00', accent: '#ffff88' },
        flea: '#ff4400',
        scorpion: '#8800ff'
      }
    };
  }

  setLevel(level) {
    this.currentLevel = level;
  }

  getCurrentTheme() {
    // Cycle through themes, using modulo for levels beyond defined themes
    const themeIndex = ((this.currentLevel - 1) % 5) + 1;
    return this.colorThemes[themeIndex] || this.colorThemes[1];
  }

  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
  }

  setupViewport() {
    // Handle responsive scaling
    const resizeHandler = () => {
      const containerWidth = window.innerWidth - 40;
      const containerHeight = window.innerHeight - 100;
      
      const scaleX = containerWidth / this.width;
      const scaleY = containerHeight / this.height;
      this.scale = Math.min(scaleX, scaleY, 1);
      
      this.canvas.style.width = (this.width * this.scale) + 'px';
      this.canvas.style.height = (this.height * this.scale) + 'px';
    };

    window.addEventListener('resize', resizeHandler);
    resizeHandler();
  }

  clear() {
    const theme = this.getCurrentTheme();
    this.ctx.fillStyle = theme.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawRect(x, y, width, height, color = '#fff') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), width, height);
  }

  drawCircle(x, y, radius, color = '#fff') {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(Math.round(x), Math.round(y), radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawText(text, x, y, size = 16, color = '#fff', align = 'left') {
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px 'Courier New', monospace`;
    this.ctx.textAlign = align;
    this.ctx.fillText(text, Math.round(x), Math.round(y));
  }

  drawLine(x1, y1, x2, y2, color = '#fff', width = 1) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(Math.round(x1), Math.round(y1));
    this.ctx.lineTo(Math.round(x2), Math.round(y2));
    this.ctx.stroke();
  }

  // Specialized drawing methods for game entities
  drawPlayer(x, y, size) {
    const theme = this.getCurrentTheme();
    // Draw player as a triangle pointing up
    this.ctx.fillStyle = theme.player;
    this.ctx.beginPath();
    this.ctx.moveTo(Math.round(x), Math.round(y - size / 2));
    this.ctx.lineTo(Math.round(x - size / 2), Math.round(y + size / 2));
    this.ctx.lineTo(Math.round(x + size / 2), Math.round(y + size / 2));
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawBullet(x, y, size) {
    const theme = this.getCurrentTheme();
    this.drawRect(x - size / 2, y - size / 2, size, size, theme.bullets);
  }

  drawMushroom(x, y, size, health) {
    const theme = this.getCurrentTheme();
    const color = theme.mushrooms[Math.max(0, health - 1)] || theme.mushrooms[0];
    
    // Draw mushroom cap
    this.drawCircle(x, y - size / 4, size / 2, color);
    // Draw mushroom stem
    this.drawRect(x - size / 6, y, size / 3, size / 2, '#8b4513');
  }

  drawCentipedeSegment(x, y, size, isHead = false) {
    const theme = this.getCurrentTheme();
    const color = isHead ? theme.centipedeHead : theme.centipedeBody;
    this.drawCircle(x, y, size / 2, color);
    
    if (isHead) {
      // Draw eyes
      this.drawCircle(x - size / 4, y - size / 6, 2, '#000');
      this.drawCircle(x + size / 4, y - size / 6, 2, '#000');
    }
  }

  drawSpider(x, y, size) {
    const ctx = this.ctx;
    const theme = this.getCurrentTheme();
    
    // Spider colors from theme - bright and contrasting for visibility
    const bodyColor = theme.spider.body;
    const legColor = theme.spider.legs;
    const accentColor = theme.spider.accent;
    
    // Draw spider legs (8 legs in 4 pairs)
    ctx.strokeStyle = legColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < 4; i++) {
      const side = i < 2 ? -1 : 1; // Left or right side
      const legIndex = i % 2; // Which leg on that side
      
      // Leg angles for realistic spider leg positioning
      const baseAngle = side === -1 ? Math.PI * 0.8 : Math.PI * 0.2;
      const angleOffset = (legIndex * 0.6 - 0.3) * side;
      const angle = baseAngle + angleOffset;
      
      // Leg segments for jointed appearance
      const seg1Length = size * 0.4;
      const seg2Length = size * 0.35;
      
      // First segment
      const joint1X = x + Math.cos(angle) * seg1Length;
      const joint1Y = y + Math.sin(angle) * seg1Length;
      
      // Second segment (bends outward)
      const bendAngle = angle + (side * 0.8);
      const endX = joint1X + Math.cos(bendAngle) * seg2Length;
      const endY = joint1Y + Math.sin(bendAngle) * seg2Length;
      
      // Draw leg segments
      ctx.beginPath();
      ctx.moveTo(Math.round(x), Math.round(y));
      ctx.lineTo(Math.round(joint1X), Math.round(joint1Y));
      ctx.lineTo(Math.round(endX), Math.round(endY));
      ctx.stroke();
    }
    
    // Draw spider abdomen (larger rear section)
    const abdomenSize = size * 0.6;
    this.drawCircle(x + size * 0.1, y + size * 0.1, abdomenSize / 2, bodyColor);
    
    // Draw spider cephalothorax (front section with legs attached)
    const cephSize = size * 0.45;
    this.drawCircle(x - size * 0.05, y - size * 0.05, cephSize / 2, accentColor);
    
    // Draw eyes (spiders have multiple eyes)
    ctx.fillStyle = '#ff0000';
    const eyeSize = 1.5;
    // Main eyes
    ctx.beginPath();
    ctx.arc(Math.round(x - size * 0.15), Math.round(y - size * 0.2), eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(Math.round(x + size * 0.05), Math.round(y - size * 0.2), eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Secondary eyes (smaller)
    ctx.fillStyle = '#cc0000';
    const smallEyeSize = 1;
    ctx.beginPath();
    ctx.arc(Math.round(x - size * 0.25), Math.round(y - size * 0.15), smallEyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(Math.round(x + size * 0.15), Math.round(y - size * 0.15), smallEyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw pedipalps (feeding appendages)
    ctx.strokeStyle = legColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.round(x - size * 0.1), Math.round(y));
    ctx.lineTo(Math.round(x - size * 0.25), Math.round(y + size * 0.1));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(Math.round(x + size * 0.1), Math.round(y));
    ctx.lineTo(Math.round(x + size * 0.25), Math.round(y + size * 0.1));
    ctx.stroke();
    
    // Add some texture markings on abdomen
    ctx.fillStyle = '#1a100a';
    ctx.beginPath();
    ctx.arc(Math.round(x + size * 0.05), Math.round(y + size * 0.05), 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(Math.round(x + size * 0.15), Math.round(y + size * 0.15), 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFlea(x, y, size) {
    const theme = this.getCurrentTheme();
    this.drawCircle(x, y, size / 2, theme.flea);
    // Draw simple antenna
    this.drawLine(x, y - size / 2, x, y - size, theme.flea, 1);
  }

  drawScorpion(x, y, size) {
    const theme = this.getCurrentTheme();
    // Draw body
    this.drawRect(x - size / 2, y - size / 4, size, size / 2, theme.scorpion);
    // Draw tail
    this.drawRect(x + size / 2, y - size / 6, size / 4, size / 3, theme.scorpion);
    // Draw claws
    this.drawRect(x - size / 2 - size / 4, y - size / 6, size / 4, size / 3, theme.scorpion);
  }

  getCanvasMousePos(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / this.scale,
      y: (event.clientY - rect.top) / this.scale
    };
  }
}