import { Currency } from './types';

export const ILS_CONVERSION_RATE = 3.7;
export const MILESTONE_AGES = [30, 40, 50, 60, 70];
export const CURRENCY_SYMBOLS: { [key in Currency]: string } = {
  USD: '$',
  ILS: '₪',
};
export const SCENARIO_COLORS = [
  '#a855f7', // purple
  '#ec4899', // pink
  '#22d3ee', // cyan
  '#4ade80', // green
  '#facc15', // yellow
];
