import type { Card } from '@workspace/api-client-react';

export const PACK_RARITY_ODDS = [
  { tier: 'common', label: 'Common', probability: 0.6 },
  { tier: 'uncommon', label: 'Uncommon', probability: 0.25 },
  { tier: 'rare', label: 'Rare', probability: 0.1 },
  { tier: 'holo', label: 'Holo or better', probability: 0.05 },
] as const;

export type PackRarityTier = typeof PACK_RARITY_ODDS[number]['tier'];
export type PackCardPools = Record<PackRarityTier, Card[]>;

function normalizedSetName(value: string) {
  return value.trim().toLowerCase().replace(/,\s*\d{4}\s*$/, '');
}

export function cardRarityTier(rarity: string): PackRarityTier | null {
  const normalized = rarity.toLowerCase();
  if (normalized.includes('uncommon')) return 'uncommon';
  if (normalized.includes('common')) return 'common';
  if (/holo|secret|illustration|promo|gold star|ultra rare|radiant|rainbow|hyper rare|ace spec|amazing rare/.test(normalized)) return 'holo';
  if (normalized.includes('rare')) return 'rare';
  return null;
}

export function createPackCardPools(cards: Card[], setName: string): {
  pools: PackCardPools | null;
  catalogFallbackTiers: PackRarityTier[];
  usesRareHoloFallback: boolean;
} {
  if (!cards.length) return { pools: null, catalogFallbackTiers: [], usesRareHoloFallback: false };

  const setCards = cards.filter((card) => normalizedSetName(card.setName) === normalizedSetName(setName));
  const pools = {} as PackCardPools;
  const catalogFallbackTiers: PackRarityTier[] = [];
  let usesRareHoloFallback = false;

  for (const { tier } of PACK_RARITY_ODDS) {
    const matchingSetCards = setCards.filter((card) => cardRarityTier(card.rarity) === tier);
    const catalogCards = cards.filter((card) => cardRarityTier(card.rarity) === tier);
    let tierCards = matchingSetCards.length ? matchingSetCards : catalogCards;
    let usesSetTierCards = matchingSetCards.length > 0;
    if (tier === 'rare' && !tierCards.length) {
      const rareHoloSetCards = setCards.filter((card) => /rare holo/i.test(card.rarity) && !/gold star/i.test(card.rarity));
      const rareHoloCatalogCards = cards.filter((card) => /rare holo/i.test(card.rarity) && !/gold star/i.test(card.rarity));
      tierCards = rareHoloSetCards.length ? rareHoloSetCards : rareHoloCatalogCards;
      usesRareHoloFallback = tierCards.length > 0;
      usesSetTierCards = rareHoloSetCards.length > 0;
    }
    if (!tierCards.length) return { pools: null, catalogFallbackTiers, usesRareHoloFallback };
    pools[tier] = tierCards;
    if (!usesSetTierCards) catalogFallbackTiers.push(tier);
  }

  return { pools, catalogFallbackTiers, usesRareHoloFallback };
}

export function drawPackCards(
  pools: PackCardPools,
  random: () => number = Math.random,
  count = 10,
): Card[] {
  return Array.from({ length: count }, () => {
    const roll = random();
    const tier: PackRarityTier = roll < 0.6
      ? 'common'
      : roll < 0.85
        ? 'uncommon'
        : roll < 0.95
          ? 'rare'
          : 'holo';
    const tierCards = pools[tier];
    const cardIndex = Math.min(Math.floor(random() * tierCards.length), tierCards.length - 1);
    return tierCards[cardIndex];
  });
}

export function expectedPackValue(pools: PackCardPools, cardsPerPack = 10): number {
  const expectedPerCard = PACK_RARITY_ODDS.reduce((expected, { tier, probability }) => {
    const tierCards = pools[tier];
    const averagePrice = tierCards.reduce((sum, card) => sum + card.marketPrice, 0) / tierCards.length;
    return expected + averagePrice * probability;
  }, 0);
  return expectedPerCard * cardsPerPack;
}
