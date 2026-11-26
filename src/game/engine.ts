import {
  BETS,
  DEFAULT_BALANCE,
  DEFAULT_BET_INDEX,
  type Grid,
  PAYLINES,
  STORAGE_KEY,
  SYMBOLS,
  TOTAL_SYMBOL_WEIGHT,
  WILD_ID,
} from './constants';

export interface WinningLine {
  lineIndex: number;
  rows: [number, number, number];
  symbolId: number;
  rate: number;
  color: string;
}

export interface SpinEvaluation {
  multiplier: number;
  totalWin: number;
  winningLines: WinningLine[];
  hitCells: Set<string>;
  isFullScreen: boolean;
  celebrationTier: 'super' | 'mega' | 'big' | null;
}

export interface PersistedState {
  balance: number;
  betIndex: number;
  soundEnabled: boolean;
  turbo: boolean;
  hapticsEnabled: boolean;
}

export function drawSymbolIndex(): number {
  let r = Math.random() * TOTAL_SYMBOL_WEIGHT;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= SYMBOLS[i].weight;
    if (r <= 0) return i;
  }
  return 0;
}

export function generateSpinGrid(): Grid {
  return [
    [drawSymbolIndex(), drawSymbolIndex(), drawSymbolIndex()],
    [drawSymbolIndex(), drawSymbolIndex(), drawSymbolIndex()],
    [drawSymbolIndex(), drawSymbolIndex(), drawSymbolIndex()],
  ];
}

export function evaluateGrid(grid: Grid, bet: number): SpinEvaluation {
  let multiplier = 0;
  const winningLines: WinningLine[] = [];
  const hitCells = new Set<string>();

  for (const line of PAYLINES) {
    const [r0, r1, r2] = line.rows;
    const cells = [grid[0][r0], grid[1][r1], grid[2][r2]];
    const nonWild = cells.filter((id) => id !== WILD_ID);

    if (nonWild.length === 0 || nonWild.every((id) => id === nonWild[0])) {
      const symbolId = nonWild.length > 0 ? nonWild[0] : WILD_ID;
      const rate = SYMBOLS[symbolId].rate;
      multiplier += rate;
      winningLines.push({
        lineIndex: line.index,
        rows: line.rows,
        symbolId,
        rate,
        color: line.color,
      });
      hitCells.add(`0-${r0}`);
      hitCells.add(`1-${r1}`);
      hitCells.add(`2-${r2}`);
    }
  }

  const flat = [...grid[0], ...grid[1], ...grid[2]];
  const nonWildAll = flat.filter((id) => id !== WILD_ID);
  const isFullScreen =
    nonWildAll.length === 0 || nonWildAll.every((id) => id === nonWildAll[0]);

  if (isFullScreen && multiplier > 0) {
    multiplier *= 10;
  }

  const totalWin = Math.round(multiplier * bet * 100) / 100;
  const celebrationTier =
    multiplier >= 12 ? 'super' : multiplier >= 5 ? 'mega' : multiplier > 0 ? 'big' : null;

  return {
    multiplier,
    totalWin,
    winningLines,
    hitCells,
    isFullScreen,
    celebrationTier,
  };
}

export function loadPersistedState(): PersistedState {
  const fallback: PersistedState = {
    balance: DEFAULT_BALANCE,
    betIndex: DEFAULT_BET_INDEX,
    soundEnabled: true,
    turbo: false,
    hapticsEnabled: true,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<{
      bal: number;
      bi: number;
      snd: boolean;
      turbo: boolean;
      haptics: boolean;
    }>;

    const balance =
      typeof parsed.bal === 'number' && Number.isFinite(parsed.bal) && parsed.bal >= 0
        ? Math.round(parsed.bal * 100) / 100
        : fallback.balance;

    const betIndex =
      typeof parsed.bi === 'number' &&
      Number.isInteger(parsed.bi) &&
      parsed.bi >= 0 &&
      parsed.bi < BETS.length
        ? parsed.bi
        : fallback.betIndex;

    return {
      balance,
      betIndex,
      soundEnabled: typeof parsed.snd === 'boolean' ? parsed.snd : fallback.soundEnabled,
      turbo: typeof parsed.turbo === 'boolean' ? parsed.turbo : fallback.turbo,
      hapticsEnabled:
        typeof parsed.haptics === 'boolean' ? parsed.haptics : fallback.hapticsEnabled,
    };
  } catch {
    return fallback;
  }
}

export function savePersistedState(state: PersistedState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        bal: Math.round(state.balance * 100) / 100,
        bi: state.betIndex,
        snd: state.soundEnabled,
        turbo: state.turbo,
        haptics: state.hapticsEnabled,
      }),
    );
  } catch {
    // Ignore storage quota or private browsing errors
  }
}
