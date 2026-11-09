import { contentRect, ledges, step, pickLeader, R } from './lib.js';

const $ = id => document.getElementById(id);
const cv = $('c'), g = cv.getContext('2d');
const id = Date.now().toString(36).padStart(10, '0') + '-' + Math.random().toString(36).slice(2, 6);
const bc = new BroadcastChannel('window-marbles');
const peers = {};
const COLORS = ['#ffb43a', '#ff5d73', '#5ee0c1', '#b48cff', '#e9f1ff'];
let state = { marbles: [], cup: null, score: 0, next: 1 }, me = contentRect(window), leader = id, lastHi = 0, pop = null;

// minimized or hidden windows report 0x0: they are not part of the world
const rects = () => [me, ...Object.values(peers).filter(p => Date.now() - p.seen < 1500).map(p => p.rect)].filter(r => r.width > 0 && r.height > 0);
const say = msg => bc.postMessage(msg);

bc.onmessage = ({ data: m }) => {
  if (m.type === 'hi') peers[m.id] = { rect: m.rect, seen: Date.now() };
  else if (m.type === 'bye') delete peers[m.id];
  else if (m.type === 'state' && leader !== id) state = m.state;
  else if (m.type === 'drop' && leader === id) drop(m.x, m.y);
  else if (m.type === 'rain' && leader === id) rain();
  else if (m.type === 'pop') pop = { x: m.x, y: m.y, t: performance.now() };
};
addEventListener('pagehide', () => say({ type: 'bye', id }));

function drop(x, y) {
  state.marbles.push({ id: state.next++, x, y, vx: (Math.random() - 0.5) * 120, vy: 0, c: COLORS[state.next % COLORS.length] });
  if (state.marbles.length > 80) state.marbles.shift();
}
// ??? — eight marbles along the top of every open window
function rain() { for (const r of rects()) for (let i = 0; i < 8; i++) drop(r.left + R + Math.random() * (r.width - 2 * R), r.top + R); }

// The cup sits inside one of the open windows, fixed in SCREEN space. Move windows to reach it.
function newCup() {
  const all = rects(), r = all[Math.floor(Math.random() * all.length)];
  state.cup = { x: r.left + 60 + Math.random() * Math.max(0, r.width - 120), y: r.top + r.height * (0.45 + Math.random() * 0.3), w: 70 };
}

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 20); last = now;
  me = contentRect(window);
  if (now - lastHi > 200) { say({ type: 'hi', id, rect: me }); lastHi = now; }
  leader = pickLeader(peers, id, Date.now());
  if (leader === id) {
    const all = rects();
    if (!all.length) { requestAnimationFrame(frame); return; }
    if (!state.cup) newCup();
    const left = Math.min(...all.map(r => r.left)), right = Math.max(...all.map(r => r.left + r.width));
    const floor = Math.max(...all.map(r => r.top + r.height));
    for (const sid of step(state.marbles, ledges(all), dt, { left, right }, state.cup)) {
      state.marbles = state.marbles.filter(m => m.id !== sid);
      state.score++;
      pop = { x: state.cup.x, y: state.cup.y, t: now };
      say({ type: 'pop', x: pop.x, y: pop.y });
      newCup();
    }
    state.marbles = state.marbles.filter(m => m.y < floor + 400);
    say({ type: 'state', state });
  }
  draw(now);
  requestAnimationFrame(frame);
}

function draw(now) {
  const dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#12284a'; g.fillRect(0, 0, W, H);
  g.translate(-me.left, -me.top); // from here on, draw in SCREEN coordinates
  // blueprint grid locked to the screen, so every window looks onto the same sheet
  g.strokeStyle = 'rgba(160,200,255,.09)'; g.lineWidth = 1; g.beginPath();
  for (let x = Math.ceil(me.left / 40) * 40; x < me.left + W; x += 40) { g.moveTo(x + .5, me.top); g.lineTo(x + .5, me.top + H); }
  for (let y = Math.ceil(me.top / 40) * 40; y < me.top + H; y += 40) { g.moveTo(me.left, y + .5); g.lineTo(me.left + W, y + .5); }
  g.stroke();
  // every window's ledge, including other windows' ledges that pass through this one
  g.fillStyle = '#ffb43a';
  for (const f of ledges(rects())) g.fillRect(f.x0, f.y - 5, f.x1 - f.x0, 5);
  const cup = state.cup;
  if (cup) {
    g.strokeStyle = '#5ee0c1'; g.lineWidth = 4; g.lineCap = g.lineJoin = 'round';
    g.beginPath(); g.moveTo(cup.x - cup.w / 2, cup.y - 6); g.lineTo(cup.x - cup.w / 2 + 8, cup.y + 34); g.lineTo(cup.x + cup.w / 2 - 8, cup.y + 34); g.lineTo(cup.x + cup.w / 2, cup.y - 6); g.stroke();
  }
  for (const m of state.marbles) {
    g.fillStyle = m.c; g.beginPath(); g.arc(m.x, m.y, R, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(m.x - 4, m.y - 4, 4, 0, 7); g.fill();
  }
  const age = pop ? Math.max(0, now - pop.t) : Infinity;
  if (age < 700) {
    const k = age / 700;
    g.strokeStyle = `rgba(94,224,193,${1 - k})`; g.lineWidth = 3;
    g.beginPath(); g.arc(pop.x, pop.y + 14, 20 + k * 90, 0, 7); g.stroke();
  }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (cup && !(cup.x > me.left && cup.x < me.left + W && cup.y > me.top && cup.y < me.top + H)) arrowTo(cup, W, H);
  const n = rects().length;
  $('status').textContent = `${n} window${n > 1 ? 's' : ''}${leader === id ? ' · this one runs the physics' : ''}`;
  $('score').textContent = state.score;
  $('hint').classList.toggle('off', state.marbles.length > 0 && n > 1);
}

// Cup outside this window: an arrow on the edge points at it.
function arrowTo(cup, W, H) {
  const cx = W / 2, cy = H / 2, a = Math.atan2(cup.y - (me.top + cy), cup.x - (me.left + cx));
  const k = Math.min((W / 2 - 30) / Math.max(Math.abs(Math.cos(a)), 1e-9), (H / 2 - 30) / Math.max(Math.abs(Math.sin(a)), 1e-9));
  g.save(); g.translate(cx + Math.cos(a) * k, cy + Math.sin(a) * k); g.rotate(a);
  g.fillStyle = '#5ee0c1'; g.beginPath(); g.moveTo(14, 0); g.lineTo(-8, -9); g.lineTo(-8, 9); g.fill(); g.restore();
}

cv.addEventListener('click', e => {
  const x = me.left + e.clientX, y = me.top + e.clientY;
  if (leader === id) drop(x, y); else say({ type: 'drop', x, y });
});
$('spawn').onclick = () => {
  const w = Math.max(360, Math.round(outerWidth * 0.8)), h = Math.max(280, Math.round(outerHeight * 0.6));
  window.open(location.href, '_blank', `popup,width=${w},height=${h},left=${screenX + 60},top=${screenY + outerHeight - 40}`);
};
let typed = '';
addEventListener('keydown', e => {
  if (e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-4);
  if (typed === 'rain') { typed = ''; if (leader === id) rain(); else say({ type: 'rain' }); }
});
requestAnimationFrame(frame);
