import { useEffect, useRef, useState } from 'react';
import { REEL_HEIGHT, REEL_WIDTH, SYMBOLS, TILE_HEIGHT, WILD_ID } from '../game/constants';
import { drawSymbolIndex } from '../game/engine';

interface ReelColumnProps {
  colIndex: number;
  symbols: [number, number, number];
  spinId: number;
  turbo: boolean;
  slamSignal: number;
  pullOffset: number;
  hitCells: Set<string>;
  showWin: boolean;
  onColumnTouchdown: (colIndex: number, hasWild: boolean) => void;
  onColumnSettled: (colIndex: number) => void;
}

type Phase = 'idle' | 'crush' | 'drop' | 'settle';
const CASCADES = 5;

export function ReelColumn({
  colIndex, symbols, spinId, turbo, slamSignal, pullOffset,
  hitCells, showWin, onColumnTouchdown, onColumnSettled,
}: ReelColumnProps) {
  const [visible, setVisible] = useState<number[]>(() => [...symbols]);
  const [incoming, setIncoming] = useState<number[]>(() => [...symbols]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const callbacks = useRef({ onColumnTouchdown, onColumnSettled });
  callbacks.current = { onColumnTouchdown, onColumnSettled };
  const desired = useRef(symbols);
  desired.current = symbols;
  const turboRef = useRef(turbo);
  turboRef.current = turbo;
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const fast = useRef(false);
  const cancelTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  // Spin presses during animation hurry up subsequent cascades, never change outcome.
  useEffect(() => { if (slamSignal && busy.current) fast.current = true; }, [slamSignal]);

  useEffect(() => {
    if (!spinId) return;
    cancelTimers();
    busy.current = true;
    fast.current = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVisible([...desired.current]);
      setPhase('idle');
      later(() => {
        callbacks.current.onColumnTouchdown(colIndex, desired.current.includes(WILD_ID));
        callbacks.current.onColumnSettled(colIndex);
        busy.current = false;
      }, 50 + colIndex * 45);
      return cancelTimers;
    }

    // Each spin visibly clears and refills the screen FIVE times.
    // Only the fifth landing contains the precomputed result of the spin.
    const cascade = (index: number) => {
      const last = index === CASCADES;
      const quick = turboRef.current || fast.current;
      const crushMs = quick ? 95 : 195;
      const dropMs = quick ? 205 : 410;
      const offset = quick ? 26 : 58;
      setRound(index);
      setPhase('crush');

      later(() => {
        const next = last
          ? [...desired.current]
          : Array.from({ length: 3 }, () => drawSymbolIndex());
        setIncoming(next);
        setPhase('drop');
        later(() => {
          setVisible(next);
          setPhase('settle');
          if (last) {
            callbacks.current.onColumnTouchdown(colIndex, desired.current.includes(WILD_ID));
          }
          later(() => {
            if (last) {
              busy.current = false;
              setPhase('idle');
              callbacks.current.onColumnSettled(colIndex);
            } else {
              cascade(index + 1);
            }
          }, quick ? 30 : 85);
        }, dropMs + 2 * offset);
      }, crushMs);
    };
    // Columns start in sequence rather than all three moving in lockstep.
    later(() => cascade(1), colIndex * (turboRef.current ? 65 : 145) + 70);
    return () => { cancelTimers(); busy.current = false; };
    // spinId is the sole restart trigger. Settings and callbacks stay in refs.
  }, [spinId, colIndex]);

  const isBusy = phase !== 'idle';
  const falling = phase === 'drop';
  const isCrushing = phase === 'crush';
  const dropDuration = turbo || fast.current ? 205 : 410;
  const stagger = turbo || fast.current ? 26 : 58;

  return (
    <div className="relative overflow-hidden rounded-[12px]" style={{ width: REEL_WIDTH, height: REEL_HEIGHT }}>
      <div className="pointer-events-none absolute inset-0 z-[4] bg-gradient-to-b from-black/15 via-transparent to-black/20" />
      <div
        className="absolute inset-0"
        style={{ transform: !isBusy ? `translateY(${Math.min(38, Math.max(0, pullOffset)) * (0.86 + colIndex * .09)}px)` : undefined }}
      >
        {visible.map((id, row) => {
          const sym = SYMBOLS[id] || SYMBOLS[0];
          const won = !isBusy && showWin && hitCells.has(`${colIndex}-${row}`);
          return (
            <div key={row} className="relative flex items-center justify-center overflow-hidden" style={{ height: TILE_HEIGHT }}>
              {won && <div className="pointer-events-none absolute inset-2 rounded-xl border-2 border-[#ffe27a] bg-amber-300/15 shadow-[0_0_25px_#ffd65c]" />}
              <img
                key={`${spinId}-${round}-${row}-${phase}`}
                src={sym.image}
                alt={sym.label}
                draggable={false}
                className={`relative h-[160px] w-[160px] object-contain ${isCrushing ? 'tiger-cascade-crush' : ''} ${falling ? 'opacity-0' : ''} ${won ? 'animate-win-tile' : ''} ${!isBusy && showWin && !won ? 'opacity-50' : ''}`}
              />
              {isCrushing && <div className="tiger-cascade-sparks pointer-events-none absolute inset-0" />}
            </div>
          );
        })}
      </div>
      {falling && incoming.map((id, row) => (
        <div key={`${spinId}-${round}-${row}`} className="pointer-events-none absolute inset-x-0 z-[3] flex items-center justify-center" style={{
          top: row * TILE_HEIGHT, height: TILE_HEIGHT,
          animation: `tiger-reference-drop ${dropDuration}ms cubic-bezier(.22,.7,.25,1) ${(2-row)*stagger}ms both`,
        }}>
          <img src={(SYMBOLS[id] || SYMBOLS[0]).image} alt="" className="h-[160px] w-[160px] object-contain" draggable={false} />
        </div>
      ))}
    </div>
  );
}
