import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cardRarityTier,
  createPackCardPools,
  drawPackCards,
  expectedPackValue,
} from '../src/lib/pack-opening.ts';

const card = (id, setName, rarity, marketPrice) => ({
  id,
  setName,
  rarity,
  marketPrice,
});

test('rarity labels map to the four pack odds bands', () => {
  assert.equal(cardRarityTier('Common'), 'common');
  assert.equal(cardRarityTier('Uncommon'), 'uncommon');
  assert.equal(cardRarityTier('Rare'), 'rare');
  assert.equal(cardRarityTier('Rare Holo'), 'holo');
  assert.equal(cardRarityTier('Special Illustration Rare'), 'holo');
});

test('set pools use matching cards and transparently fill the missing standard-rare pool', () => {
  const cards = [
    card('base-common', 'Base Set, 1999', 'Common', 1),
    card('base-uncommon', 'Base Set, 1999', 'Uncommon', 2),
    card('base-holo', 'Base Set, 1999', 'Rare Holo', 4),
    card('other-holo', 'Other Set', 'Secret Rare', 5),
  ];
  const result = createPackCardPools(cards, 'Base Set');

  assert.ok(result.pools);
  assert.deepEqual(result.catalogFallbackTiers, []);
  assert.equal(result.usesRareHoloFallback, true);
  assert.deepEqual(result.pools.common.map(({ id }) => id), ['base-common']);
  assert.deepEqual(result.pools.rare.map(({ id }) => id), ['base-holo']);
  assert.deepEqual(result.pools.holo.map(({ id }) => id), ['base-holo']);
});

test('ten independent draws honor rarity odds at exact boundaries', () => {
  const cards = [
    card('common', 'Set', 'Common', 1),
    card('uncommon', 'Set', 'Uncommon', 2),
    card('rare', 'Set', 'Rare', 3),
    card('holo', 'Set', 'Secret Rare', 4),
  ];
  const pools = createPackCardPools(cards, 'Set').pools;
  assert.ok(pools);
  const rolls = [];
  for (const roll of [0.599, 0.6, 0.85, 0.95, 0, 0, 0, 0, 0, 0]) rolls.push(roll, 0);
  const pulls = drawPackCards(pools, () => rolls.shift());

  assert.equal(pulls.length, 10);
  assert.deepEqual(pulls.slice(0, 4).map(({ rarity }) => cardRarityTier(rarity)), [
    'common', 'uncommon', 'rare', 'holo',
  ]);
});

test('expected value is the weighted average of ten simulated pulls', () => {
  const cards = [
    card('common', 'Set', 'Common', 1),
    card('uncommon', 'Set', 'Uncommon', 2),
    card('rare', 'Set', 'Rare', 3),
    card('holo', 'Set', 'Secret Rare', 4),
  ];
  const pools = createPackCardPools(cards, 'Set').pools;
  assert.ok(pools);
  assert.equal(expectedPackValue(pools), 16);
});
