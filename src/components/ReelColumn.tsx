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

type Phase = 'idle' | 'crush' | 'empty' | 'falling' | 'landed';
const DROP_COUNT = 5;

export function ReelColumn({
  colIndex, symbols, spinId, turbo, slamSignal, pullOffset,
  hitCells, showWin, onColumnTouchdown, onColumnSettled,
}: ReelColumnProps) {
  const [cells, setCells] = useState<[number, number, number]>(symbols);
  const [incoming, setIncoming] = useState<[number, number]>([symbols[0], symbols[1]]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [wave, setWave] = useState(0);
  const desiredRef = useRef(symbols);
  desiredRef.current = symbols;
  const speedRef = useRef(turbo);
  speedRef.current = turbo;
  const fastRef = useRef(false);
  const busyRef = useRef(false);
  const timers = useRef<number[]>([]);
  const cbRef = useRef({ onColumnTouchdown, onColumnSettled });
  cbRef.current = { onColumnTouchdown, onColumnSettled };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const clear = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
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
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setCells(finalGrid);
      setPhase('idle');
      later(() => {
        busyRef.current = false;
        cbRef.current.onColumnTouchdown(colIndex, finalGrid.includes(WILD_ID));
        cbRef.current.onColumnSettled(colIndex);
      }, 60 + colIndex * 60);
      return () => { clear(); busyRef.current = false; };
    }

    // Reference clip: the LOWEST ROW remains anchored on screen while the
    // upper symbols burst into sparkles, leave blank slots and drop from above.
    // Five visibly distinct cascades precede the predetermined final result.
    setCells([drawSymbolIndex(), drawSymbolIndex(), finalGrid[2]]);
    const cascade = (n: number) => {
      const last = n === DROP_COUNT;
      const quick = speedRef.current || fastRef.current;
      const crushTime = quick ? 120 : 240;
      const emptyTime = quick ? 55 : 100;
      const fallTime = quick ? 300 : 540;
      const newTop: [number, number] = last
        ? [finalGrid[0], finalGrid[1]]
        : [drawSymbolIndex(), drawSymbolIndex()];
      setWave(n);
      setPhase('crush');
      later(() => {
        setPhase('empty');
        later(() => {
          setIncoming(newTop);
          setPhase('falling');
          later(() => {
            setCells([newTop[0], newTop[1], finalGrid[2]]);
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
            }, quick ? 45 : 135);
          }, fallTime);
        }, emptyTime);
      }, crushTime);
    };
    later(() => cascade(1), 110 + colIndex * (speedRef.current ? 35 : 95));
    return () => { clear(); busyRef.current = false; };
  }, [spinId, colIndex]);

  const busy = phase !== 'idle';
  const hideTop = phase === 'empty' || phase === 'falling';
  const quick = turbo || fastRef.current;
  return (
    <div className="relative overflow-hidden rounded-[12px]" style={{ width: REEL_WIDTH, height: REEL_HEIGHT }}>
      <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      <div style={{ transform: !busy ? `translateY(${Math.min(38, Math.max(0,pullOffset)) * (0.86 + colIndex * .09)}px)` : undefined }}>
        {cells.map((id, row) => {
          const symbol = SYMBOLS[id] || SYMBOLS[0];
          const won = !busy && showWin && hitCells.has(`${colIndex}-${row}`);
          const invisible = row < 2 && hideTop;
          const crushing = row < 2 && phase === 'crush';
          return (
            <div key={row} className="relative flex items-center justify-center overflow-hidden" style={{ height: TILE_HEIGHT, '--crush-duration': quick ? '120ms' : '240ms' } as React.CSSProperties}>
              {won && <div className="pointer-events-none absolute inset-2 rounded-xl border-2 border-[#ffe27a] bg-amber-300/15 shadow-[0_0_25px_#ffd65c]" />}
              {!invisible && (
                <img
                  key={`${row}-${id}`}
                  src={symbol.image} alt={symbol.label} draggable={false}
                  className={`relative tiger-reel-icon object-contain ${crushing ? 'tiger-reference-crush' : ''} ${won ? 'animate-win-tile' : ''} ${!busy && showWin && !won ? 'opacity-50' : ''}`}
                />
              )}
              {crushing && <div className="tiger-reference-sparkles pointer-events-none absolute inset-0" />}
            </div>
          );
        })}
      </div>
      {phase === 'falling' && incoming.map((id, row) => (
        <div
          key={`${spinId}-${wave}-fall-${row}`}
          className="pointer-events-none absolute inset-x-0 z-[3] flex items-center justify-center"
          style={{
            top: row * TILE_HEIGHT,
            height: TILE_HEIGHT,
            animation: `tiger-reference-cascade-drop ${quick ? 280 : 510}ms cubic-bezier(.25,.55,.35,1) ${row === 0 ? 0 : quick ? 18 : 30}ms both`,
          }}
        >
          <img src={(SYMBOLS[id] || SYMBOLS[0]).image} alt="" draggable={false} className="tiger-reel-icon object-contain" />
        </div>
      ))}
    </div>
  );
}
