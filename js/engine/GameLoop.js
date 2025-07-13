class GameLoop {
  constructor() {
    this.lastTime = 0;
    this.accumulator = 0;
    this.deltaTime = 1000 / 60; // 60 FPS
    this.running = false;
    this.updateCallback = null;
    this.renderCallback = null;
    this.frameCount = 0;
    this.fpsDisplay = 0;
    this.fpsTimer = 0;
  }

  start(updateCallback, renderCallback) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
  }

  loop() {
    if (!this.running) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Prevent spiral of death
    const clampedFrameTime = Math.min(frameTime, 250);
    this.accumulator += clampedFrameTime;

    // Fixed timestep updates
    while (this.accumulator >= this.deltaTime) {
      if (this.updateCallback) {
        this.updateCallback(this.deltaTime / 1000); // Convert to seconds
      }
      this.accumulator -= this.deltaTime;
    }

    // Calculate interpolation factor for smooth rendering
    const interpolation = this.accumulator / this.deltaTime;

    // Render
    if (this.renderCallback) {
      this.renderCallback(interpolation);
    }

    // FPS tracking
    this.frameCount++;
    this.fpsTimer += frameTime;
    if (this.fpsTimer >= 1000) {
      this.fpsDisplay = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    requestAnimationFrame(() => this.loop());
  }

  getFPS() {
    return this.fpsDisplay;
  }
}