class CollisionSystem {
  constructor() {
    this.collisionCallbacks = new Map();
  }

  registerCallback(type1, type2, callback) {
    const key = `${type1}-${type2}`;
    this.collisionCallbacks.set(key, callback);
  }

  checkCollisions(entities) {
    const results = [];

    // Check player bullets vs mushrooms
    if (entities.player && entities.mushroomField) {
      for (let i = entities.player.bullets.length - 1; i >= 0; i--) {
        const bullet = entities.player.bullets[i];
        if (!bullet.active) continue;

        const collidedMushroom = entities.mushroomField.checkCollision(bullet.getBounds());
        if (collidedMushroom) {
          bullet.destroy();
          entities.player.bullets.splice(i, 1);
          
          const destroyed = collidedMushroom.takeDamage();
          results.push({
            type: 'bullet-mushroom',
            bullet: bullet,
            mushroom: collidedMushroom,
            destroyed: destroyed
          });
        }
      }
    }

    // Check player bullets vs centipede segments
    if (entities.player && entities.centipedes) {
      for (let i = entities.player.bullets.length - 1; i >= 0; i--) {
        const bullet = entities.player.bullets[i];
        if (!bullet.active) continue;

        for (const centipede of entities.centipedes) {
          for (let j = centipede.segments.length - 1; j >= 0; j--) {
            const segment = centipede.segments[j];
            if (!segment.active) continue;

            if (this.rectsIntersect(bullet.getBounds(), segment.getBounds())) {
              bullet.destroy();
              entities.player.bullets.splice(i, 1);
              
              results.push({
                type: 'bullet-centipede',
                bullet: bullet,
                centipede: centipede,
                segmentIndex: j,
                segment: segment
              });
              break; // Only hit one segment per bullet
            }
          }
          if (!bullet.active) break; // Bullet was destroyed
        }
      }
    }

    // Check player bullets vs enemies
    if (entities.player && entities.enemies) {
      for (let i = entities.player.bullets.length - 1; i >= 0; i--) {
        const bullet = entities.player.bullets[i];
        if (!bullet.active) continue;

        for (let j = entities.enemies.length - 1; j >= 0; j--) {
          const enemy = entities.enemies[j];
          if (!enemy.active) continue;

          if (this.rectsIntersect(bullet.getBounds(), enemy.getBounds())) {
            bullet.destroy();
            entities.player.bullets.splice(i, 1);
            enemy.takeDamage();
            
            results.push({
              type: 'bullet-enemy',
              bullet: bullet,
              enemy: enemy,
              enemyIndex: j
            });
            break; // Only hit one enemy per bullet
          }
        }
        if (!bullet.active) break; // Bullet was destroyed
      }
    }

    // Check player vs centipede segments
    if (entities.player && entities.player.alive && entities.centipedes) {
      const playerBounds = entities.player.getBounds();
      
      for (const centipede of entities.centipedes) {
        for (const segment of centipede.segments) {
          if (!segment.active) continue;

          if (this.rectsIntersect(playerBounds, segment.getBounds())) {
            results.push({
              type: 'player-centipede',
              player: entities.player,
              centipede: centipede,
              segment: segment
            });
            break; // Only need to detect one collision per centipede
          }
        }
      }
    }

    // Check player vs enemies
    if (entities.player && entities.player.alive && entities.enemies) {
      const playerBounds = entities.player.getBounds();
      
      for (const enemy of entities.enemies) {
        if (!enemy.active) continue;

        if (this.rectsIntersect(playerBounds, enemy.getBounds())) {
          results.push({
            type: 'player-enemy',
            player: entities.player,
            enemy: enemy
          });
        }
      }
    }

    // Check centipede segments vs mushrooms
    if (entities.centipedes && entities.mushroomField) {
      for (const centipede of entities.centipedes) {
        for (const segment of centipede.segments) {
          if (!segment.active) continue;

          const collidedMushroom = entities.mushroomField.checkCollision(segment.getBounds());
          if (collidedMushroom) {
            results.push({
              type: 'centipede-mushroom',
              centipede: centipede,
              segment: segment,
              mushroom: collidedMushroom
            });
          }
        }
      }
    }

    // Check enemies vs mushrooms (for spider destroying mushrooms)
    if (entities.enemies && entities.mushroomField) {
      for (const enemy of entities.enemies) {
        if (!enemy.active || enemy.type !== 'spider') continue;

        const collidedMushroom = entities.mushroomField.checkCollision(enemy.getBounds());
        if (collidedMushroom) {
          results.push({
            type: 'spider-mushroom',
            enemy: enemy,
            mushroom: collidedMushroom
          });
        }
      }
    }

    return results;
  }

  rectsIntersect(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  circleIntersect(circle1, circle2) {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (circle1.radius + circle2.radius);
  }

  pointInRect(point, rect) {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
  }

  // Spatial partitioning could be added here for performance optimization
  // This would divide the game world into a grid and only check collisions
  // between objects in the same or adjacent grid cells
}