import type { PricePoint } from '@workspace/api-client-react';

export type WishListSortOrder = 'trend_drop' | 'trend_gain' | 'price_high' | 'price_low';

export function wishListTrend(history: PricePoint[]) {
  const first = history[0];
  const last = history[history.length - 1];
  if (history.length < 2 || !first || !last || first.value <= 0) {
    return {
      direction: 'unavailable',
      changePercent: null,
      label: '30D · Not enough history',
      description: 'Not enough simulated price history to calculate a 30-day trend.',
    };
  }
  const change = ((last.value - first.value) / first.value) * 100;
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  const amount = Math.abs(change) > 0 && Math.abs(change) < 0.1
    ? '<0.1%'
    : `${Math.abs(change).toFixed(1)}%`;
  const movement = direction === 'flat' ? 'Unchanged' : `${direction === 'up' ? 'Up' : 'Down'} ${amount}`;
  return {
    direction,
    changePercent: change,
    label: `30D · ${movement}`,
    description: `Simulated price history: ${movement.toLowerCase()} from ${first.day} to ${last.day}, based on ${history.length} daily records in the last 30 days.`,
  };
}

export function sortWishListItems<T extends { history: PricePoint[]; card: { marketPrice: number } }>(
  items: T[],
  order: WishListSortOrder,
): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      if (order === 'trend_drop' || order === 'trend_gain') {
        const aChange = wishListTrend(a.item.history).changePercent;
        const bChange = wishListTrend(b.item.history).changePercent;
        if (aChange === null && bChange !== null) return 1;
        if (aChange !== null && bChange === null) return -1;
        if (aChange !== null && bChange !== null && aChange !== bChange) {
          return order === 'trend_drop' ? aChange - bChange : bChange - aChange;
        }
      } else if (a.item.card.marketPrice !== b.item.card.marketPrice) {
        return order === 'price_high'
          ? b.item.card.marketPrice - a.item.card.marketPrice
          : a.item.card.marketPrice - b.item.card.marketPrice;
      }
      return a.index - b.index;
    })
    .map(({ item }) => item);
}
