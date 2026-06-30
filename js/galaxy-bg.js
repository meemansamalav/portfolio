/**
 * galaxy-bg.js — Procedural galaxy background.
 * Dense, high-resolution feel without a giant bitmap asset.
 */

const STAR_LAYERS = [
  { count: 140, speed: 0.018, size: [0.35, 1.1], alpha: [0.16, 0.42] },
  { count: 90,  speed: 0.038, size: [0.5, 1.6],  alpha: [0.2, 0.56] },
  { count: 44,  speed: 0.075, size: [0.75, 2.0], alpha: [0.24, 0.7] },
];

function rand(seed) {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function makeStars(width, height) {
  return STAR_LAYERS.map((layer, layerIndex) => ({
    ...layer,
    stars: Array.from({ length: layer.count }, (_, i) => {
      const base = (layerIndex + 1) * 10000 + i * 17;
      const sizeMin = layer.size[0];
      const sizeMax = layer.size[1];
      const alphaMin = layer.alpha[0];
      const alphaMax = layer.alpha[1];

      return {
        x: rand(base) * width,
        y: rand(base + 1) * height,
        r: sizeMin + rand(base + 2) * (sizeMax - sizeMin),
        a: alphaMin + rand(base + 3) * (alphaMax - alphaMin),
        phase: rand(base + 4) * Math.PI * 2,
      };
    }),
  }));
}

function drawStarField(ctx, layers, width, height, time) {
  layers.forEach(layer => {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    layer.stars.forEach(star => {
      const driftX = (time * layer.speed * width * 0.025) % width;
      const driftY = Math.sin(time * layer.speed + star.phase) * 8;
      const x = (star.x + driftX) % width;
      const y = (star.y + driftY + height) % height;
      const twinkle = 0.72 + Math.sin(time * 1.6 + star.phase) * 0.28;

      ctx.beginPath();
      ctx.fillStyle = `rgba(232, 230, 255, ${star.a * twinkle})`;
      ctx.arc(x, y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  });
}

function drawGalaxy(ctx, width, height, time, scrollProgress) {
  const cx = width * 0.5;
  const cy = height * 0.54;
  const minSide = Math.min(width, height);
  const maxSide = Math.max(width, height);
  const flip = scrollProgress * Math.PI * 0.72;
  const tilt = Math.sin(flip);
  const diskWidth = maxSide * 1.55;
  const diskHeight = Math.max(minSide * (0.09 + tilt * 0.2), 52);
  const angle = -0.045 + tilt * 0.33;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = 'screen';

  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, diskWidth * 0.45);
  halo.addColorStop(0, 'rgba(232, 230, 255, 0.12)');
  halo.addColorStop(0.28, 'rgba(124, 58, 237, 0.14)');
  halo.addColorStop(0.58, 'rgba(14, 165, 233, 0.08)');
  halo.addColorStop(1, 'rgba(5, 5, 8, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(-diskWidth * 0.55, -diskWidth * 0.35, diskWidth * 1.1, diskWidth * 0.7);

  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, diskWidth * 0.18);
  core.addColorStop(0, 'rgba(255, 244, 214, 0.24)');
  core.addColorStop(0.34, 'rgba(219, 39, 119, 0.16)');
  core.addColorStop(0.72, 'rgba(124, 58, 237, 0.09)');
  core.addColorStop(1, 'rgba(5, 5, 8, 0)');
  ctx.fillStyle = core;
  ctx.fillRect(-diskWidth * 0.22, -diskWidth * 0.22, diskWidth * 0.44, diskWidth * 0.44);

  for (let i = 0; i < 1800; i++) {
    const seed = i * 31;
    
    // Elliptical orbit parameters
    const orbitSize = rand(seed) * diskWidth * 0.5;
    const eccentricity = 0.15 + rand(seed + 1) * 0.2; 
    const orbitHeight = orbitSize * eccentricity;
    
    // Position on orbit
    const phase = rand(seed + 2) * Math.PI * 2;
    // Inner particles orbit faster. Direction can be forward or backward, but mostly forward
    const speed = (0.2 + rand(seed + 3) * 0.3) * (rand(seed + 4) > 0.8 ? -1 : 1) / (orbitSize / diskWidth + 0.05);
    
    // Add scroll progress and time to the angle
    const currentAngle = phase + (time * 0.15 + scrollProgress * 15.0) * speed;
    
    const x = Math.cos(currentAngle) * orbitSize;
    // Add some random vertical noise (bandNoise) like before
    const bandNoise = (rand(seed + 5) - 0.5) * diskHeight * 0.5;
    const y = Math.sin(currentAngle) * orbitHeight + bandNoise;
    
    const dist = orbitSize / (diskWidth * 0.5);
    const dust = 1 - dist;
    
    // User requested BIGGER particles
    const starR = 1.0 + rand(seed + 6) * (dist < 0.22 ? 3.5 : 2.0);
    const alpha = (0.05 + dust * 0.2) * (0.75 + tilt * 0.18);
    const huePick = rand(seed + 7);

    if (huePick < 0.58) ctx.fillStyle = `rgba(232, 230, 255, ${alpha})`;
    else if (huePick < 0.82) ctx.fillStyle = `rgba(14, 165, 233, ${alpha * 0.9})`;
    else ctx.fillStyle = `rgba(219, 39, 119, ${alpha * 0.72})`;

    ctx.beginPath();
    ctx.arc(x, y, starR, 0, Math.PI * 2);
    ctx.fill();
  }

  const lane = ctx.createLinearGradient(0, -diskHeight, 0, diskHeight);
  lane.addColorStop(0, 'rgba(5, 5, 8, 0)');
  lane.addColorStop(0.42, 'rgba(5, 5, 8, 0.18)');
  lane.addColorStop(0.54, 'rgba(5, 5, 8, 0.28)');
  lane.addColorStop(1, 'rgba(5, 5, 8, 0)');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = lane;
  ctx.fillRect(-diskWidth * 0.52, -diskHeight * 1.4, diskWidth * 1.04, diskHeight * 2.8);

  ctx.restore();
}

export function initGalaxyBackground() {
  const canvas = document.getElementById('galaxy-bg');
  if (!canvas) return null;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return null;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let layers = [];
  let scrollProgress = 0;
  let rafId = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layers = makeStars(width, height);
  }

  function render(now) {
    const time = now * 0.001;
    ctx.clearRect(0, 0, width, height);
    drawStarField(ctx, layers, width, height, time);
    drawGalaxy(ctx, width, height, time, scrollProgress);
    rafId = requestAnimationFrame(render);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  rafId = requestAnimationFrame(render);

  return {
    setScrollProgress(progress) {
      scrollProgress = Math.max(0, Math.min(1, progress || 0));
    },
    destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    },
  };
}
