import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  REEL_HEIGHT,
  REEL_WIDTH,
  SYMBOLS,
  TILE_HEIGHT,
  WILD_ID,
} from '../game/constants';
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

export function ReelColumn({
  colIndex,
  symbols,
  spinId,
  turbo,
  slamSignal,
  pullOffset,
  hitCells,
  showWin,
  onColumnTouchdown,
  onColumnSettled,
}: ReelColumnProps) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const prevSymbolsRef = useRef<[number, number, number]>(symbols);
  const settingsRef = useRef({ symbols, turbo });
  useLayoutEffect(() => {
    settingsRef.current = { symbols, turbo };
  }, [symbols, turbo]);
  const rafRef = useRef<number | null>(null);

  // Refs to coordinate smooth quick-slam without re-triggering the spin effect
  const slamStateRef = useRef<{
    active: boolean;
    startTime: number;
    startY: number;
    duration: number;
  } | null>(null);
  const quickDropRef = useRef(false);
  const currentYRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const touchdownFiredRef = useRef(false);

  const onTouchdownRef = useRef(onColumnTouchdown);
  const onSettledRef = useRef(onColumnSettled);
  onTouchdownRef.current = onColumnTouchdown;
  onSettledRef.current = onColumnSettled;

  const [strip, setStrip] = useState<number[]>(() => [...symbols]);
  const [spinningVisual, setSpinningVisual] = useState(false);

  const [drop, setDrop] = useState<{ round: number; symbols: number[]; duration: number; stagger: number } | null>(null);

  // Trigger quick-slam if user taps reels or spin button mid-spin
  useEffect(() => {
    if (slamSignal === 0 || !isAnimatingRef.current) return;
    quickDropRef.current = true;
    if (touchdownFiredRef.current) return;
    if (slamStateRef.current?.active) return;

    slamStateRef.current = {
      active: true,
      startTime: performance.now(),
      startY: currentYRef.current,
      duration: 135 + colIndex * 45,
    };
  }, [slamSignal, colIndex]);

  // Apply gentle physical pull-down offset while idle and user drags down on reels
  useLayoutEffect(() => {
    if (isAnimatingRef.current) return;
    const el = stripRef.current;
    if (!el) return;
    const clampedPull = Math.max(0, Math.min(40, pullOffset));
    const staggerFactor = 0.86 + colIndex * 0.09;
    const y = clampedPull * staggerFactor;
    el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    el.style.filter = 'none';
  }, [pullOffset, colIndex]);

  // Launch physics-driven 60fps reel animation whenever spinId advances
  useLayoutEffect(() => {
    if (spinId === 0) return;

    quickDropRef.current = false;
    const prev = prevSymbolsRef.current;
    const { symbols: next, turbo } = settingsRef.current;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      prevSymbolsRef.current = next;
      setStrip([...next]);
      setSpinningVisual(false);
      isAnimatingRef.current = false;
      const hasWild = next.includes(WILD_ID);
      const timer = window.setTimeout(() => {
        onTouchdownRef.current(colIndex, hasWild);
        onSettledRef.current(colIndex);
      }, 90 + colIndex * 70);
      return () => window.clearTimeout(timer);
    }

    const fillerCount = turbo ? 7 + colIndex * 3 : 12 + colIndex * 5;
    const filler: number[] = [];
    for (let i = 0; i < fillerCount; i++) {
      filler.push(drawSymbolIndex());
    }

    // Strip layout: [target top..bot, ...random filler..., prev top..bot]
    // Starting at startY shows prev exactly; the guard tiles cover the window during wind-up and bounce.
    const outgoing = [drawSymbolIndex(), drawSymbolIndex(), drawSymbolIndex()];
    const fullStrip = [drawSymbolIndex(), ...outgoing, ...filler, ...prev, drawSymbolIndex()];
    const landingY = -TILE_HEIGHT;
    const startY = -(fullStrip.length - 4) * TILE_HEIGHT;

    setStrip(fullStrip);
    setSpinningVisual(true);
    isAnimatingRef.current = true;
    touchdownFiredRef.current = false;
    slamStateRef.current = null;
    currentYRef.current = startY;

    const anticipationMs = turbo ? 42 : 85;
    const travelMs = turbo ? 300 + colIndex * 24 : 580 + colIndex * 35;
    const settleMs = turbo ? 125 : 195;
    const overshootPx = turbo ? 18 : 26;
    const anticipationPx = turbo ? 12 : 20;

    const startTime = performance.now();
    const hasWild = next.includes(WILD_ID);

    // Paint initial offset immediately before first rAF tick so there is zero flash
    if (stripRef.current) {
      stripRef.current.style.transform = `translate3d(0, ${startY}px, 0)`;
      stripRef.current.style.filter = 'none';
    }

    let dropTimer: number | undefined;
    const finishColumn = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      slamStateRef.current = null;
      currentYRef.current = 0;
      prevSymbolsRef.current = next;

      if (stripRef.current) {
        stripRef.current.style.transform = 'translate3d(0, 0px, 0)';
        stripRef.current.style.filter = 'none';
      }

      const playDrop = (round: number, previous: number[]) => {
        const final = round === 5;
        const quick = turbo || quickDropRef.current;
        const duration = quick ? 170 : final ? 450 : 300;
        const stagger = quick ? 15 : 35;
        const incoming = final ? next : Array.from({ length: 3 }, drawSymbolIndex);
        setStrip(previous);
        setDrop({ round, symbols: incoming, duration, stagger });
        dropTimer = window.setTimeout(() => {
          if (!final) {
            playDrop(round + 1, incoming);
            return;
          }
          isAnimatingRef.current = false;
          setStrip([...next]);
          setDrop(null);
          setSpinningVisual(false);
          onSettledRef.current(colIndex);
        }, duration + 2 * stagger + 35);
      };
      playDrop(1, outgoing);

      if (!touchdownFiredRef.current) {
        touchdownFiredRef.current = true;
        onTouchdownRef.current(colIndex, hasWild);
      }
    };

    const tick = (now: number) => {
      const el = stripRef.current;
      if (!el) return;

      const slam = slamStateRef.current;
      let y = 0;
      let blurPx = 0;

      if (slam && slam.active) {
        const elapsedSlam = now - slam.startTime;
        const slamTravel = slam.duration * 0.72;
        const slamSettle = slam.duration * 0.28;

        if (elapsedSlam < slamTravel) {
          const p = Math.min(1, elapsedSlam / slamTravel);
          const eased = 1 - Math.pow(1 - p, 2.4);
          y = slam.startY + (landingY + overshootPx * 0.75 - slam.startY) * eased;
          blurPx = p < 0.7 ? 0.9 : 0;
        } else {
          if (!touchdownFiredRef.current) {
            touchdownFiredRef.current = true;
            onTouchdownRef.current(colIndex, hasWild);
          }
          const q = Math.min(1, (elapsedSlam - slamTravel) / slamSettle);
          y = landingY + overshootPx * 0.75 * Math.cos(q * Math.PI * 0.5) * (1 - q * 0.25);
          blurPx = 0;
          if (q >= 1) {
            finishColumn();
            return;
          }
        }
      } else {
        const elapsed = now - startTime;

        if (elapsed < anticipationMs) {
          // Subtle upward anticipation wind-up
          const p = elapsed / anticipationMs;
          y = startY - Math.sin(p * Math.PI * 0.5) * anticipationPx;
          blurPx = 0;
        } else if (elapsed < anticipationMs + travelMs) {
          // High-speed downward spin into overshoot peak
          const p = (elapsed - anticipationMs) / travelMs;
          // Integrate a speed curve with acceleration, cruise, then braking.
          const ramp = 0.18;
          const brake = 0.36;
          const cruiseEnd = 1 - brake;
          const distance = 1 - (ramp + brake) / 2;
          let eased = (p - ramp / 2) / distance;
          if (p < ramp) eased = p * p / (2 * ramp * distance);
          if (p > cruiseEnd) eased = 1 - (1 - p) ** 2 / (2 * brake * distance);
          const originY = startY - anticipationPx;
          y = originY + (landingY + overshootPx - originY) * eased;

          // Subtle motion blur only during peak velocity window
          blurPx = p > 0.12 && p < 0.74 ? (turbo ? 1.1 : 0.85) : 0;
        } else {
          // Touchdown & elastic spring settle back to 0
          if (!touchdownFiredRef.current) {
            touchdownFiredRef.current = true;
            onTouchdownRef.current(colIndex, hasWild);
          }
          const q = Math.min(1, (elapsed - anticipationMs - travelMs) / settleMs);
          y = landingY + overshootPx * Math.cos(q * Math.PI * 0.5) * (1 - q * 0.28);
          blurPx = 0;

          if (q >= 1) {
            finishColumn();
            return;
          }
        }
      }

      currentYRef.current = y;
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      el.style.filter = blurPx > 0 ? `blur(${blurPx}px)` : 'none';

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(dropTimer);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [spinId, colIndex]);

  return (
    <div
      className="relative overflow-hidden rounded-[12px]"
      style={{
        width: REEL_WIDTH,
        height: REEL_HEIGHT,
      }}
    >
      {/* Subtle top & bottom drum curvature shading for physical depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-black/35 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-black/35 to-transparent"
      />

      <div
        ref={stripRef}
        className="will-change-transform"
        style={{
          transform: 'translate3d(0, 0px, 0)',
        }}
      >
        {strip.map((symbolId, idx) => {
          const sym = SYMBOLS[symbolId] ?? SYMBOLS[0];
          const isRestingHit =
            !spinningVisual && showWin && idx < 3 && hitCells.has(`${colIndex}-${idx}`);
          const isDimmed =
            !spinningVisual && showWin && hitCells.size > 0 && idx < 3 && !isRestingHit;

          return (
            <div
              key={`${spinId}-${drop?.round ?? 0}-${idx}`}
              className="relative flex items-center justify-center overflow-hidden"
              style={{
                width: REEL_WIDTH,
                height: TILE_HEIGHT,
              }}
            >
              {isRestingHit && (
                <>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-[6px] rounded-[16px] border-2 border-[#ffe27a] bg-[radial-gradient(circle,rgba(255,214,70,0.34)_0%,rgba(255,156,28,0.08)_72%,transparent_100%)] shadow-[inset_0_0_20px_rgba(255,220,90,0.65),0_0_22px_rgba(255,196,42,0.75)]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-[6px] overflow-hidden rounded-[16px]"
                  >
                    <div className="animate-shimmer-sweep h-full w-14 bg-gradient-to-r from-transparent via-[#fff7cc]/70 to-transparent" />
                  </div>
                </>
              )}

              {isRestingHit && (
                <div aria-hidden="true" className="tiger-shards pointer-events-none absolute z-[2] h-[160px] w-[160px]">
                  {[0, 1, 2, 3].map(piece => (
                    <img key={piece} src={sym.image} alt="" className="absolute inset-0 h-full w-full object-contain" />
                  ))}
                </div>
              )}
              <img
                style={drop ? {
                  animation: `tiger-tile-exit ${drop.duration}ms linear ${(2 - idx) * drop.stagger}ms both`,
                } : undefined}
                src={sym.image}
                alt={idx < 3 ? sym.label : ''}
                draggable={false}
                className={`pointer-events-none relative z-[1] h-[160px] w-[160px] object-contain transition-opacity duration-200 ${
                  isRestingHit ? 'tiger-crush-symbol' : ''
                } ${isDimmed ? 'opacity-50' : 'opacity-100'}`}
              />
            </div>
          );
        })}
      </div>
      {drop && drop.symbols.map((symbolId, row) => (
        <div
          key={`${drop.round}-${row}`}
          data-drop-round={drop.round}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-[2] flex items-center justify-center"
          style={{
            top: row * TILE_HEIGHT,
            height: TILE_HEIGHT,
            animation: `tiger-column-fall ${drop.duration}ms linear ${(2 - row) * drop.stagger}ms both`,
          }}
        >
          <img className="h-[160px] w-[160px] object-contain" src={SYMBOLS[symbolId].image} alt="" />
        </div>
      ))}
    </div>
  );
}
