export interface LogEntry {
  id: string;
  timestamp: number;
  timeStr: string;
  category: 'COMBAT' | 'PERF' | 'STATE' | 'WARNING';
  message: string;
  data?: Record<string, any>;
}

class DiagnosticLogger {
  private static instance: DiagnosticLogger;
  private logs: LogEntry[] = [];
  private maxLogs: number = 300;
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();
  
  // Real-time metrics
  public currentFps: number = 60;
  public frameTimeMs: number = 16.6;
  public activeEnemiesCount: number = 0;
  public activeProjectilesCount: number = 0;
  public activeParticlesCount: number = 0;

  private constructor() {
    // Expose on window for direct devtools console inspection
    if (typeof window !== 'undefined') {
      (window as any).__RONIN_LOGGER__ = this;
    }
  }

  public static getInstance(): DiagnosticLogger {
    if (!DiagnosticLogger.instance) {
      DiagnosticLogger.instance = new DiagnosticLogger();
    }
    return DiagnosticLogger.instance;
  }

  public log(category: LogEntry['category'], message: string, data?: Record<string, any>) {
    const now = performance.now();
    const d = new Date();
    const timeStr = `${d.toTimeString().split(' ')[0]}.${Math.floor(d.getMilliseconds() / 10).toString().padStart(2, '0')}`;

    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      timeStr,
      category,
      message,
      data,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Output to browser console as well
    if (category === 'WARNING') {
      console.warn(`[RONIN ${category}] ${message}`, data || '');
    } else if (category === 'PERF') {
      console.info(`[RONIN ${category}] ${message}`, data || '');
    }

    this.notify();
  }

  private lastPerfLogTime: number = 0;

  public updateMetrics(fps: number, frameTimeMs: number, enemies: number, projectiles: number, particles: number) {
    this.currentFps = Math.round(fps);
    this.frameTimeMs = Number(frameTimeMs.toFixed(1));
    this.activeEnemiesCount = enemies;
    this.activeProjectilesCount = projectiles;
    this.activeParticlesCount = particles;

    const now = performance.now();
    if (fps < 38 && now - this.lastPerfLogTime > 4000) {
      this.lastPerfLogTime = now;
      this.log('PERF', `Low FPS Spike Detected: ${this.currentFps} FPS (${this.frameTimeMs}ms)`, {
        fps: this.currentFps,
        frameTimeMs: this.frameTimeMs,
        enemies,
        projectiles,
        particles,
      });
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear() {
    this.logs = [];
    this.notify();
  }

  public exportLogs(): string {
    return JSON.stringify(
      {
        metrics: {
          currentFps: this.currentFps,
          frameTimeMs: this.frameTimeMs,
          enemies: this.activeEnemiesCount,
          projectiles: this.activeProjectilesCount,
          particles: this.activeParticlesCount,
        },
        logs: this.logs,
      },
      null,
      2
    );
  }

  public subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const snapshot = this.getLogs();
    this.listeners.forEach((l) => l(snapshot));
  }
}

export const logger = DiagnosticLogger.getInstance();
