import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { ASSETS, BOARD_HEIGHT, BOARD_WIDTH, formatINR } from '../game/constants';

interface WinCelebrationProps {
  tier: 'mega' | 'super' | null;
  amount: number;
  autoSpinActive: boolean;
  onDismiss: () => void;
}

interface CoinParticle {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  rotation: number;
}

interface SparkleParticle {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
}

export function WinCelebration({
  tier,
  amount,
  autoSpinActive,
  onDismiss,
}: WinCelebrationProps) {
  const [displayAmount, setDisplayAmount] = useState(0);

  const coins = useMemo<CoinParticle[]>(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: 26 + ((i * 33) % 622),
        size: 28 + (i % 4) * 7,
        duration: 1.7 + (i % 5) * 0.28,
        delay: (i % 7) * 0.16,
        drift: ((i % 2 === 0 ? 1 : -1) * (20 + (i % 5) * 14)),
        rotation: (i % 2 === 0 ? 1 : -1) * (420 + (i % 4) * 140),
      })),
    [],
  );

  const sparkles = useMemo<SparkleParticle[]>(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: 70 + ((i * 97) % 530),
        top: 380 + ((i * 113) % 520),
        size: 16 + (i % 3) * 8,
        duration: 1.05 + (i % 4) * 0.25,
        delay: (i % 6) * 0.18,
      })),
    [],
  );

  // Smooth rAF count-up for prize readout
  useEffect(() => {
    if (!tier || amount <= 0) {
      setDisplayAmount(0);
      return;
    }

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      setDisplayAmount(amount);
      return;
    }

    const countDuration = tier === 'super' ? 1250 : 950;
    const start = performance.now();
    let rafId = 0;

    const step = (now: number) => {
      const p = Math.min(1, (now - start) / countDuration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayAmount(amount * eased);
      if (p < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setDisplayAmount(amount);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [tier, amount]);

  // Auto-dismiss cleanly
  useEffect(() => {
    if (!tier) return;
    const timeoutMs = autoSpinActive ? 2200 : 3600;
    const timer = window.setTimeout(onDismiss, timeoutMs);
    return () => window.clearTimeout(timer);
  }, [tier, autoSpinActive, onDismiss]);

  if (!tier) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${tier === 'super' ? 'Super Win' : 'Mega Win'} ${formatINR(amount)}. Tap to continue.`}
      onClick={onDismiss}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          onDismiss();
        }
      }}
      className="animate-overlay-in absolute inset-0 z-40 cursor-pointer overflow-hidden bg-black/55 backdrop-blur-[2px]"
      style={{
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
      }}
    >
      {/* Golden radial spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(255,200,55,0.34)_0%,rgba(120,30,8,0.12)_48%,transparent_72%)]"
      />

      {/* Exact Mega/Super Win artwork overlay */}
      <img
        src={tier === 'super' ? ASSETS.super : ASSETS.mega}
        alt={tier === 'super' ? 'Super Win' : 'Mega Win'}
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
      />

      {/* Falling gold coin shower */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {coins.map((c) => (
          <div
            key={c.id}
            className="animate-coin-fall absolute top-0 rounded-full border-[3px] border-[#fff3a8] bg-[radial-gradient(circle_at_32%_30%,#fff9d0_0%,#ffd046_42%,#c97a08_100%)] shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
            style={
              {
                left: c.left,
                width: c.size,
                height: c.size,
                '--coin-dur': `${c.duration}s`,
                '--coin-delay': `${c.delay}s`,
                '--coin-drift': `${c.drift}px`,
                '--coin-rot': `${c.rotation}deg`,
              } as CSSProperties
            }
          >
            <div className="mx-auto mt-[22%] h-[56%] w-[56%] rounded-full border border-[#a55c00]/65" />
          </div>
        ))}
      </div>

      {/* Twinkling star sparkles */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {sparkles.map((s) => (
          <svg
            key={s.id}
            width={s.size}
            height={s.size}
            viewBox="0 0 24 24"
            className="animate-sparkle-pop absolute drop-shadow-[0_0_8px_rgba(255,235,140,0.95)]"
            style={
              {
                left: s.left,
                top: s.top,
                '--sp-dur': `${s.duration}s`,
                '--sp-delay': `${s.delay}s`,
              } as CSSProperties
            }
          >
            <path
              d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z"
              fill="#fff8c9"
            />
          </svg>
        ))}
      </div>

      {/* Animated winning amount aligned precisely to original artwork slot (top: 729px) */}
      <div
        className="tiger-prize-amount font-cabinet-serif pointer-events-none absolute left-0 w-full text-center text-[56px] font-black leading-none tracking-tight"
        style={{ top: 729 }}
      >
        {formatINR(displayAmount)}
      </div>

      {/* Subtle tap-to-continue cue */}
      <div
        className="pointer-events-none absolute left-0 w-full text-center"
        style={{ top: 1090 }}
      >
        <span className="inline-block rounded-full border border-[#ffe28c]/45 bg-[#2a0c06]/80 px-6 py-2 text-[20px] font-bold tracking-[0.16em] text-[#ffe9b4]/90 shadow-lg">
          TAP TO CONTINUE
        </span>
      </div>
    </div>
  );
}
