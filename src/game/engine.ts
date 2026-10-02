import { Asteroid, Enemy, Particle, Projectile, ReconDrone, Station, EscortShip, FloatingLoot } from '../types/game';
import { useGameStore, getDifficultyMultipliers } from '../store/useGameStore';
import { SoundManager } from '../audio/SoundManager';
import { logger } from './diagnosticLogger';

export interface OrientedBox {
  halfLength: number;
  halfWidth: number;
  forwardOffset: number;
}

export function getPlayerBoundingBox(tier: number, scale: number = 1.0): OrientedBox {
  let hl = 22;
  let hw = 14;
  let fo = 2;
  if (tier >= 22) {
    hl = 86 + (tier - 22) * 0.7;
    hw = 38 + (tier - 22) * 0.35;
    fo = 12;
  } else if (tier >= 18) {
    hl = 74;
    hw = 34;
    fo = 10;
  } else if (tier >= 14) {
    hl = 60;
    hw = 28;
    fo = 8;
  } else if (tier >= 10) {
    hl = 46;
    hw = 24;
    fo = 6;
  } else if (tier >= 7) {
    hl = 34;
    hw = 20;
    fo = 4;
  } else if (tier >= 4) {
    hl = 26;
    hw = 16;
    fo = 3;
  }
  return {
    halfLength: hl * scale,
    halfWidth: hw * scale,
    forwardOffset: fo * scale,
  };
}

export function getEnemyBoundingBox(category: string, scale: number = 1.0): OrientedBox {
  let hl = 16;
  let hw = 12;
  let fo = 0;
  if (category === 'COLOSSUS') {
    hl = 58;
    hw = 30;
    fo = 8;
  } else if (category === 'CARRIER') {
    hl = 50;
    hw = 26;
    fo = 6;
  } else if (category === 'BATTLESHIP') {
    hl = 44;
    hw = 24;
    fo = 4;
  } else if (category === 'CRUISER') {
    hl = 36;
    hw = 21;
    fo = 3;
  } else if (category === 'FRIGATE') {
    hl = 28;
    hw = 17;
    fo = 2;
  } else if (category === 'CORVETTE') {
    hl = 22;
    hw = 14;
    fo = 0;
  }
  return {
    halfLength: hl * scale,
    halfWidth: hw * scale,
    forwardOffset: fo * scale,
  };
}

export function isPointInOrientedBox(
  px: number,
  py: number,
  cx: number,
  cy: number,
  rot: number,
  box: OrientedBox,
  margin: number = 0
): boolean {
  const dx = px - cx;
  const dy = py - cy;
  const cos = Math.cos(-rot);
  const sin = Math.sin(-rot);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  return (
    Math.abs(localX - box.forwardOffset) <= box.halfLength + margin &&
    Math.abs(localY) <= box.halfWidth + margin
  );
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastTime: number = 0;

  // Frame telemetry
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private lastFps: number = 60;

  // Input states
  private keys: Record<string, boolean> = {};
  private mouse = { x: 0, y: 0, isDown: false };

  // Particles
  private particles: Particle[] = [];

  // Starfield background
  private stars: Array<{ x: number; y: number; size: number; layer: number; brightness: number }> = [];

  // Weapon cooldowns & Secondary Weapons
  private playerShootCooldown: number = 0;
  private torpedoCooldown: number = 0;
  private autoTurretCooldown: number = 0;
  private empWaves: Array<{ x: number; y: number; radius: number; maxRadius: number; alpha: number; zappedEnemyIds: Set<string> }> = [];
  private miningActive: boolean = false;
  private targetedAsteroid: Asteroid | null = null;
  private playerBeamTarget: { x: number; y: number; id: string; isEscort?: boolean } | null = null;
  private enemyBeamActive: Set<string> = new Set();
  private phaserAudioCooldown: number = 0;
  private lastTargetedEnemyId: string | null = null;

  // Performance accumulators & throttles
  private lastClusterCheckX: number = -999999;
  private lastClusterCheckY: number = -999999;
  private poiUpdateTimer: number = 0;
  private fuelDrainAccumulator: number = 0;
  private shieldRechargeAccumulator: number = 0;
  private asteroidCollisionCooldown: number = 0;
  private miningDamageAccumulator: number = 0;
  private miningDamageTimer: number = 0;
  private playerBeamDamageAccumulator: number = 0;
  private playerBeamDamageTimer: number = 0;
  private enemyBeamDamageAccumulator: number = 0;
  private enemyBeamDamageTimer: number = 0;

  // Dynamic Camera Zoom & FOV
  private currentZoom: number = 1.0;
  private targetZoom: number = 1.0;

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
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('ronin-virtual-control', this.handleVirtualControl as EventListener);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  public destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('ronin-virtual-control', this.handleVirtualControl as EventListener);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
    SoundManager.updateThruster(false);

    // Flush any pending accumulators
    if (this.fuelDrainAccumulator > 0) {
      useGameStore.getState().consumeFuel(this.fuelDrainAccumulator);
      this.fuelDrainAccumulator = 0;
    }
    if (this.shieldRechargeAccumulator > 0) {
      useGameStore.getState().rechargeShields(this.shieldRechargeAccumulator);
      this.shieldRechargeAccumulator = 0;
    }
  }

  private handleVirtualControl = (e: CustomEvent<{ key?: string; isPressed?: boolean; action?: string }>) => {
    if (!e.detail) return;
    const { key, isPressed, action } = e.detail;
    if (key !== undefined && isPressed !== undefined) {
      this.keys[key] = isPressed;
      this.keys[key.toLowerCase()] = isPressed;
      this.keys[key.toUpperCase()] = isPressed;
    }
    if (action === 'torpedo') {
      this.attemptFireTorpedo();
    } else if (action === 'emp') {
      this.attemptTriggerEmp();
    } else if (action === 'dock') {
      this.attemptDock();
    } else if (action === 'drone') {
      useGameStore.getState().launchReconDrone();
    } else if (action === 'armada') {
      useGameStore.getState().toggleArmadaStance();
    }
  };

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private handleBlur = () => {
    this.keys = {};
    SoundManager.updateThruster(false);
  };

  private isPressed(...targetKeys: string[]): boolean {
    for (const k of targetKeys) {
      if (!k) continue;
      if (
        this.keys[k] ||
        this.keys[k.toLowerCase()] ||
        this.keys[k.toUpperCase()]
      ) {
        return true;
      }
    }
    return false;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key) {
      this.keys[e.key] = true;
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.key.toUpperCase()] = true;
    }
    if (e.code) {
      this.keys[e.code] = true;
      this.keys[e.code.toLowerCase()] = true;
      this.keys[e.code.toUpperCase()] = true;
    }

    const matches = (code: string, char: string) => {
      return (
        e.code === code ||
        e.code?.toLowerCase() === code.toLowerCase() ||
        e.key?.toLowerCase() === char.toLowerCase() ||
        e.key === char
      );
    };

    // Quick dock key: E
    if (matches('KeyE', 'e')) {
      this.attemptDock();
    }
    // Fire Photon Torpedo key: F
    if (matches('KeyF', 'f')) {
      this.attemptFireTorpedo();
    }
    // Trigger EMP Shockwave key: Q or X
    if (matches('KeyQ', 'q') || matches('KeyX', 'x')) {
      this.attemptTriggerEmp();
    }
    // Launch Recon Drone key: R
    if (matches('KeyR', 'r')) {
      useGameStore.getState().launchReconDrone();
    }
    // Toggle Armada Stance key: T
    if (matches('KeyT', 't')) {
      useGameStore.getState().toggleArmadaStance();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key) {
      this.keys[e.key] = false;
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.key.toUpperCase()] = false;
    }
    if (e.code) {
      this.keys[e.code] = false;
      this.keys[e.code.toLowerCase()] = false;
      this.keys[e.code.toUpperCase()] = false;
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouse.isDown = true;
    } else if (e.button === 2) {
      this.attemptFireTorpedo();
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouse.isDown = false;
    }
  };

  public attemptFireTorpedo() {
    const state = useGameStore.getState();
    const { ship } = state;
    if (!ship.hasTorpedoLauncher || ship.torpedoes <= 0) return;
    if (this.torpedoCooldown > 0) return;

    this.torpedoCooldown = 0.75;
    const ok = state.fireTorpedo();
    if (!ok) return;

    SoundManager.playTorpedoLaunch();

    const rot = ship.rotation;
    const launchSpeed = 620;
    const projVx = ship.vx + Math.cos(rot) * launchSpeed;
    const projVy = ship.vy + Math.sin(rot) * launchSpeed;

    const torpedo: Projectile = {
      id: `p_torp_${Date.now()}_${Math.random()}`,
      owner: 'PLAYER',
      type: 'TORPEDO',
      x: ship.x + Math.cos(rot) * 26,
      y: ship.y + Math.sin(rot) * 26,
      vx: projVx,
      vy: projVy,
      damage: 180, // Heavy explosive warhead!
      lifetime: 4.5,
      color: '#FB923C',
      radius: 8,
      trailColor: '#F97316',
    };
    state.addProjectile(torpedo);
  }

  public attemptTriggerEmp() {
    const state = useGameStore.getState();
    const { ship } = state;
    if (!ship.hasEmpGenerator || (ship.empCooldown && ship.empCooldown > 0)) return;

    const ok = state.triggerEmpWave();
    if (!ok) return;

    SoundManager.playEmpWave();

    // Spawn expanding shockwave entity
    this.empWaves.push({
      x: ship.x,
      y: ship.y,
      radius: 15,
      maxRadius: 380,
      alpha: 1.0,
      zappedEnemyIds: new Set<string>(),
    });

    // Spawn burst of 25 electric particles around ship
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 120 + Math.random() * 260;
      this.particles.push({
        x: ship.x,
        y: ship.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color: Math.random() < 0.5 ? '#00F0FF' : '#C084FC',
        size: Math.random() * 3 + 1.5,
        alpha: 1,
        lifetime: 0.6,
        maxLifetime: 0.6,
      });
    }
  }

  private attemptDock() {
    const state = useGameStore.getState();
    if (state.gameStatus !== 'EXPLORING' && state.gameStatus !== 'COMBAT') return;

    const { ship, world } = state;
    const DOCK_DISTANCE = 160;

    for (const station of world.stations) {
      const dist = Math.hypot(ship.x - station.x, ship.y - station.y);
      if (dist <= station.radius + DOCK_DISTANCE) {
        if (this.fuelDrainAccumulator > 0) {
          state.consumeFuel(this.fuelDrainAccumulator);
          this.fuelDrainAccumulator = 0;
        }
        if (this.shieldRechargeAccumulator > 0) {
          state.rechargeShields(this.shieldRechargeAccumulator);
          this.shieldRechargeAccumulator = 0;
        }
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
    try {
      const rawDt = Math.max(0.001, (currentTime - this.lastTime) / 1000);
      const dt = Math.min(rawDt, 0.1);
      this.lastTime = currentTime;

      // Track real-time FPS and frame metrics
      this.frameCount++;
      this.fpsTimer += rawDt;
      if (this.fpsTimer >= 0.5) {
        this.lastFps = this.frameCount / this.fpsTimer;
        this.frameCount = 0;
        this.fpsTimer = 0;
        const st = useGameStore.getState();
        logger.updateMetrics(
          this.lastFps,
          rawDt * 1000,
          st.world?.enemies?.length || 0,
          st.world?.projectiles?.length || 0,
          this.particles.length
        );
      }

      const state = useGameStore.getState();

      if (
        (state.gameStatus === 'EXPLORING' || state.gameStatus === 'COMBAT') &&
        !state.isPaused &&
        !state.isDiagnosticsOpen
      ) {
        this.update(dt);
      } else {
        SoundManager.updateThruster(false);
      }

      this.render();
    } catch (err) {
      console.error('GameEngine render loop error:', err);
    }

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const state = useGameStore.getState();
    const { ship, world, player } = state;

    // 0. Dynamic Camera Zoom Calculation based on Ship Class Progression
    // Zoom out to provide wide tactical combat visibility as starships and armada fleets grow
    const tier = ship.shipTier || 1;
    if (tier >= 80) {
      this.targetZoom = 0.28;
    } else if (tier >= 50) {
      this.targetZoom = 0.32;
    } else if (tier >= 30) {
      this.targetZoom = 0.38;
    } else if (tier >= 20) {
      this.targetZoom = 0.44;
    } else if (tier >= 12) {
      this.targetZoom = 0.54;
    } else if (tier >= 6) {
      this.targetZoom = 0.68;
    } else if (tier >= 3) {
      this.targetZoom = 0.82;
    } else {
      this.targetZoom = 0.95;
    }

    // Smooth camera zoom interpolation
    this.currentZoom += (this.targetZoom - this.currentZoom) * Math.min(1, 3.0 * dt);

    // Viewport dimensions in world space
    const currentEngineZoom = Math.max(0.15, this.currentZoom || 1.0);
    const halfVw = (this.canvas.width / 2) / currentEngineZoom;
    const halfVh = (this.canvas.height / 2) / currentEngineZoom;

    // 1. Power & Upgrade modifiers
    const engineLvl = ship.engineLevel || 1;
    const weaponLvl = ship.weaponLevel || 1;
    const thrustMultiplier = (0.6 + ship.enginePower * 0.25) * (1 + (engineLvl - 1) * 0.15);
    const turnSpeed = (2.5 + ship.enginePower * 0.35) * (1 + (engineLvl - 1) * 0.12);
    const fireCooldownRate = Math.max(0.12, (0.34 - ship.weaponPower * 0.04) * (1 - (weaponLvl - 1) * 0.08));
    // Supercharged player laser damage:
    // Base 45 + 12 per power bar, scaled by weapon level. Deals 70-130 damage per shot!
    const weaponDamage = (45 + ship.weaponPower * 12) * (1 + (weaponLvl - 1) * 0.25);

    // 2. Player Input & Steering
    let rot = ship.rotation;
    let isThrusting = false;
    let isReverseThrusting = false;

    if (this.isPressed('KeyA', 'a', 'ArrowLeft', 'arrowleft')) {
      rot -= turnSpeed * dt;
    }
    if (this.isPressed('KeyD', 'd', 'ArrowRight', 'arrowright')) {
      rot += turnSpeed * dt;
    }

    let vx = ship.vx;
    let vy = ship.vy;

    const hasFuel = player.fuel > 0;
    const forwardPressed = this.isPressed('KeyW', 'w', 'ArrowUp', 'arrowup');
    const reversePressed = this.isPressed('KeyS', 's', 'ArrowDown', 'arrowdown');

    if (forwardPressed && hasFuel) {
      isThrusting = true;
      const accel = 340 * thrustMultiplier;
      vx += Math.cos(rot) * accel * dt;
      vy += Math.sin(rot) * accel * dt;

      // Accumulate fuel drain slowly while burning
      this.fuelDrainAccumulator += 1.2 * dt;

      // Spawn thruster particles
      this.spawnThrusterParticles(ship.x, ship.y, rot);
    }

    if (reversePressed && hasFuel) {
      isReverseThrusting = true;
      // Active reverse thrust: accelerates backwards (not just braking!)
      const revAccel = 260 * thrustMultiplier;
      vx -= Math.cos(rot) * revAccel * dt;
      vy -= Math.sin(rot) * revAccel * dt;

      // Accumulate fuel drain slowly while burning reverse thrusters
      this.fuelDrainAccumulator += 1.0 * dt;

      // Spawn reverse thruster particles from forward maneuvering RCS jets!
      this.spawnReverseThrusterParticles(ship.x, ship.y, rot);
    }

    // Commit accumulated fuel drain in batches
    if (this.fuelDrainAccumulator >= 0.25) {
      state.consumeFuel(this.fuelDrainAccumulator);
      this.fuelDrainAccumulator = 0;
    }

    // Natural space friction / flight computer stabilizer when no thrust applied
    if (!forwardPressed && !reversePressed) {
      const naturalDamp = Math.pow(0.88, dt);
      vx *= naturalDamp;
      vy *= naturalDamp;
    }

    // Speed clamp
    const maxSpeed = 400 * thrustMultiplier;
    const currentSpeed = Math.hypot(vx, vy);
    if (currentSpeed > maxSpeed) {
      vx = (vx / currentSpeed) * maxSpeed;
      vy = (vy / currentSpeed) * maxSpeed;
    }

    let newX = ship.x + vx * dt;
    let newY = ship.y + vy * dt;

    // Asteroid & Hostile Ship Collision Detection & Elastic Rebound
    this.asteroidCollisionCooldown = Math.max(0, this.asteroidCollisionCooldown - dt);
    const playerTier = ship.shipTier || 1;
    const playerScale = playerTier <= 22 ? 1.0 : Number((1.0 + (playerTier - 22) * 0.008).toFixed(2));
    const pBox = getPlayerBoundingBox(playerTier, playerScale);
    const playerHitRadius = Math.max(pBox.halfWidth, pBox.halfLength * 0.85);

    for (const ast of world.asteroids) {
      const distToAst = Math.hypot(newX - ast.x, newY - ast.y);
      const minDistance = playerHitRadius + ast.radius;

      if (distToAst < minDistance) {
        // Impact / Contact detected
        const overlap = minDistance - distToAst;
        const nx = distToAst > 0.0001 ? (newX - ast.x) / distToAst : Math.cos(rot);
        const ny = distToAst > 0.0001 ? (newY - ast.y) / distToAst : Math.sin(rot);

        // 1. Separate position smoothly to prevent tunneling
        newX += nx * overlap * 1.05;
        newY += ny * overlap * 1.05;

        // 2. Relative impact velocity calculation
        const relVx = vx - ast.vx;
        const relVy = vy - ast.vy;
        const impactSpeed = Math.hypot(relVx, relVy);

        // 3. Elastic rebound reflection
        const dot = vx * nx + vy * ny;
        if (dot < 0) {
          vx = (vx - 1.65 * dot * nx) * 0.7;
          vy = (vy - 1.65 * dot * ny) * 0.7;
        }

        // 4. Damage, audio & particle explosions ONLY trigger with cooldown & speed threshold!
        if (this.asteroidCollisionCooldown <= 0 && impactSpeed > 25) {
          this.asteroidCollisionCooldown = 0.5; // 500ms grace period between heavy impacts
          const collisionDmg = Math.round(Math.max(18, 12 + impactSpeed * 0.22));
          state.damagePlayer(collisionDmg);
          state.damageAsteroid(ast.id, Math.round(collisionDmg * 1.5));

          SoundManager.playExplosion();
          this.spawnExplosionParticles(ast.x + nx * ast.radius, ast.y + ny * ast.radius, '#F59E0B', 10);
        }
      }
    }

    // Physical Enemy Ship Collision Separation & Overlap Prevention (Oriented Hull Box bounds)
    for (const enemy of world.enemies || []) {
      const distToEnemy = Math.hypot(newX - enemy.x, newY - enemy.y);
      const cat = enemy.category || (enemy.type === 'OUTLAW_BOSS' ? 'BATTLESHIP' : enemy.type === 'RAIDER_CORVETTE' ? 'CRUISER' : 'SCOUT');
      const eBox = getEnemyBoundingBox(cat, enemy.scale || 1.0);
      const enemyEffectiveRadius = Math.max(eBox.halfWidth, eBox.halfLength * 0.85);
      const minDistance = playerHitRadius + enemyEffectiveRadius;

      if (distToEnemy < minDistance && distToEnemy > 0.0001) {
        const overlap = minDistance - distToEnemy;
        const nx = (newX - enemy.x) / distToEnemy;
        const ny = (newY - enemy.y) / distToEnemy;

        // Immediately push apart to prevent overlapping
        newX += nx * overlap * 0.6;
        newY += ny * overlap * 0.6;
        enemy.x -= nx * overlap * 0.6;
        enemy.y -= ny * overlap * 0.6;

        // Elastic bounce
        const relVx = vx - enemy.vx;
        const relVy = vy - enemy.vy;
        const dot = relVx * nx + relVy * ny;
        if (dot < 0) {
          vx = (vx - 1.4 * dot * nx) * 0.8;
          vy = (vy - 1.4 * dot * ny) * 0.8;
          enemy.vx = (enemy.vx + 1.4 * dot * nx) * 0.8;
          enemy.vy = (enemy.vy + 1.4 * dot * ny) * 0.8;
        }

        if (Math.random() < 0.25) {
          this.spawnExplosionParticles(enemy.x + nx * enemyEffectiveRadius, enemy.y + ny * enemyEffectiveRadius, '#00F0FF', 6);
        }
      }
    }

    // Update sound
    SoundManager.updateThruster(isThrusting || isReverseThrusting);

    // 3. Shield Regeneration (Batched commits to prevent constant React re-renders)
    if (ship.shield < ship.maxShield) {
      this.shieldRechargeAccumulator += dt;
      if (this.shieldRechargeAccumulator >= 0.25) {
        state.rechargeShields(this.shieldRechargeAccumulator);
        this.shieldRechargeAccumulator = 0;
      }
    } else {
      this.shieldRechargeAccumulator = 0;
    }

    // 4. Weapons & Projectiles
    this.playerShootCooldown = Math.max(0, this.playerShootCooldown - dt);
    this.torpedoCooldown = Math.max(0, this.torpedoCooldown - dt);

    if (this.isPressed('Space', 'space', ' ')) {
      if (this.playerShootCooldown <= 0) {
        this.playerShootCooldown = fireCooldownRate;

        // Magnetic Aim Assist: lead towards nearby hostile if aiming in their direction
        let fireAngle = rot;
        const liveEnemies = useGameStore.getState().world.enemies;
        let bestTarget: Enemy | null = null;
        let smallestDiff = 0.58; // ~33 degree cone

        for (const e of liveEnemies) {
          const angleToEnemy = Math.atan2(e.y - newY, e.x - newX);
          const diff = Math.abs(Math.atan2(Math.sin(angleToEnemy - rot), Math.cos(angleToEnemy - rot)));
          const dist = Math.hypot(e.x - newX, e.y - newY);
          if (dist < 850 && diff < smallestDiff) {
            smallestDiff = diff;
            bestTarget = e;
          }
        }

        if (bestTarget) {
          fireAngle = Math.atan2(bestTarget.y - newY, bestTarget.x - newX);
          this.lastTargetedEnemyId = bestTarget.id;
        }

        const perpAngle = fireAngle + Math.PI / 2;

        // Multi-Tier Laser Cannon Configurations (Levels 1 to 50+)
        // Distinct visual beam colors, varied widths, speeds, and multi-cannon layouts
        const baseSpeed = 860;

        if (weaponLvl === 1) {
          // MK-1: Cyan Pulse Needle
          state.addProjectile({
            id: `p_player_${Date.now()}_${Math.random()}`,
            owner: 'PLAYER',
            type: 'LASER',
            x: newX + Math.cos(fireAngle) * 22,
            y: newY + Math.sin(fireAngle) * 22,
            vx: vx + Math.cos(fireAngle) * baseSpeed,
            vy: vy + Math.sin(fireAngle) * baseSpeed,
            damage: weaponDamage,
            lifetime: 1.8,
            color: '#00F0FF',
            radius: 1.8,
          });
        } else if (weaponLvl === 2) {
          // MK-2: Twin Azure Wing Cannons
          const offset = 11;
          const dmgPerBolt = weaponDamage * 0.58;
          [-offset, offset].forEach((off) => {
            state.addProjectile({
              id: `p_player_${Date.now()}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 18 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 18 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(fireAngle) * (baseSpeed + 20),
              vy: vy + Math.sin(fireAngle) * (baseSpeed + 20),
              damage: dmgPerBolt,
              lifetime: 1.8,
              color: '#38BDF8',
              radius: 2.2,
            });
          });
        } else if (weaponLvl === 3) {
          // MK-3: Triple Violet Hyper-Trident
          const dmgPerBolt = weaponDamage * 0.44;
          state.addProjectile({
            id: `p_player_${Date.now()}_${Math.random()}`,
            owner: 'PLAYER',
            type: 'LASER',
            x: newX + Math.cos(fireAngle) * 22,
            y: newY + Math.sin(fireAngle) * 22,
            vx: vx + Math.cos(fireAngle) * (baseSpeed + 30),
            vy: vy + Math.sin(fireAngle) * (baseSpeed + 30),
            damage: dmgPerBolt * 1.15,
            lifetime: 1.8,
            color: '#C084FC',
            radius: 2.5,
          });
          [-14, 14].forEach((off, idx) => {
            const spreadAngle = fireAngle + (idx === 0 ? -0.04 : 0.04);
            state.addProjectile({
              id: `p_player_${Date.now()}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 16 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 16 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(spreadAngle) * (baseSpeed + 20),
              vy: vy + Math.sin(spreadAngle) * (baseSpeed + 20),
              damage: dmgPerBolt,
              lifetime: 1.8,
              color: '#C084FC',
              radius: 2.2,
            });
          });
        } else if (weaponLvl === 4) {
          // MK-4: Quad Crimson Antimatter Cannons
          const dmgPerBolt = weaponDamage * 0.36;
          [-18, -7, 7, 18].forEach((off) => {
            state.addProjectile({
              id: `p_player_${Date.now()}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 16 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 16 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(fireAngle) * (baseSpeed + 50),
              vy: vy + Math.sin(fireAngle) * (baseSpeed + 50),
              damage: dmgPerBolt,
              lifetime: 1.9,
              color: '#FF3366',
              radius: 2.8,
            });
          });
        } else if (weaponLvl === 5) {
          // MK-5: Overcharged Golden Solar Lance
          const dmgPerBolt = weaponDamage * 0.50;
          state.addProjectile({
            id: `p_player_${Date.now()}_${Math.random()}`,
            owner: 'PLAYER',
            type: 'LASER',
            x: newX + Math.cos(fireAngle) * 26,
            y: newY + Math.sin(fireAngle) * 26,
            vx: vx + Math.cos(fireAngle) * (baseSpeed + 90),
            vy: vy + Math.sin(fireAngle) * (baseSpeed + 90),
            damage: dmgPerBolt * 1.35,
            lifetime: 2.0,
            color: '#FFDD00',
            radius: 3.6,
          });
          [-16, 16].forEach((off) => {
            state.addProjectile({
              id: `p_player_${Date.now()}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 18 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 18 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(fireAngle) * (baseSpeed + 40),
              vy: vy + Math.sin(fireAngle) * (baseSpeed + 40),
              damage: dmgPerBolt * 0.85,
              lifetime: 2.0,
              color: '#FFDD00',
              radius: 2.6,
            });
          });
        } else if (weaponLvl === 6) {
          // MK-6: Tachyon Emerald Disintegrator Array (5 High-Speed Needles)
          const dmgPerBolt = weaponDamage * 0.32;
          state.addProjectile({
            id: `p_player_${Date.now()}_${Math.random()}`,
            owner: 'PLAYER',
            type: 'LASER',
            x: newX + Math.cos(fireAngle) * 28,
            y: newY + Math.sin(fireAngle) * 28,
            vx: vx + Math.cos(fireAngle) * (baseSpeed + 130),
            vy: vy + Math.sin(fireAngle) * (baseSpeed + 130),
            damage: dmgPerBolt * 1.4,
            lifetime: 2.1,
            color: '#10B981',
            radius: 3.0,
          });
          [-22, -11, 11, 22].forEach((off, idx) => {
            const spread = (idx === 0 || idx === 3 ? (idx < 2 ? -0.05 : 0.05) : 0);
            state.addProjectile({
              id: `p_player_${Date.now()}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 18 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 18 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(fireAngle + spread) * (baseSpeed + 80),
              vy: vy + Math.sin(fireAngle + spread) * (baseSpeed + 80),
              damage: dmgPerBolt,
              lifetime: 2.0,
              color: '#10B981',
              radius: 2.4,
            });
          });
        } else if (weaponLvl === 7) {
          // MK-7: Quantum Singularity Salvo (6 Neon-Pink Quantum Beams)
          const dmgPerBolt = weaponDamage * 0.30;
          [-24, -14, -5, 5, 14, 24].forEach((off, idx) => {
            const spread = (idx - 2.5) * 0.025;
            state.addProjectile({
              id: `p_player_${Date.now()}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 20 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 20 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(fireAngle + spread) * (baseSpeed + 110),
              vy: vy + Math.sin(fireAngle + spread) * (baseSpeed + 110),
              damage: dmgPerBolt,
              lifetime: 2.2,
              color: '#EC4899',
              radius: 3.0,
            });
          });
        } else if (weaponLvl === 8) {
          // MK-8: Apex Hyper-Nova Battery (7 Supreme Violet-Plasma Heavy Lances)
          const dmgPerBolt = weaponDamage * 0.32;
          [-7, 7].forEach((off) => {
            state.addProjectile({
              id: `p_player_${Date.now()}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 32 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 32 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(fireAngle) * (baseSpeed + 150),
              vy: vy + Math.sin(fireAngle) * (baseSpeed + 150),
              damage: dmgPerBolt * 1.45,
              lifetime: 2.3,
              color: '#A855F7',
              radius: 3.8,
            });
          });
          [-28, -18, 0, 18, 28].forEach((off, idx) => {
            const spread = (idx - 2) * 0.035;
            state.addProjectile({
              id: `p_player_${Date.now()}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 22 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 22 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(fireAngle + spread) * (baseSpeed + 90),
              vy: vy + Math.sin(fireAngle + spread) * (baseSpeed + 90),
              damage: dmgPerBolt,
              lifetime: 2.2,
              color: '#A855F7',
              radius: 3.2,
            });
          });
        } else if (weaponLvl <= 14) {
          // MK-9 to MK-14: Hellfire Plasma Incinerators (Hellfire Orange Salvo)
          const boltCount = Math.min(8, 6 + (weaponLvl - 9));
          const dmgPerBolt = weaponDamage / boltCount;
          for (let i = 0; i < boltCount; i++) {
            const off = (i - (boltCount - 1) / 2) * 9;
            const spread = (i - (boltCount - 1) / 2) * 0.025;
            state.addProjectile({
              id: `p_player_${Date.now()}_${i}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 26 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 26 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(fireAngle + spread) * (baseSpeed + 130),
              vy: vy + Math.sin(fireAngle + spread) * (baseSpeed + 130),
              damage: dmgPerBolt * 1.1,
              lifetime: 2.3,
              color: '#F97316',
              radius: 3.6,
            });
          }
        } else if (weaponLvl <= 20) {
          // MK-15 to MK-20: Prismatic Diamond Beam Lances (White/Cyan Hypersonic Beams)
          const boltCount = 8;
          const dmgPerBolt = weaponDamage / boltCount;
          for (let i = 0; i < boltCount; i++) {
            const off = (i - 3.5) * 8;
            const spread = (i - 3.5) * 0.02;
            state.addProjectile({
              id: `p_player_${Date.now()}_${i}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 28 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 28 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(fireAngle + spread) * (baseSpeed + 180),
              vy: vy + Math.sin(fireAngle + spread) * (baseSpeed + 180),
              damage: dmgPerBolt * 1.15,
              lifetime: 2.4,
              color: '#FFFFFF',
              radius: 3.2,
            });
          }
        } else if (weaponLvl <= 28) {
          // MK-21 to MK-28: Dark Matter Void Singularity Cannons (Deep Indigo Heavy Bolts)
          const boltCount = Math.min(10, 8 + Math.floor((weaponLvl - 21) / 3));
          const dmgPerBolt = weaponDamage / boltCount;
          for (let i = 0; i < boltCount; i++) {
            const off = (i - (boltCount - 1) / 2) * 10;
            const spread = (i - (boltCount - 1) / 2) * 0.03;
            state.addProjectile({
              id: `p_player_${Date.now()}_${i}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 30 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 30 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(fireAngle + spread) * (baseSpeed + 160),
              vy: vy + Math.sin(fireAngle + spread) * (baseSpeed + 160),
              damage: dmgPerBolt * 1.2,
              lifetime: 2.4,
              color: '#6366F1',
              radius: 4.2,
            });
          }
        } else if (weaponLvl <= 36) {
          // MK-29 to MK-36: Chrono-Teal Phased Disintegrators (Chrono Teal Phased Barrage)
          const boltCount = 10;
          const dmgPerBolt = weaponDamage / boltCount;
          for (let i = 0; i < boltCount; i++) {
            const off = (i - 4.5) * 9;
            const spread = (i - 4.5) * 0.024;
            state.addProjectile({
              id: `p_player_${Date.now()}_${i}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 32 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 32 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(fireAngle + spread) * (baseSpeed + 200),
              vy: vy + Math.sin(fireAngle + spread) * (baseSpeed + 200),
              damage: dmgPerBolt * 1.25,
              lifetime: 2.5,
              color: '#06B6D4',
              radius: 4.0,
            });
          }
        } else if (weaponLvl <= 44) {
          // MK-37 to MK-44: Blood Ruby Super-Cannons (Apex Ruby #E11D48 Heavy Super-Salvo)
          const boltCount = Math.min(12, 10 + Math.floor((weaponLvl - 37) / 3));
          const dmgPerBolt = weaponDamage / boltCount;
          for (let i = 0; i < boltCount; i++) {
            const off = (i - (boltCount - 1) / 2) * 9.5;
            const spread = (i - (boltCount - 1) / 2) * 0.028;
            state.addProjectile({
              id: `p_player_${Date.now()}_${i}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 34 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 34 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(fireAngle + spread) * (baseSpeed + 220),
              vy: vy + Math.sin(fireAngle + spread) * (baseSpeed + 220),
              damage: dmgPerBolt * 1.3,
              lifetime: 2.5,
              color: '#E11D48',
              radius: 4.8,
            });
          }
        } else {
          // MK-45 to MK-50+: Celestial God-Lance Supernova Battery (Starlight Gold Supreme Heavy Lances)
          const boltCount = 12;
          const dmgPerBolt = weaponDamage / boltCount;
          // Dual Core Lances
          [-7, 7].forEach((off) => {
            state.addProjectile({
              id: `p_player_${Date.now()}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 38 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 38 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(fireAngle) * (baseSpeed + 260),
              vy: vy + Math.sin(fireAngle) * (baseSpeed + 260),
              damage: dmgPerBolt * 2.0,
              lifetime: 2.6,
              color: '#FBBF24',
              radius: 5.6,
            });
          });
          // 10 Outer Nova Lances
          for (let i = 0; i < 10; i++) {
            const off = (i - 4.5) * 11;
            const spread = (i - 4.5) * 0.032;
            state.addProjectile({
              id: `p_player_${Date.now()}_${i}_${Math.random()}`,
              owner: 'PLAYER',
              type: 'LASER',
              x: newX + Math.cos(fireAngle) * 28 + Math.cos(perpAngle) * off,
              y: newY + Math.sin(fireAngle) * 28 + Math.sin(perpAngle) * off,
              vx: vx + Math.cos(fireAngle + spread) * (baseSpeed + 210),
              vy: vy + Math.sin(fireAngle + spread) * (baseSpeed + 210),
              damage: dmgPerBolt * 1.15,
              lifetime: 2.5,
              color: '#FBBF24',
              radius: 4.4,
            });
          }
        }
        SoundManager.playLaser(false);
      }
    }

    // Auto Flak Point-Defense Turrets
    if (ship.hasAutoTurrets) {
      this.autoTurretCooldown = Math.max(0, this.autoTurretCooldown - dt);
      if (this.autoTurretCooldown <= 0) {
        const enemies = state.world.enemies;
        let targetX: number | null = null;
        let targetY: number | null = null;
        let closestEnemyDist = 420;

        for (const e of enemies) {
          const isEnOnScreen = Math.abs(e.x - newX) <= halfVw + 30 && Math.abs(e.y - newY) <= halfVh + 30;
          if (!isEnOnScreen) continue;
          const d = Math.hypot(e.x - newX, e.y - newY);
          if (d < closestEnemyDist) {
            closestEnemyDist = d;
            targetX = e.x;
            targetY = e.y;
          }
        }
        if (targetX === null) {
          for (const esc of state.world.escorts || []) {
            if (esc.owner === 'ENEMY') {
              const isEscOnScreen = Math.abs(esc.x - newX) <= halfVw + 30 && Math.abs(esc.y - newY) <= halfVh + 30;
              if (!isEscOnScreen) continue;
              const d = Math.hypot(esc.x - newX, esc.y - newY);
              if (d < closestEnemyDist) {
                closestEnemyDist = d;
                targetX = esc.x;
                targetY = esc.y;
              }
            }
          }
        }

        if (targetX !== null && targetY !== null) {
          this.autoTurretCooldown = 0.45;
          const angle = Math.atan2(targetY - newY, targetX - newX);
          const flakSpeed = 950;
          state.addProjectile({
            id: `p_flak_${Date.now()}_${Math.random()}`,
            owner: 'PLAYER',
            type: 'FLAK',
            x: newX,
            y: newY,
            vx: vx + Math.cos(angle) * flakSpeed,
            vy: vy + Math.sin(angle) * flakSpeed,
            damage: 10,
            lifetime: 0.35,
            color: '#FDE047',
            radius: 3,
          });
        }
      }
    }

    // 5. Mining Beam (Hold Mouse Down or Key 'M')
    this.miningActive = this.mouse.isDown || this.isPressed('KeyM', 'm');
    this.targetedAsteroid = null;

    if (this.miningActive) {
      // Find closest asteroid within mining range (260px) that is strictly on screen
      const MINING_RANGE = 260;
      let closestAst: Asteroid | null = null;
      let closestDist = Infinity;

      for (const ast of world.asteroids) {
        const isAstOnScreen = Math.abs(ast.x - newX) <= halfVw + ast.radius && Math.abs(ast.y - newY) <= halfVh + ast.radius;
        if (!isAstOnScreen) continue;
        const dist = Math.hypot(newX - ast.x, newY - ast.y) - ast.radius;
        if (dist < MINING_RANGE && dist < closestDist) {
          closestDist = dist;
          closestAst = ast;
        }
      }

      if (closestAst) {
        this.targetedAsteroid = closestAst;
        SoundManager.playMiningBeam();

        // Accumulate and commit mining extraction damage in batched ticks
        const miningDps = 220 * (1 + (ship.weaponLevel || 1) * 0.18);
        this.miningDamageAccumulator += miningDps * dt;
        this.miningDamageTimer += dt;

        if (this.miningDamageTimer >= 0.12 || this.miningDamageAccumulator >= closestAst.health) {
          state.damageAsteroid(closestAst.id, this.miningDamageAccumulator);
          this.miningDamageAccumulator = 0;
          this.miningDamageTimer = 0;
        }

        // Spawn rich mining fracture sparks & molten ore fragments
        this.spawnMiningParticles(closestAst.x, closestAst.y);
        if (Math.random() < 0.35) {
          const streamAngle = Math.atan2(newY - closestAst.y, newX - closestAst.x) + (Math.random() - 0.5) * 0.4;
          this.particles.push({
            x: closestAst.x + (Math.random() - 0.5) * closestAst.radius,
            y: closestAst.y + (Math.random() - 0.5) * closestAst.radius,
            vx: Math.cos(streamAngle) * 220,
            vy: Math.sin(streamAngle) * 220,
            color: closestAst.oreType === 'fusion_cells' ? '#C084FC' : '#FBBF24',
            size: 2.2 + Math.random() * 2,
            alpha: 1.0,
            lifetime: 0.35,
            maxLifetime: 0.35,
          });
        }
      } else {
        this.miningDamageAccumulator = 0;
        this.miningDamageTimer = 0;
      }
    } else {
      this.miningDamageAccumulator = 0;
      this.miningDamageTimer = 0;
    }

    // 6. Update Projectiles, Torpedo Homing, EMP shockwaves & Check Collisions
    state.updateProjectiles(dt);
    const activeProjectiles = useGameStore.getState().world.projectiles;

    // Torpedo homing guidance & smoke trails
    const liveEnemiesForTorp = useGameStore.getState().world.enemies;
    const enemyEscortsForTorp = (useGameStore.getState().world.escorts || []).filter((e) => e.owner === 'ENEMY');
    for (const proj of activeProjectiles) {
      if (proj.owner === 'PLAYER' && proj.type === 'TORPEDO' && proj.lifetime > 0) {
        let closestDist = 900;
        let targetTorpPos: { x: number; y: number } | null = null;
        for (const e of liveEnemiesForTorp) {
          const isEnOnScreen = Math.abs(e.x - newX) <= halfVw + 30 && Math.abs(e.y - newY) <= halfVh + 30;
          if (!isEnOnScreen) continue;
          const d = Math.hypot(e.x - proj.x, e.y - proj.y);
          if (d < closestDist) {
            closestDist = d;
            targetTorpPos = { x: e.x, y: e.y };
          }
        }
        if (!targetTorpPos) {
          for (const esc of enemyEscortsForTorp) {
            const isEscOnScreen = Math.abs(esc.x - newX) <= halfVw + 30 && Math.abs(esc.y - newY) <= halfVh + 30;
            if (!isEscOnScreen) continue;
            const d = Math.hypot(esc.x - proj.x, esc.y - proj.y);
            if (d < closestDist) {
              closestDist = d;
              targetTorpPos = { x: esc.x, y: esc.y };
            }
          }
        }
        if (targetTorpPos) {
          const curAng = Math.atan2(proj.vy, proj.vx);
          const targetAng = Math.atan2(targetTorpPos.y - proj.y, targetTorpPos.x - proj.x);
          const diff = Math.atan2(Math.sin(targetAng - curAng), Math.cos(targetAng - curAng));
          const turn = Math.sign(diff) * Math.min(Math.abs(diff), 4.2 * dt);
          const newAng = curAng + turn;
          const speed = Math.min(720, Math.hypot(proj.vx, proj.vy) + 160 * dt);
          proj.vx = Math.cos(newAng) * speed;
          proj.vy = Math.sin(newAng) * speed;
        }

        // Particle smoke trail behind torpedo
        if (Math.random() < 0.65) {
          this.particles.push({
            x: proj.x - proj.vx * 0.02 + (Math.random() - 0.5) * 4,
            y: proj.y - proj.vy * 0.02 + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            color: Math.random() < 0.6 ? '#FB923C' : '#FDE047',
            size: Math.random() * 2.5 + 1.5,
            alpha: 0.8,
            lifetime: 0.35,
            maxLifetime: 0.35,
          });
        }
      }
    }

    // EMP Shockwaves expansion, missile interception, and enemy/escort FREEZING & disruption
    this.empWaves = this.empWaves.filter((wave) => {
      wave.radius += 560 * dt;
      wave.alpha = Math.max(0, 1 - wave.radius / wave.maxRadius);

      // Vaporize enemy projectiles caught in shockwave
      for (const ep of activeProjectiles) {
        if (ep.owner === 'ENEMY' && ep.lifetime > 0) {
          const d = Math.hypot(ep.x - wave.x, ep.y - wave.y);
          if (d <= wave.radius) {
            ep.lifetime = 0;
            this.spawnExplosionParticles(ep.x, ep.y, '#00F0FF', 6);
          }
        }
      }

      // Zap, disrupt, and FREEZE main enemies for 5.0 seconds!
      const currentLive = useGameStore.getState().world.enemies;
      for (const enemy of currentLive) {
        if (!wave.zappedEnemyIds.has(enemy.id)) {
          const d = Math.hypot(enemy.x - wave.x, enemy.y - wave.y);
          if (d <= wave.radius) {
            wave.zappedEnemyIds.add(enemy.id);
            const res = state.damageEnemy(enemy.id, 50, true, 5.0); // 50 EMP disruption damage + 5s FREEZE!
            if (res.destroyed) {
              this.spawnExplosionParticles(enemy.x, enemy.y, '#00F0FF', 30);
            } else {
              this.spawnExplosionParticles(enemy.x, enemy.y, '#00F0FF', 20);
            }
          }
        }
      }

      // Zap, disrupt, and FREEZE enemy escorts for 5.0 seconds!
      const liveEscortsForEmp = useGameStore.getState().world.escorts || [];
      for (const esc of liveEscortsForEmp) {
        if (esc.owner === 'ENEMY' && !wave.zappedEnemyIds.has(esc.id)) {
          const d = Math.hypot(esc.x - wave.x, esc.y - wave.y);
          if (d <= wave.radius) {
            wave.zappedEnemyIds.add(esc.id);
            const res = state.damageEscort(esc.id, 50, 5.0); // 50 EMP damage + 5s FREEZE!
            if (res.destroyed) {
              this.spawnExplosionParticles(esc.x, esc.y, '#00F0FF', 24);
            } else {
              this.spawnExplosionParticles(esc.x, esc.y, '#00F0FF', 16);
            }
          }
        }
      }

      return wave.radius < wave.maxRadius;
    });

    // Check collisions for active projectiles
    const screenMinX = newX - halfVw - 10;
    const screenMaxX = newX + halfVw + 10;
    const screenMinY = newY - halfVh - 10;
    const screenMaxY = newY + halfVh + 10;

    for (const proj of activeProjectiles) {
      if (proj.lifetime <= 0) continue;

      // Projectile immediately disappears when going offscreen
      if (proj.x < screenMinX || proj.x > screenMaxX || proj.y < screenMinY || proj.y > screenMaxY) {
        proj.lifetime = 0;
        continue;
      }

      if (proj.owner === 'PLAYER') {
        // A. Check hits on regular enemies (Strictly on-screen)
        const currentEnemies = useGameStore.getState().world.enemies;
        for (const enemy of currentEnemies) {
          const isEnemyOnScreen = Math.abs(enemy.x - newX) <= halfVw + 30 && Math.abs(enemy.y - newY) <= halfVh + 30;
          if (!isEnemyOnScreen) continue;

          const cat = enemy.category || (enemy.type === 'OUTLAW_BOSS' ? 'BATTLESHIP' : enemy.type === 'RAIDER_CORVETTE' ? 'CRUISER' : 'SCOUT');
          const eBox = getEnemyBoundingBox(cat, enemy.scale || 1.0);
          const margin = proj.type === 'TORPEDO' ? 26 : (proj.radius || 4);

          if (isPointInOrientedBox(proj.x, proj.y, enemy.x, enemy.y, enemy.rotation, eBox, margin)) {
            this.lastTargetedEnemyId = enemy.id;
            if (proj.type === 'TORPEDO') {
              // Massive Torpedo Blast AOE! (Explosive damage ignores armor)
              SoundManager.playExplosion();
              this.spawnExplosionParticles(proj.x, proj.y, '#FB923C', 32);
              const BLAST_RADIUS = 130;
              for (const e of currentEnemies) {
                if (Math.abs(e.x - newX) > halfVw + 30 || Math.abs(e.y - newY) > halfVh + 30) continue;
                const ed = Math.hypot(proj.x - e.x, proj.y - e.y);
                if (ed < BLAST_RADIUS) {
                  const dmg = Math.round(180 * (1 - ed / (BLAST_RADIUS * 1.3)));
                  const res = state.damageEnemy(e.id, dmg, true);
                  if (res.destroyed) {
                    this.spawnExplosionParticles(e.x, e.y, '#FB923C', 28);
                  }
                }
              }
              const worldEscorts = useGameStore.getState().world.escorts || [];
              for (const esc of worldEscorts) {
                if (esc.owner === 'ENEMY') {
                  if (Math.abs(esc.x - newX) > halfVw + 30 || Math.abs(esc.y - newY) > halfVh + 30) continue;
                  const ed = Math.hypot(proj.x - esc.x, proj.y - esc.y);
                  if (ed < BLAST_RADIUS) {
                    const dmg = Math.round(180 * (1 - ed / (BLAST_RADIUS * 1.3)));
                    const res = state.damageEscort(esc.id, dmg);
                    if (res.destroyed) {
                      this.spawnExplosionParticles(esc.x, esc.y, '#FB923C', 22);
                    }
                  }
                }
              }
              for (const ast of world.asteroids) {
                if (Math.abs(ast.x - newX) > halfVw + ast.radius + 15 || Math.abs(ast.y - newY) > halfVh + ast.radius + 15) continue;
                const ad = Math.hypot(proj.x - ast.x, proj.y - ast.y);
                if (ad < BLAST_RADIUS + ast.radius) {
                  state.damageAsteroid(ast.id, 140);
                }
              }
            } else {
              const res = state.damageEnemy(enemy.id, proj.damage, false);
              if (res.destroyed) {
                this.spawnExplosionParticles(enemy.x, enemy.y, '#FB923C', 28);
              } else {
                this.spawnExplosionParticles(proj.x, proj.y, proj.color || '#00F0FF', 14);
              }
            }
            proj.lifetime = 0; // Destroy projectile
            break;
          }
        }
        if (proj.lifetime <= 0) continue;

        // B. Check hits on enemy escorts (Strictly on-screen)
        const currentWorldEscorts = useGameStore.getState().world.escorts || [];
        for (const esc of currentWorldEscorts) {
          if (esc.owner !== 'ENEMY') continue;
          const isEscOnScreen = Math.abs(esc.x - newX) <= halfVw + 30 && Math.abs(esc.y - newY) <= halfVh + 30;
          if (!isEscOnScreen) continue;

          const escHl = esc.type === 'RONIN_WARMASTER' ? 24 : esc.type === 'GUNSHIP' || esc.type === 'MISSILE_CRUISER' ? 18 : 14;
          const escHw = esc.type === 'RONIN_WARMASTER' ? 18 : esc.type === 'GUNSHIP' || esc.type === 'SHIELD_PROJECTOR' ? 14 : 10;
          const escBox: OrientedBox = { halfLength: escHl, halfWidth: escHw, forwardOffset: 0 };
          const margin = proj.type === 'TORPEDO' ? 26 : (proj.radius || 4);

          if (isPointInOrientedBox(proj.x, proj.y, esc.x, esc.y, esc.rotation, escBox, margin)) {
            if (proj.type === 'TORPEDO') {
              SoundManager.playExplosion();
              this.spawnExplosionParticles(proj.x, proj.y, '#FB923C', 32);
              const BLAST_RADIUS = 130;
              for (const e of currentEnemies) {
                if (Math.abs(e.x - newX) > halfVw + 30 || Math.abs(e.y - newY) > halfVh + 30) continue;
                const ed = Math.hypot(proj.x - e.x, proj.y - e.y);
                if (ed < BLAST_RADIUS) {
                  const dmg = Math.round(180 * (1 - ed / (BLAST_RADIUS * 1.3)));
                  const res = state.damageEnemy(e.id, dmg, true);
                  if (res.destroyed) {
                    this.spawnExplosionParticles(e.x, e.y, '#FB923C', 28);
                  }
                }
              }
              for (const otherEsc of currentWorldEscorts) {
                if (otherEsc.owner === 'ENEMY') {
                  if (Math.abs(otherEsc.x - newX) > halfVw + 30 || Math.abs(otherEsc.y - newY) > halfVh + 30) continue;
                  const ed = Math.hypot(proj.x - otherEsc.x, proj.y - otherEsc.y);
                  if (ed < BLAST_RADIUS) {
                    const dmg = Math.round(180 * (1 - ed / (BLAST_RADIUS * 1.3)));
                    const res = state.damageEscort(otherEsc.id, dmg);
                    if (res.destroyed) {
                      this.spawnExplosionParticles(otherEsc.x, otherEsc.y, '#FB923C', 22);
                    }
                  }
                }
              }
            } else {
              const res = state.damageEscort(esc.id, proj.damage);
              if (res.destroyed) {
                this.spawnExplosionParticles(esc.x, esc.y, '#FB923C', 22);
              } else {
                this.spawnExplosionParticles(proj.x, proj.y, proj.color || '#00F0FF', 10);
              }
            }
            proj.lifetime = 0;
            break;
          }
        }
        if (proj.lifetime <= 0) continue;

        // C. Check hits on asteroids (Strictly on-screen)
        for (const ast of world.asteroids) {
          const isAstOnScreen = Math.abs(ast.x - newX) <= halfVw + ast.radius + 15 && Math.abs(ast.y - newY) <= halfVh + ast.radius + 15;
          if (!isAstOnScreen) continue;

          const dist = Math.hypot(proj.x - ast.x, proj.y - ast.y);
          if (dist < ast.radius) {
            if (proj.type === 'TORPEDO') {
              SoundManager.playExplosion();
              this.spawnExplosionParticles(proj.x, proj.y, '#FB923C', 30);
              const BLAST_RADIUS = 110;
              for (const a of world.asteroids) {
                if (Math.abs(a.x - newX) > halfVw + a.radius + 15 || Math.abs(a.y - newY) > halfVh + a.radius + 15) continue;
                const ad = Math.hypot(proj.x - a.x, proj.y - a.y);
                if (ad < BLAST_RADIUS + a.radius) {
                  state.damageAsteroid(a.id, 140);
                }
              }
              for (const e of currentEnemies) {
                if (Math.abs(e.x - newX) > halfVw + 30 || Math.abs(e.y - newY) > halfVh + 30) continue;
                const ed = Math.hypot(proj.x - e.x, proj.y - e.y);
                if (ed < BLAST_RADIUS) {
                  const res = state.damageEnemy(e.id, 120, true);
                  if (res.destroyed) {
                    this.spawnExplosionParticles(e.x, e.y, '#FB923C', 28);
                  }
                }
              }
              const worldEscorts = useGameStore.getState().world.escorts || [];
              for (const esc of worldEscorts) {
                if (esc.owner === 'ENEMY') {
                  if (Math.abs(esc.x - newX) > halfVw + 30 || Math.abs(esc.y - newY) > halfVh + 30) continue;
                  const ed = Math.hypot(proj.x - esc.x, proj.y - esc.y);
                  if (ed < BLAST_RADIUS) {
                    const dmg = Math.round(120 * (1 - ed / (BLAST_RADIUS * 1.3)));
                    const res = state.damageEscort(esc.id, dmg);
                    if (res.destroyed) {
                      this.spawnExplosionParticles(esc.x, esc.y, '#FB923C', 22);
                    }
                  }
                }
              }
            } else {
              // Standard lasers deal low chipping damage against dense asteroid crust
              state.damageAsteroid(ast.id, Math.max(1, Math.round(proj.damage * 0.35)));
              this.spawnExplosionParticles(proj.x, proj.y, '#F59E0B', 6);
            }
            proj.lifetime = 0;
            break;
          }
        }
      } else if (proj.owner === 'ENEMY') {
        // A. Check hits on player (Oriented hull & deflector shield bounding box with swept collision)
        const playerTier = ship.shipTier || 1;
        const playerScale = playerTier <= 22 ? 1.0 : Number((1.0 + (playerTier - 22) * 0.008).toFixed(2));
        const pBox = getPlayerBoundingBox(playerTier, playerScale);
        const margin = Math.max(16, (proj.radius || 4) + (ship.shield > 0 ? 14 : 6));

        const hitCurrent = isPointInOrientedBox(proj.x, proj.y, newX, newY, rot, pBox, margin);
        const hitMid = isPointInOrientedBox(proj.x - proj.vx * dt * 0.5, proj.y - proj.vy * dt * 0.5, newX, newY, rot, pBox, margin);

        if (hitCurrent || hitMid) {
          state.damagePlayer(proj.damage);
          proj.lifetime = 0;
          this.spawnExplosionParticles(proj.x, proj.y, '#FF3366', 12);
        } else {
          // B. Check hits on player escort fleet!
          const playerEscorts = (useGameStore.getState().world.escorts || []).filter((e) => e.owner === 'PLAYER');
          for (const esc of playerEscorts) {
            const escHl = esc.type === 'RONIN_WARMASTER' ? 24 : esc.type === 'GUNSHIP' || esc.type === 'MISSILE_CRUISER' ? 18 : 14;
            const escHw = esc.type === 'RONIN_WARMASTER' ? 18 : esc.type === 'GUNSHIP' || esc.type === 'SHIELD_PROJECTOR' ? 14 : 10;
            const escBox: OrientedBox = { halfLength: escHl, halfWidth: escHw, forwardOffset: 0 };
            const escMargin = Math.max(10, (proj.radius || 4) + (esc.shield > 0 ? 8 : 4));

            if (
              isPointInOrientedBox(proj.x, proj.y, esc.x, esc.y, esc.rotation, escBox, escMargin) ||
              isPointInOrientedBox(proj.x - proj.vx * dt * 0.5, proj.y - proj.vy * dt * 0.5, esc.x, esc.y, esc.rotation, escBox, escMargin)
            ) {
              const res = state.damageEscort(esc.id, proj.damage);
              if (res.destroyed) {
                this.spawnExplosionParticles(esc.x, esc.y, '#34D399', 22);
              } else {
                this.spawnExplosionParticles(proj.x, proj.y, '#34D399', 10);
              }
              proj.lifetime = 0;
              break;
            }
          }
        }
      }
    }

    // 7. Enemy AI & Projectiles (Spatial Culling: only simulate active hostiles in player vicinity, max 10)
    let isAnyEnemyEngaged = false;
    const allEnemies = useGameStore.getState().world.enemies;
    const MAX_ACTIVE_DIST_SQ = 3200 * 3200;
    const simMap = new Map<string, Partial<Enemy>>();

    const survivingEnemies = allEnemies
      .filter((e) => {
        const dx = newX - e.x;
        const dy = newY - e.y;
        return dx * dx + dy * dy < MAX_ACTIVE_DIST_SQ;
      })
      .slice(0, 10);

    for (let index = 0; index < survivingEnemies.length; index++) {
      const enemy = survivingEnemies[index];
      const pdx = newX - enemy.x;
      const pdy = newY - enemy.y;
      const distToPlayer = Math.hypot(pdx, pdy);
      let enemyRot = enemy.rotation;
      let evx = enemy.vx;
      let evy = enemy.vy;
      let fireCooldown = (enemy.fireCooldown || 0) - dt;

      // Check EMP stun timer
      const currentStun = Math.max(0, (enemy.stunDuration || 0) - dt);
      if (currentStun > 0) {
        // Stunned: decelerate to a halt, skip aiming and firing
        evx *= Math.max(0, 1 - 4 * dt);
        evy *= Math.max(0, 1 - 4 * dt);

        if (Math.random() < 0.35) {
          const sparkAngle = Math.random() * Math.PI * 2;
          this.particles.push({
            x: enemy.x + (Math.random() - 0.5) * 26 * (enemy.scale || 1.0),
            y: enemy.y + (Math.random() - 0.5) * 26 * (enemy.scale || 1.0),
            vx: Math.cos(sparkAngle) * (40 + Math.random() * 40),
            vy: Math.sin(sparkAngle) * (40 + Math.random() * 40),
            color: Math.random() < 0.6 ? '#00F0FF' : '#C084FC',
            size: 1.5 + Math.random() * 1.5,
            alpha: 0.85,
            lifetime: 0.2,
            maxLifetime: 0.2,
          });
        }

        const nx = enemy.x + evx * dt;
        const ny = enemy.y + evy * dt;
        simMap.set(enemy.id, {
          x: Number.isFinite(nx) ? nx : enemy.x,
          y: Number.isFinite(ny) ? ny : enemy.y,
          vx: Number.isFinite(evx) ? evx : 0,
          vy: Number.isFinite(evy) ? evy : 0,
          rotation: enemyRot,
          fireCooldown,
          stunDuration: currentStun,
        });
        continue;
      }

      // Determine if enemy is aggroed / alerted
      let isAggroed = Boolean(enemy.isAggroed || (enemy.aggroTimer !== undefined && enemy.aggroTimer > 0) || distToPlayer < enemy.aggroDistance);
      let aggroTimer = enemy.aggroTimer || 0;

      // If damaged (hull or shields lower than max), automatically aggro and retaliate
      if (enemy.hull < (enemy.maxHull || 100) || (enemy.maxShield > 0 && enemy.shield < enemy.maxShield)) {
        isAggroed = true;
        aggroTimer = Math.max(aggroTimer, 25);
      }

      // Dynamic calculation of 2 screen lengths
      const screenDiag = Math.hypot(this.canvas.width, this.canvas.height) / (this.currentZoom || 1.0);
      const twoScreensDist = Math.max(3200, screenDiag * 2.0);

      // If player is within natural detection range, stay aggroed
      if (distToPlayer < enemy.aggroDistance) {
        isAggroed = true;
        aggroTimer = Math.max(aggroTimer, 18);
      } else if (isAggroed) {
        // Chase player continuously unless player gets more than 2 screens away
        if (distToPlayer > twoScreensDist) {
          isAggroed = false;
          aggroTimer = 0;
        } else {
          aggroTimer = Math.max(0, aggroTimer - dt);
          if (aggroTimer <= 0 && distToPlayer > screenDiag * 1.5) {
            isAggroed = false;
          }
        }
      }

      if (isAggroed) {
        isAnyEnemyEngaged = true;

        // Alert nearby squadmates within 850px so they join the attack
        for (let sIdx = 0; sIdx < survivingEnemies.length; sIdx++) {
          const squadMate = survivingEnemies[sIdx];
          if (squadMate.id !== enemy.id && !squadMate.isAggroed) {
            const squadDist = Math.hypot(squadMate.x - enemy.x, squadMate.y - enemy.y);
            if (squadDist < 850) {
              squadMate.isAggroed = true;
              squadMate.aggroTimer = Math.max(squadMate.aggroTimer || 0, 20);
            }
          }
        }

        // 1. Aim towards player with smooth turning
        const targetAngle = Math.atan2(newY - enemy.y, newX - enemy.x);
        const angleDiff = Math.atan2(Math.sin(targetAngle - enemyRot), Math.cos(targetAngle - enemyRot));
        const turnSpeed = enemy.type === 'PIRATE_SCOUT' ? 4.2 : 2.8;
        enemyRot += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed * dt);

        // 2. Dogfighting tactics & engagement distance based on ship category
        const enemyCat = enemy.category || (enemy.type === 'OUTLAW_BOSS' ? 'BATTLESHIP' : enemy.type === 'RAIDER_CORVETTE' ? 'CRUISER' : 'SCOUT');
        const isCapital = enemyCat === 'COLOSSUS' || enemyCat === 'BATTLESHIP';
        const isCruiser = enemyCat === 'CRUISER';
        const isFrigate = enemyCat === 'FRIGATE';
        const isCorvette = enemyCat === 'CORVETTE';

        const minPlayerDist = playerHitRadius + Math.max(55, 38 * (enemy.scale || 1.0)) + 60;
        const preferredDist = Math.max(minPlayerDist + 80, isCapital ? 540 : isCruiser ? 440 : isFrigate ? 370 : isCorvette ? 310 : 260);
        
        // Enemy chase speed: up to 50% of the player's potential speed
        // Player speed is much higher so player can always outrun hostiles and disengage
        const playerTheoreticalTopSpeed = 220 + (ship.enginePower || 4) * 40 + (ship.engineLevel || 1) * 55;
        const playerCurrentSpeed = Math.hypot(vx, vy);
        const playerSpeedRef = Math.max(playerTheoreticalTopSpeed, playerCurrentSpeed);

        const speedRatio = isCapital ? 0.30 : isCruiser ? 0.35 : isFrigate ? 0.40 : isCorvette ? 0.45 : 0.50;
        const baseSpeed = Math.max(160, playerSpeedRef * speedRatio);

        // When far away, boost pursuit up to full 50% speed
        const interceptBoost = distToPlayer > preferredDist + 100 ? Math.min(1.25, 1.0 + (distToPlayer - preferredDist) / 400) : 1.0;
        const maxSpeed = Math.min(playerSpeedRef * 0.52, baseSpeed * interceptBoost);
        const accelRate = (isCapital ? 2.8 : isCruiser ? 3.4 : isFrigate ? 4.0 : 4.8) * (distToPlayer > preferredDist + 120 ? 1.3 : 1.0);

        // Strafe direction: alternate clockwise / counter-clockwise based on enemy index
        const strafeSign = (index % 2 === 0) ? 1 : -1;

        let desiredMoveAngle: number;
        let desiredSpeed: number;

        if (distToPlayer > preferredDist + 80) {
          desiredMoveAngle = targetAngle;
          desiredSpeed = maxSpeed;
        } else if (distToPlayer < preferredDist - 70) {
          desiredMoveAngle = targetAngle + Math.PI + strafeSign * 0.4;
          desiredSpeed = maxSpeed * 0.9;
        } else {
          desiredMoveAngle = targetAngle + (Math.PI / 2) * strafeSign;
          desiredSpeed = maxSpeed * 0.85;
        }

        // Smooth acceleration with inertia
        const desiredVx = Math.cos(desiredMoveAngle) * desiredSpeed;
        const desiredVy = Math.sin(desiredMoveAngle) * desiredSpeed;
        evx += (desiredVx - evx) * Math.min(1, accelRate * dt);
        evy += (desiredVy - evy) * Math.min(1, accelRate * dt);

        // 3. Collision avoidance & repulsion from player (scales with ship size)
        if (distToPlayer < minPlayerDist && distToPlayer > 0.1) {
          const pushAngle = Math.atan2(enemy.y - newY, enemy.x - newX);
          const pushForce = (minPlayerDist - distToPlayer) * 25;
          evx += Math.cos(pushAngle) * pushForce * dt;
          evy += Math.sin(pushAngle) * pushForce * dt;
        }

        // 4. Fast separation from other live enemies using squared distance
        for (let oIdx = 0; oIdx < survivingEnemies.length; oIdx++) {
          const other = survivingEnemies[oIdx];
          if (other.id !== enemy.id) {
            const dx = enemy.x - other.x;
            const dy = enemy.y - other.y;
            const distSq = dx * dx + dy * dy;
            const sepDist = Math.max(70, 35 * ((enemy.scale || 1.0) + (other.scale || 1.0)));
            if (distSq < sepDist * sepDist && distSq > 0.01) {
              const distToOther = Math.sqrt(distSq);
              const pushOtherAngle = Math.atan2(dy, dx);
              const pushOtherForce = (sepDist - distToOther) * 8;
              evx += Math.cos(pushOtherAngle) * pushOtherForce * dt;
              evy += Math.sin(pushOtherAngle) * pushOtherForce * dt;
            }
          }
        }

        // 4b. Velocity Clamp: prevent repulsive slingshots and velocity explosion off-screen
        const curEnemySpeed = Math.hypot(evx, evy);
        const maxAllowedSpeed = maxSpeed * 1.5;
        if (curEnemySpeed > maxAllowedSpeed && curEnemySpeed > 0.001) {
          evx = (evx / curEnemySpeed) * maxAllowedSpeed;
          evy = (evy / curEnemySpeed) * maxAllowedSpeed;
        }

        // 5. Predictive Aim & Fire Weapon (Retaliates immediately at long range when aggroed)
        const maxFireRange = isCapital ? 750 : isCruiser ? 680 : isFrigate ? 620 : 560;
        const laserSpeed = isCapital ? 620 : isCruiser ? 580 : 540;

        // Predictive target intercept calculation with slight natural aim variance
        const leadTime = Math.min(1.2, distToPlayer / laserSpeed);
        const predTargetX = newX + vx * leadTime * 0.75;
        const predTargetY = newY + vy * leadTime * 0.75;
        const fireAngle = Math.atan2(predTargetY - enemy.y, predTargetX - enemy.x);
        const aimDiff = Math.abs(Math.atan2(Math.sin(fireAngle - enemyRot), Math.cos(fireAngle - enemyRot)));
        const isFacingPlayer = aimDiff < 0.52;

        if (distToPlayer < maxFireRange && isFacingPlayer && fireCooldown <= 0) {
          fireCooldown = isCapital ? 2.2 : isCruiser ? 2.0 : isFrigate ? 1.9 : 1.7;

          const threatMult = enemy.threatLevel === 'STRONGER' ? 1.15 : enemy.threatLevel === 'WEAKER' ? 0.85 : 1.0;
          const { dmgMult } = getDifficultyMultipliers(state.difficulty || 'EASY');
          const boltDamage = Math.round((isCapital ? 8 : isCruiser ? 9 : isFrigate ? 8 : 7) * threatMult * dmgMult);
          const laserColor = enemy.threatColor || (enemy.threatLevel === 'STRONGER' ? '#EF4444' : enemy.threatLevel === 'WEAKER' ? '#FBBF24' : '#A855F7');
          const spread = (Math.random() - 0.5) * 0.08;
          const shotAngle = fireAngle + spread;
          const perp = shotAngle + Math.PI / 2;
          const projLifetime = Math.max(1.8, (distToPlayer + 220) / laserSpeed);

          if (isCapital) {
            // Quad heavy plasma battery salvo
            [-16, -6, 6, 16].forEach((off) => {
              state.addProjectile({
                id: `p_enemy_${Date.now()}_${Math.random()}`,
                owner: 'ENEMY',
                x: enemy.x + Math.cos(shotAngle) * 26 + Math.cos(perp) * off,
                y: enemy.y + Math.sin(shotAngle) * 26 + Math.sin(perp) * off,
                vx: Math.cos(shotAngle) * laserSpeed,
                vy: Math.sin(shotAngle) * laserSpeed,
                damage: boltDamage,
                lifetime: projLifetime,
                color: laserColor,
              });
            });

            // Occasional secondary torpedo launch only from apex capital battleships
            if (enemy.threatLevel === 'STRONGER' && Math.random() < 0.20 && distToPlayer < 650) {
              state.addProjectile({
                id: `p_enemy_torp_${Date.now()}_${Math.random()}`,
                owner: 'ENEMY',
                type: 'TORPEDO',
                x: enemy.x + Math.cos(shotAngle) * 28,
                y: enemy.y + Math.sin(shotAngle) * 28,
                vx: Math.cos(shotAngle) * 340,
                vy: Math.sin(shotAngle) * 340,
                damage: Math.round(32 * dmgMult),
                lifetime: Math.max(3.0, (distToPlayer + 200) / 340),
                color: '#A855F7',
              });
            }
          } else if (isCruiser || isFrigate) {
            // Twin plasma cannons
            [-12, 12].forEach((off) => {
              state.addProjectile({
                id: `p_enemy_${Date.now()}_${Math.random()}`,
                owner: 'ENEMY',
                x: enemy.x + Math.cos(shotAngle) * 22 + Math.cos(perp) * off,
                y: enemy.y + Math.sin(shotAngle) * 22 + Math.sin(perp) * off,
                vx: Math.cos(shotAngle) * laserSpeed,
                vy: Math.sin(shotAngle) * laserSpeed,
                damage: boltDamage,
                lifetime: projLifetime,
                color: laserColor,
              });
            });
          } else {
            // Scout / Corvette single bolt
            state.addProjectile({
              id: `p_enemy_${Date.now()}_${Math.random()}`,
              owner: 'ENEMY',
              x: enemy.x + Math.cos(shotAngle) * 18,
              y: enemy.y + Math.sin(shotAngle) * 18,
              vx: Math.cos(shotAngle) * laserSpeed,
              vy: Math.sin(shotAngle) * laserSpeed,
              damage: Math.round(boltDamage * 1.2),
              lifetime: projLifetime,
              color: laserColor,
            });
          }
          SoundManager.playLaser(true);
        }
      } else {
        // Un-aggroed sector patrol: smooth cruising
        const enemyCat = enemy.category || (enemy.type === 'OUTLAW_BOSS' ? 'BATTLESHIP' : enemy.type === 'RAIDER_CORVETTE' ? 'CRUISER' : 'SCOUT');
        const isCapital = enemyCat === 'COLOSSUS' || enemyCat === 'BATTLESHIP';
        const isCruiser = enemyCat === 'CRUISER';
        const isFrigate = enemyCat === 'FRIGATE';
        const patrolSpeed = isCapital ? 45 : isCruiser ? 60 : isFrigate ? 75 : 90;
        const patrolVx = Math.cos(enemyRot) * patrolSpeed;
        const patrolVy = Math.sin(enemyRot) * patrolSpeed;
        evx += (patrolVx - evx) * Math.min(1, 1.4 * dt);
        evy += (patrolVy - evy) * Math.min(1, 1.4 * dt);
      }

      // 6. Shield regeneration on capital and cruiser ships
      let newShield = enemy.shield;
      if (enemy.maxShield > 0 && enemy.shield < enemy.maxShield) {
        const rechargeRate = (enemy.maxShield / 18) * dt; // Regenerates full shield over 18s
        newShield = Math.min(enemy.maxShield, enemy.shield + rechargeRate);
      }

      // Smoke & fiery spark particles trailing from heavily damaged enemy hulls
      if (enemy.hull < (enemy.maxHull || 100) * 0.45 && Math.random() < 0.22) {
        const smokeAngle = enemyRot + Math.PI + (Math.random() - 0.5) * 0.8;
        this.particles.push({
          x: enemy.x + (Math.random() - 0.5) * 16,
          y: enemy.y + (Math.random() - 0.5) * 16,
          vx: Math.cos(smokeAngle) * 35 + (Math.random() - 0.5) * 15,
          vy: Math.sin(smokeAngle) * 35 + (Math.random() - 0.5) * 15,
          color: Math.random() < 0.55 ? '#64748b' : (enemy.hull < (enemy.maxHull || 100) * 0.2 ? '#EF4444' : '#F97316'),
          size: 1.8 + Math.random() * 1.8,
          alpha: 0.65,
          lifetime: 0.35,
          maxLifetime: 0.35,
        });
      }

      // Safety check against NaN coordinates
      if (!Number.isFinite(evx) || !Number.isFinite(evy)) {
        evx = 0;
        evy = 0;
      }
      const nx = enemy.x + evx * dt;
      const ny = enemy.y + evy * dt;

      simMap.set(enemy.id, {
        x: Number.isFinite(nx) ? nx : enemy.x,
        y: Number.isFinite(ny) ? ny : enemy.y,
        vx: evx,
        vy: evy,
        rotation: enemyRot,
        fireCooldown,
        shield: newShield,
        stunDuration: 0,
        isAggroed,
        aggroTimer,
      });
    }

    // Merge simulation back into latest state without overwriting HP/Shields damaged this frame
    const currentEnemiesState = useGameStore.getState().world.enemies;
    const mergedEnemies = currentEnemiesState.map((e) => {
      const sim = simMap.get(e.id);
      return sim ? { ...e, ...sim } : e;
    });

    state.updateEnemies(mergedEnemies);
    state.setCombatAlert(isAnyEnemyEngaged);

    // Reinforce enemy patrol waves when count drops low
    if (mergedEnemies.length < 3) {
      state.spawnEnemyWave();
    }

    // 8. Floating Loot Magnet & Pickup (Player & Player Escorts)
    // Scale tractor beam range and magnetic pull strength proportionally as the ship grows larger
    const tierTractorScale = 1.0 + (playerTier - 1) * 0.05; // +5% range & pull per tier
    const TRACTOR_RANGE = 220 * tierTractorScale;
    const PICKUP_RANGE = 44 * (1.0 + (playerTier - 1) * 0.035);
    const ESCORT_TRACTOR_RANGE = 320;
    const ESCORT_PICKUP_RANGE = 50;

    const floatingLoots = world.floatingLoot || [];
    let hasExpiredLoot = false;
    const livePlayerEscorts = (world.escorts || []).filter((e) => e.owner === 'PLAYER' && e.hull > 0);

    for (const loot of floatingLoots) {
      if (!loot) continue;
      const lx = loot.x ?? 0;
      const ly = loot.y ?? 0;

      // Calculate distance to player
      const distToPlayer = Math.hypot(newX - lx, newY - ly);
      let closestDist = distToPlayer;
      let targetPullX = newX;
      let targetPullY = newY;
      let isEscortCollecting = false;
      let activeCollector: EscortShip | null = null;
      let isMiningBargeCollector = false;

      // Check distance to all player escorts (Mining barges have high-efficiency 750px vacuum tractor field for all loot)
      for (const esc of livePlayerEscorts) {
        const dEsc = Math.hypot(esc.x - lx, esc.y - ly);
        const isBarge = esc.type === 'MINING_BARGE';
        const effectiveTractor = isBarge ? 750 : ESCORT_TRACTOR_RANGE;

        if (dEsc < effectiveTractor && dEsc < closestDist) {
          closestDist = dEsc;
          targetPullX = esc.x;
          targetPullY = esc.y;
          isEscortCollecting = true;
          activeCollector = esc;
          isMiningBargeCollector = isBarge;
        }
      }

      const activeTractorRange = isMiningBargeCollector ? 750 : isEscortCollecting ? ESCORT_TRACTOR_RANGE : TRACTOR_RANGE;
      if (closestDist < activeTractorRange && closestDist > 0.001) {
        // Magnetic tractor beam pull (stronger gravity pull as ship gets larger)
        const pullAngle = Math.atan2(targetPullY - ly, targetPullX - lx);
        const basePullSpeed = isMiningBargeCollector ? 550 : isEscortCollecting ? 320 : 270 * tierTractorScale;
        const pullSpeed = basePullSpeed * Math.min(3.5, 1.3 - (closestDist / activeTractorRange) * 0.4);
        loot.vx = (loot.vx || 0) + Math.cos(pullAngle) * pullSpeed * dt;
        loot.vy = (loot.vy || 0) + Math.sin(pullAngle) * pullSpeed * dt;

        // Visual collection tractor particle stream towards collector
        if (isEscortCollecting && Math.random() < 0.28) {
          this.particles.push({
            x: lx + (Math.random() - 0.5) * 6,
            y: ly + (Math.random() - 0.5) * 6,
            vx: Math.cos(pullAngle) * 110,
            vy: Math.sin(pullAngle) * 110,
            color: isMiningBargeCollector ? '#06B6D4' : '#34D399',
            size: 1.6,
            alpha: 0.85,
            lifetime: 0.2,
            maxLifetime: 0.2,
          });
        }
      }
      loot.vx = (loot.vx || 0) * 0.98;
      loot.vy = (loot.vy || 0) * 0.98;
      loot.x = lx + loot.vx * dt;
      loot.y = ly + loot.vy * dt;
      loot.lifetime = (loot.lifetime ?? 50) - dt;

      if (loot.lifetime <= 0) {
        hasExpiredLoot = true;
      }

      // Pickup if close to player OR any player escort
      const activePickupRange = isEscortCollecting ? ESCORT_PICKUP_RANGE : PICKUP_RANGE;
      if (closestDist < activePickupRange) {
        const collected = state.collectLoot(loot.id);
        if (collected) {
          const fxColor =
            loot.lootType === 'CREDITS'
              ? '#FBBF24'
              : loot.lootType === 'MISSILES'
              ? '#F97316'
              : loot.lootType === 'FUEL'
              ? '#A855F7'
              : loot.lootType === 'REPAIR'
              ? '#10B981'
              : '#00F0FF';
          const burstX = isEscortCollecting && activeCollector ? activeCollector.x : loot.x;
          const burstY = isEscortCollecting && activeCollector ? activeCollector.y : loot.y;
          this.spawnExplosionParticles(burstX, burstY, fxColor, 8);
        }
      }
    }

    // Clean up expired floating loot pods
    if (hasExpiredLoot && floatingLoots.length > 0) {
      useGameStore.setState((s) => ({
        world: {
          ...s.world,
          floatingLoot: (s.world.floatingLoot || []).filter((l) => l.lifetime > 0),
        },
      }));
    }

    // 9. Update particles in-place with zero GC heap allocations (capped to 75 max)
    let pWrite = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.lifetime -= dt;
      if (p.lifetime > 0) {
        p.alpha = Math.max(0, p.lifetime / p.maxLifetime);
        this.particles[pWrite++] = p;
      }
    }
    this.particles.length = Math.min(pWrite, 50);

    // 10. Endless Universe & Clusters Check (Throttled: check only when player moves > 300 units)
    if (Math.hypot(newX - this.lastClusterCheckX, newY - this.lastClusterCheckY) > 300) {
      this.lastClusterCheckX = newX;
      this.lastClusterCheckY = newY;
      state.checkAndGenerateClusters(newX, newY);
    }

    // 11. HyperJump Progress
    state.updateHyperJump(dt);

    // 12. Orbiting Combat Defense Drones Simulation (Flying escort wingmen)
    const worldDrones = world.drones || [];
    if (worldDrones.length > 0) {
      const liveEnemies = useGameStore.getState().world.enemies;

      const updatedDrones = worldDrones
        .map((drone) => {
          // Orbit smoothly around player's current position
          const nAngle = drone.orbitAngle + drone.orbitSpeed * dt;
          const targetX = newX + Math.cos(nAngle) * drone.orbitRadius;
          const targetY = newY + Math.sin(nAngle) * drone.orbitRadius;
          const nCooldown = Math.max(0, drone.fireCooldown - dt);
          const nLifetime = drone.lifetime - dt;
          const droneRot = nAngle + Math.PI / 2;

          // B. Auto-fire micro-pulse laser at nearest hostile within 480 units
          if (nCooldown <= 0 && liveEnemies.length > 0) {
            let nearestEnemy: Enemy | null = null;
            let minDist = 480;
            for (const en of liveEnemies) {
              const isEnOnScreen = Math.abs(en.x - newX) <= halfVw + 30 && Math.abs(en.y - newY) <= halfVh + 30;
              if (!isEnOnScreen) continue;
              const d = Math.hypot(en.x - targetX, en.y - targetY);
              if (d < minDist) {
                minDist = d;
                nearestEnemy = en;
              }
            }

            if (nearestEnemy) {
              const aimAngle = Math.atan2(nearestEnemy.y - targetY, nearestEnemy.x - targetX);
              state.addProjectile({
                id: `p_drone_${Date.now()}_${Math.random()}`,
                owner: 'PLAYER',
                type: 'LASER',
                x: targetX + Math.cos(aimAngle) * 12,
                y: targetY + Math.sin(aimAngle) * 12,
                vx: vx + Math.cos(aimAngle) * 880,
                vy: vy + Math.sin(aimAngle) * 880,
                damage: 35, // Escort combat fire!
                lifetime: 1.4,
                color: '#10B981',
              });
              SoundManager.playLaser(false);
              return {
                ...drone,
                orbitAngle: nAngle,
                x: targetX,
                y: targetY,
                rotation: droneRot,
                fireCooldown: 0.45,
                lifetime: nLifetime,
              };
            }
          }

          return {
            ...drone,
            orbitAngle: nAngle,
            x: targetX,
            y: targetY,
            rotation: droneRot,
            fireCooldown: nCooldown,
            lifetime: nLifetime,
          };
        })
        .filter((d) => d.lifetime > 0);

      state.updateWorldDrones(updatedDrones);
    }

    // 12b. Auto-Targeting Continuous Phaser Beam Lance (Player & Enemies)
    this.phaserAudioCooldown = Math.max(0, this.phaserAudioCooldown - dt);
    this.playerBeamTarget = null;
    this.enemyBeamActive.clear();

    const liveEnemiesForBeam = useGameStore.getState().world.enemies;
    const currentWorldEscorts = world.escorts || [];

    if (ship.hasBeamWeapon) {
      let closestTarget: { x: number; y: number; id: string; isEscort: boolean } | null = null;
      let closestDist = 620;

      for (const e of liveEnemiesForBeam) {
        const isEnOnScreen = Math.abs(e.x - newX) <= halfVw + 30 && Math.abs(e.y - newY) <= halfVh + 30;
        if (!isEnOnScreen) continue;
        const d = Math.hypot(e.x - newX, e.y - newY);
        if (d < closestDist) {
          closestDist = d;
          closestTarget = { x: e.x, y: e.y, id: e.id, isEscort: false };
        }
      }

      for (const esc of currentWorldEscorts) {
        if (esc.owner === 'ENEMY') {
          const isEscOnScreen = Math.abs(esc.x - newX) <= halfVw + 30 && Math.abs(esc.y - newY) <= halfVh + 30;
          if (!isEscOnScreen) continue;
          const d = Math.hypot(esc.x - newX, esc.y - newY);
          if (d < closestDist) {
            closestDist = d;
            closestTarget = { x: esc.x, y: esc.y, id: esc.id, isEscort: true };
          }
        }
      }

      if (closestTarget) {
        this.playerBeamTarget = closestTarget;
        this.lastTargetedEnemyId = closestTarget.id;
        const beamDps = 145 * (1 + (ship.weaponPower || 3) * 0.15);
        this.playerBeamDamageAccumulator += beamDps * dt;
        this.playerBeamDamageTimer += dt;

        if (this.playerBeamDamageTimer >= 0.12) {
          if (closestTarget.isEscort) {
            state.damageEscort(closestTarget.id, this.playerBeamDamageAccumulator);
          } else {
            state.damageEnemy(closestTarget.id, this.playerBeamDamageAccumulator, false);
          }
          this.playerBeamDamageAccumulator = 0;
          this.playerBeamDamageTimer = 0;
        }

        // Impact spark particles on target
        if (Math.random() < 0.6) {
          const sparkAngle = Math.random() * Math.PI * 2;
          this.particles.push({
            x: closestTarget.x + (Math.random() - 0.5) * 16,
            y: closestTarget.y + (Math.random() - 0.5) * 16,
            vx: Math.cos(sparkAngle) * (60 + Math.random() * 80),
            vy: Math.sin(sparkAngle) * (60 + Math.random() * 80),
            color: Math.random() < 0.5 ? '#00F0FF' : '#38BDF8',
            size: 1.5 + Math.random() * 2,
            alpha: 0.9,
            lifetime: 0.25,
            maxLifetime: 0.25,
          });
        }

        if (this.phaserAudioCooldown <= 0) {
          SoundManager.playLaser(true);
          this.phaserAudioCooldown = 0.35;
        }
      } else {
        this.playerBeamDamageAccumulator = 0;
        this.playerBeamDamageTimer = 0;
      }
    } else {
      this.playerBeamDamageAccumulator = 0;
      this.playerBeamDamageTimer = 0;
    }

    // Enemy Heavy Beam Weapons (Disabled if stunned)
    let anyEnemyBeamFiring = false;
    const { dmgMult: beamDmgMult } = getDifficultyMultipliers(state.difficulty || 'EASY');
    for (const en of liveEnemiesForBeam) {
      if (en.hasBeamWeapon && (!en.stunDuration || en.stunDuration <= 0)) {
        const d = Math.hypot(newX - en.x, newY - en.y);
        if (d < 450) {
          anyEnemyBeamFiring = true;
          this.enemyBeamActive.add(en.id);
          this.enemyBeamDamageAccumulator += 10 * beamDmgMult * dt;

          if (Math.random() < 0.3) {
            const sparkAngle = Math.random() * Math.PI * 2;
            this.particles.push({
              x: newX + (Math.random() - 0.5) * 18,
              y: newY + (Math.random() - 0.5) * 18,
              vx: Math.cos(sparkAngle) * 70,
              vy: Math.sin(sparkAngle) * 70,
              color: en.threatColor || '#A855F7',
              size: 2,
              alpha: 0.9,
              lifetime: 0.22,
              maxLifetime: 0.22,
            });
          }
        }
      }
    }

    if (anyEnemyBeamFiring) {
      this.enemyBeamDamageTimer += dt;
      if (this.enemyBeamDamageTimer >= 0.12) {
        state.damagePlayer(this.enemyBeamDamageAccumulator);
        this.enemyBeamDamageAccumulator = 0;
        this.enemyBeamDamageTimer = 0;
      }
    } else {
      this.enemyBeamDamageAccumulator = 0;
      this.enemyBeamDamageTimer = 0;
    }

    // 12c. Escort Armada Fleet Simulation (Autonomous wingmen)
    const playerTierVal = ship.shipTier || 1;
    const playerScaleVal = playerTierVal <= 22 ? 1.0 : Number((1.0 + (playerTierVal - 22) * 0.008).toFixed(2));
    const armadaStance = ship.armadaStance || 'DEFEND';
    const enemyProjsForEscort = useGameStore.getState().world.projectiles.filter((p) => p.owner === 'ENEMY');

    // Dynamic speed matching: escorts match and exceed player speeds to prevent falling behind
    const playerSpeed = Math.hypot(vx, vy);
    const playerMaxTheoreticalSpeed = 220 + (ship.enginePower || 4) * 40 + (ship.engineLevel || 1) * 55;
    const escortBaseSpeed = Math.max(400, playerMaxTheoreticalSpeed * 1.35);

    // Use current active world escorts as the source of truth
    const allEscorts: EscortShip[] = (world.escorts || []).filter((e) => e.hull > 0);

    const updatedWorldEscorts: EscortShip[] = [];
    const enemyMap = new Map(liveEnemiesForBeam.map((e) => [e.id, e]));
    const liveEnemyEscorts = allEscorts.filter((e) => e.owner === 'ENEMY');

    for (let eIdx = 0; eIdx < allEscorts.length; eIdx++) {
      const escort = allEscorts[eIdx];
      let ex = escort.x;
      let ey = escort.y;
      let evx = escort.vx;
      let evy = escort.vy;
      let erot = escort.rotation;
      let fireCd = Math.max(0, escort.fireCooldown - dt);
      let currentMiningTargetId: string | null = null;

      // Check EMP stun on escort ship
      const escortStun = Math.max(0, (escort.stunDuration || 0) - dt);
      if (escortStun > 0) {
        evx *= Math.max(0, 1 - 4 * dt);
        evy *= Math.max(0, 1 - 4 * dt);

        if (Math.random() < 0.3) {
          const sparkAngle = Math.random() * Math.PI * 2;
          this.particles.push({
            x: ex + (Math.random() - 0.5) * 14,
            y: ey + (Math.random() - 0.5) * 14,
            vx: Math.cos(sparkAngle) * 35,
            vy: Math.sin(sparkAngle) * 35,
            color: '#00F0FF',
            size: 1.2,
            alpha: 0.8,
            lifetime: 0.18,
            maxLifetime: 0.18,
          });
        }

        ex += evx * dt;
        ey += evy * dt;
        if (escort.hull > 0) {
          updatedWorldEscorts.push({
            ...escort,
            x: ex,
            y: ey,
            vx: evx,
            vy: evy,
            rotation: erot,
            fireCooldown: fireCd,
            stunDuration: escortStun,
          });
        }
        continue;
      }

      if (escort.owner === 'PLAYER') {
        // === PLAYER ESCORT ===
        // Formation Slot Coordinates
        const formationRadius = 48 * playerScaleVal + escort.formationDist;
        const targetFormationAngle = rot + escort.formationAngle;
        const targetFormX = newX + Math.cos(targetFormationAngle) * formationRadius;
        const targetFormY = newY + Math.sin(targetFormationAngle) * formationRadius;
        const distToForm = Math.hypot(targetFormX - ex, targetFormY - ey);
        const distToPlayer = Math.hypot(newX - ex, newY - ey);

        // Dynamic viewport half-dimensions in world space
        const currentEngineZoom = Math.max(0.15, this.currentZoom);
        const halfVw = (this.canvas.width / 2) / currentEngineZoom;
        const halfVh = (this.canvas.height / 2) / currentEngineZoom;
        const screenDiag = Math.hypot(halfVw, halfVh);

        // Rubber-banding snapback if escort drifted more than 1 screen away from player
        const maxAllowedDistance = screenDiag + 200;
        if (distToPlayer > maxAllowedDistance) {
          ex = targetFormX;
          ey = targetFormY;
          evx = vx;
          evy = vy;
          // Spawn warp flash particles
          for (let i = 0; i < 12; i++) {
            const wAngle = (i / 12) * Math.PI * 2;
            this.particles.push({
              x: ex,
              y: ey,
              vx: Math.cos(wAngle) * 90,
              vy: Math.sin(wAngle) * 90,
              color: '#00F0FF',
              size: 2.2,
              alpha: 0.95,
              lifetime: 0.35,
              maxLifetime: 0.35,
            });
          }
        }

        // Catch-up multiplier so fleet never falls behind when player upgrades engines or boosts
        const catchupMultiplier = Math.min(3.6, 1.0 + distToForm / 90);
        const maxFollowSpeed = escortBaseSpeed * catchupMultiplier;
        const desiredFollowSpeed = Math.min(maxFollowSpeed, Math.max(playerSpeed * 1.3, distToForm * 5.8));
        const formMoveAngle = Math.atan2(targetFormY - ey, targetFormX - ex);

        // Specialty 1: Auto-Mining Barge (Follows player fleet, collects ANY visible loot on screen, and mines visible asteroids)
        if (escort.type === 'MINING_BARGE') {
          // 1. Priority A: Search for ALL visible floating loot pods on screen (Ore, Cargo, Credits, Missiles, Fuel, Repair)
          const floatingLoots = world.floatingLoot || [];
          const onScreenLoots = floatingLoots.filter((loot) =>
            Math.abs(loot.x - newX) <= halfVw + 120 && Math.abs(loot.y - newY) <= halfVh + 120
          );

          let nearestLoot: FloatingLoot | null = null;
          let minLootDist = Infinity;
          if (onScreenLoots.length > 0) {
            for (let lIdx = 0; lIdx < onScreenLoots.length; lIdx++) {
              const l = onScreenLoots[lIdx];
              const d = Math.hypot(l.x - ex, l.y - ey);
              if (d < minLootDist) {
                minLootDist = d;
                nearestLoot = l;
              }
            }
          }

          // 2. Priority B: Search for visible asteroids to mine if no loot is currently on screen
          let closestAst: Asteroid | null = null;
          let minAstDist = screenDiag + 80;
          if (!nearestLoot) {
            const liveAsteroids = world.asteroids || [];
            for (const ast of liveAsteroids) {
              if (ast.health > 0) {
                const isOnScreen = Math.abs(ast.x - newX) <= halfVw + 100 && Math.abs(ast.y - newY) <= halfVh + 100;
                if (isOnScreen) {
                  const dBarge = Math.hypot(ast.x - ex, ast.y - ey);
                  if (dBarge < minAstDist) {
                    minAstDist = dBarge;
                    closestAst = ast;
                  }
                }
              }
            }
          }

          if (nearestLoot) {
            // Actively navigate directly towards the floating loot pod to vacuum and collect it
            const lootAngle = Math.atan2(nearestLoot.y - ey, nearestLoot.x - ex);
            erot = lootAngle;
            const lootSeekSpeed = Math.min(maxFollowSpeed, Math.max(playerSpeed * 1.45, 420));
            evx += (Math.cos(lootAngle) * lootSeekSpeed - evx) * Math.min(1, 6.5 * dt);
            evy += (Math.sin(lootAngle) * lootSeekSpeed - evy) * Math.min(1, 6.5 * dt);

            // Instant collection when close to pod
            if (minLootDist < 70) {
              state.collectLoot(nearestLoot.id);
            }
          } else if (closestAst) {
            currentMiningTargetId = closestAst.id;
            const aimAngle = Math.atan2(closestAst.y - ey, closestAst.x - ex);
            erot = aimAngle;

            // Follow fleet formation position while actively firing mining laser
            evx += (Math.cos(formMoveAngle) * desiredFollowSpeed - evx) * Math.min(1, 5.0 * dt);
            evy += (Math.sin(formMoveAngle) * desiredFollowSpeed - evy) * Math.min(1, 5.0 * dt);

            // Apply mining damage to asteroid
            const miningDps = 130;
            state.damageAsteroid(closestAst.id, miningDps * dt);

            // Turquoise mining beam impact spark particles on asteroid
            if (Math.random() < 0.4) {
              const sparkAngle = Math.random() * Math.PI * 2;
              this.particles.push({
                x: closestAst.x + (Math.random() - 0.5) * 16,
                y: closestAst.y + (Math.random() - 0.5) * 16,
                vx: Math.cos(sparkAngle) * 60,
                vy: Math.sin(sparkAngle) * 60,
                color: '#06B6D4',
                size: 1.5,
                alpha: 0.85,
                lifetime: 0.2,
                maxLifetime: 0.2,
              });
            }
          } else {
            // Follow fleet formation position smoothly
            evx += (Math.cos(formMoveAngle) * desiredFollowSpeed - evx) * Math.min(1, 5.0 * dt);
            evy += (Math.sin(formMoveAngle) * desiredFollowSpeed - evy) * Math.min(1, 5.0 * dt);
            erot = rot;
          }
        }

        // Specialty 2: Shield Projector Dome (Neutralizes incoming enemy fire within 130px)
        if (escort.type === 'SHIELD_PROJECTOR') {
          for (const ep of enemyProjsForEscort) {
            if (ep.lifetime > 0) {
              const dp = Math.hypot(ep.x - ex, ep.y - ey);
              if (dp < 130) {
                ep.lifetime = 0;
                this.spawnExplosionParticles(ep.x, ep.y, '#00F0FF', 8);
              }
            }
          }
        }

        // Specialty 3: Nanite Repair Tender (Heals player and friendly fleet every 2.5s)
        if (escort.type === 'REPAIR_TENDER') {
          if (fireCd <= 0) {
            fireCd = 2.5;
            if (distToPlayer < 360) {
              useGameStore.setState((s) => ({
                player: { ...s.player, hull: Math.min(s.player.maxHull, s.player.hull + 15) },
                ship: { ...s.ship, shield: Math.min(s.ship.maxShield, s.ship.shield + 20) },
              }));
            }
            // Heal friendly escorts in range
            for (const otherEsc of allEscorts) {
              if (otherEsc.owner === 'PLAYER') {
                const distToOther = Math.hypot(otherEsc.x - ex, otherEsc.y - ey);
                if (distToOther < 360) {
                  otherEsc.hull = Math.min(otherEsc.maxHull, otherEsc.hull + 25);
                  otherEsc.shield = Math.min(otherEsc.maxShield, otherEsc.shield + 25);
                }
              }
            }
            // Healing pulse particles
            for (let i = 0; i < 8; i++) {
              const pulseAng = (i / 8) * Math.PI * 2;
              this.particles.push({
                x: ex,
                y: ey,
                vx: Math.cos(pulseAng) * 80,
                vy: Math.sin(pulseAng) * 80,
                color: '#10B981',
                size: 2.5,
                alpha: 0.9,
                lifetime: 0.35,
                maxLifetime: 0.35,
              });
            }
          }
        }

        // Standard Movement & Combat for Non-Mining Ships
        if (armadaStance === 'DEFEND' && escort.type !== 'MINING_BARGE') {
          // === DEFEND STANCE ===
          // Stay close in tight wingman formation around player, matching speed with catchup
          evx += (Math.cos(formMoveAngle) * desiredFollowSpeed - evx) * Math.min(1, 5.2 * dt);
          evy += (Math.sin(formMoveAngle) * desiredFollowSpeed - evy) * Math.min(1, 5.2 * dt);
          erot = rot;

          // Intercept enemy projectiles close to player/escort
          for (const ep of enemyProjsForEscort) {
            const dp = Math.hypot(ep.x - ex, ep.y - ey);
            if (dp < 160) {
              ep.lifetime = 0;
              this.spawnExplosionParticles(ep.x, ep.y, '#34D399', 8);
              SoundManager.playLaser(false);
              break;
            }
          }

          // Combat Firing in DEFEND stance: attack any enemy ship close by while staying in formation
          if (fireCd <= 0 && (liveEnemiesForBeam.length > 0 || liveEnemyEscorts.length > 0)) {
            let closeTarget: { x: number; y: number; id?: string } | null = null;
            let closeDist = 520;
            for (const en of liveEnemiesForBeam) {
              const d = Math.hypot(en.x - ex, en.y - ey);
              if (d < closeDist) {
                closeDist = d;
                closeTarget = { x: en.x, y: en.y, id: en.id };
              }
            }
            if (!closeTarget) {
              for (const ee of liveEnemyEscorts) {
                const d = Math.hypot(ee.x - ex, ee.y - ey);
                if (d < closeDist) {
                  closeDist = d;
                  closeTarget = { x: ee.x, y: ee.y, id: ee.id };
                }
              }
            }
            if (closeTarget) {
              const aimAngle = Math.atan2(closeTarget.y - ey, closeTarget.x - ex);

              if (escort.type === 'MISSILE_CRUISER') {
                // Specialty: Endless Photon Torpedo Salvos
                fireCd = 3.5;
                state.addProjectile({
                  id: `p_escort_torp_${Date.now()}_${Math.random()}`,
                  owner: 'PLAYER',
                  type: 'TORPEDO',
                  x: ex + Math.cos(aimAngle) * 16,
                  y: ey + Math.sin(aimAngle) * 16,
                  vx: evx + Math.cos(aimAngle) * 600,
                  vy: evy + Math.sin(aimAngle) * 600,
                  damage: 220,
                  lifetime: 3.8,
                  color: '#F97316',
                  targetEnemyId: closeTarget.id,
                });
                SoundManager.playTorpedoLaunch();
              } else if (escort.type !== 'SHIELD_PROJECTOR' && escort.type !== 'REPAIR_TENDER') {
                // Combat Warships
                const escortDmg =
                  escort.type === 'RONIN_WARMASTER' ? 550 :
                  escort.type === 'BATTLECRUISER' ? 260 :
                  escort.type === 'DESTROYER' ? 130 :
                  escort.type === 'FRIGATE' ? 62 :
                  escort.type === 'GUNSHIP' ? 38 : 26;

                const escortCol =
                  escort.type === 'RONIN_WARMASTER' ? '#FFDD00' :
                  escort.type === 'BATTLECRUISER' ? '#EC4899' :
                  escort.type === 'DESTROYER' ? '#A855F7' :
                  escort.type === 'FRIGATE' ? '#38BDF8' :
                  escort.type === 'GUNSHIP' ? '#FBBF24' : '#34D399';

                fireCd = escort.type === 'RONIN_WARMASTER' ? 0.18 :
                         escort.type === 'BATTLECRUISER' ? 0.25 :
                         escort.type === 'DESTROYER' ? 0.32 :
                         escort.type === 'FRIGATE' ? 0.36 :
                         escort.type === 'GUNSHIP' ? 0.30 : 0.22;

                state.addProjectile({
                  id: `p_escort_${Date.now()}_${Math.random()}`,
                  owner: 'PLAYER',
                  type: 'LASER',
                  x: ex + Math.cos(aimAngle) * 14,
                  y: ey + Math.sin(aimAngle) * 14,
                  vx: evx + Math.cos(aimAngle) * 920,
                  vy: evy + Math.sin(aimAngle) * 920,
                  damage: escortDmg,
                  lifetime: 1.6,
                  color: escortCol,
                });
                SoundManager.playLaser(false);
              }
            }
          }
        } else if (armadaStance === 'ATTACK' && escort.type !== 'MINING_BARGE') {
          // === ATTACK STANCE ===
          // Focus fire on whatever enemy ship the player last targeted
          let targetEnemy: { x: number; y: number; id?: string } | null = null;

          if (this.lastTargetedEnemyId) {
            const targetedEnemy = enemyMap.get(this.lastTargetedEnemyId);
            if (targetedEnemy && targetedEnemy.hull > 0) {
              const isTargetOnScreen = Math.abs(targetedEnemy.x - newX) <= halfVw + 40 && Math.abs(targetedEnemy.y - newY) <= halfVh + 40;
              if (isTargetOnScreen) {
                targetEnemy = { x: targetedEnemy.x, y: targetedEnemy.y, id: targetedEnemy.id };
              } else {
                this.lastTargetedEnemyId = null;
              }
            } else {
              this.lastTargetedEnemyId = null;
            }
          }

          if (!targetEnemy && this.playerBeamTarget) {
            targetEnemy = this.playerBeamTarget;
          }

          if (!targetEnemy) {
            // Fallback to closest on-screen enemy to player
            let minD = 1500;
            for (const en of liveEnemiesForBeam) {
              const isEnOnScreen = Math.abs(en.x - newX) <= halfVw + 30 && Math.abs(en.y - newY) <= halfVh + 30;
              if (!isEnOnScreen) continue;
              const d = Math.hypot(en.x - newX, en.y - newY);
              if (d < minD) {
                minD = d;
                targetEnemy = { x: en.x, y: en.y, id: en.id };
              }
            }
            if (!targetEnemy) {
              for (const ee of liveEnemyEscorts) {
                const isEeOnScreen = Math.abs(ee.x - newX) <= halfVw + 30 && Math.abs(ee.y - newY) <= halfVh + 30;
                if (!isEeOnScreen) continue;
                const d = Math.hypot(ee.x - newX, ee.y - newY);
                if (d < minD) {
                  minD = d;
                  targetEnemy = { x: ee.x, y: ee.y, id: ee.id };
                }
              }
            }
          }

          if (targetEnemy) {
            const distToEnemy = Math.hypot(targetEnemy.x - ex, targetEnemy.y - ey);
            const attackOffsetAngle = escort.formationAngle;
            const orbitDist = 190;
            const targetAttackX = targetEnemy.x + Math.cos(attackOffsetAngle) * orbitDist;
            const targetAttackY = targetEnemy.y + Math.sin(attackOffsetAngle) * orbitDist;

            const moveAngle = Math.atan2(targetAttackY - ey, targetAttackX - ex);
            const attackSpeed = Math.max(escortBaseSpeed * 1.1, playerSpeed * 1.3);
            evx += (Math.cos(moveAngle) * attackSpeed - evx) * Math.min(1, 4.8 * dt);
            evy += (Math.sin(moveAngle) * attackSpeed - evy) * Math.min(1, 4.8 * dt);

            // Aim at target enemy
            const aimAngle = Math.atan2(targetEnemy.y - ey, targetEnemy.x - ex);
            const rotDiff = Math.atan2(Math.sin(aimAngle - erot), Math.cos(aimAngle - erot));
            erot += Math.sign(rotDiff) * Math.min(Math.abs(rotDiff), 6.0 * dt);

            if (distToEnemy < 600 && Math.abs(rotDiff) < 0.6 && fireCd <= 0) {
              if (escort.type === 'MISSILE_CRUISER') {
                fireCd = 3.5;
                state.addProjectile({
                  id: `p_escort_torp_${Date.now()}_${Math.random()}`,
                  owner: 'PLAYER',
                  type: 'TORPEDO',
                  x: ex + Math.cos(erot) * 16,
                  y: ey + Math.sin(erot) * 16,
                  vx: evx + Math.cos(erot) * 620,
                  vy: evy + Math.sin(erot) * 620,
                  damage: 220,
                  lifetime: 3.8,
                  color: '#F97316',
                  targetEnemyId: targetEnemy.id,
                });
                SoundManager.playTorpedoLaunch();
              } else if (escort.type !== 'SHIELD_PROJECTOR' && escort.type !== 'REPAIR_TENDER') {
                const escortDmg =
                  escort.type === 'RONIN_WARMASTER' ? 550 :
                  escort.type === 'BATTLECRUISER' ? 260 :
                  escort.type === 'DESTROYER' ? 130 :
                  escort.type === 'FRIGATE' ? 62 :
                  escort.type === 'GUNSHIP' ? 42 : 28;

                const escortCol =
                  escort.type === 'RONIN_WARMASTER' ? '#FFDD00' :
                  escort.type === 'BATTLECRUISER' ? '#EC4899' :
                  escort.type === 'DESTROYER' ? '#A855F7' :
                  escort.type === 'FRIGATE' ? '#38BDF8' :
                  escort.type === 'GUNSHIP' ? '#FBBF24' : '#34D399';

                fireCd = escort.type === 'RONIN_WARMASTER' ? 0.18 :
                         escort.type === 'BATTLECRUISER' ? 0.25 :
                         escort.type === 'DESTROYER' ? 0.32 :
                         escort.type === 'FRIGATE' ? 0.36 :
                         escort.type === 'GUNSHIP' ? 0.30 : 0.22;

                state.addProjectile({
                  id: `p_escort_${Date.now()}_${Math.random()}`,
                  owner: 'PLAYER',
                  type: 'LASER',
                  x: ex + Math.cos(erot) * 14,
                  y: ey + Math.sin(erot) * 14,
                  vx: evx + Math.cos(erot) * 940,
                  vy: evy + Math.sin(erot) * 940,
                  damage: escortDmg,
                  lifetime: 1.6,
                  color: escortCol,
                });
                SoundManager.playLaser(false);
              }
            }
          } else {
            // No enemies: search for nearby floating loot pods to vacuum or return to formation
            let closestLoot: any = null;
            let minLootDist = 450;
            for (const l of floatingLoots) {
              const d = Math.hypot((l.x ?? 0) - ex, (l.y ?? 0) - ey);
              if (d < minLootDist) {
                minLootDist = d;
                closestLoot = l;
              }
            }

            if (closestLoot) {
              const lootAngle = Math.atan2((closestLoot.y ?? 0) - ey, (closestLoot.x ?? 0) - ex);
              evx += (Math.cos(lootAngle) * 300 - evx) * Math.min(1, 4.0 * dt);
              evy += (Math.sin(lootAngle) * 300 - evy) * Math.min(1, 4.0 * dt);
              erot = lootAngle;
            } else {
              // Return to formation with player
              evx += (Math.cos(formMoveAngle) * desiredFollowSpeed - evx) * Math.min(1, 4.8 * dt);
              evy += (Math.sin(formMoveAngle) * desiredFollowSpeed - evy) * Math.min(1, 4.8 * dt);
              erot = rot;
            }
          }
        }
      } else {
        // === ENEMY ESCORT ===
        const leader = escort.leaderId ? enemyMap.get(escort.leaderId) : null;
        if (leader) {
          const leaderFormAngle = leader.rotation + escort.formationAngle;
          const targetX = leader.x + Math.cos(leaderFormAngle) * escort.formationDist;
          const targetY = leader.y + Math.sin(leaderFormAngle) * escort.formationDist;
          const distToForm = Math.hypot(targetX - ex, targetY - ey);

          const moveAngle = Math.atan2(targetY - ey, targetX - ex);
          const leaderSpeed = Math.min(280, distToForm * 4.5);
          evx += (Math.cos(moveAngle) * leaderSpeed - evx) * Math.min(1, 3.5 * dt);
          evy += (Math.sin(moveAngle) * leaderSpeed - evy) * Math.min(1, 3.5 * dt);
          erot = leader.rotation;

          // If close to player, attack player!
          const distToPlayer = Math.hypot(newX - ex, newY - ey);
          if (distToPlayer < 460 && fireCd <= 0) {
            fireCd = 1.6;
            const aimAngle = Math.atan2(newY - ey, newX - ex);
            state.addProjectile({
              id: `p_eescort_${Date.now()}_${Math.random()}`,
              owner: 'ENEMY',
              type: 'LASER',
              x: ex + Math.cos(aimAngle) * 12,
              y: ey + Math.sin(aimAngle) * 12,
              vx: evx + Math.cos(aimAngle) * 620,
              vy: evy + Math.sin(aimAngle) * 620,
              damage: escort.type === 'GUNSHIP' ? 24 : 16,
              lifetime: 1.6,
              color: '#FF3366',
            });
          }
        } else {
          // Leader destroyed: swarm player directly
          const distToPlayer = Math.hypot(newX - ex, newY - ey);
          const moveAngle = Math.atan2(newY - ey, newX - ex);
          evx += (Math.cos(moveAngle) * 240 - evx) * Math.min(1, 3.0 * dt);
          evy += (Math.sin(moveAngle) * 240 - evy) * Math.min(1, 3.0 * dt);
          erot = moveAngle;

          if (distToPlayer < 420 && fireCd <= 0) {
            fireCd = 1.8;
            state.addProjectile({
              id: `p_eescort_${Date.now()}_${Math.random()}`,
              owner: 'ENEMY',
              type: 'LASER',
              x: ex + Math.cos(moveAngle) * 12,
              y: ey + Math.sin(moveAngle) * 12,
              vx: evx + Math.cos(moveAngle) * 620,
              vy: evy + Math.sin(moveAngle) * 620,
              damage: 18,
              lifetime: 1.6,
              color: '#FF3366',
            });
          }
        }
      }

      ex += evx * dt;
      ey += evy * dt;

      const escortSim: Partial<EscortShip> = {
        x: ex,
        y: ey,
        vx: evx,
        vy: evy,
        rotation: erot,
        fireCooldown: fireCd,
        miningTargetId: currentMiningTargetId,
        stunDuration: 0,
      };

      if (escort.hull > 0) {
        updatedWorldEscorts.push({
          ...escort,
          ...escortSim,
        });
      }
    }

    // Merge simulation back into latest state so any damage taken this frame is preserved
    const currentEscortsState = useGameStore.getState().world.escorts || [];
    const simEscortMap = new Map(updatedWorldEscorts.map((e) => [e.id, e]));
    const mergedWorldEscorts = currentEscortsState.map((esc) => {
      const sim = simEscortMap.get(esc.id);
      return sim
        ? {
            ...esc,
            x: sim.x,
            y: sim.y,
            vx: sim.vx,
            vy: sim.vy,
            rotation: sim.rotation,
            fireCooldown: sim.fireCooldown,
            miningTargetId: sim.miningTargetId,
            stunDuration: sim.stunDuration,
          }
        : esc;
    });

    state.updateWorldEscorts(mergedWorldEscorts);

    // 13. Update Points of Interest Lifetimes & Distances (Throttled to 4 Hz / every 0.25s)
    this.poiUpdateTimer += dt;
    if (this.poiUpdateTimer >= 0.25) {
      state.updatePointsOfInterest(this.poiUpdateTimer, newX, newY);
      this.poiUpdateTimer = 0;
    }

    // Commit physics updates
    state.updateShipPhysics({
      x: newX,
      y: newY,
      vx,
      vy,
      rotation: rot,
      isThrusting,
      isMining: this.miningActive,
      empCooldown: Math.max(0, (ship.empCooldown || 0) - dt),
      droneCooldown: Math.max(0, (ship.droneCooldown || 0) - dt),
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

  private spawnReverseThrusterParticles(x: number, y: number, rot: number) {
    const exhaustAngle = rot + (Math.random() - 0.5) * 0.6;
    const speed = 110 + Math.random() * 70;
    const colors = ['#00F0FF', '#38BDF8', '#E0F2FE'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    this.particles.push({
      x: x + Math.cos(rot) * 16,
      y: y + Math.sin(rot) * 16,
      vx: Math.cos(exhaustAngle) * speed,
      vy: Math.sin(exhaustAngle) * speed,
      color,
      size: 1.5 + Math.random() * 2,
      alpha: 1,
      lifetime: 0.25,
      maxLifetime: 0.25,
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
    if (!ship || !world) return;
    const theme = world.sector?.theme;

    ctx.clearRect(0, 0, width, height);

    // Deep space dark background
    ctx.fillStyle = theme?.backgroundColor || '#030712';
    ctx.fillRect(0, 0, width, height);

    const zoom = this.currentZoom;
    const effectiveVw = width / zoom;
    const effectiveVh = height / zoom;

    ctx.save();
    // Camera translation centered on player with smooth zoom
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-ship.x, -ship.y);

    // 0. Render Cosmic Nebulae
    this.renderNebulae(ctx, ship.x, ship.y, effectiveVw, effectiveVh, theme);

    // 1. Render Starfield
    this.renderStarfield(ctx, ship.x, ship.y, effectiveVw, effectiveVh, theme);

    // 2. Render Stations (Frustum culled)
    this.renderStations(ctx, world.stations || [], ship.x, ship.y, effectiveVw, effectiveVh);

    // 3. Render Asteroids (Frustum culled)
    this.renderAsteroids(ctx, world.asteroids || [], ship.x, ship.y, effectiveVw, effectiveVh);

    // 4. Render Floating Loot (Frustum culled)
    this.renderFloatingLoot(ctx, world.floatingLoot || [], ship.x, ship.y, effectiveVw, effectiveVh);

    // 5. Render Mining Beam
    if (this.miningActive && this.targetedAsteroid) {
      this.renderMiningBeam(ctx, ship.x, ship.y, this.targetedAsteroid.x, this.targetedAsteroid.y);
    }

    // 5b. Render Auto-Targeting Phaser Beams (Player & Enemies)
    this.renderPhaserBeams(ctx, ship, world.enemies || []);

    // 6. Render Enemies (Frustum culled)
    this.renderEnemies(ctx, world.enemies || [], ship.x, ship.y, effectiveVw, effectiveVh);

    // 7. Render Projectiles (Frustum culled)
    this.renderProjectiles(ctx, world.projectiles || [], ship.x, ship.y, effectiveVw, effectiveVh);

    // 8. Render EMP Shockwaves
    this.renderEmpWaves(ctx);

    // 9. Render Recon Scout Drones
    this.renderDrones(ctx, world.drones || []);

    // 9b. Render Escort Armada Fleet (Player & Enemy Escorts)
    this.renderEscorts(ctx, world.escorts || [], ship.x, ship.y, effectiveVw, effectiveVh);

    // 10. Render Particles (Frustum culled)
    this.renderParticles(ctx, ship.x, ship.y, effectiveVw, effectiveVh);

    // 11. Render Player Ship
    this.renderPlayerShip(ctx, ship);

    // 11b. Render In-World Active Mission Waypoint & Orbit Chevron
    const missionTarget = this.getActiveMissionTarget(ship, world, state.activeMission);
    if (missionTarget) {
      this.renderMissionWaypointInWorld(ctx, ship, missionTarget);
    }

    ctx.restore();

    // 11c. Render Screen-Space Perimeter Waypoint Marker (when target is off-screen)
    if (missionTarget) {
      this.renderMissionOffscreenWaypoint(ctx, width, height, ship, missionTarget, zoom);
    }

    // 12. Screen-Space Hyperspace Warp Tunnel Animation
    if (state.isHyperJumping) {
      this.renderHyperJumpTunnel(ctx, width, height, state.hyperJumpProgress);
    }
  }

  private getActiveMissionTarget(
    ship: any,
    world: any,
    activeMission: any
  ): {
    x: number;
    y: number;
    label: string;
    category: 'STATION' | 'ENEMY' | 'ASTEROID';
    dist: number;
    angleRad: number;
  } | null {
    if (!activeMission || activeMission.status !== 'ACTIVE') return null;

    // 1. Station Destinations (Courier, VIP, Convoy)
    if (
      activeMission.type === 'COURIER_CARGO' ||
      activeMission.type === 'VIP_TRANSPORT' ||
      activeMission.type === 'CONVOY_ESCORT'
    ) {
      const st = (world.stations || []).find((s: any) => s.id === activeMission.targetStationId);
      if (st) {
        const dx = st.x - ship.x;
        const dy = st.y - ship.y;
        const dist = Math.hypot(dx, dy);
        const angleRad = Math.atan2(dy, dx);
        return {
          x: st.x,
          y: st.y,
          label: st.name,
          category: 'STATION',
          dist: Math.round(dist),
          angleRad,
        };
      }
    }

    // 2. Bounty Hunt Targets
    if (activeMission.type === 'BOUNTY_HUNT') {
      const enemies = world.enemies || [];
      if (enemies.length > 0) {
        let closest = enemies[0];
        let minDist = Math.hypot(closest.x - ship.x, closest.y - ship.y);
        for (let i = 1; i < enemies.length; i++) {
          const d = Math.hypot(enemies[i].x - ship.x, enemies[i].y - ship.y);
          if (d < minDist) {
            minDist = d;
            closest = enemies[i];
          }
        }
        const dx = closest.x - ship.x;
        const dy = closest.y - ship.y;
        const dist = Math.hypot(dx, dy);
        const angleRad = Math.atan2(dy, dx);
        return {
          x: closest.x,
          y: closest.y,
          label: activeMission.targetEnemyName || closest.name,
          category: 'ENEMY',
          dist: Math.round(dist),
          angleRad,
        };
      }
    }

    // 3. Mineral Extraction Target
    if (activeMission.type === 'MINERAL_EXTRACTION') {
      const inventory = useGameStore.getState().player.inventory || [];
      const currentQty = inventory.find((i: any) => i.id === activeMission.requiredMineralId)?.quantity || 0;
      const reqQty = activeMission.requiredMineralQty || 1;

      if (currentQty >= reqQty) {
        const st = (world.stations || []).find((s: any) => s.id === activeMission.targetStationId);
        if (st) {
          const dx = st.x - ship.x;
          const dy = st.y - ship.y;
          const dist = Math.hypot(dx, dy);
          const angleRad = Math.atan2(dy, dx);
          return {
            x: st.x,
            y: st.y,
            label: `${st.name} [DELIVER ORE]`,
            category: 'STATION',
            dist: Math.round(dist),
            angleRad,
          };
        }
      } else {
        const matchingAsts = (world.asteroids || []).filter(
          (a: any) => a.oreType === activeMission.requiredMineralId
        );
        const pool = matchingAsts.length > 0 ? matchingAsts : world.asteroids || [];
        if (pool.length > 0) {
          let closest = pool[0];
          let minDist = Math.hypot(closest.x - ship.x, closest.y - ship.y);
          for (let i = 1; i < pool.length; i++) {
            const d = Math.hypot(pool[i].x - ship.x, pool[i].y - ship.y);
            if (d < minDist) {
              minDist = d;
              closest = pool[i];
            }
          }
          const dx = closest.x - ship.x;
          const dy = closest.y - ship.y;
          const dist = Math.hypot(dx, dy);
          const angleRad = Math.atan2(dy, dx);
          return {
            x: closest.x,
            y: closest.y,
            label: `Asteroid: ${activeMission.requiredMineralName}`,
            category: 'ASTEROID',
            dist: Math.round(dist),
            angleRad,
          };
        }
      }
    }

    return null;
  }

  private renderMissionWaypointInWorld(
    ctx: CanvasRenderingContext2D,
    ship: any,
    target: { x: number; y: number; label: string; dist: number; angleRad: number }
  ) {
    ctx.save();

    // 1. Orbiting Nav Chevron & Distance around Player Ship
    const orbitRadius = 75 + (ship.shipTier || 1) * 1.5;
    const arrowX = ship.x + Math.cos(target.angleRad) * orbitRadius;
    const arrowY = ship.y + Math.sin(target.angleRad) * orbitRadius;

    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(target.angleRad);

    // Glowing golden chevron
    ctx.fillStyle = '#F59E0B';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -9);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner bright core
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(-3, -4);
    ctx.lineTo(0, 0);
    ctx.lineTo(-3, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Distance label next to player chevron
    const labelDist = orbitRadius + 22;
    const labelX = ship.x + Math.cos(target.angleRad) * labelDist;
    const labelY = ship.y + Math.sin(target.angleRad) * labelDist;

    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Label background tag
    const distText = `${target.dist.toLocaleString()}u`;
    const textWidth = ctx.measureText(distText).width;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(labelX - textWidth / 2 - 5, labelY - 8, textWidth + 10, 16, 4);
    } else {
      ctx.rect(labelX - textWidth / 2 - 5, labelY - 8, textWidth + 10, 16);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FDE047';
    ctx.fillText(distText, labelX, labelY);

    // 2. Target Location Lock Reticle in World
    ctx.save();
    ctx.translate(target.x, target.y);
    const pulse = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
    const reticleRadius = 45 + pulse * 10;

    // Pulsing diamond target box
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, reticleRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Corner brackets
    const bracketSize = 14;
    const bOffset = reticleRadius * 0.75;
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2.5;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(-bOffset, -bOffset + bracketSize);
    ctx.lineTo(-bOffset, -bOffset);
    ctx.lineTo(-bOffset + bracketSize, -bOffset);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(bOffset - bracketSize, -bOffset);
    ctx.lineTo(bOffset, -bOffset);
    ctx.lineTo(bOffset, -bOffset + bracketSize);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(-bOffset, bOffset - bracketSize);
    ctx.lineTo(-bOffset, bOffset);
    ctx.lineTo(-bOffset + bracketSize, bOffset);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(bOffset - bracketSize, bOffset);
    ctx.lineTo(bOffset, bOffset);
    ctx.lineTo(bOffset, bOffset - bracketSize);
    ctx.stroke();

    // Target Label in World
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#FDE047';
    ctx.textAlign = 'center';
    ctx.fillText(`🎯 ${target.label.toUpperCase()}`, 0, -reticleRadius - 12);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#FCD34D';
    ctx.fillText(`[MISSION DESTINATION • ${target.dist.toLocaleString()}u]`, 0, -reticleRadius - 26);

    ctx.restore();

    ctx.restore();
  }

  private renderMissionOffscreenWaypoint(
    ctx: CanvasRenderingContext2D,
    screenWidth: number,
    screenHeight: number,
    ship: any,
    target: { x: number; y: number; label: string; dist: number; angleRad: number },
    zoom: number
  ) {
    // Check if target is off-screen
    const screenTargetX = screenWidth / 2 + (target.x - ship.x) * zoom;
    const screenTargetY = screenHeight / 2 + (target.y - ship.y) * zoom;

    const margin = 60;
    const isOffscreen =
      screenTargetX < margin ||
      screenTargetX > screenWidth - margin ||
      screenTargetY < margin ||
      screenTargetY > screenHeight - margin;

    if (!isOffscreen) return;

    ctx.save();

    // Calculate clamped screen edge position
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    const dx = screenTargetX - centerX;
    const dy = screenTargetY - centerY;
    const angle = Math.atan2(dy, dx);

    // Bounding box intersection with margin
    const hw = centerX - margin;
    const hh = centerY - margin;

    let edgeX = 0;
    let edgeY = 0;

    const tanA = Math.tan(angle);
    if (Math.abs(dx) * hh > Math.abs(dy) * hw) {
      // Hits left or right edge
      edgeX = dx > 0 ? hw : -hw;
      edgeY = edgeX * tanA;
    } else {
      // Hits top or bottom edge
      edgeY = dy > 0 ? hh : -hh;
      edgeX = edgeY / tanA;
    }

    const badgeX = centerX + edgeX;
    const badgeY = centerY + edgeY;

    // Draw prominent Holographic Perimeter Waypoint Pointer
    ctx.translate(badgeX, badgeY);

    // Draw Arrow Pointer
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = '#F59E0B';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-8, -12);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-8, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-4, -5);
    ctx.lineTo(-1, 0);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw Distance & Target Label Tag
    const tagText = `🎯 ${target.label} • ${target.dist.toLocaleString()}u`;
    ctx.font = 'bold 11px monospace';
    const tagW = ctx.measureText(tagText).width;
    const tagOffset = 26;
    const tagX = Math.cos(angle) * -tagOffset;
    const tagY = Math.sin(angle) * -tagOffset;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(tagX - tagW / 2 - 8, tagY - 11, tagW + 16, 22, 5);
    } else {
      ctx.rect(tagX - tagW / 2 - 8, tagY - 11, tagW + 16, 22);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FDE047';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, tagX, tagY);

    ctx.restore();
  }

  private renderNebulae(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    vw: number,
    vh: number,
    theme?: any
  ) {
    if (!theme) return;
    const colors: string[] = theme.nebulaColors || ['#3B82F6', '#8B5CF6', '#1E1B4B'];
    const dustAlpha = theme.ambientDustAlpha || 0.15;

    ctx.save();
    const cellSize = 1400;
    const startCellX = Math.floor((camX - vw / 2 - 700) / cellSize);
    const endCellX = Math.ceil((camX + vw / 2 + 700) / cellSize);
    const startCellY = Math.floor((camY - vh / 2 - 700) / cellSize);
    const endCellY = Math.ceil((camY + vh / 2 + 700) / cellSize);

    let renderedCount = 0;
    for (let cx = startCellX; cx <= endCellX; cx++) {
      for (let cy = startCellY; cy <= endCellY; cy++) {
        if (renderedCount >= 2) break;
        const hash = Math.sin(cx * 374761393 + cy * 668265263) * 10000;
        const rand = Math.abs(hash - Math.floor(hash));
        if (rand > 0.40) continue;

        const cloudX = cx * cellSize + (rand * cellSize * 0.7);
        const cloudY = cy * cellSize + ((1 - rand) * cellSize * 0.7);
        const radius = 500 + rand * 350;

        // Frustum check
        if (
          cloudX + radius < camX - vw / 2 ||
          cloudX - radius > camX + vw / 2 ||
          cloudY + radius < camY - vh / 2 ||
          cloudY - radius > camY + vh / 2
        ) {
          continue;
        }

        const colIdx = Math.floor(rand * colors.length) % colors.length;
        const color = colors[colIdx];

        const grad = ctx.createRadialGradient(cloudX, cloudY, 20, cloudX, cloudY, radius);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');

        ctx.globalAlpha = dustAlpha * (0.4 + rand * 0.6);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, radius, 0, Math.PI * 2);
        ctx.fill();
        renderedCount++;
      }
      if (renderedCount >= 2) break;
    }
    ctx.restore();
  }

  private renderDrones(ctx: CanvasRenderingContext2D, drones: ReconDrone[]) {
    for (const d of drones) {
      ctx.save();
      ctx.translate(d.x, d.y);

      // Defense Drone Shield Barrier Aura
      const pulseRatio = (Math.sin(Date.now() / 140) + 1) * 0.5;
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.25 + pulseRatio * 0.25})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();

      // Second soft interceptor ring
      ctx.strokeStyle = `rgba(52, 211, 153, ${0.12 + pulseRatio * 0.15})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();

      // Rotate drone in flight direction
      ctx.rotate(d.rotation);

      // Orbital Thruster glow & trail
      ctx.fillStyle = '#34D399';
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.lineTo(-12 - Math.random() * 5, 0);
      ctx.lineTo(-6, 2);
      ctx.fill();

      // Sleek Defense Escort Fighter Chassis (twin wingtips + angular armored cockpit)
      ctx.fillStyle = '#064E3B';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(2, 6);
      ctx.lineTo(-7, 7);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-7, -7);
      ctx.lineTo(2, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dual Micro-laser Cannons on wingtips
      ctx.fillStyle = '#6EE7B7';
      ctx.fillRect(0, -7, 4, 1.5);
      ctx.fillRect(0, 5.5, 4, 1.5);

      // Core fusion emitter glow
      ctx.fillStyle = '#A7F3D0';
      ctx.beginPath();
      ctx.arc(1, 0, 2, 0, Math.PI * 2);
      ctx.fill();

      // Escort Label
      ctx.rotate(-d.rotation);
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#34D399';
      ctx.textAlign = 'center';
      ctx.fillText('ESCORT', 0, -16);

      ctx.restore();
    }
  }

  private renderHyperJumpTunnel(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number
  ) {
    ctx.save();
    const centerX = width / 2;
    const centerY = height / 2;
    const intensity = Math.sin(progress * Math.PI);

    // Dark backdrop overlay with flash
    ctx.fillStyle = `rgba(3, 7, 18, ${intensity * 0.8})`;
    ctx.fillRect(0, 0, width, height);

    // Radiant warp streaks
    const streakCount = 80;
    for (let i = 0; i < streakCount; i++) {
      const angle = (i / streakCount) * Math.PI * 2 + progress * 3;
      const speed = 0.3 + (i % 6) * 0.25;
      const innerDist = 40 + ((progress * speed * 900) % 350);
      const outerDist = innerDist + 90 + intensity * 320;

      const x1 = centerX + Math.cos(angle) * innerDist;
      const y1 = centerY + Math.sin(angle) * innerDist;
      const x2 = centerX + Math.cos(angle) * outerDist;
      const y2 = centerY + Math.sin(angle) * outerDist;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0)');
      grad.addColorStop(0.5, i % 2 === 0 ? 'rgba(0, 240, 255, 0.9)' : 'rgba(192, 132, 252, 0.9)');
      grad.addColorStop(1, '#FFFFFF');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Central hyperspace singularity vortex
    const vortexGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 150 * intensity);
    vortexGrad.addColorStop(0, '#FFFFFF');
    vortexGrad.addColorStop(0.3, 'rgba(0, 240, 255, 0.85)');
    vortexGrad.addColorStop(0.7, 'rgba(147, 51, 234, 0.45)');
    vortexGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = vortexGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 150 * intensity, 0, Math.PI * 2);
    ctx.fill();

    // Hyperspace HUD text
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#00F0FF';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 10;
    ctx.fillText('HYPERSPACE TRANSIT ACTIVE', centerX, centerY + 180);
    ctx.font = '13px monospace';
    ctx.fillStyle = '#E2E8F0';
    ctx.shadowBlur = 0;
    ctx.fillText(`FOLDING SPACE-TIME COORD [${Math.round(progress * 100)}%]`, centerX, centerY + 205);

    ctx.restore();
  }

  private renderStarfield(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    vw: number,
    vh: number,
    theme?: any
  ) {
    ctx.save();
    const starTint = theme?.starTint || '#E2E8F0';
    ctx.fillStyle = starTint;

    const minX = camX - vw / 2 - 20;
    const maxX = camX + vw / 2 + 20;
    const minY = camY - vh / 2 - 20;
    const maxY = camY + vh / 2 + 20;

    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      // Parallax offset
      const sx = star.x + camX * (1 - star.layer);
      const sy = star.y + camY * (1 - star.layer);

      // Fast AABB culling
      if (sx >= minX && sx <= maxX && sy >= minY && sy <= maxY) {
        ctx.globalAlpha = star.brightness * star.layer;
        const s = star.size;
        ctx.fillRect(sx - s * 0.5, sy - s * 0.5, s, s);
      }
    }
    ctx.restore();
  }

  private renderStations(
    ctx: CanvasRenderingContext2D,
    stations: Station[],
    playerX: number,
    playerY: number,
    vw: number,
    vh: number
  ) {
    const minX = playerX - vw / 2 - 350;
    const maxX = playerX + vw / 2 + 350;
    const minY = playerY - vh / 2 - 350;
    const maxY = playerY + vh / 2 + 350;

    for (const st of stations) {
      if (st.x < minX || st.x > maxX || st.y < minY || st.y > maxY) continue;

      ctx.save();
      ctx.translate(st.x, st.y);

      // Docking radius ring (dashed)
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = st.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, st.radius + 120, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

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
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = st.color;
        ctx.fillRect(Math.cos(a) * (st.radius - 20) - 8, Math.sin(a) * (st.radius - 20) - 8, 16, 16);
        ctx.restore();
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

  private renderAsteroids(
    ctx: CanvasRenderingContext2D,
    asteroids: Asteroid[],
    playerX: number,
    playerY: number,
    vw: number,
    vh: number
  ) {
    const minX = playerX - vw / 2 - 120;
    const maxX = playerX + vw / 2 + 120;
    const minY = playerY - vh / 2 - 120;
    const maxY = playerY + vh / 2 + 120;

    for (const ast of asteroids) {
      if (ast.x < minX || ast.x > maxX || ast.y < minY || ast.y > maxY) continue;

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

  private renderFloatingLoot(
    ctx: CanvasRenderingContext2D,
    loots: any[],
    playerX: number,
    playerY: number,
    vw: number,
    vh: number
  ) {
    const minX = playerX - vw / 2 - 80;
    const maxX = playerX + vw / 2 + 80;
    const minY = playerY - vh / 2 - 80;
    const maxY = playerY + vh / 2 + 80;

    const time = performance.now() * 0.003;
    for (const loot of loots) {
      if (loot.x < minX || loot.x > maxX || loot.y < minY || loot.y > maxY) continue;

      const type = loot.lootType || 'CARGO';

      let strokeColor = '#00F0FF';
      let fillColor = 'rgba(0, 240, 255, 0.22)';
      let label = loot.item?.name || 'Cargo Pod';

      if (type === 'CREDITS') {
        strokeColor = '#FBBF24';
        fillColor = 'rgba(251, 191, 36, 0.3)';
        label = `+${loot.creditsValue || loot.item?.quantity || 100} CR`;
      } else if (type === 'MISSILES') {
        strokeColor = '#F97316';
        fillColor = 'rgba(249, 115, 22, 0.3)';
        label = `+${loot.missilesCount || loot.item?.quantity || 1} Torps`;
      } else if (type === 'FUEL') {
        strokeColor = '#A855F7';
        fillColor = 'rgba(168, 85, 247, 0.3)';
        label = `+${loot.fuelAmount || loot.item?.quantity || 25} Fuel`;
      } else if (type === 'REPAIR') {
        strokeColor = '#10B981';
        fillColor = 'rgba(16, 185, 129, 0.3)';
        label = `+${loot.repairAmount || loot.item?.quantity || 30} Nanite`;
      } else {
        // CARGO goods
        if (loot.item?.category === 'ORE') {
          strokeColor = '#F59E0B';
          fillColor = 'rgba(245, 158, 11, 0.25)';
        } else if (loot.item?.category === 'FOOD') {
          strokeColor = '#84CC16';
          fillColor = 'rgba(132, 204, 22, 0.25)';
        } else if (loot.item?.category === 'TECH') {
          strokeColor = '#00F0FF';
          fillColor = 'rgba(0, 240, 255, 0.25)';
        } else {
          strokeColor = '#C084FC';
          fillColor = 'rgba(192, 132, 252, 0.25)';
        }
        label = `${loot.item?.name || 'Supplies'} (${loot.item?.quantity || 1})`;
      }

      ctx.save();
      ctx.translate(loot.x, loot.y);

      // Rotating canister / pod body
      ctx.save();
      ctx.rotate(time);

      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = fillColor;
      ctx.lineWidth = 1.6;

      if (type === 'CREDITS') {
        // Shimmering Golden Diamond Chip
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(9, 0);
        ctx.lineTo(0, 9);
        ctx.lineTo(-9, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = '#FFFBEB';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === 'MISSILES') {
        // High-Vis Ordnance Pod with fins
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(-6, -9, 12, 18, 4);
        } else {
          ctx.rect(-6, -9, 12, 18);
        }
        ctx.fill();
        ctx.stroke();

        // Ordnance fins
        ctx.fillStyle = strokeColor;
        ctx.fillRect(-8, 3, 2, 5);
        ctx.fillRect(6, 3, 2, 5);
      } else if (type === 'FUEL') {
        // Plasma Fuel Cell
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(-7, -8, 14, 16, 3);
        } else {
          ctx.rect(-7, -8, 14, 16);
        }
        ctx.fill();
        ctx.stroke();

        // Liquid fuel level bar
        ctx.fillStyle = '#C084FC';
        ctx.fillRect(-4, 0, 8, 5);
      } else if (type === 'REPAIR') {
        // Nanite Repair Cross
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(-8, -8, 16, 16, 3);
        } else {
          ctx.rect(-8, -8, 16, 16);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#34D399';
        ctx.fillRect(-2, -5, 4, 10);
        ctx.fillRect(-5, -2, 10, 4);
      } else {
        // Standard Cargo Crate
        ctx.beginPath();
        ctx.rect(-8, -8, 16, 16);
        ctx.fill();
        ctx.stroke();

        // Corner reinforcement clips
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(-5, -5, 10, 10);
      }

      ctx.restore(); // Undo rotation for text label so it stays upright

      // Compact, crisp floating badge
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';

      // Drop shadow for legibility against dark space
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillText(label, 0, -13);
      ctx.fillText(label, 1, -12);

      ctx.fillStyle = strokeColor;
      ctx.fillText(label, 0, -12);

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

  private renderEnemies(
    ctx: CanvasRenderingContext2D,
    enemies: Enemy[],
    playerX: number,
    playerY: number,
    vw: number,
    vh: number
  ) {
    const minX = playerX - vw / 2 - 250;
    const maxX = playerX + vw / 2 + 250;
    const minY = playerY - vh / 2 - 250;
    const maxY = playerY + vh / 2 + 250;

    for (const enemy of enemies) {
      if (enemy.x < minX || enemy.x > maxX || enemy.y < minY || enemy.y > maxY) continue;

      const threatColor = enemy.threatColor || (enemy.threatLevel === 'STRONGER' ? '#EF4444' : enemy.threatLevel === 'WEAKER' ? '#FBBF24' : '#A855F7');
      const threatLevel = enemy.threatLevel || (threatColor === '#EF4444' ? 'STRONGER' : threatColor === '#FBBF24' || threatColor === '#F97316' ? 'WEAKER' : 'EVEN');
      const enemyScale = enemy.scale || 1.0;
      const category = enemy.category || (enemy.type === 'OUTLAW_BOSS' ? 'BATTLESHIP' : enemy.type === 'RAIDER_CORVETTE' ? 'CRUISER' : 'SCOUT');

      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(enemy.rotation);
      ctx.scale(enemyScale, enemyScale);

      // Raider Ship Hull
      ctx.fillStyle = threatLevel === 'STRONGER' ? '#31090f' : threatLevel === 'EVEN' ? '#22093e' : '#271804';
      ctx.strokeStyle = threatColor;
      ctx.lineWidth = threatLevel === 'STRONGER' ? 2.5 : threatLevel === 'EVEN' ? 2.0 : 1.8;

      ctx.beginPath();
      switch (category) {
        case 'COLOSSUS': {
          // Supreme Apex Capital Fortress (Elongated Cosmic Titan + Dual Flight Channels)
          ctx.moveTo(64, -8);
          ctx.lineTo(64, 8);
          ctx.lineTo(44, 22);
          ctx.lineTo(16, 28);
          ctx.lineTo(-28, 28);
          ctx.lineTo(-44, 18);
          ctx.lineTo(-34, 0);
          ctx.lineTo(-44, -18);
          ctx.lineTo(-28, -28);
          ctx.lineTo(16, -28);
          ctx.lineTo(44, -22);
          break;
        }

        case 'CARRIER': {
          // Elongated Heavy Outlaw Supercarrier (Flat Runway Deck + Outrigger Launch Bays)
          ctx.moveTo(56, -14);
          ctx.lineTo(56, 12);
          ctx.lineTo(38, 20);
          ctx.lineTo(12, 24);
          ctx.lineTo(-28, 24);
          ctx.lineTo(-40, 14);
          ctx.lineTo(-30, 0);
          ctx.lineTo(-40, -14);
          ctx.lineTo(-28, -24);
          ctx.lineTo(12, -24);
          ctx.lineTo(38, -14);
          break;
        }

        case 'BATTLESHIP': {
          // Elongated Chevron Dreadnought Warship (Multi-tier Armor Decks)
          ctx.moveTo(48, 0);
          ctx.lineTo(30, -12);
          ctx.lineTo(18, -22);
          ctx.lineTo(-20, -22);
          ctx.lineTo(-32, -14);
          ctx.lineTo(-24, 0);
          ctx.lineTo(-32, 14);
          ctx.lineTo(-20, 22);
          ctx.lineTo(18, 22);
          ctx.lineTo(30, 12);
          break;
        }

        case 'CRUISER': {
          // Elongated Trident Battlecruiser (Triple-Prow Rams + Broadside Decks)
          ctx.moveTo(40, 0);
          ctx.lineTo(24, -8);
          ctx.lineTo(30, -18);
          ctx.lineTo(12, -20);
          ctx.lineTo(-18, -20);
          ctx.lineTo(-26, -12);
          ctx.lineTo(-20, 0);
          ctx.lineTo(-26, 12);
          ctx.lineTo(-18, 20);
          ctx.lineTo(12, 20);
          ctx.lineTo(30, 18);
          ctx.lineTo(24, 8);
          break;
        }

        case 'FRIGATE': {
          // Stepped Wedge Heavy Destroyer (Broadside Nacelles)
          ctx.moveTo(28, 0);
          ctx.lineTo(16, -12);
          ctx.lineTo(6, -22);
          ctx.lineTo(-8, -24);
          ctx.lineTo(-18, -16);
          ctx.lineTo(-14, -8);
          ctx.lineTo(-20, 0);
          ctx.lineTo(-14, 8);
          ctx.lineTo(-18, 16);
          ctx.lineTo(-8, 24);
          ctx.lineTo(6, 22);
          ctx.lineTo(16, 12);
          break;
        }

        case 'CORVETTE': {
          // Hammerhead Outrigger Gunship
          ctx.moveTo(20, -10);
          ctx.lineTo(24, 0);
          ctx.lineTo(20, 10);
          ctx.lineTo(12, 16);
          ctx.lineTo(-6, 20);
          ctx.lineTo(-16, 14);
          ctx.lineTo(-12, 0);
          ctx.lineTo(-16, -14);
          ctx.lineTo(-6, -20);
          ctx.lineTo(12, -16);
          break;
        }

        default: {
          // SCOUT: Sleek needle interceptor
          ctx.moveTo(22, 0);
          ctx.lineTo(8, -6);
          ctx.lineTo(-14, -14);
          ctx.lineTo(-8, -5);
          ctx.lineTo(-16, 0);
          ctx.lineTo(-8, 5);
          ctx.lineTo(-14, 14);
          ctx.lineTo(8, 6);
          break;
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const glowAccent = threatLevel === 'STRONGER' ? '#EF4444' : threatLevel === 'EVEN' ? '#C084FC' : '#FBBF24';

      // Category-specific internal armor lines & bridge canopies
      if (category === 'COLOSSUS' || category === 'CARRIER' || category === 'BATTLESHIP') {
        // Flight deck runway markings for Carrier / Colossus
        if (category === 'CARRIER' || category === 'COLOSSUS') {
          ctx.save();
          ctx.strokeStyle = threatColor;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(-18, -4);
          ctx.lineTo(44, -4);
          ctx.moveTo(-18, 4);
          ctx.lineTo(44, 4);
          ctx.stroke();
          ctx.restore();

          // Side hangar launch lights
          ctx.fillStyle = '#10B981';
          ctx.fillRect(-12, -22, 16, 2.5);
          ctx.fillRect(-12, 19.5, 16, 2.5);
        }

        // Broadside turret pods
        ctx.fillStyle = threatColor;
        ctx.fillRect(-10, -20, 16, 3);
        ctx.fillRect(-10, 17, 16, 3);
        // Elevated command tower
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = threatColor;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-12, -7, 16, 14);
        ctx.fillRect(-12, -7, 16, 14);
        // Bridge glow
        ctx.fillStyle = glowAccent;
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // Quad thrusters
        ctx.fillStyle = glowAccent;
        ctx.fillRect(-34, -14, 6, 2.5);
        ctx.fillRect(-34, -6, 6, 2.5);
        ctx.fillRect(-34, 3.5, 6, 2.5);
        ctx.fillRect(-34, 11.5, 6, 2.5);
      } else if (category === 'CRUISER') {
        // Dual weapon ram lights
        ctx.fillStyle = threatColor;
        ctx.fillRect(26, -14, 4, 2);
        ctx.fillRect(26, 12, 4, 2);
        // Triple thruster nozzles
        ctx.fillStyle = glowAccent;
        ctx.fillRect(-24, -10, 5, 2.5);
        ctx.fillRect(-26, -1.5, 6, 3);
        ctx.fillRect(-24, 7.5, 5, 2.5);
        // Cockpit
        ctx.beginPath();
        ctx.arc(6, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (category === 'FRIGATE') {
        // Dual engine exhausts
        ctx.fillStyle = glowAccent;
        ctx.fillRect(-18, -13, 5, 2.5);
        ctx.fillRect(-18, 10.5, 5, 2.5);
        // Cockpit
        ctx.beginPath();
        ctx.arc(5, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (category === 'CORVETTE') {
        // Dual engine exhausts
        ctx.fillStyle = glowAccent;
        ctx.fillRect(-16, -9, 4, 2);
        ctx.fillRect(-16, 7, 4, 2);
        // Cockpit
        ctx.beginPath();
        ctx.arc(6, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Single Scout engine glow
        ctx.fillStyle = glowAccent;
        ctx.beginPath();
        ctx.arc(-12, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        // Cockpit
        ctx.beginPath();
        ctx.arc(4, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Physical Hull Damage: Visible breach holes, blast scorches, and exposed molten framework
      const maxH = enemy.maxHull || 1;
      const hpPct = Math.max(0, Math.min(1, enemy.hull / maxH));

      if (hpPct < 0.95) {
        let breachSpots: { x: number; y: number; r: number }[] = [];
        if (category === 'COLOSSUS' || category === 'CARRIER') {
          breachSpots = [
            { x: 26, y: -12, r: 5.0 },
            { x: -14, y: 14, r: 6.0 },
            { x: 44, y: 2, r: 4.5 },
            { x: -22, y: -16, r: 5.5 },
            { x: 8, y: 16, r: 4.8 },
            { x: -28, y: 0, r: 6.5 },
          ];
        } else if (category === 'BATTLESHIP') {
          breachSpots = [
            { x: 20, y: -8, r: 4.2 },
            { x: -8, y: 11, r: 4.8 },
            { x: 32, y: 0, r: 3.8 },
            { x: -18, y: -10, r: 4.5 },
            { x: -20, y: 8, r: 5.2 },
          ];
        } else if (category === 'CRUISER') {
          breachSpots = [
            { x: 18, y: -9, r: 3.8 },
            { x: -6, y: 10, r: 4.2 },
            { x: 26, y: 0, r: 3.2 },
            { x: -14, y: -8, r: 4.0 },
          ];
        } else if (category === 'FRIGATE' || category === 'CORVETTE') {
          breachSpots = [
            { x: 12, y: -6, r: 3.2 },
            { x: -4, y: 8, r: 3.8 },
            { x: 16, y: 0, r: 2.8 },
            { x: -10, y: -7, r: 3.5 },
          ];
        } else {
          // SCOUT
          breachSpots = [
            { x: 8, y: -4, r: 2.6 },
            { x: -4, y: 4, r: 3.0 },
            { x: -8, y: 0, r: 2.5 },
          ];
        }

        const totalHoles = breachSpots.length;
        const holesToDraw = Math.min(totalHoles, Math.max(1, Math.ceil((1.0 - hpPct) * totalHoles * 1.35)));

        for (let hIdx = 0; hIdx < holesToDraw; hIdx++) {
          const spot = breachSpots[hIdx];
          
          // Outer charred void burn
          ctx.fillStyle = '#090a0f';
          ctx.strokeStyle = hpPct < 0.35 ? '#EF4444' : '#EA580C';
          ctx.lineWidth = 1.0;
          
          ctx.beginPath();
          ctx.ellipse(spot.x, spot.y, spot.r, spot.r * 0.75, hIdx * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Internal exposed molten fiery core
          ctx.fillStyle = hpPct < 0.25 ? '#FBBF24' : '#F97316';
          ctx.beginPath();
          ctx.arc(spot.x + 0.4, spot.y + 0.2, Math.max(0.8, spot.r * 0.38), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Dynamic Shield barrier (Width, opacity & line pattern dynamically scale with shield capacity)
      if (enemy.shield > 0 && (enemy.maxShield || 0) > 0) {
        const shieldPct = Math.max(0, Math.min(1, enemy.shield / enemy.maxShield));
        const eBox = getEnemyBoundingBox(category, 1.0);
        const sL = eBox.halfLength + 6;
        const sW = eBox.halfWidth + 6;

        // Dynamic barrier thickness: 1.2px (failing) up to 4.5px (full shield capacity)
        const barrierWidth = Number((1.2 + 3.3 * shieldPct).toFixed(1));
        const barrierAlpha = Number((0.25 + 0.65 * shieldPct).toFixed(2));
        
        let barrierStroke = `rgba(168, 85, 247, ${barrierAlpha})`;
        let barrierFill = `rgba(168, 85, 247, ${0.04 + 0.12 * shieldPct})`;
        if (threatLevel === 'STRONGER') {
          barrierStroke = `rgba(239, 68, 68, ${barrierAlpha})`;
          barrierFill = `rgba(239, 68, 68, ${0.05 + 0.14 * shieldPct})`;
        } else if (threatLevel === 'WEAKER') {
          barrierStroke = `rgba(251, 191, 36, ${barrierAlpha})`;
          barrierFill = `rgba(251, 191, 36, ${0.04 + 0.10 * shieldPct})`;
        }

        ctx.save();
        ctx.strokeStyle = barrierStroke;
        ctx.fillStyle = barrierFill;
        ctx.lineWidth = barrierWidth;

        // Failing shield flickers with dashed line when < 30%
        if (shieldPct < 0.30) {
          ctx.setLineDash([5, 4]);
        }

        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(-sL + eBox.forwardOffset, -sW, sL * 2, sW * 2, 10);
        } else {
          ctx.rect(-sL + eBox.forwardOffset, -sW, sL * 2, sW * 2);
        }
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // EMP Stun electric field
      if (enemy.stunDuration && enemy.stunDuration > 0) {
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const stunR = 34 + Math.sin(Date.now() * 0.02) * 3;
        ctx.arc(0, 0, stunR, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Clean, Prominent Floating Threat & Status Tag (Replaced micro bars with high-contrast label)
      let threatBadge = `[MATCH]`;
      if (threatLevel === 'WEAKER') {
        const pct = Math.abs(Math.round((enemy.powerDelta || -0.15) * 100));
        threatBadge = `▼ [WEAK -${pct}%]`;
      } else if (threatLevel === 'STRONGER') {
        const pct = Math.round((enemy.powerDelta || 0.10) * 100);
        threatBadge = `▲ [APEX +${pct}%]`;
      } else {
        threatBadge = `■ [MATCH ±5%]`;
      }

      const isCrit = hpPct < 0.30;
      const critTag = isCrit ? ' 🔥[CRITICAL]' : '';
      const shieldTag = enemy.shield > 0 ? ` 🛡️${Math.round((enemy.shield / (enemy.maxShield || 1)) * 100)}%` : '';

      const threatLabel = enemy.stunDuration && enemy.stunDuration > 0
        ? `⚡ [${category}] ${enemy.name} [EMP STUNNED ${enemy.stunDuration.toFixed(1)}s]`
        : `${threatBadge} [${category}] ${enemy.name}${shieldTag}${critTag}`;

      const labelY = enemy.y - Math.round(28 * enemyScale);

      ctx.save();
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      const textWidth = ctx.measureText(threatLabel).width;

      // Dark translucent backing pill for high readability against nebulae and stars
      ctx.fillStyle = 'rgba(8, 12, 24, 0.85)';
      ctx.fillRect(enemy.x - textWidth / 2 - 6, labelY - 11, textWidth + 12, 15);
      ctx.strokeStyle = isCrit ? '#EF4444' : (enemy.stunDuration ? '#00F0FF' : threatColor);
      ctx.lineWidth = 1;
      ctx.strokeRect(enemy.x - textWidth / 2 - 6, labelY - 11, textWidth + 12, 15);

      ctx.fillStyle = enemy.stunDuration && enemy.stunDuration > 0 ? '#00F0FF' : threatColor;
      ctx.fillText(threatLabel, enemy.x, labelY);
      ctx.restore();
    }
  }

  private renderProjectiles(
    ctx: CanvasRenderingContext2D,
    projectiles: Projectile[],
    playerX: number,
    playerY: number,
    vw: number,
    vh: number
  ) {
    const minX = playerX - vw / 2 - 80;
    const maxX = playerX + vw / 2 + 80;
    const minY = playerY - vh / 2 - 80;
    const maxY = playerY + vh / 2 + 80;

    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) continue;

      if (p.type === 'TORPEDO') {
        // Render Torpedo Missile (Requires local transform)
        ctx.save();
        const heading = Math.atan2(p.vy, p.vx);
        ctx.translate(p.x, p.y);
        ctx.rotate(heading);

        // Exhaust plume glow (fast circle instead of CPU shadowBlur)
        ctx.fillStyle = '#FB923C';
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(-10, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Exhaust flame
        ctx.fillStyle = '#FFDD00';
        ctx.beginPath();
        ctx.moveTo(-9, -2.5);
        ctx.lineTo(-17 - Math.random() * 6, 0);
        ctx.lineTo(-9, 2.5);
        ctx.closePath();
        ctx.fill();

        // Missile hull
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#FB923C';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-8, -4, 16, 8, 3);
        ctx.fill();
        ctx.stroke();

        // Glowing warhead tip
        ctx.fillStyle = '#FB923C';
        ctx.beginPath();
        ctx.arc(6, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Stabilizer fins
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-7, -6, 4, 2);
        ctx.fillRect(-7, 4, 4, 2);
        ctx.restore();
      } else if (p.type === 'FLAK') {
        // Fast dual-pass yellow/white flak tracer
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025);
        ctx.stroke();

        ctx.strokeStyle = '#FDE047';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // High-Performance Dual-Pass Neon Laser Visuals (0ms GPU/CPU Gaussian blur overhead)
        const isTier5 = p.color === '#FFDD00' || p.color === '#FBBF24';
        const isTier4 = p.color === '#FF3366' || p.color === '#E11D48';
        const isTier3 = p.color === '#C084FC' || p.color === '#A855F7';
        const isTier2 = p.color === '#38BDF8' || p.color === '#06B6D4';
        const coreWidth = p.radius ? p.radius * 1.5 : (isTier5 ? 4.5 : isTier4 ? 3.8 : isTier3 ? 3.2 : isTier2 ? 2.8 : 2.4);
        const trailLen = p.radius ? Math.min(0.065, 0.038 + p.radius * 0.004) : (isTier5 ? 0.055 : 0.04);
        const x2 = p.x - p.vx * trailLen;
        const y2 = p.y - p.vy * trailLen;

        // Pass 1: Outer Soft Neon Plasma Aura
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = 0.42;
        ctx.lineWidth = coreWidth * 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Pass 2: High-Intensity Core Laser
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = coreWidth;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Emitter Core Tip
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(2.0, coreWidth * 0.62), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderEmpWaves(ctx: CanvasRenderingContext2D) {
    for (const wave of this.empWaves) {
      ctx.save();

      // Outer expanding ring aura (fast 0ms alpha stroke)
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Sharp primary EMP wave
      ctx.strokeStyle = `rgba(0, 240, 255, ${wave.alpha})`;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner electric harmonic ripple
      ctx.strokeStyle = `rgba(192, 132, 252, ${wave.alpha * 0.75})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, Math.max(0, wave.radius - 14), 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderParticles(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number,
    vw: number,
    vh: number
  ) {
    const minX = playerX - vw / 2 - 50;
    const maxX = playerX + vw / 2 + 50;
    const minY = playerY - vh / 2 - 50;
    const maxY = playerY + vh / 2 + 50;

    // Batch particle rendering in a single canvas save/restore block
    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) continue;

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.fillRect(p.x - s, p.y - s, s * 2, s * 2);
    }
    ctx.restore();
  }

  private renderPhaserBeams(ctx: CanvasRenderingContext2D, ship: any, enemies: Enemy[]) {
    ctx.save();
    // 1. Player Heavy Phaser Beam Lance
    if (ship.hasBeamWeapon && this.playerBeamTarget) {
      const target = this.playerBeamTarget;
      const x1 = ship.x;
      const y1 = ship.y;
      const x2 = target.x;
      const y2 = target.y;

      // Outer phaser lance glow
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Electric harmonic arc
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 8;
      const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 8;
      ctx.lineTo(midX, midY);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Pure white piercing laser core
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Target impact burn ring
      ctx.fillStyle = '#00F0FF';
      ctx.beginPath();
      ctx.arc(x2, y2, 6 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Enemy Heavy Phaser Beams
    for (const enemy of enemies) {
      if (enemy.hasBeamWeapon && this.enemyBeamActive.has(enemy.id)) {
        const x1 = enemy.x;
        const y1 = enemy.y;
        const x2 = ship.x;
        const y2 = ship.y;

        // Outer red plasma beam
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Inner crimson electrical lance
        ctx.strokeStyle = '#FF3366';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 7;
        const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 7;
        ctx.lineTo(midX, midY);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // White core
        ctx.strokeStyle = '#FEE2E2';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private renderEscorts(
    ctx: CanvasRenderingContext2D,
    escorts: EscortShip[],
    playerX: number,
    playerY: number,
    vw: number,
    vh: number
  ) {
    const minX = playerX - vw / 2 - 150;
    const maxX = playerX + vw / 2 + 150;
    const minY = playerY - vh / 2 - 150;
    const maxY = playerY + vh / 2 + 150;
    const liveAsteroids = useGameStore.getState().world.asteroids || [];

    for (const esc of escorts) {
      if (esc.x < minX || esc.x > maxX || esc.y < minY || esc.y > maxY) continue;

      const isPlayer = esc.owner === 'PLAYER';

      // 1. Render Specialty Mining Laser Beam for Auto-Mining Barge
      if (esc.type === 'MINING_BARGE' && esc.miningTargetId) {
        const targetAst = liveAsteroids.find((a) => a.id === esc.miningTargetId && a.health > 0);
        if (targetAst) {
          ctx.save();
          // Turquoise mining laser beam
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(esc.x, esc.y);
          ctx.lineTo(targetAst.x, targetAst.y);
          ctx.stroke();

          ctx.strokeStyle = '#22D3EE';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(esc.x, esc.y);
          ctx.lineTo(targetAst.x, targetAst.y);
          ctx.stroke();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(esc.x, esc.y);
          ctx.lineTo(targetAst.x, targetAst.y);
          ctx.stroke();

          // Target impact burn ring
          ctx.fillStyle = '#06B6D4';
          ctx.beginPath();
          ctx.arc(targetAst.x, targetAst.y, 7 + Math.random() * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.save();
      ctx.translate(esc.x, esc.y);

      // 2. Specialty Shield Dome Projector (Wide 130px Deflector Barrier)
      if (esc.type === 'SHIELD_PROJECTOR') {
        ctx.save();
        const pulse = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.35 + pulse * 0.25})`;
        ctx.lineWidth = 2.0;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, 130, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = `rgba(0, 240, 255, ${0.05 + pulse * 0.04})`;
        ctx.beginPath();
        ctx.arc(0, 0, 130, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = '#00F0FF';
        ctx.textAlign = 'center';
        ctx.fillText('SHIELD BUBBLE (130u)', 0, -134);
        ctx.restore();
      }

      // Base Deflector Shield Aura
      if (esc.shield > 0) {
        const sPct = esc.shield / esc.maxShield;
        ctx.strokeStyle = isPlayer
          ? `rgba(52, 211, 153, ${0.25 + sPct * 0.3})`
          : `rgba(239, 68, 68, ${0.25 + sPct * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.rotate(esc.rotation);

      // Thruster trail
      const thrusterColor =
        esc.type === 'MINING_BARGE' ? '#06B6D4' :
        esc.type === 'MISSILE_CRUISER' ? '#F97316' :
        esc.type === 'SHIELD_PROJECTOR' ? '#00F0FF' :
        esc.type === 'REPAIR_TENDER' ? '#10B981' :
        esc.type === 'RONIN_WARMASTER' ? '#FFDD00' :
        isPlayer ? '#34D399' : '#FF3366';

      ctx.fillStyle = thrusterColor;
      ctx.beginPath();
      ctx.moveTo(-6, -2.5);
      ctx.lineTo(-13 - Math.random() * 5, 0);
      ctx.lineTo(-6, 2.5);
      ctx.closePath();
      ctx.fill();

      // Custom Chassis Render per Escort Type
      ctx.fillStyle = isPlayer ? '#0f172a' : '#311018';
      ctx.strokeStyle = thrusterColor;
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      if (esc.type === 'MINING_BARGE') {
        // Heavy industrial mining barge (Hexagonal prow with dual laser cutters)
        ctx.moveTo(14, -6);
        ctx.lineTo(14, 6);
        ctx.lineTo(6, 12);
        ctx.lineTo(-10, 12);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-10, -12);
        ctx.lineTo(6, -12);
      } else if (esc.type === 'MISSILE_CRUISER') {
        // Missile Cruiser (Elongated cruiser with twin torpedo pods)
        ctx.moveTo(16, 0);
        ctx.lineTo(6, 6);
        ctx.lineTo(2, 12); // Starboard torpedo pod
        ctx.lineTo(-10, 12);
        ctx.lineTo(-8, 5);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-8, -5);
        ctx.lineTo(-10, -12);
        ctx.lineTo(2, -12); // Port torpedo pod
        ctx.lineTo(6, -6);
      } else if (esc.type === 'SHIELD_PROJECTOR') {
        // Shield Projector (Command ring dome with central emitter)
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
      } else if (esc.type === 'REPAIR_TENDER') {
        // Nanite Repair Tender (Twin-hull catamaran)
        ctx.moveTo(12, -8);
        ctx.lineTo(12, -3);
        ctx.lineTo(6, 0);
        ctx.lineTo(12, 3);
        ctx.lineTo(12, 8);
        ctx.lineTo(-10, 8);
        ctx.lineTo(-8, 3);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-8, -3);
        ctx.lineTo(-10, -8);
      } else if (esc.type === 'GUNSHIP') {
        // Heavy Gunship (Broad delta with twin cannons)
        ctx.moveTo(12, 0);
        ctx.lineTo(4, 8);
        ctx.lineTo(-8, 10);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-8, -10);
        ctx.lineTo(4, -8);
      } else if (esc.type === 'RONIN_WARMASTER') {
        // Apex Warmaster (Large triple-hull flagship)
        ctx.moveTo(18, 0);
        ctx.lineTo(8, -10);
        ctx.lineTo(12, -14);
        ctx.lineTo(-12, -14);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-12, 14);
        ctx.lineTo(12, 14);
        ctx.lineTo(8, 10);
      } else {
        // Interceptor Fighter / Frigate / Destroyer
        ctx.moveTo(12, 0);
        ctx.lineTo(2, 6);
        ctx.lineTo(-7, 7);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-7, -7);
        ctx.lineTo(2, -6);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Core Emitter / Weapon Tips
      ctx.fillStyle = thrusterColor;
      if (esc.type === 'SHIELD_PROJECTOR') {
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (esc.type === 'REPAIR_TENDER') {
        ctx.fillRect(-2, -4, 4, 8);
        ctx.fillRect(-4, -2, 8, 4);
      } else {
        ctx.fillRect(4, -5, 3, 1.5);
        ctx.fillRect(4, 3.5, 3, 1.5);
      }

      ctx.rotate(-esc.rotation);

      // EMP Stun electric field for escorts
      if (esc.stunDuration && esc.stunDuration > 0) {
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const stunR = 18 + Math.sin(Date.now() * 0.02) * 2;
        ctx.arc(0, 0, stunR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Health bar & status tag
      const hpPct = Math.max(0, Math.min(1, esc.hull / esc.maxHull));
      const barW = 22;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(-barW / 2, -18, barW, 2.5);
      ctx.fillStyle = thrusterColor;
      ctx.fillRect(-barW / 2, -18, barW * hpPct, 2.5);

      ctx.font = 'bold 7px monospace';
      ctx.fillStyle = esc.stunDuration && esc.stunDuration > 0 ? '#00F0FF' : thrusterColor;
      ctx.textAlign = 'center';
      const escortLabel = esc.stunDuration && esc.stunDuration > 0
        ? `⚡ [EMP ${esc.stunDuration.toFixed(1)}s]`
        : isPlayer ? esc.name.toUpperCase().split(' ')[0] : 'RAIDER';
      ctx.fillText(escortLabel, 0, -22);

      ctx.restore();
    }
  }

  private renderPlayerShip(ctx: CanvasRenderingContext2D, ship: any) {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.rotation);

    const tier = ship.shipTier || 1;
    const weaponLvl = ship.weaponLevel || 1;

    // Visual player ship scaling: vector paths already scale from 24u up to 88u across classes;
    // apply gentle progression for prestige tiers > 22
    const playerScale = tier <= 22 ? 1.0 : Number((1.0 + (tier - 22) * 0.008).toFixed(2));
    ctx.scale(playerScale, playerScale);

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;

    ctx.beginPath();
    switch (tier) {
      case 1: // Ronin Dart (Sharp needle interceptor)
        ctx.moveTo(24, 0);
        ctx.lineTo(8, -5);
        ctx.lineTo(-14, -13);
        ctx.lineTo(-8, -5);
        ctx.lineTo(-14, 0);
        ctx.lineTo(-8, 5);
        ctx.lineTo(-14, 13);
        ctx.lineTo(8, 5);
        break;

      case 2: // Viper Strikecraft (Twin-pronged forward fork)
        ctx.moveTo(22, -6);
        ctx.lineTo(12, 0);
        ctx.lineTo(22, 6);
        ctx.lineTo(4, 12);
        ctx.lineTo(-16, -18);
        ctx.lineTo(-8, -6);
        ctx.lineTo(-14, 0);
        ctx.lineTo(-8, 6);
        ctx.lineTo(-16, 18);
        ctx.lineTo(4, -12);
        break;

      case 3: // Kestrel Interceptor (Forward-swept gull wings)
        ctx.moveTo(22, 0);
        ctx.lineTo(4, -8);
        ctx.lineTo(10, -22); // Forward-swept wingtip
        ctx.lineTo(-4, -16);
        ctx.lineTo(-16, -8);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-16, 8);
        ctx.lineTo(-4, 16);
        ctx.lineTo(10, 22); // Forward-swept wingtip
        ctx.lineTo(4, 8);
        break;

      case 4: // Corsair Skiff (Asymmetrical outrigger raider)
        ctx.moveTo(24, -2);
        ctx.lineTo(8, -12);
        ctx.lineTo(2, -26); // Heavy port outrigger
        ctx.lineTo(-14, -22);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-16, 0);
        ctx.lineTo(-10, 10);
        ctx.lineTo(6, 16); // Starboard stabilizer
        ctx.lineTo(14, 4);
        break;

      case 5: // Hammerhead Gunship (Armored T-crossbar prow)
        ctx.moveTo(22, -18);
        ctx.lineTo(22, 18); // Flat hammerhead front
        ctx.lineTo(14, 18);
        ctx.lineTo(12, 8);
        ctx.lineTo(-16, 14);
        ctx.lineTo(-18, 0);
        ctx.lineTo(-16, -14);
        ctx.lineTo(12, -8);
        ctx.lineTo(14, -18);
        break;

      case 6: // Valkyrie Heavy Frigate (Swept diamond delta)
        ctx.moveTo(28, 0);
        ctx.lineTo(6, -24); // Wide diamond shoulder
        ctx.lineTo(-12, -18);
        ctx.lineTo(-18, -10);
        ctx.lineTo(-14, 0);
        ctx.lineTo(-18, 10);
        ctx.lineTo(-12, 18);
        ctx.lineTo(6, 24);
        break;

      case 7: // Spectre Stealth Blade (Faceted hexagonal stealth hull)
        ctx.moveTo(26, -4);
        ctx.lineTo(26, 4);
        ctx.lineTo(12, 22);
        ctx.lineTo(-8, 20);
        ctx.lineTo(-18, 8);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-18, -8);
        ctx.lineTo(-8, -20);
        ctx.lineTo(12, -22);
        break;

      case 8: // Centurion Catamaran (Twin-hull heavy gunboat)
        ctx.moveTo(26, -14);
        ctx.lineTo(6, -20);
        ctx.lineTo(-20, -18);
        ctx.lineTo(-14, -8);
        ctx.lineTo(-16, 0);
        ctx.lineTo(-14, 8);
        ctx.lineTo(-20, 18);
        ctx.lineTo(6, 20);
        ctx.lineTo(26, 14);
        ctx.lineTo(16, 6);
        ctx.lineTo(18, 0);
        ctx.lineTo(16, -6);
        break;

      case 9: // Aegis Destroyer (Stepped wedge with armored broadsides)
        ctx.moveTo(32, 0);
        ctx.lineTo(16, -14);
        ctx.lineTo(14, -22);
        ctx.lineTo(2, -26);
        ctx.lineTo(-20, -20);
        ctx.lineTo(-14, 0);
        ctx.lineTo(-20, 20);
        ctx.lineTo(2, 26);
        ctx.lineTo(14, 22);
        ctx.lineTo(16, 14);
        break;

      case 10: // Trident Battlecruiser (Elongated triple-prow dreadnought)
        ctx.moveTo(46, 0);
        ctx.lineTo(26, -8);
        ctx.lineTo(34, -18);
        ctx.lineTo(14, -22);
        ctx.lineTo(-24, -22);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-24, 22);
        ctx.lineTo(14, 22);
        ctx.lineTo(34, 18);
        ctx.lineTo(26, 8);
        break;

      case 11: // Gorgon Assault Cruiser (Elongated heavy armored bunker warship)
        ctx.moveTo(46, -10);
        ctx.lineTo(46, 10);
        ctx.lineTo(26, 24);
        ctx.lineTo(-20, 24);
        ctx.lineTo(-30, 14);
        ctx.lineTo(-22, 0);
        ctx.lineTo(-30, -14);
        ctx.lineTo(-20, -24);
        ctx.lineTo(26, -24);
        break;

      case 12: // Phoenix Strike Cruiser (Elongated forward raptor-wings)
        ctx.moveTo(50, 0);
        ctx.lineTo(16, -10);
        ctx.lineTo(26, -28);
        ctx.lineTo(-10, -24);
        ctx.lineTo(-28, -14);
        ctx.lineTo(-20, 0);
        ctx.lineTo(-28, 14);
        ctx.lineTo(-10, 24);
        ctx.lineTo(26, 28);
        ctx.lineTo(16, 10);
        break;

      case 13: // Titan Heavy Battleship (Elongated stepped chevron super-dreadnought)
        ctx.moveTo(54, 0);
        ctx.lineTo(32, -14);
        ctx.lineTo(10, -26);
        ctx.lineTo(-26, -24);
        ctx.lineTo(-20, -10);
        ctx.lineTo(-30, 0);
        ctx.lineTo(-20, 10);
        ctx.lineTo(-26, 24);
        ctx.lineTo(10, 26);
        ctx.lineTo(32, 14);
        break;

      case 14: // Obsidian Dreadnought (Elongated monolithic dagger dreadnought)
        ctx.moveTo(58, 0);
        ctx.lineTo(26, -14);
        ctx.lineTo(6, -26);
        ctx.lineTo(-24, -24);
        ctx.lineTo(-34, -12);
        ctx.lineTo(-24, 0);
        ctx.lineTo(-34, 12);
        ctx.lineTo(-24, 24);
        ctx.lineTo(6, 26);
        ctx.lineTo(26, 14);
        break;

      case 15: // Leviathan Flagship (Elongated segmented capital carrier flagship)
        ctx.moveTo(58, -12);
        ctx.lineTo(58, 12);
        ctx.lineTo(32, 22);
        ctx.lineTo(14, 28);
        ctx.lineTo(-26, 28);
        ctx.lineTo(-38, 16);
        ctx.lineTo(-28, 0);
        ctx.lineTo(-38, -16);
        ctx.lineTo(-26, -28);
        ctx.lineTo(14, -28);
        ctx.lineTo(32, -22);
        break;

      case 16: // Solar Apex Colossus (Elongated quantum ring colossus)
        ctx.moveTo(64, 0);
        ctx.lineTo(28, -16);
        ctx.lineTo(8, -30);
        ctx.lineTo(-26, -28);
        ctx.lineTo(-40, -14);
        ctx.lineTo(-28, 0);
        ctx.lineTo(-40, 14);
        ctx.lineTo(-26, 28);
        ctx.lineTo(8, 30);
        ctx.lineTo(28, 16);
        break;

      case 17: // Hyperion Fleet Carrier (Elongated dual-flight deck aircraft carrier)
        ctx.moveTo(66, -15);
        ctx.lineTo(66, 12);
        ctx.lineTo(44, 20);
        ctx.lineTo(14, 24);
        ctx.lineTo(-32, 24);
        ctx.lineTo(-44, 14);
        ctx.lineTo(-32, 0);
        ctx.lineTo(-44, -14);
        ctx.lineTo(-32, -24);
        ctx.lineTo(14, -24);
        ctx.lineTo(44, -15);
        break;

      case 18: // Archon Supercarrier (Elongated triple catapult flight runway)
        ctx.moveTo(70, -16);
        ctx.lineTo(70, 14);
        ctx.lineTo(48, 22);
        ctx.lineTo(16, 26);
        ctx.lineTo(-36, 26);
        ctx.lineTo(-48, 16);
        ctx.lineTo(-36, 0);
        ctx.lineTo(-48, -16);
        ctx.lineTo(-36, -26);
        ctx.lineTo(16, -26);
        ctx.lineTo(48, -22);
        break;

      case 19: // Sovereign Dread-Carrier (Elongated dreadnought carrier with armored ram)
        ctx.moveTo(74, 0);
        ctx.lineTo(54, -18);
        ctx.lineTo(20, -28);
        ctx.lineTo(-34, -28);
        ctx.lineTo(-50, -16);
        ctx.lineTo(-38, 0);
        ctx.lineTo(-50, 16);
        ctx.lineTo(-34, 28);
        ctx.lineTo(20, 28);
        ctx.lineTo(54, 18);
        break;

      case 20: // Astral Leviathan Titan (Elongated star titan fortress)
        ctx.moveTo(78, -10);
        ctx.lineTo(78, 10);
        ctx.lineTo(52, 26);
        ctx.lineTo(18, 32);
        ctx.lineTo(-38, 32);
        ctx.lineTo(-54, 18);
        ctx.lineTo(-40, 0);
        ctx.lineTo(-54, -18);
        ctx.lineTo(-38, -32);
        ctx.lineTo(18, -32);
        ctx.lineTo(52, -26);
        break;

      case 21: // Chronos World-Engine (Elongated celestial ark)
        ctx.moveTo(82, 0);
        ctx.lineTo(56, -18);
        ctx.lineTo(18, -34);
        ctx.lineTo(-38, -34);
        ctx.lineTo(-58, -18);
        ctx.lineTo(-42, 0);
        ctx.lineTo(-58, 18);
        ctx.lineTo(-38, 34);
        ctx.lineTo(18, 34);
        ctx.lineTo(56, 18);
        break;

      case 22: // Ouroboros Infinity Flagship (Supreme elongated cosmic supercarrier)
      default:
        ctx.moveTo(88, -12);
        ctx.lineTo(88, 12);
        ctx.lineTo(60, 28);
        ctx.lineTo(22, 36);
        ctx.lineTo(-42, 36);
        ctx.lineTo(-64, 20);
        ctx.lineTo(-46, 0);
        ctx.lineTo(-64, -20);
        ctx.lineTo(-42, -36);
        ctx.lineTo(22, -36);
        ctx.lineTo(60, -28);
        break;
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Flight Deck Runway & Sci-Fi Carrier Visual Details (Tier 15+)
    if (tier >= 15) {
      // Runway Centerline dashed stripes
      ctx.save();
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(-16, -4);
      ctx.lineTo(tier >= 17 ? 56 : 46, -4);
      ctx.moveTo(-16, 4);
      ctx.lineTo(tier >= 17 ? 56 : 46, 4);
      ctx.stroke();
      ctx.restore();

      // Runway Arrestor Cables
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.0;
      [-10, -2, 6].forEach((rx) => {
        ctx.beginPath();
        ctx.moveTo(rx, -10);
        ctx.lineTo(rx, 10);
        ctx.stroke();
      });

      // Side Hangar Bays with Cyan/Green Glow
      ctx.fillStyle = '#064E3B';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1.0;
      ctx.fillRect(-12, -22, 18, 3.5);
      ctx.strokeRect(-12, -22, 18, 3.5);
      ctx.fillRect(-12, 18.5, 18, 3.5);
      ctx.strokeRect(-12, 18.5, 18, 3.5);

      // Port/Starboard Navigation Lights
      ctx.fillStyle = '#EF4444'; // Port red
      ctx.beginPath();
      ctx.arc(tier >= 17 ? 50 : 38, -14, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10B981'; // Starboard green
      ctx.beginPath();
      ctx.arc(tier >= 17 ? 50 : 38, 14, 2, 0, Math.PI * 2);
      ctx.fill();

      // Island Command Superstructure
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#00F0FF';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-8, -16, 14, 7);
      ctx.fillRect(-8, -16, 14, 7);
      ctx.fillStyle = '#00F0FF';
      ctx.fillRect(-6, -14, 10, 2);
    }

    // Additional glowing hull details for top-tier titans (Tier 14+)
    if (tier >= 14) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-10, -8, 18, 16);
    }
    if (tier === 16 || tier === 21 || tier === 22) {
      // Quantum Resonance Ring Arrays
      ctx.strokeStyle = 'rgba(255, 221, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Glowing cyan cockpit canopy
    ctx.fillStyle = '#00F0FF';
    ctx.beginPath();
    ctx.ellipse(tier >= 8 ? 6 : 3, 0, tier >= 8 ? 8 : 6, tier >= 8 ? 4 : 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const wingDist = 12 + Math.min(tier * 1.2, 20);
    const podDist = 8 + Math.min(tier * 1.0, 16);
    const exhaustBack = -12 - Math.min(tier * 0.8, 14);

    // Twin plasma gun barrels if upgraded
    if (weaponLvl >= 2) {
      ctx.fillStyle = weaponLvl >= 8 ? '#A855F7' : weaponLvl >= 7 ? '#EC4899' : weaponLvl >= 6 ? '#34D399' : weaponLvl >= 5 ? '#FFDD00' : weaponLvl >= 4 ? '#FF3366' : weaponLvl >= 3 ? '#A855F7' : '#00F0FF';
      ctx.fillRect(-2, -wingDist - 2, 8, 3);
      ctx.fillRect(-2, wingDist - 1, 8, 3);
    }

    // Torpedo launcher pods if equipped
    if (ship.hasTorpedoLauncher) {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#FB923C';
      ctx.lineWidth = 1;
      ctx.strokeRect(-4, -podDist - 2, 8, 4);
      ctx.strokeRect(-4, podDist - 2, 8, 4);
      ctx.fillStyle = '#FB923C';
      ctx.fillRect(4, -podDist - 1, 2, 2);
      ctx.fillRect(4, podDist - 1, 2, 2);
    }

    // Auto Flak Point-Defense Turrets if equipped
    if (ship.hasAutoTurrets) {
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(-2, -6, 2.5, 0, Math.PI * 2);
      ctx.arc(-2, 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Auto-Targeting Phaser Beam Lance Emitter Mount
    if (ship.hasBeamWeapon) {
      ctx.fillStyle = '#0284C7';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(tier >= 8 ? 14 : 10, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pulsing cyan emitter core
      ctx.fillStyle = '#00F0FF';
      ctx.beginPath();
      ctx.arc(tier >= 8 ? 14 : 10, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Thruster engine flame if active
    if (ship.isThrusting) {
      ctx.fillStyle = '#FFDD00';
      ctx.beginPath();
      ctx.moveTo(exhaustBack, -4);
      ctx.lineTo(exhaustBack - 14 - Math.random() * 8, 0);
      ctx.lineTo(exhaustBack, 4);
      ctx.closePath();
      ctx.fill();

      if (tier >= 2) {
        // Dual side flames
        ctx.fillStyle = '#00F0FF';
        ctx.fillRect(exhaustBack - 6, -10, 6, 2);
        ctx.fillRect(exhaustBack - 6, 8, 6, 2);
      }
      if (tier >= 8) {
        // Quad thrusters for capital ships
        ctx.fillStyle = '#FFDD00';
        ctx.fillRect(exhaustBack - 8, -18, 6, 2.5);
        ctx.fillRect(exhaustBack - 8, 16, 6, 2.5);
      }
    }

    // Active Shield Barrier (Rounded rectangular deflector shield barrier matching flagship hull)
    if (ship.shield > 0) {
      const pBox = getPlayerBoundingBox(tier, 1.0);
      const shieldAlpha = Math.min(0.65, 0.2 + (ship.shield / ship.maxShield) * 0.35);
      ctx.strokeStyle = `rgba(0, 240, 255, ${shieldAlpha})`;
      ctx.lineWidth = 2.0;
      const sL = pBox.halfLength + 8;
      const sW = pBox.halfWidth + 8;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-sL + pBox.forwardOffset, -sW, sL * 2, sW * 2, 14);
      } else {
        ctx.rect(-sL + pBox.forwardOffset, -sW, sL * 2, sW * 2);
      }
      ctx.stroke();

      // Shield corner capacitor accents
      ctx.strokeStyle = `rgba(56, 189, 248, ${shieldAlpha * 0.7})`;
      ctx.lineWidth = 1.0;
      ctx.strokeRect(-sL + pBox.forwardOffset + 2, -sW + 2, sL * 2 - 4, sW * 2 - 4);
    }

    ctx.restore();
  }
}
