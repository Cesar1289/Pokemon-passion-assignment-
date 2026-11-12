import assert from 'node:assert/strict';
import { test } from 'node:test';
import { wishListTrend } from '../src/lib/wish-list-trend.ts';

const history = (first, last) => [
  { day: '2026-10-14', value: first },
  { day: '2026-11-12', value: last },
];

test('reports up, down, and unchanged from history rather than current price', () => {
  assert.equal(wishListTrend(history(100, 110)).label, '30D · Up 10.0%');
  assert.equal(wishListTrend(history(100, 90)).label, '30D · Down 10.0%');
  assert.equal(wishListTrend(history(100, 100)).label, '30D · Unchanged');
});

test('empty, single-point, and zero-baseline histories have an explicit unavailable state', () => {
  for (const points of [[], [{ day: '2026-11-12', value: 10 }], history(0, 10)]) {
    assert.equal(wishListTrend(points).direction, 'unavailable');
    assert.match(wishListTrend(points).label, /Not enough history/);
  }
});

test('small changes never display a misleading zero percent', () => {
  assert.equal(wishListTrend(history(100, 100.01)).label, '30D · Up <0.1%');
  assert.equal(wishListTrend(history(100, 99.99)).label, '30D · Down <0.1%');
});

test('accessible description discloses actual dates and partial coverage', () => {
  const trend = wishListTrend(history(100, 110));
  assert.match(trend.description, /2026-10-14 to 2026-11-12/);
  assert.match(trend.description, /2 daily records in the last 30 days/);
});
