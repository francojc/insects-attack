class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.prevKeys = {};
    this.mouse = { x: 0, y: 0, pressed: false, prevPressed: false };
    this.touches = new Map();
    this.virtualJoystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
    
    // Touch button states
    this.touchButtons = {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false
    };
    
    this.setupKeyboardEvents();
    this.setupMouseEvents();
    this.setupTouchEvents();
    this.setupMobileButtons();
  }

  setupKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      
      // Prevent default for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Handle focus loss
    window.addEventListener('blur', () => {
      this.keys = {};
    });
  }

  setupMouseEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.mouse.pressed = true;
      this.updateMousePosition(e);
      e.preventDefault();
    });

    this.canvas.addEventListener('mouseup', (e) => {
      this.mouse.pressed = false;
      e.preventDefault();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.updateMousePosition(e);
    });
  }

  setupTouchEvents() {
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      
      for (let touch of e.changedTouches) {
        this.touches.set(touch.identifier, {
          x: this.getCanvasPos(touch).x,
          y: this.getCanvasPos(touch).y,
          startX: this.getCanvasPos(touch).x,
          startY: this.getCanvasPos(touch).y
        });

        // Start virtual joystick if touch is in bottom area
        const pos = this.getCanvasPos(touch);
        if (pos.y > this.canvas.height * 0.7) {
          this.virtualJoystick.active = true;
          this.virtualJoystick.startX = pos.x;
          this.virtualJoystick.startY = pos.y;
          this.virtualJoystick.currentX = pos.x;
          this.virtualJoystick.currentY = pos.y;
        }
      }
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      
      for (let touch of e.changedTouches) {
        if (this.touches.has(touch.identifier)) {
          const pos = this.getCanvasPos(touch);
          this.touches.set(touch.identifier, {
            ...this.touches.get(touch.identifier),
            x: pos.x,
            y: pos.y
          });

          // Update virtual joystick
          if (this.virtualJoystick.active) {
            this.virtualJoystick.currentX = pos.x;
            this.virtualJoystick.currentY = pos.y;
          }
        }
      }
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      
      for (let touch of e.changedTouches) {
        this.touches.delete(touch.identifier);
      }

      // End virtual joystick if no touches remain
      if (this.touches.size === 0) {
        this.virtualJoystick.active = false;
      }
    });
  }

  updateMousePosition(e) {
    const pos = this.getCanvasPos(e);
    this.mouse.x = pos.x;
    this.mouse.y = pos.y;
  }

  getCanvasPos(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  update() {
    // Store previous frame state
    this.prevKeys = { ...this.keys };
    this.mouse.prevPressed = this.mouse.pressed;
  }

  // Keyboard input methods
  isKeyDown(key) {
    return !!this.keys[key];
  }

  isKeyPressed(key) {
    return !!this.keys[key] && !this.prevKeys[key];
  }

  isKeyReleased(key) {
    return !this.keys[key] && !!this.prevKeys[key];
  }

  // Mouse input methods
  isMouseDown() {
    return this.mouse.pressed;
  }

  isMousePressed() {
    return this.mouse.pressed && !this.mouse.prevPressed;
  }

  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  // Game-specific input methods
  getMovementInput() {
    let x = 0, y = 0;

    // Keyboard input
    if (this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA')) x -= 1;
    if (this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD')) x += 1;
    if (this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW')) y -= 1;
    if (this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS')) y += 1;

    // Touch button input
    if (this.touchButtons.left) x -= 1;
    if (this.touchButtons.right) x += 1;
    if (this.touchButtons.up) y -= 1;
    if (this.touchButtons.down) y += 1;

    // Virtual joystick input (only if touch buttons aren't being used)
    const anyButtonPressed = this.touchButtons.up || this.touchButtons.down || 
                             this.touchButtons.left || this.touchButtons.right;
    if (this.virtualJoystick.active && !anyButtonPressed) {
      const deltaX = this.virtualJoystick.currentX - this.virtualJoystick.startX;
      const deltaY = this.virtualJoystick.currentY - this.virtualJoystick.startY;
      const deadzone = 20;
      const maxDistance = 50;

      if (Math.abs(deltaX) > deadzone) {
        x = Math.max(-1, Math.min(1, deltaX / maxDistance));
      }
      if (Math.abs(deltaY) > deadzone) {
        y = Math.max(-1, Math.min(1, deltaY / maxDistance));
      }
    }

    return { x, y };
  }

  isShootPressed() {
    const spacePressed = this.isKeyDown('Space');
    const mousePressed = this.isMouseDown();
    const touchPressed = this.isTouchHeld();
    const shootButtonPressed = this.touchButtons.shoot;
    
    return spacePressed || mousePressed || touchPressed || shootButtonPressed;
  }

  isShootHeld() {
    return this.isKeyDown('Space') || this.isMouseDown() || this.isTouchHeld() || this.touchButtons.shoot;
  }

  isTouchPressed() {
    // Check if any new touches started this frame
    return this.touches.size > 0 && !this.virtualJoystick.active;
  }

  isTouchHeld() {
    return this.touches.size > 0;
  }

  // Virtual joystick rendering data
  getVirtualJoystickData() {
    if (!this.virtualJoystick.active) return null;

    return {
      baseX: this.virtualJoystick.startX,
      baseY: this.virtualJoystick.startY,
      stickX: this.virtualJoystick.currentX,
      stickY: this.virtualJoystick.currentY,
      radius: 50
    };
  }

  setupMobileButtons() {
    // Wait for DOM to be ready
    const initButtons = () => {
      // Get button elements
      const upButton = document.getElementById('upButton');
      const downButton = document.getElementById('downButton');
      const leftButton = document.getElementById('leftButton');
      const rightButton = document.getElementById('rightButton');
      const shootButton = document.getElementById('shootButton');

      if (!upButton || !downButton || !leftButton || !rightButton || !shootButton) {
        console.log('Mobile control buttons not found, retrying in 100ms...');
        setTimeout(initButtons, 100);
        return;
      }

      console.log('Mobile control buttons found, setting up events...');

    // Prevent default touch behaviors
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Up button events
    upButton.addEventListener('touchstart', (e) => {
      preventDefaults(e);
      this.touchButtons.up = true;
    });

    upButton.addEventListener('touchend', (e) => {
      preventDefaults(e);
      this.touchButtons.up = false;
    });

    upButton.addEventListener('touchcancel', (e) => {
      preventDefaults(e);
      this.touchButtons.up = false;
    });

    // Down button events
    downButton.addEventListener('touchstart', (e) => {
      preventDefaults(e);
      this.touchButtons.down = true;
    });

    downButton.addEventListener('touchend', (e) => {
      preventDefaults(e);
      this.touchButtons.down = false;
    });

    downButton.addEventListener('touchcancel', (e) => {
      preventDefaults(e);
      this.touchButtons.down = false;
    });

    // Left button events
    leftButton.addEventListener('touchstart', (e) => {
      preventDefaults(e);
      this.touchButtons.left = true;
    });

    leftButton.addEventListener('touchend', (e) => {
      preventDefaults(e);
      this.touchButtons.left = false;
    });

    leftButton.addEventListener('touchcancel', (e) => {
      preventDefaults(e);
      this.touchButtons.left = false;
    });

    // Right button events
    rightButton.addEventListener('touchstart', (e) => {
      preventDefaults(e);
      this.touchButtons.right = true;
    });

    rightButton.addEventListener('touchend', (e) => {
      preventDefaults(e);
      this.touchButtons.right = false;
    });

    rightButton.addEventListener('touchcancel', (e) => {
      preventDefaults(e);
      this.touchButtons.right = false;
    });

    // Shoot button events
    shootButton.addEventListener('touchstart', (e) => {
      preventDefaults(e);
      this.touchButtons.shoot = true;
    });

    shootButton.addEventListener('touchend', (e) => {
      preventDefaults(e);
      this.touchButtons.shoot = false;
    });

    shootButton.addEventListener('touchcancel', (e) => {
      preventDefaults(e);
      this.touchButtons.shoot = false;
    });

    // Add mouse events for desktop testing
    upButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.touchButtons.up = true;
    });

    upButton.addEventListener('mouseup', (e) => {
      e.preventDefault();
      this.touchButtons.up = false;
    });

    upButton.addEventListener('mouseleave', () => {
      this.touchButtons.up = false;
    });

    downButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.touchButtons.down = true;
    });

    downButton.addEventListener('mouseup', (e) => {
      e.preventDefault();
      this.touchButtons.down = false;
    });

    downButton.addEventListener('mouseleave', () => {
      this.touchButtons.down = false;
    });

    leftButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.touchButtons.left = true;
    });

    leftButton.addEventListener('mouseup', (e) => {
      e.preventDefault();
      this.touchButtons.left = false;
    });

    leftButton.addEventListener('mouseleave', () => {
      this.touchButtons.left = false;
    });

    rightButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.touchButtons.right = true;
    });

    rightButton.addEventListener('mouseup', (e) => {
      e.preventDefault();
      this.touchButtons.right = false;
    });

    rightButton.addEventListener('mouseleave', () => {
      this.touchButtons.right = false;
    });

    shootButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.touchButtons.shoot = true;
    });

    shootButton.addEventListener('mouseup', (e) => {
      e.preventDefault();
      this.touchButtons.shoot = false;
    });

    shootButton.addEventListener('mouseleave', () => {
      this.touchButtons.shoot = false;
    });

    // Global touch event cleanup
    document.addEventListener('touchend', () => {
      this.touchButtons.up = false;
      this.touchButtons.down = false;
      this.touchButtons.left = false;
      this.touchButtons.right = false;
      this.touchButtons.shoot = false;
    });

    document.addEventListener('touchcancel', () => {
      this.touchButtons.up = false;
      this.touchButtons.down = false;
      this.touchButtons.left = false;
      this.touchButtons.right = false;
      this.touchButtons.shoot = false;
    });

      console.log('Mobile button event handlers bound successfully');
    };

    // Start initialization
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initButtons);
    } else {
      initButtons();
    }
  }
}