// Pure logic shared by the page and the tests. All positions are SCREEN pixels (y grows down).

export const G = 1800, R = 13, BOUNCE = 0.45, MIN_ROLL = 45;

// The part of the screen a window's page actually covers (skips title bar, tabs, borders).
export function contentRect(w) {
  const side = Math.max(0, (w.outerWidth - w.innerWidth) / 2);
  return { left: w.screenX + side, top: w.screenY + Math.max(0, w.outerHeight - w.innerHeight - side), width: w.innerWidth, height: w.innerHeight };
}

// Every window's bottom edge is a ledge marbles can land on and roll along.
export const ledges = rects => rects.map(r => ({ x0: r.left, x1: r.left + r.width, y: r.top + r.height }));

// Advance marbles by dt seconds. Returns ids of marbles that fell through the cup's mouth.
export function step(marbles, floors, dt, bounds, cup) {
  const scored = [];
  const n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n; // small substeps so fast marbles can't tunnel through a ledge
  for (const m of marbles) for (let s = 0; s < n; s++) {
    const py = m.y;
    m.vy += G * h; m.x += m.vx * h; m.y += m.vy * h;
    for (const f of floors) {
      if (py + R <= f.y + 0.5 && m.y + R > f.y && m.x >= f.x0 && m.x <= f.x1) {
        m.y = f.y - R;
        m.vy = Math.abs(m.vy) < 120 ? 0 : -m.vy * BOUNCE;
        if (Math.abs(m.vx) < MIN_ROLL) m.vx = (Math.sign(m.vx) || 1) * MIN_ROLL; // keep rolling so it always leaves a ledge
        m.vx *= 0.999;
      }
    }
    if (m.x < bounds.left + R) { m.x = bounds.left + R; m.vx = Math.abs(m.vx); }
    if (m.x > bounds.right - R) { m.x = bounds.right - R; m.vx = -Math.abs(m.vx); }
    if (cup && py < cup.y && m.y >= cup.y && Math.abs(m.x - cup.x) < cup.w / 2 - R / 2 && !scored.includes(m.id)) scored.push(m.id);
  }
  return scored;
}

// Oldest live window leads (runs the physics); the rest just draw. Ids start with a timestamp.
export function pickLeader(peers, selfId, now, ttl = 1500) {
  const live = [selfId, ...Object.entries(peers).filter(([, p]) => now - p.seen < ttl).map(([id]) => id)];
  return live.sort()[0];
}
