import type { PricePoint } from '@workspace/api-client-react';

export function wishListTrend(history: PricePoint[]) {
  const first = history[0];
  const last = history[history.length - 1];
  if (history.length < 2 || !first || !last || first.value <= 0) {
    return {
      direction: 'unavailable',
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
    label: `30D · ${movement}`,
    description: `Simulated price history: ${movement.toLowerCase()} from ${first.day} to ${last.day}, based on ${history.length} daily records in the last 30 days.`,
  };
}
