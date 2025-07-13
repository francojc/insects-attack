class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 800;
    this.height = 600;
    this.scale = 1;
    
    this.setupCanvas();
    this.setupViewport();
    
    // Rendering optimization
    this.ctx.imageSmoothingEnabled = false;
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
    this.ctx.fillStyle = '#001100';
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
    // Draw player as a triangle pointing up
    this.ctx.fillStyle = '#00ff00';
    this.ctx.beginPath();
    this.ctx.moveTo(Math.round(x), Math.round(y - size / 2));
    this.ctx.lineTo(Math.round(x - size / 2), Math.round(y + size / 2));
    this.ctx.lineTo(Math.round(x + size / 2), Math.round(y + size / 2));
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawBullet(x, y, size) {
    this.drawRect(x - size / 2, y - size / 2, size, size, '#ffff00');
  }

  drawMushroom(x, y, size, health) {
    const colors = ['#ff0000', '#ff4444', '#ff8888', '#ffaaaa'];
    const color = colors[Math.max(0, health - 1)] || '#ff0000';
    
    // Draw mushroom cap
    this.drawCircle(x, y - size / 4, size / 2, color);
    // Draw mushroom stem
    this.drawRect(x - size / 6, y, size / 3, size / 2, '#8b4513');
  }

  drawCentipedeSegment(x, y, size, isHead = false) {
    const color = isHead ? '#ffff00' : '#ff6600';
    this.drawCircle(x, y, size / 2, color);
    
    if (isHead) {
      // Draw eyes
      this.drawCircle(x - size / 4, y - size / 6, 2, '#000');
      this.drawCircle(x + size / 4, y - size / 6, 2, '#000');
    }
  }

  drawSpider(x, y, size) {
    // Draw spider body
    this.drawCircle(x, y, size / 2, '#800080');
    // Draw legs (simplified)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const legX = x + Math.cos(angle) * size / 2;
      const legY = y + Math.sin(angle) * size / 2;
      this.drawLine(x, y, legX, legY, '#800080', 2);
    }
  }

  drawFlea(x, y, size) {
    this.drawCircle(x, y, size / 2, '#00ffff');
    // Draw simple antenna
    this.drawLine(x, y - size / 2, x, y - size, '#00ffff', 1);
  }

  drawScorpion(x, y, size) {
    // Draw body
    this.drawRect(x - size / 2, y - size / 4, size, size / 2, '#ffaa00');
    // Draw tail
    this.drawRect(x + size / 2, y - size / 6, size / 4, size / 3, '#ffaa00');
    // Draw claws
    this.drawRect(x - size / 2 - size / 4, y - size / 6, size / 4, size / 3, '#ffaa00');
  }

  getCanvasMousePos(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / this.scale,
      y: (event.clientY - rect.top) / this.scale
    };
  }
}