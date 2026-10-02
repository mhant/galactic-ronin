import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Compass } from 'lucide-react';

export const RadarMinimap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    let lastRenderTime = 0;
    const FRAME_INTERVAL = 1000 / 30; // 30 FPS radar sweep

    const render = (currentTime: number) => {
      animId = requestAnimationFrame(render);

      if (currentTime - lastRenderTime < FRAME_INTERVAL) {
        return;
      }
      lastRenderTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const radarRange = 2800; // Units covered by radar
      const scale = (center - 8) / radarRange;

      ctx.clearRect(0, 0, size, size);

      // Radar background circle
      ctx.fillStyle = 'rgba(11, 17, 32, 0.9)';
      ctx.beginPath();
      ctx.arc(center, center, center - 2, 0, Math.PI * 2);
      ctx.fill();

      // Outer border & range circles
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(center, center, (center - 8) * 0.5, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(center, 4);
      ctx.lineTo(center, size - 4);
      ctx.moveTo(4, center);
      ctx.lineTo(size - 4, center);
      ctx.stroke();

      // Radar sweep
      const now = performance.now() * 0.002;
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(now);
      const gradient = ctx.createLinearGradient(0, 0, center - 8, 0);
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, center - 8, 0, 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const { ship, world } = useGameStore.getState();
      if (!ship || !world) return;

      // 1. Draw Asteroids (Fast AABB pre-cull + dot rendering)
      for (const ast of (world.asteroids || [])) {
        const rawDx = ast.x - ship.x;
        const rawDy = ast.y - ship.y;
        if (Math.abs(rawDx) > radarRange || Math.abs(rawDy) > radarRange) continue;

        const dx = rawDx * scale;
        const dy = rawDy * scale;
        if (dx * dx + dy * dy < (center - 6) * (center - 6)) {
          const isFusion = ast.oreType === 'fusion_cells';
          ctx.fillStyle = isFusion ? '#00F0FF' : '#F59E0B';
          ctx.beginPath();
          ctx.arc(center + dx, center + dy, isFusion ? 2.5 : 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Draw Stations (In range: diamond; Out of range: perimeter chevron + distance)
      for (const st of (world.stations || [])) {
        const dx = (st.x - ship.x) * scale;
        const dy = (st.y - ship.y) * scale;
        const distPixels = Math.hypot(dx, dy);
        const actualDist = Math.hypot(st.x - ship.x, st.y - ship.y);

        if (distPixels < center - 10) {
          // Inside radar
          ctx.fillStyle = st.color;
          ctx.beginPath();
          ctx.rect(center + dx - 3.5, center + dy - 3.5, 7, 7);
          ctx.fill();
        } else {
          // Infinite scale: Clamp off-screen station to radar rim as directional pointer
          const angle = Math.atan2(dy, dx);
          const rimR = center - 8;
          const px = center + Math.cos(angle) * rimR;
          const py = center + Math.sin(angle) * rimR;

          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(angle);
          ctx.fillStyle = st.color;
          ctx.beginPath();
          ctx.moveTo(5, 0);
          ctx.lineTo(-4, -3.5);
          ctx.lineTo(-2, 0);
          ctx.lineTo(-4, 3.5);
          ctx.closePath();
          ctx.fill();

          // Distance tag
          ctx.rotate(-angle);
          ctx.font = 'bold 8px monospace';
          ctx.fillStyle = st.color;
          ctx.textAlign = 'center';
          const distK = (actualDist / 1000).toFixed(1) + 'k';
          ctx.fillText(distK, 0, py < center ? 11 : -6);
          ctx.restore();
        }
      }

      // 3. Draw Active Defense Escort Drones
      const drones = world.drones || [];
      for (const d of drones) {
        const dx = (d.x - ship.x) * scale;
        const dy = (d.y - ship.y) * scale;
        if (Math.hypot(dx, dy) < center - 6) {
          ctx.fillStyle = '#34D399';
          ctx.beginPath();
          ctx.arc(center + dx, center + dy, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Mini defense escort perimeter ring
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(center + dx, center + dy, 4.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 4. Draw Points of Interest (POIs)
      const pois = world.pointsOfInterest || [];
      for (const poi of pois) {
        const dx = (poi.x - ship.x) * scale;
        const dy = (poi.y - ship.y) * scale;
        const distPixels = Math.hypot(dx, dy);
        const poiColor =
          poi.type === 'STATION'
            ? '#00F0FF'
            : poi.type === 'FUSION_ASTEROID'
            ? '#F59E0B'
            : '#EF4444';

        if (distPixels < center - 10) {
          ctx.save();
          ctx.fillStyle = poiColor;
          ctx.shadowColor = poiColor;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(center + dx, center + dy, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // Off-radar POI indicator ring
          const angle = Math.atan2(dy, dx);
          const rimR = center - 6;
          const px = center + Math.cos(angle) * rimR;
          const py = center + Math.sin(angle) * rimR;

          ctx.save();
          ctx.translate(px, py);
          ctx.fillStyle = poiColor;
          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 5. Draw Enemies (Orange for -30% to -5%, Red for -5% to +5%, Purple for >+5%)
      for (const enemy of (world.enemies || [])) {
        const dx = (enemy.x - ship.x) * scale;
        const dy = (enemy.y - ship.y) * scale;
        if (Math.hypot(dx, dy) < center - 6) {
          const dotColor = enemy.threatColor || (enemy.threatLevel === 'STRONGER' ? '#A855F7' : enemy.threatLevel === 'WEAKER' ? '#F97316' : '#EF4444');
          const isStronger = enemy.threatLevel === 'STRONGER';
          const baseRadius = (enemy.scale || 1.0) * 1.8;
          const dotRadius = isStronger ? Math.max(3.8, baseRadius + 1.0) : Math.max(2.4, baseRadius);

          ctx.save();
          if (isStronger) {
            ctx.shadowColor = '#A855F7';
            ctx.shadowBlur = 6;
          }
          ctx.fillStyle = dotColor;
          ctx.beginPath();
          ctx.arc(center + dx, center + dy, dotRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 5b. Draw Floating Salvage & Loot Pods (Twinkling color-coded blips)
      const loots = world.floatingLoot || [];
      const lootPulse = Math.sin(performance.now() * 0.006) * 0.4 + 0.6;
      for (const loot of loots) {
        const dx = (loot.x - ship.x) * scale;
        const dy = (loot.y - ship.y) * scale;
        if (Math.hypot(dx, dy) < center - 6) {
          const type = loot.lootType || 'CARGO';
          const blipColor =
            type === 'CREDITS'
              ? '#FBBF24'
              : type === 'MISSILES'
              ? '#F97316'
              : type === 'FUEL'
              ? '#A855F7'
              : type === 'REPAIR'
              ? '#10B981'
              : '#00F0FF';

          ctx.fillStyle = blipColor;
          ctx.beginPath();
          ctx.arc(center + dx, center + dy, 1.8 * lootPulse, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 6. Draw Player (Cyan triangle in center)
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(ship.rotation);
      ctx.fillStyle = '#00F0FF';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 rounded-lg p-2.5 shadow-2xl pointer-events-auto">
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-cyan-900/60 font-mono text-[11px] text-cyan-400">
        <span className="flex items-center gap-1 font-bold">
          <Compass className="w-3.5 h-3.5 text-cyan-400" /> RADAR SCOPE
        </span>
        <span className="text-[10px] text-slate-400">2.8k RAD</span>
      </div>
      <canvas
        ref={canvasRef}
        width={140}
        height={140}
        className="block rounded-full mx-auto"
      />
    </div>
  );
};
