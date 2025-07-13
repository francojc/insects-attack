# Insects Attack! 

A modern HTML5 recreation of the classic Atari "Centipede" arcade game. Built with vanilla JavaScript, this game features faithful recreation of the original gameplay mechanics with modern web technologies.

## Game Overview

Insects Attack! is a top-down shooter where you control a character at the bottom of the screen, firing upward at a segmented centipede that winds down through a field of mushrooms. The centipede moves horizontally, dropping down and reversing direction when hitting obstacles or screen edges. When shot, the centipede splits into multiple independent segments.

### Features

- **Authentic Gameplay**: Faithful recreation of original Centipede mechanics
- **Progressive Difficulty**: Increasing speed and complexity across levels
- **Multiple Enemies**: Spider, Flea, and Scorpion with unique behaviors
- **Responsive Design**: Works on desktop and mobile devices
- **Touch Controls**: Virtual joystick for mobile gameplay
- **High Score System**: Local storage for persistent high scores
- **Web Audio**: Synthesized sound effects
- **60fps Performance**: Smooth gameplay with optimized rendering

## How to Play

### Controls

**Desktop:**
- **WASD** or **Arrow Keys**: Move player
- **Spacebar**: Shoot
- **P**: Pause/Resume
- **R**: Restart (when game over)
- **D**: Toggle debug mode
- **Escape**: Pause

**Mobile:**
- **Touch and drag**: Virtual joystick for movement
- **Tap**: Shoot

### Gameplay

1. **Objective**: Destroy all centipede segments to advance to the next level
2. **Movement**: You're constrained to the bottom third of the screen
3. **Shooting**: Fire bullets upward to destroy enemies and mushrooms
4. **Centipede Behavior**: 
   - Moves horizontally, drops down when hitting mushrooms or edges
   - Splits into independent pieces when middle segments are hit
   - Speed increases as segments are destroyed
5. **Mushrooms**: Take 4 hits to destroy, can be poisoned by scorpions
6. **Lives**: Start with 3 lives, gain extra lives every 10,000 points

### Enemies

**Centipede Segments**
- Head: 100 points
- Body: 10 points
- Creates mushroom when destroyed

**Spider** (300-900 points)
- Bounces diagonally around the screen
- Points vary based on proximity to player when destroyed
- Destroys mushrooms on contact

**Flea** (200 points)
- Drops vertically from top of screen
- Creates mushrooms in its path
- Spawns when bottom area has few mushrooms

**Scorpion** (1000 points)
- Moves horizontally across screen
- Poisons mushrooms it touches
- Poisoned mushrooms cause centipede to move straight down

## Installation & Setup

1. **Clone or download** the project files
2. **Serve the files** using a local web server (required for proper operation)

### Option 1: Python Server
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Option 2: Node.js Server
```bash
npx serve .
```

### Option 3: PHP Server
```bash
php -S localhost:8000
```

3. **Open your browser** and navigate to `http://localhost:8000`

## Technical Architecture

### Core Engine Components

- **GameLoop.js**: Fixed-timestep game loop with requestAnimationFrame
- **Renderer.js**: Canvas 2D rendering with responsive scaling
- **InputManager.js**: Unified keyboard, mouse, and touch input handling
- **AudioManager.js**: Web Audio API for synthesized sound effects

### Game Entities

- **Player.js**: Player character with movement and shooting
- **Centipede.js**: Segmented centipede with linked movement AI
- **Enemies.js**: Spider, Flea, and Scorpion implementations
- **Mushroom.js**: Mushroom field generation and management

### Game Systems

- **CollisionSystem.js**: AABB collision detection
- **ScoringSystem.js**: Score tracking and high score persistence
- **LevelManager.js**: Level progression and difficulty scaling

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 13+)
- **Edge**: Full support

## Performance Notes

- Maintains 60fps on most devices
- Uses object pooling for bullets to reduce garbage collection
- Optimized collision detection with spatial awareness
- Canvas rendering optimizations for smooth animation

## Development

### File Structure
```
insects-attack/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Game styling
├── js/
│   ├── main.js             # Game controller
│   ├── engine/             # Core engine components
│   ├── entities/           # Game entities
│   └── systems/            # Game systems
└── README.md
```

### Customization

The game is highly modular and can be easily customized:

- **Difficulty**: Modify values in `LevelManager.js`
- **Visuals**: Update rendering methods in `Renderer.js`
- **Controls**: Adjust input handling in `InputManager.js`
- **Audio**: Modify sound generation in `AudioManager.js`
- **Gameplay**: Tweak entity behavior in respective entity files

### Debug Mode

Press **D** during gameplay to enable debug mode, which displays:
- Current FPS
- Entity counts
- Game state information
- Performance metrics

## Known Issues

- Mobile performance may vary on older devices
- Audio may not work in some browsers until user interaction
- Virtual joystick sensitivity may need adjustment for different screen sizes

## License

This project is for educational purposes. Original Centipede game concept by Atari.

## Credits

- Original game design: Atari (1981)
- Implementation: Modern HTML5/JavaScript recreation
- Sound effects: Web Audio API synthesis
- Inspired by classic arcade gaming

Enjoy playing Insects Attack!