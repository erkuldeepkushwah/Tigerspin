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
  winCrush: boolean;
  onColumnTouchdown: (colIndex: number, hasWild: boolean) => void;
  onColumnSettled: (colIndex: number) => void;
}

type Phase = 'idle' | 'crush' | 'empty' | 'falling' | 'landed';
const DROP_COUNT = 5;
function reducedMotionClass() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'tiger-reel-reduced' : '';
}

export function ReelColumn({
  colIndex, symbols, spinId, turbo, slamSignal, pullOffset,
  hitCells, showWin, winCrush, onColumnTouchdown, onColumnSettled,
}: ReelColumnProps) {
  const [cells, setCells] = useState<[number, number, number]>(symbols);
  const [incoming, setIncoming] = useState<[number, number, number]>(symbols);
  const [phase, setPhase] = useState<Phase>('idle');
  const [wave, setWave] = useState(0);
  const desiredRef = useRef(symbols);
  desiredRef.current = symbols;
  const speedRef = useRef(turbo);
  speedRef.current = turbo;
  const fastRef = useRef(false);
  const busyRef = useRef(false);
  const timers = useRef<number[]>([]);
  const frames = useRef<number[]>([]);
  const cbRef = useRef({ onColumnTouchdown, onColumnSettled });
  cbRef.current = { onColumnTouchdown, onColumnSettled };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const clear = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    frames.current.forEach(window.cancelAnimationFrame);
    frames.current = [];
  };
  const afterPaint = (fn: () => void) => {
    frames.current.push(window.requestAnimationFrame(() => {
      frames.current.push(window.requestAnimationFrame(fn));
    }));
  };

  useEffect(() => {
    if (slamSignal > 0 && busyRef.current) fastRef.current = true;
  }, [slamSignal]);

  useEffect(() => {
    if (!spinId) return;
    clear();
    fastRef.current = false;
    busyRef.current = true;
    const finalGrid = [...desiredRef.current] as [number, number, number];
    // All three rows participate in each of the five cascades.
    const cascade = (n: number) => {
      const last = n === DROP_COUNT;
      const quick = speedRef.current || fastRef.current;
      const mobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768;
      const crushTime = mobile ? (quick ? 110 : 150) : (quick ? 65 : 100);
      const fallTime = mobile ? (quick ? 460 : 620) : (quick ? 240 : 380);
      const nextCells: [number, number, number] = last
        ? finalGrid
        : [drawSymbolIndex(), drawSymbolIndex(), drawSymbolIndex()];
      setWave(n);
      setPhase('crush');
      afterPaint(() => later(() => {
        setPhase('empty');
        afterPaint(() => {
          setIncoming(nextCells);
          setPhase('falling');
          afterPaint(() => later(() => {
            setCells(nextCells);
            setPhase('landed');
            if (last) cbRef.current.onColumnTouchdown(colIndex, finalGrid.includes(WILD_ID));
            later(() => {
              if (last) {
                setPhase('idle');
                busyRef.current = false;
                cbRef.current.onColumnSettled(colIndex);
              } else {
                cascade(n + 1);
              }
            }, last ? 45 : 55);
          }, fallTime));
        });
      }, crushTime));
    };
    later(() => cascade(1), colIndex * (speedRef.current ? 12 : 20));
    return () => { clear(); busyRef.current = false; };
  }, [spinId, colIndex]);

  const busy = phase !== 'idle';
  const hideCells = phase === 'empty' || phase === 'falling';
  const quick = turbo || fastRef.current;
  const touch = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768;
  return (
    <div className={`relative overflow-hidden rounded-[12px] tiger-reel-column ${reducedMotionClass()}`} style={{ width: REEL_WIDTH, height: REEL_HEIGHT }}>
      <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      <div style={{ transform: !busy ? `translateY(${Math.min(38, Math.max(0,pullOffset)) * (0.86 + colIndex * .09)}px)` : undefined }}>
        {cells.map((id, row) => {
          const symbol = SYMBOLS[id] || SYMBOLS[0];
          const won = !busy && showWin && hitCells.has(`${colIndex}-${row}`);
          const invisible = hideCells;
          const crushing = phase === 'crush';
          return (
            <div key={row} className="relative flex items-center justify-center overflow-hidden" style={{ height: TILE_HEIGHT, '--crush-duration': quick ? '65ms' : '100ms' } as React.CSSProperties}>
              {won && <div className="pointer-events-none absolute inset-2 rounded-xl border-2 border-[#ffe27a] bg-amber-300/15 shadow-[0_0_25px_#ffd65c]" />}
              {!invisible && (
                <img
                  key={`${row}-${id}`}
                  src={symbol.image} alt={symbol.label} draggable={false}
                  className={`relative tiger-reel-icon object-contain ${crushing ? 'tiger-reference-crush' : ''} ${won ? (winCrush ? 'tiger-winning-crush' : 'animate-win-tile') : ''} ${!busy && showWin && !won ? 'opacity-50' : ''}`}
                />
              )}
              {won && winCrush && <div className="tiger-winning-sparks pointer-events-none absolute inset-0" />}
              {crushing && <div className="tiger-reference-sparkles pointer-events-none absolute inset-0" />}
            </div>
          );
        })}
      </div>
      {phase === 'falling' && incoming.map((id, row) => (
        <div
          key={`${spinId}-${wave}-fall-${row}`}
          className="tiger-falling-symbol pointer-events-none absolute inset-x-0 z-[3] flex items-center justify-center"
          style={{
            top: row * TILE_HEIGHT,
            height: TILE_HEIGHT,
            animation: `tiger-reference-cascade-drop ${touch ? (quick ? 390 : 520) : (quick ? 190 : 310)}ms cubic-bezier(.25,.55,.35,1) ${row * (quick ? 12 : 20)}ms both`,
          }}
        >
          <img src={(SYMBOLS[id] || SYMBOLS[0]).image} alt="" draggable={false} className="tiger-reel-icon object-contain" />
        </div>
      ))}
    </div>
  );
}
