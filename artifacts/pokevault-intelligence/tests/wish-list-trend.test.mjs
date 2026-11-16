import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sortWishListItems, wishListTrend } from '../src/lib/wish-list-trend.ts';

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

const item = (cardId, points, marketPrice) => ({
  cardId,
  history: points,
  card: { marketPrice },
});

test('Wish List trend sorting puts the biggest drops first and unavailable history last', () => {
  const items = [
    item('rise', history(100, 120), 5),
    item('unavailable', [], 100),
    item('drop-a', history(100, 80), 30),
    item('drop-b', history(100, 90), 10),
  ];
  assert.deepEqual(sortWishListItems(items, 'trend_drop').map(({ cardId }) => cardId), [
    'drop-a', 'drop-b', 'rise', 'unavailable',
  ]);
  assert.deepEqual(sortWishListItems(items, 'trend_gain').map(({ cardId }) => cardId), [
    'rise', 'drop-b', 'drop-a', 'unavailable',
  ]);
});

test('Wish List price sorting uses current simulated prices and keeps tied cards stable', () => {
  const items = [
    item('first', [], 20),
    item('last', history(100, 50), 5),
    item('middle', history(100, 110), 12),
    item('tie', [], 20),
  ];
  assert.deepEqual(sortWishListItems(items, 'price_high').map(({ cardId }) => cardId), [
    'first', 'tie', 'middle', 'last',
  ]);
  assert.deepEqual(sortWishListItems(items, 'price_low').map(({ cardId }) => cardId), [
    'last', 'middle', 'first', 'tie',
  ]);
});
