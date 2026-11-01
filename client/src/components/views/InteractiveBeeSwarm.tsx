import React, { useEffect, useRef } from 'react';

interface BeeState {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  targetX: number;
  targetY: number;
  mode: 'HOVER' | 'DART';
  modeTimer: number;
  facing: 1 | -1;
  fleeFactor: number; // 0.0 (calm) to 1.0 (panicked evasion)
  evadeSign: 1 | -1;
  wanderRadiusX: number;
  wanderRadiusY: number;
  repelRadius: number;
  cruiseSpeed: number;
  fleeSpeed: number;
  phase: number;
  hopCount: number;
}

interface BeeConfig {
  id: number;
  anchorXPercent: number; // relative to hero width (0..1)
  anchorYPercent: number; // relative to hero height (0..1)
  wanderRadiusX: number;
  wanderRadiusY: number;
  repelRadius: number;
  cruiseSpeed: number;
  fleeSpeed: number;
  evadeSign: 1 | -1;
  sizeClass: string;
}

const BEE_CONFIGS: BeeConfig[] = [
  {
    // Bee 1: Sky Scout over right grass (Grass01.svg)
    id: 1,
    anchorXPercent: 0.82,
    anchorYPercent: 0.20,
    wanderRadiusX: 160,
    wanderRadiusY: 110,
    repelRadius: 185,
    cruiseSpeed: 175,
    fleeSpeed: 640,
    evadeSign: 1,
    sizeClass: 'w-8 sm:w-10',
  },
  {
    // Bee 2: Inquisitive worker near "it"
    id: 2,
    anchorXPercent: 0.28,
    anchorYPercent: 0.44,
    wanderRadiusX: 110,
    wanderRadiusY: 85,
    repelRadius: 155,
    cruiseSpeed: 205,
    fleeSpeed: 700,
    evadeSign: -1,
    sizeClass: 'w-5 sm:w-6',
  },
  {
    // Bee 3: Flower Forager hovering over left grass (Grass02.svg)
    id: 3,
    anchorXPercent: 0.18,
    anchorYPercent: 0.70,
    wanderRadiusX: 170,
    wanderRadiusY: 100,
    repelRadius: 170,
    cruiseSpeed: 165,
    fleeSpeed: 610,
    evadeSign: 1,
    sizeClass: 'w-7 sm:w-9',
  },
  {
    // Bee 4: Playful Sky Drifter above "Sketch"
    id: 4,
    anchorXPercent: 0.42,
    anchorYPercent: 0.15,
    wanderRadiusX: 130,
    wanderRadiusY: 90,
    repelRadius: 160,
    cruiseSpeed: 190,
    fleeSpeed: 670,
    evadeSign: -1,
    sizeClass: 'w-5 sm:w-6.5',
  },
];

export const InteractiveBeeSwarm: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const beeRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 720;

    // Robust dimension tracking via ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          width = entry.contentRect.width;
          height = entry.contentRect.height;
        }
      }
    });
    resizeObserver.observe(container);

    // Mouse / Pointer Tracking relative to hero container
    let mouseX = -9999;
    let mouseY = -9999;
    let mouseActive = false;
    let mouseInactiveTimer: ReturnType<typeof setTimeout> | null = null;

    const onPointerMove = (e: PointerEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      mouseActive = true;

      if (mouseInactiveTimer) clearTimeout(mouseInactiveTimer);
      mouseInactiveTimer = setTimeout(() => {
        mouseActive = false;
      }, 3000);
    };

    const onPointerLeave = () => {
      mouseActive = false;
      mouseX = -9999;
      mouseY = -9999;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('blur', onPointerLeave);

    // Initialize individual bee states
    const bees: BeeState[] = BEE_CONFIGS.map((cfg, i) => {
      const homeX = width * cfg.anchorXPercent;
      const homeY = height * cfg.anchorYPercent;
      return {
        id: cfg.id,
        x: homeX + (Math.random() - 0.5) * 50,
        y: homeY + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        homeX,
        homeY,
        targetX: homeX,
        targetY: homeY,
        mode: 'HOVER',
        modeTimer: 0.3 + i * 0.25,
        // The bee sprite naturally faces left (1 = natural left, -1 = flipped to face right)
        facing: (i % 2 === 0 ? 1 : -1) as 1 | -1,
        fleeFactor: 0,
        evadeSign: cfg.evadeSign,
        wanderRadiusX: cfg.wanderRadiusX,
        wanderRadiusY: cfg.wanderRadiusY,
        repelRadius: cfg.repelRadius,
        cruiseSpeed: cfg.cruiseSpeed,
        fleeSpeed: cfg.fleeSpeed,
        phase: Math.random() * 20,
        hopCount: 0,
      };
    });

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      // Clamp dt to avoid huge teleports on background tab resume
      const dt = Math.min(rawDt, 0.05);

      // Keep home coordinates synchronized with responsive container dimensions
      for (let i = 0; i < bees.length; i++) {
        bees[i].homeX = width * BEE_CONFIGS[i].anchorXPercent;
        bees[i].homeY = height * BEE_CONFIGS[i].anchorYPercent;
      }

      // Physics loop per bee
      for (let i = 0; i < bees.length; i++) {
        const bee = bees[i];
        bee.phase += dt;

        // -----------------------------------------------------------
        // 1. Interactive Cursor Repulsion (Active Evasion Physics)
        // -----------------------------------------------------------
        const dx = bee.x - mouseX;
        const dy = bee.y - mouseY;
        const distToMouse = Math.hypot(dx, dy);

        let isRepelling = false;
        if (mouseActive && distToMouse < bee.repelRadius) {
          isRepelling = true;
          const nx = dx / (distToMouse || 0.001);
          const ny = dy / (distToMouse || 0.001);

          // Proximity factor: 1.0 when right on top, 0.0 at threshold boundary
          const proximity = Math.pow((bee.repelRadius - distToMouse) / bee.repelRadius, 1.2);
          bee.fleeFactor = Math.min(1, bee.fleeFactor + proximity * 4.0 * dt + 0.35);

          // Evasive tangential deflection: dodges diagonally/sideways like a real surprised insect
          const tanX = -ny * bee.evadeSign * 0.42;
          const tanY = nx * bee.evadeSign * 0.42;

          // Strong repulsion acceleration away from the pointer
          const fleeForce = (bee.fleeSpeed * 2.6 * proximity) + 420;
          bee.vx += (nx + tanX) * fleeForce * dt;
          bee.vy += (ny + tanY) * fleeForce * dt;

          // Set immediate evasive escape target
          bee.targetX = bee.x + (nx + tanX) * (150 + Math.random() * 100);
          bee.targetY = bee.y + (ny + tanY) * (120 + Math.random() * 80);
          bee.mode = 'DART';
          bee.modeTimer = 0.5 + Math.random() * 0.4;
        } else {
          // Smoothly calm down when cursor is far
          bee.fleeFactor = Math.max(0, bee.fleeFactor - dt * 1.6);
        }

        // -----------------------------------------------------------
        // 2. Autonomous Hopping & Waggle Flight (Dart-and-Hover)
        // -----------------------------------------------------------
        if (!isRepelling) {
          bee.modeTimer -= dt;

          if (bee.mode === 'HOVER') {
            // Calm down velocity in hover mode
            bee.vx *= Math.pow(0.84, dt * 60);
            bee.vy *= Math.pow(0.84, dt * 60);

            // Natural hover oscillation: vertical bobbing and gentle wandering draft
            const bobFreq = 6.5 + (bee.id % 2) * 1.5;
            bee.vy += Math.sin(bee.phase * bobFreq) * 32 * dt;
            bee.vx += Math.cos(bee.phase * 3.0) * 18 * dt;

            // When hover time finishes, pick next waypoint and hop!
            if (bee.modeTimer <= 0) {
              bee.mode = 'DART';
              bee.hopCount++;

              // Alternate between short curious hops and longer exploratory sweeps
              const isLongHop = bee.hopCount % 3 === 0;
              bee.modeTimer = isLongHop ? 0.5 + Math.random() * 0.35 : 0.28 + Math.random() * 0.3;

              // Pick random target in its anchor zone
              const angle = Math.random() * Math.PI * 2;
              const rangeMultiplier = isLongHop ? 1.0 : 0.55;
              const rx = Math.pow(Math.random(), 0.6) * bee.wanderRadiusX * rangeMultiplier;
              const ry = Math.pow(Math.random(), 0.6) * bee.wanderRadiusY * rangeMultiplier;

              bee.targetX = bee.homeX + Math.cos(angle) * rx;
              bee.targetY = bee.homeY + Math.sin(angle) * ry;

              // Sudden energetic hop impulse toward target
              const tdx = bee.targetX - bee.x;
              const tdy = bee.targetY - bee.y;
              const tdist = Math.hypot(tdx, tdy) || 1;
              const hopSpeed = bee.cruiseSpeed * (isLongHop ? 1.3 : 1.0) * (0.85 + Math.random() * 0.4);
              bee.vx += (tdx / tdist) * hopSpeed;
              bee.vy += (tdy / tdist) * hopSpeed;
            }
          } else if (bee.mode === 'DART') {
            // Steer actively toward target
            const tdx = bee.targetX - bee.x;
            const tdy = bee.targetY - bee.y;
            const tdist = Math.hypot(tdx, tdy);

            if (tdist > 16) {
              const steerForce = 440;
              bee.vx += (tdx / tdist) * steerForce * dt;
              bee.vy += (tdy / tdist) * steerForce * dt;
            }

            if (bee.modeTimer <= 0 || tdist < 16) {
              // Reached destination: switch back to HOVER & waggle
              bee.mode = 'HOVER';
              bee.modeTimer = 0.4 + Math.random() * 0.85;
            }
          }
        }

        // -----------------------------------------------------------
        // 3. Velocity Clamping & Fluid Damping
        // -----------------------------------------------------------
        const currentSpeed = Math.hypot(bee.vx, bee.vy);
        const maxSpeed = bee.fleeFactor > 0.1 ? bee.fleeSpeed : bee.cruiseSpeed * 1.5;
        if (currentSpeed > maxSpeed) {
          bee.vx = (bee.vx / currentSpeed) * maxSpeed;
          bee.vy = (bee.vy / currentSpeed) * maxSpeed;
        }

        // Air drag
        const drag = bee.fleeFactor > 0.1 ? 0.96 : 0.92;
        bee.vx *= Math.pow(drag, dt * 60);
        bee.vy *= Math.pow(drag, dt * 60);

        // Integrate position
        bee.x += bee.vx * dt;
        bee.y += bee.vy * dt;

        // -----------------------------------------------------------
        // 4. Soft Boundary Deflection (Keep Bees Within Screen)
        // -----------------------------------------------------------
        const marginX = Math.min(50, width * 0.05);
        const marginY = 30;

        if (bee.x < marginX) {
          bee.vx += (marginX - bee.x) * 15 * dt;
          if (bee.x < 15) {
            bee.x = 15;
            bee.vx = Math.abs(bee.vx) * 0.6;
          }
        } else if (bee.x > width - marginX) {
          bee.vx -= (bee.x - (width - marginX)) * 15 * dt;
          if (bee.x > width - 15) {
            bee.x = width - 15;
            bee.vx = -Math.abs(bee.vx) * 0.6;
          }
        }

        if (bee.y < marginY) {
          bee.vy += (marginY - bee.y) * 15 * dt;
          if (bee.y < 15) {
            bee.y = 15;
            bee.vy = Math.abs(bee.vy) * 0.6;
          }
        } else if (bee.y > height - marginY) {
          bee.vy -= (bee.y - (height - marginY)) * 15 * dt;
          if (bee.y > height - 15) {
            bee.y = height - 15;
            bee.vy = -Math.abs(bee.vy) * 0.6;
          }
        }

        // -----------------------------------------------------------
        // 5. Facing Direction & Aerodynamic Banking
        // -----------------------------------------------------------
        // Note: The sprite naturally faces LEFT (scaleX = 1).
        // When flying right (vx > 18), scaleX = -1 flips the sprite to face right!
        if (bee.vx > 18) {
          bee.facing = -1;
        } else if (bee.vx < -18) {
          bee.facing = 1;
        }

        // Banking tilt: pitch nose down when diving, pitch nose up when climbing
        // Plus subtle roll into turns
        const pitchTilt = (-bee.vy * 0.06) * bee.facing;
        const rollTilt = (bee.vx * 0.03);
        const bank = Math.max(-22, Math.min(22, pitchTilt + rollTilt));

        // -----------------------------------------------------------
        // 6. Signature High-Frequency Waggle Dance Vibration
        // -----------------------------------------------------------
        // Calm: 24 Hz buzzing with ~9 deg waggle.
        // Fleeing: 48 Hz hyper-buzz with ~22 deg panicked flutter!
        const waggleFreq = 24 + bee.fleeFactor * 26;
        const waggleAmp = 8 + bee.fleeFactor * 14;
        const waggleAngle = Math.sin(bee.phase * waggleFreq) * waggleAmp;
        const waggleY = Math.cos(bee.phase * waggleFreq * 1.2) * (1.2 + bee.fleeFactor * 2.5);

        const totalRotation = bank + waggleAngle;

        // Apply hardware-accelerated transform directly (zero React re-renders)
        const el = beeRefs.current[i];
        if (el) {
          el.style.transform = `translate3d(${bee.x.toFixed(1)}px, ${(bee.y + waggleY).toFixed(1)}px, 0) scaleX(${bee.facing}) rotate(${totalRotation.toFixed(1)}deg)`;
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('blur', onPointerLeave);
      if (mouseInactiveTimer) clearTimeout(mouseInactiveTimer);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-25"
      aria-hidden="true"
    >
      {BEE_CONFIGS.map((cfg, idx) => (
        <div
          key={cfg.id}
          ref={(el) => {
            beeRefs.current[idx] = el;
          }}
          className="absolute top-0 left-0 will-change-transform select-none pointer-events-none"
          style={{
            // Placed safely before first RAF tick positions them
            transform: 'translate3d(-120px, -120px, 0)',
          }}
        >
          <img
            src="/assets/bee_cropped.png"
            alt=""
            className={`${cfg.sizeClass} h-auto select-none drop-shadow-xs`}
            draggable={false}
          />
        </div>
      ))}
    </div>
  );
};
