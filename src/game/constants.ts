export interface SymbolDef {
  id: number;
  key: 'orange' | 'jade' | 'packet' | 'cracker' | 'bag' | 'wild' | 'egg';
  label: string;
  weight: number;
  rate: number;
  image: string;
  isWild?: boolean;
}

export type Grid = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

export const BOARD_WIDTH = 674;
export const BOARD_HEIGHT = 1462;

export const REEL_TOP = 389;
export const REEL_LEFT = 43;
export const REEL_WIDTH = 189;
export const REEL_GAP = 12;
export const TILE_HEIGHT = 182;
export const REEL_HEIGHT = TILE_HEIGHT * 3; // 546
export const REELS_TOTAL_WIDTH = REEL_WIDTH * 3 + REEL_GAP * 2; // 591

export const ASSETS = {
  board: '/assets/tiger/board.webp',
  topBackground: '/assets/icons/top%20tiger%20baground.png',
  topTiger: '/assets/icons/top%20tiger.png',
  big: '/assets/icons/big%20win/full-win-overlay.png.svg',
  mega: '/assets/icons/mega%20win/full-mega-win-overlay.png.svg',
  super: '/assets/tiger/super.webp.svg',
} as const;

export const SYMBOLS: readonly SymbolDef[] = [
  {
    id: 0,
    key: 'orange',
    label: 'Mandarin',
    weight: 7,
    rate: 2,
    image: '/assets/icons/orange-fruit.png',
  },
  {
    id: 1,
    key: 'jade',
    label: 'Jade Charm',
    weight: 4,
    rate: 8,
    image: '/assets/icons/Jade%20Charm.png',
  },
  {
    id: 2,
    key: 'packet',
    label: 'Red Packet',
    weight: 5,
    rate: 4,
    image: '/assets/icons/red-lucky-envelope.png',
  },
  {
    id: 3,
    key: 'cracker',
    label: 'Firecracker',
    weight: 5,
    rate: 3,
    image: '/assets/icons/blue-firecrackers.png',
  },
  {
    id: 4,
    key: 'bag',
    label: 'Gold Pouch',
    weight: 4,
    rate: 5,
    image: '/assets/icons/golden-coin-bag.png',
  },
  {
    id: 5,
    key: 'wild',
    label: 'Tiger Wild',
    weight: 1,
    rate: 50,
    image: '/assets/icons/wild_tiger_transparent_50kb.png',
    isWild: true,
  },
  {
    id: 6,
    key: 'egg',
    label: 'Golden Egg',
    weight: 4,
    rate: 6,
    image: '/assets/icons/golden_egg_icon.png',
  },
] as const;

export const TOTAL_SYMBOL_WEIGHT = SYMBOLS.reduce((acc, s) => acc + s.weight, 0);
export const WILD_ID = 5;

export const BETS = [5, 10, 20, 50, 100, 200] as const;
export const DEFAULT_BET_INDEX = 2;
export const DEFAULT_BALANCE = 3942.5;
export const STORAGE_KEY = 'tigerArcade';

export const INITIAL_GRID: Grid = [
  [0, 1, 1],
  [2, 0, 0],
  [3, 0, 1],
];

export interface PaylineDef {
  index: number;
  name: string;
  rows: [number, number, number];
  color: string;
}

export const PAYLINES: readonly PaylineDef[] = [
  { index: 0, name: 'Top Row', rows: [0, 0, 0], color: '#ffe169' },
  { index: 1, name: 'Center Row', rows: [1, 1, 1], color: '#ffb703' },
  { index: 2, name: 'Bottom Row', rows: [2, 2, 2], color: '#ffe169' },
  { index: 3, name: 'Diagonal ↘', rows: [0, 1, 2], color: '#ff9f1c' },
  { index: 4, name: 'Diagonal ↗', rows: [2, 1, 0], color: '#ff9f1c' },
] as const;

export const HOTSPOTS = {
  pause: { left: 4, top: 145, width: 90, height: 90 },
  settings: { left: 572, top: 145, width: 90, height: 90 },
  turbo: { left: 37, top: 1150, width: 87, height: 90 },
  minus: { left: 140, top: 1150, width: 87, height: 90 },
  spin: { left: 258, top: 1136, width: 157, height: 158 },
  plus: { left: 443, top: 1150, width: 87, height: 90 },
  auto: { left: 545, top: 1150, width: 90, height: 90 },
} as const;

export const DEFAULT_BANNER_TEXT = '×10 multiplier with full screen win!';

export function formatINR(value: number): string {
  return (
    '₹' +
    value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
