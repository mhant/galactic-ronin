import { Asteroid, Enemy, Particle, Projectile, Station } from '../types/game';
import { useGameStore } from '../store/useGameStore';
import { SoundManager } from '../audio/SoundManager';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;

  // Input states
  private keys: Record<string, boolean> = {};
  private mouse = { x: 0, y: 0, isDown: false };

  // Particles
  private particles: Particle[] = [];

  // Starfield background
  private stars: Array<{ x: number; y: number; size: number; layer: number; brightness: number }> = [];

  // Weapon cooldowns
  private playerShootCooldown: number = 0;
  private miningActive: boolean = false;
  private targetedAsteroid: Asteroid | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.initStars();
    this.bindEvents();
  }

  private initStars() {
    this.stars = [];
    const count = 350;
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 8000,
        y: (Math.random() - 0.5) * 8000,
        size: Math.random() * 2 + 0.5,
        layer: Math.random() < 0.6 ? 0.2 : Math.random() < 0.9 ? 0.5 : 0.8,
        brightness: 0.4 + Math.random() * 0.6,
      });
    }
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  public destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    SoundManager.updateThruster(false);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
    this.keys[e.code] = true;

    // Quick dock key
    if (e.key.toLowerCase() === 'e') {
      this.attemptDock();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
    this.keys[e.code] = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouse.isDown = true;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouse.isDown = false;
    }
  };

  private attemptDock() {
    const state = useGameStore.getState();
    if (state.gameStatus !== 'EXPLORING' && state.gameStatus !== 'COMBAT') return;

    const { ship, world } = state;
    const DOCK_DISTANCE = 160;

    for (const station of world.stations) {
      const dist = Math.hypot(ship.x - station.x, ship.y - station.y);
      if (dist <= station.radius + DOCK_DISTANCE) {
        state.dockAtStation(station.id);
        break;
      }
    }
  }

  public start() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop = (currentTime: number) => {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    const state = useGameStore.getState();

    if (state.gameStatus === 'EXPLORING' || state.gameStatus === 'COMBAT') {
      this.update(dt);
    }

    this.render();

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const state = useGameStore.getState();
    const { ship, world, player } = state;

    // 1. Power modifiers
    const thrustMultiplier = 0.6 + ship.enginePower * 0.25;
    const turnSpeed = 2.5 + ship.enginePower * 0.35;
    const fireCooldownRate = 0.45 - ship.weaponPower * 0.06; // 0.15s to 0.39s
    const weaponDamage = 18 + ship.weaponPower * 6; // 24 to 48

    // 2. Player Input & Steering
    let rot = ship.rotation;
    let isThrusting = false;

    if (this.keys['a'] || this.keys['arrowleft']) {
      rot -= turnSpeed * dt;
    }
    if (this.keys['d'] || this.keys['arrowright']) {
      rot += turnSpeed * dt;
    }

    let vx = ship.vx;
    let vy = ship.vy;

    const hasFuel = player.fuel > 0;

    if ((this.keys['w'] || this.keys['arrowup']) && hasFuel) {
      isThrusting = true;
      const accel = 320 * thrustMultiplier;
      vx += Math.cos(rot) * accel * dt;
      vy += Math.sin(rot) * accel * dt;

      // Consume fuel slowly while burning
      state.consumeFuel(1.2 * dt);

      // Spawn thruster particles
      this.spawnThrusterParticles(ship.x, ship.y, rot);
    }

    // Retro-thrusters / dampeners (S or Down)
    if (this.keys['s'] || this.keys['arrowdown']) {
      const damp = Math.pow(0.2, dt);
      vx *= damp;
      vy *= damp;
    } else {
      // Natural space friction / flight computer stabilizer
      const naturalDamp = Math.pow(0.88, dt);
      vx *= naturalDamp;
      vy *= naturalDamp;
    }

    // Speed clamp
    const maxSpeed = 380 * thrustMultiplier;
    const currentSpeed = Math.hypot(vx, vy);
    if (currentSpeed > maxSpeed) {
      vx = (vx / currentSpeed) * maxSpeed;
      vy = (vy / currentSpeed) * maxSpeed;
    }

    const newX = ship.x + vx * dt;
    const newY = ship.y + vy * dt;

    // Update sound
    SoundManager.updateThruster(isThrusting);

    // 3. Shield Regeneration
    state.rechargeShields(dt);

    // 4. Weapons & Projectiles
    this.playerShootCooldown = Math.max(0, this.playerShootCooldown - dt);
    if (this.keys[' '] || this.keys['space']) {
      if (this.playerShootCooldown <= 0) {
        this.playerShootCooldown = fireCooldownRate;
        const projectileSpeed = 650;
        const projVx = vx + Math.cos(rot) * projectileSpeed;
        const projVy = vy + Math.sin(rot) * projectileSpeed;

        const proj: Projectile = {
          id: `p_player_${Date.now()}_${Math.random()}`,
          owner: 'PLAYER',
          x: newX + Math.cos(rot) * 22,
          y: newY + Math.sin(rot) * 22,
          vx: projVx,
          vy: projVy,
          damage: weaponDamage,
          lifetime: 1.8,
          color: '#00F0FF',
        };
        state.addProjectile(proj);
        SoundManager.playLaser(false);
      }
    }

    // 5. Mining Beam (Hold Mouse Down or Key 'M')
    this.miningActive = this.mouse.isDown || this.keys['m'];
    this.targetedAsteroid = null;

    if (this.miningActive) {
      // Find closest asteroid within mining range (250px)
      const MINING_RANGE = 260;
      let closestAst: Asteroid | null = null;
      let closestDist = Infinity;

      for (const ast of world.asteroids) {
        const dist = Math.hypot(newX - ast.x, newY - ast.y) - ast.radius;
        if (dist < MINING_RANGE && dist < closestDist) {
          closestDist = dist;
          closestAst = ast;
        }
      }

      if (closestAst) {
        this.targetedAsteroid = closestAst;
        SoundManager.playMiningBeam();
        // Deal mining damage
        const miningDamage = 35 * dt;
        state.damageAsteroid(closestAst.id, miningDamage);

        // Spawn mining fracture sparks
        this.spawnMiningParticles(closestAst.x, closestAst.y);
      }
    }

    // 6. Update Projectiles & Check Collisions
    state.updateProjectiles(dt);
    const activeProjectiles = useGameStore.getState().world.projectiles;

    for (const proj of activeProjectiles) {
      if (proj.owner === 'PLAYER') {
        // Check hits on enemies
        for (const enemy of world.enemies) {
          const dist = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
          if (dist < 28) {
            state.damageEnemy(enemy.id, proj.damage);
            proj.lifetime = 0; // Destroy projectile
            this.spawnExplosionParticles(proj.x, proj.y, '#00F0FF', 8);
            break;
          }
        }

        // Check hits on asteroids
        for (const ast of world.asteroids) {
          const dist = Math.hypot(proj.x - ast.x, proj.y - ast.y);
          if (dist < ast.radius) {
            state.damageAsteroid(ast.id, proj.damage);
            proj.lifetime = 0;
            this.spawnExplosionParticles(proj.x, proj.y, '#F59E0B', 6);
            break;
          }
        }
      } else if (proj.owner === 'ENEMY') {
        // Check hits on player
        const dist = Math.hypot(proj.x - newX, proj.y - newY);
        if (dist < 22) {
          state.damagePlayer(proj.damage);
          proj.lifetime = 0;
          this.spawnExplosionParticles(proj.x, proj.y, '#FF3366', 10);
        }
      }
    }

    // 7. Enemy AI & Projectiles
    let isAnyEnemyEngaged = false;
    const updatedEnemies = world.enemies.map((enemy, index) => {
      const distToPlayer = Math.hypot(newX - enemy.x, newY - enemy.y);
      let enemyRot = enemy.rotation;
      let evx = enemy.vx;
      let evy = enemy.vy;
      let fireCooldown = enemy.fireCooldown - dt;

      if (distToPlayer < enemy.aggroDistance) {
        isAnyEnemyEngaged = true;

        // 1. Aim towards player with smooth turning
        const targetAngle = Math.atan2(newY - enemy.y, newX - enemy.x);
        const angleDiff = Math.atan2(Math.sin(targetAngle - enemyRot), Math.cos(targetAngle - enemyRot));
        const turnSpeed = enemy.type === 'PIRATE_SCOUT' ? 3.4 : 2.0;
        enemyRot += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed * dt);

        // 2. Dogfighting tactics & engagement distance
        const isScout = enemy.type === 'PIRATE_SCOUT';
        const preferredDist = isScout ? 210 : 300;
        const maxSpeed = isScout ? 160 : 100;
        const accelRate = 3.5;

        // Strafe direction: alternate clockwise / counter-clockwise based on enemy index
        const strafeSign = (index % 2 === 0) ? 1 : -1;

        let desiredMoveAngle: number;
        let desiredSpeed: number;

        if (distToPlayer > preferredDist + 70) {
          // Approach player
          desiredMoveAngle = targetAngle;
          desiredSpeed = maxSpeed;
        } else if (distToPlayer < preferredDist - 60) {
          // Too close: peel away / reverse thrusters
          desiredMoveAngle = targetAngle + Math.PI + strafeSign * 0.4;
          desiredSpeed = maxSpeed * 0.9;
        } else {
          // Sweet spot: strafe in tangential orbit while facing player
          desiredMoveAngle = targetAngle + (Math.PI / 2) * strafeSign;
          desiredSpeed = maxSpeed * 0.85;
        }

        // Smooth acceleration with inertia
        const desiredVx = Math.cos(desiredMoveAngle) * desiredSpeed;
        const desiredVy = Math.sin(desiredMoveAngle) * desiredSpeed;
        evx += (desiredVx - evx) * Math.min(1, accelRate * dt);
        evy += (desiredVy - evy) * Math.min(1, accelRate * dt);

        // 3. Collision avoidance & repulsion from player
        const MIN_PLAYER_DISTANCE = 95;
        if (distToPlayer < MIN_PLAYER_DISTANCE && distToPlayer > 0.1) {
          const pushAngle = Math.atan2(enemy.y - newY, enemy.x - newX);
          const pushForce = (MIN_PLAYER_DISTANCE - distToPlayer) * 15;
          evx += Math.cos(pushAngle) * pushForce * dt;
          evy += Math.sin(pushAngle) * pushForce * dt;
        }

        // 4. Separation from other enemies (avoid stacking)
        for (let j = 0; j < world.enemies.length; j++) {
          if (j !== index) {
            const other = world.enemies[j];
            const distToOther = Math.hypot(enemy.x - other.x, enemy.y - other.y);
            if (distToOther < 70 && distToOther > 0.1) {
              const pushOtherAngle = Math.atan2(enemy.y - other.y, enemy.x - other.x);
              const pushOtherForce = (70 - distToOther) * 8;
              evx += Math.cos(pushOtherAngle) * pushOtherForce * dt;
              evy += Math.sin(pushOtherAngle) * pushOtherForce * dt;
            }
          }
        }

        // 5. Fire weapon only when in range AND roughly aligned with player
        const isFacingPlayer = Math.abs(angleDiff) < 0.35; // Within ~20 degrees
        if (distToPlayer < 420 && isFacingPlayer && fireCooldown <= 0) {
          fireCooldown = isScout ? 1.5 : 2.0;
          const laserSpeed = 500;
          const ep: Projectile = {
            id: `p_enemy_${Date.now()}_${Math.random()}`,
            owner: 'ENEMY',
            x: enemy.x + Math.cos(enemyRot) * 20,
            y: enemy.y + Math.sin(enemyRot) * 20,
            vx: Math.cos(enemyRot) * laserSpeed,
            vy: Math.sin(enemyRot) * laserSpeed,
            damage: isScout ? 12 : 22,
            lifetime: 1.5,
            color: '#FF3366',
          };
          state.addProjectile(ep);
          SoundManager.playLaser(true);
        }
      } else {
        // Idle drift when un-aggroed
        evx *= Math.pow(0.92, dt);
        evy *= Math.pow(0.92, dt);
      }

      return {
        ...enemy,
        x: enemy.x + evx * dt,
        y: enemy.y + evy * dt,
        vx: evx,
        vy: evy,
        rotation: enemyRot,
        fireCooldown,
      };
    });

    state.updateEnemies(updatedEnemies);
    state.setCombatAlert(isAnyEnemyEngaged);

    // 8. Floating Loot Magnet & Pickup
    const TRACTOR_RANGE = 180;
    const PICKUP_RANGE = 38;

    for (const loot of world.floatingLoot) {
      const dist = Math.hypot(newX - loot.x, newY - loot.y);
      if (dist < TRACTOR_RANGE) {
        // Magnetic tractor beam pull
        const pullAngle = Math.atan2(newY - loot.y, newX - loot.x);
        const pullSpeed = 220 * (1 - dist / TRACTOR_RANGE);
        loot.vx += Math.cos(pullAngle) * pullSpeed * dt;
        loot.vy += Math.sin(pullAngle) * pullSpeed * dt;
      }
      loot.x += loot.vx * dt;
      loot.y += loot.vy * dt;
      loot.lifetime -= dt;

      if (dist < PICKUP_RANGE) {
        state.collectLoot(loot.id);
      }
    }

    // 9. Update particles
    this.particles = this.particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        lifetime: p.lifetime - dt,
        alpha: (p.lifetime - dt) / p.maxLifetime,
      }))
      .filter((p) => p.lifetime > 0);

    // Commit physics updates
    state.updateShipPhysics({
      x: newX,
      y: newY,
      vx,
      vy,
      rotation: rot,
      isThrusting,
      isMining: this.miningActive,
    });
  }

  private spawnThrusterParticles(x: number, y: number, rot: number) {
    const exhaustAngle = rot + Math.PI + (Math.random() - 0.5) * 0.4;
    const speed = 120 + Math.random() * 80;
    const colors = ['#00F0FF', '#38BDF8', '#60A5FA', '#F59E0B'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    this.particles.push({
      x: x - Math.cos(rot) * 16,
      y: y - Math.sin(rot) * 16,
      vx: Math.cos(exhaustAngle) * speed,
      vy: Math.sin(exhaustAngle) * speed,
      color,
      size: 2 + Math.random() * 2.5,
      alpha: 1,
      lifetime: 0.35,
      maxLifetime: 0.35,
    });
  }

  private spawnMiningParticles(targetX: number, targetY: number) {
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      this.particles.push({
        x: targetX + (Math.random() - 0.5) * 20,
        y: targetY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() < 0.5 ? '#00F0FF' : '#F59E0B',
        size: 1.5 + Math.random() * 2,
        alpha: 1,
        lifetime: 0.4,
        maxLifetime: 0.4,
      });
    }
  }

  private spawnExplosionParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        alpha: 1,
        lifetime: 0.6,
        maxLifetime: 0.6,
      });
    }
  }

  public render() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const state = useGameStore.getState();
    const { ship, world } = state;

    ctx.clearRect(0, 0, width, height);

    // Deep space dark background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Camera translation centered on player
    ctx.translate(width / 2 - ship.x, height / 2 - ship.y);

    // 1. Render Starfield
    this.renderStarfield(ctx, ship.x, ship.y, width, height);

    // 2. Render Stations
    this.renderStations(ctx, world.stations, ship.x, ship.y);

    // 3. Render Asteroids
    this.renderAsteroids(ctx, world.asteroids);

    // 4. Render Floating Loot
    this.renderFloatingLoot(ctx, world.floatingLoot);

    // 5. Render Mining Beam
    if (this.miningActive && this.targetedAsteroid) {
      this.renderMiningBeam(ctx, ship.x, ship.y, this.targetedAsteroid.x, this.targetedAsteroid.y);
    }

    // 6. Render Enemies
    this.renderEnemies(ctx, world.enemies);

    // 7. Render Projectiles
    this.renderProjectiles(ctx, world.projectiles);

    // 8. Render Particles
    this.renderParticles(ctx);

    // 9. Render Player Ship
    this.renderPlayerShip(ctx, ship);

    ctx.restore();
  }

  private renderStarfield(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    vw: number,
    vh: number
  ) {
    ctx.save();
    for (const star of this.stars) {
      // Parallax offset
      const sx = star.x + camX * (1 - star.layer);
      const sy = star.y + camY * (1 - star.layer);

      // Simple culling
      if (
        sx >= camX - vw / 2 - 20 &&
        sx <= camX + vw / 2 + 20 &&
        sy >= camY - vh / 2 - 20 &&
        sy <= camY + vh / 2 + 20
      ) {
        ctx.fillStyle = `rgba(226, 232, 240, ${star.brightness * star.layer})`;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private renderStations(
    ctx: CanvasRenderingContext2D,
    stations: Station[],
    playerX: number,
    playerY: number
  ) {
    for (const st of stations) {
      ctx.save();
      ctx.translate(st.x, st.y);

      // Docking radius ring (dashed)
      ctx.strokeStyle = `${st.color}55`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, st.radius + 120, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Outer habitat rotating ring
      const time = performance.now() * 0.0005;
      ctx.rotate(time);

      ctx.strokeStyle = st.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, st.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Station spokes & solar wings
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * st.radius, Math.sin(a) * st.radius);
        ctx.stroke();

        // Solar panels
        ctx.fillStyle = `${st.color}33`;
        ctx.fillRect(Math.cos(a) * (st.radius - 20) - 8, Math.sin(a) * (st.radius - 20) - 8, 16, 16);
      }

      // Station Hub Core
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, st.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      // Station Title & Dock Prompt
      const dist = Math.hypot(playerX - st.x, playerY - st.y);
      ctx.save();
      ctx.translate(st.x, st.y);

      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = st.color;
      ctx.textAlign = 'center';
      ctx.fillText(st.name.toUpperCase(), 0, -st.radius - 25);

      ctx.font = '11px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`[${st.type}] - ${Math.round(dist)}u`, 0, -st.radius - 10);

      if (dist <= st.radius + 140) {
        ctx.fillStyle = '#00F0FF';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('PRESS [E] TO DOCK', 0, st.radius + 30);
      }
      ctx.restore();
    }
  }

  private renderAsteroids(ctx: CanvasRenderingContext2D, asteroids: Asteroid[]) {
    for (const ast of asteroids) {
      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rotation);

      // Shaded asteroid body
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;

      ctx.beginPath();
      const first = ast.vertices[0];
      const startX = Math.cos(first.angle) * first.distance;
      const startY = Math.sin(first.angle) * first.distance;
      ctx.moveTo(startX, startY);

      for (let i = 1; i < ast.vertices.length; i++) {
        const v = ast.vertices[i];
        ctx.lineTo(Math.cos(v.angle) * v.distance, Math.sin(v.angle) * v.distance);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Core mineral veins
      ctx.fillStyle = ast.oreType === 'fusion_cells' ? '#00F0FF' : '#F59E0B';
      ctx.beginPath();
      ctx.arc(3, -2, 3, 0, Math.PI * 2);
      ctx.arc(-4, 5, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Health bar if damaged
      if (ast.health < ast.maxHealth) {
        const barWidth = 36;
        const hpPct = ast.health / ast.maxHealth;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(ast.x - barWidth / 2, ast.y - ast.radius - 12, barWidth, 4);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(ast.x - barWidth / 2, ast.y - ast.radius - 12, barWidth * hpPct, 4);
      }
    }
  }

  private renderFloatingLoot(ctx: CanvasRenderingContext2D, loots: any[]) {
    const time = performance.now() * 0.003;
    for (const loot of loots) {
      ctx.save();
      ctx.translate(loot.x, loot.y);
      ctx.rotate(time);

      // Glowing cargo cube
      ctx.strokeStyle = '#00F0FF';
      ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-7, -7, 14, 14);
      ctx.fillRect(-7, -7, 14, 14);

      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(loot.item.quantity.toString(), 0, 3);

      ctx.restore();
    }
  }

  private renderMiningBeam(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ) {
    ctx.save();
    // Glowing beam
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Sharp core beam with electric jitter
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 6;
    const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 6;
    ctx.lineTo(midX, midY);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  private renderEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]) {
    for (const enemy of enemies) {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.rotation);

      // Raider Ship Hull (Crimson Arrowhead with jagged fins)
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-14, -12);
      ctx.lineTo(-8, -4);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, 4);
      ctx.lineTo(-14, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Raider red engine glow
      ctx.fillStyle = '#FF3366';
      ctx.beginPath();
      ctx.arc(-11, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      // Shield bubble
      if (enemy.shield > 0) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Health bar above enemy
      const barWidth = 32;
      const hpPct = enemy.hull / enemy.maxHull;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(enemy.x - barWidth / 2, enemy.y - 26, barWidth, 3);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(enemy.x - barWidth / 2, enemy.y - 26, barWidth * hpPct, 3);

      // Name & Bounty
      ctx.fillStyle = '#F87171';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(enemy.name, enemy.x, enemy.y - 32);
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
    for (const p of projectiles) {
      ctx.save();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderPlayerShip(ctx: CanvasRenderingContext2D, ship: any) {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.rotation);

    // Ronin Interceptor Chassis: Sleek dart-wing with cockpit canopy
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(22, 0); // Nose
    ctx.lineTo(-14, -14); // Left wingtip
    ctx.lineTo(-8, -6);
    ctx.lineTo(-16, -6);
    ctx.lineTo(-12, 0); // Center engine
    ctx.lineTo(-16, 6);
    ctx.lineTo(-8, 6);
    ctx.lineTo(-14, 14); // Right wingtip
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing cyan cockpit canopy
    ctx.fillStyle = '#00F0FF';
    ctx.beginPath();
    ctx.ellipse(3, 0, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thruster engine flame if active
    if (ship.isThrusting) {
      ctx.fillStyle = '#FFDD00';
      ctx.beginPath();
      ctx.moveTo(-12, -4);
      ctx.lineTo(-24 - Math.random() * 8, 0);
      ctx.lineTo(-12, 4);
      ctx.closePath();
      ctx.fill();
    }

    // Active Shield Bubble
    if (ship.shield > 0) {
      const shieldAlpha = Math.min(0.5, (ship.shield / ship.maxShield) * 0.4);
      ctx.strokeStyle = `rgba(0, 240, 255, ${shieldAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
