// Gobble Dash — particles. One job: feathers, dust puffs, corn sparkles
// and escape confetti, all drawn as simple shapes, no images.
export function createParticles() {
  return [];
}

export function burst(particles, x, y, opts = {}) {
  const count = opts.count || 10;
  const color = opts.color || '#fff';
  const speed = opts.speed || 160;
  const size = opts.size || 4;
  const life = opts.life || 0.7;
  const gravity = opts.gravity ?? 300;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 60,
      life: life * (0.6 + Math.random() * 0.7),
      maxLife: life,
      size: size * (0.6 + Math.random() * 0.8),
      color,
      gravity,
      spin: (Math.random() - 0.5) * 10,
      rot: Math.random() * 6.28,
      feather: !!opts.feather,
    });
  }
}

export function featherBurst(particles, x, y) {
  burst(particles, x, y - 20, { count: 14, color: '#ffffff', speed: 120, size: 7, life: 1.1, gravity: 120, feather: true });
  burst(particles, x, y - 10, { count: 6, color: '#e8a34c', speed: 90, size: 4, life: 0.8, gravity: 200 });
}

export function dustPuff(particles, x, y) {
  burst(particles, x, y, { count: 5, color: '#d9b380', speed: 60, size: 5, life: 0.45, gravity: -40 });
}

export function cornSparkle(particles, x, y) {
  burst(particles, x, y, { count: 7, color: '#ffd94d', speed: 110, size: 3, life: 0.5, gravity: 60 });
}

export function confetti(particles, x, y) {
  const colors = ['#ff5a3c', '#ffd94d', '#7bc950', '#4da6ff', '#ff8ad8'];
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 500,
      y: y - 40 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 60,
      vy: 40 + Math.random() * 80,
      life: 2.2,
      maxLife: 2.2,
      size: 5 + Math.random() * 4,
      color: colors[i % colors.length],
      gravity: 60,
      spin: (Math.random() - 0.5) * 12,
      rot: Math.random() * 6.28,
      feather: false,
    });
  }
}

export function updateParticles(particles, dt) {
  for (const p of particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.gravity * dt;
    p.rot += p.spin * dt;
  }
  return particles.filter((p) => p.life > 0);
}
