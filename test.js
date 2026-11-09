import test from 'node:test';
import assert from 'node:assert/strict';
import { contentRect, ledges, step, pickLeader, R } from './lib.js';

const bounds = { left: 0, right: 2000 };

test('content rect skips the title bar and borders', () => {
  assert.deepEqual(contentRect({ screenX: 100, screenY: 50, outerWidth: 816, outerHeight: 639, innerWidth: 800, innerHeight: 550 }),
    { left: 108, top: 131, width: 800, height: 550 });
});

test('a marble lands on a window bottom, rolls off the end, and lands on the next window down', () => {
  const floors = ledges([{ left: 0, top: 0, width: 300, height: 300 }, { left: 250, top: 300, width: 400, height: 300 }]);
  const m = { id: 1, x: 100, y: 100, vx: 0, vy: 0 };
  let landed1 = false, landed2 = false;
  for (let i = 0; i < 600; i++) {
    step([m], floors, 1 / 60, bounds);
    if (m.vy === 0 && Math.abs(m.y - (300 - R)) < 1) landed1 = true;
    if (m.vy === 0 && Math.abs(m.y - (600 - R)) < 1) landed2 = true;
  }
  assert.ok(landed1 && landed2, 'should rest on both ledges in turn');
});

test('fast marbles never tunnel through a ledge', () => {
  const m = { id: 1, x: 50, y: 0, vx: 0, vy: 9000 };
  step([m], ledges([{ left: 0, top: 0, width: 100, height: 200 }]), 1 / 30, bounds);
  assert.ok(m.y <= 200 - R + 1e-9);
});

test('scoring through the cup mouth, and leader election', () => {
  const m = { id: 7, x: 500, y: 390, vx: 0, vy: 600 };
  assert.deepEqual(step([m], [], 1 / 30, bounds, { x: 505, y: 400, w: 70 }), [7]);
  assert.equal(pickLeader({ '0002-b': { seen: 1000 }, '0001-a': { seen: 0 } }, '0003-c', 2000), '0002-b'); // 0001 timed out
});
