import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { PricePoint } from '@workspace/api-client-react';
import { wishListTrend } from '../lib/wish-list-trend';

export function WishListTrend({ history, cardName }: { history: PricePoint[]; cardName: string }) {
  const trend = wishListTrend(history);
  const Icon = trend.direction === 'up' ? ArrowUpRight : trend.direction === 'down' ? ArrowDownRight : Minus;
  return <span
    className={`wish-list-trend wish-list-trend-${trend.direction}`}
    role="img"
    aria-label={`${cardName}: ${trend.description}`}
    title={trend.description}
  ><Icon size={13} aria-hidden="true" /><span>{trend.label}</span></span>;
}
