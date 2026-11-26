import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { BOARD_HEIGHT, BOARD_WIDTH, formatINR } from '../game/constants';

interface WinCelebrationProps {
  tier: 'big' | 'mega' | 'super' | null;
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
      aria-label={`${tier === 'super' ? 'Super Mega Win' : tier === 'big' ? 'Big Win' : 'Mega Win'} ${formatINR(amount)}. Tap to continue.`}
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

      {tier === 'big' ? (
        <div className="pointer-events-none absolute inset-0">
          <svg viewBox="0 0 674 1462" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <radialGradient id="bigWinGlow"><stop stopColor="#fffed1"/><stop offset=".48" stopColor="#ffdd40"/><stop offset="1" stopColor="#a7531b"/></radialGradient>
              <linearGradient id="bigWinGold" x2="0" y2="1"><stop stopColor="#fff0a1"/><stop offset=".48" stopColor="#c17b27"/><stop offset="1" stopColor="#ffe79a"/></linearGradient>
            </defs>
            <path d="M24 365 Q125 435 220 329 L337 292 454 329 Q550 435 650 365 L630 449 Q530 478 337 407 Q144 478 44 449Z" fill="#ae3026" stroke="#6ad4d7" strokeWidth="10"/>
            <circle cx="337" cy="330" r="55" fill="#bd3027" stroke="#87d8d7" strokeWidth="7"/>
            <text x="337" y="344" textAnchor="middle" fontSize="36" fontWeight="900" fill="#ffe475">NIU</text>
            {[34,640].map(x=><g key={x} stroke="#ffb960" strokeWidth="5"><path d={`M${x} 434v145`} /><rect x={x-10} y="490" width="20" height="90" rx="8" fill="#b82323"/></g>)}
            <g fill="#123d7f" stroke="#e9b353" strokeWidth="7">
              <path d="M0 900 Q65 835 134 904 Q190 853 247 948 Q337 900 337 1055 Q210 1120 120 1060 Q40 1080 0 1020Z"/>
              <path d="M674 900 Q609 835 540 904 Q484 853 427 948 Q337 900 337 1055 Q464 1120 554 1060 Q634 1080 674 1020Z"/>
              <path d="M36 980q80-100 132 0q-25 72-75 20M638 980q-80-100-132 0q25 72 75 20" fill="none"/>
            </g>
            <circle cx="337" cy="660" r="311" fill="#8f421c" stroke="#f6c15a" strokeWidth="9"/>
            <circle cx="337" cy="660" r="292" fill="url(#bigWinGold)" stroke="#9b4b21" strokeWidth="9" strokeDasharray="13 5"/>
            <circle cx="337" cy="660" r="268" fill="url(#bigWinGlow)" stroke="#ffda78" strokeWidth="12"/>
            <path d="M337 415Q410 414 444 455Q508 452 514 520Q578 551 570 660Q578 769 514 800Q508 868 444 865Q410 906 337 905Q264 906 230 865Q166 868 160 800Q96 769 104 660Q96 551 160 520Q166 452 230 455Q264 414 337 415Z" fill="none" stroke="#ffc977" strokeWidth="6"/>
            <path d="M283 947h108l38 56-38 56H283l-38-56Z" fill="#b92c25" stroke="#f4b449" strokeWidth="8"/>
            <text x="337" y="1022" textAnchor="middle" fontSize="48" fontWeight="900" fill="#ffde59">FU</text>
          </svg>
          <div className="absolute left-0 top-[35%] w-full text-center font-black italic text-[100px] leading-none" style={{color:'#ffe583',WebkitTextStroke:'4px #087c9d',paintOrder:'stroke fill',textShadow:'0 8px 0 #07526a'}}>BIG WIN</div>
          <img src="/assets/icons/big%20win/golden-bull.png.svg" alt="" draggable={false} className="tiger-win-character absolute left-[17%] top-[69%] h-[21%] w-[66%] object-contain" style={{maskImage:'radial-gradient(ellipse at 50% 48%, black 58%, transparent 75%)'}} />
        </div>
      ) : (
        <>
          <div className="pointer-events-none absolute left-[5%] top-[23%] h-[49%] w-[90%] rounded-[64px] border-[10px] border-[#f8cd58] shadow-[0_0_55px_#ffbb37,inset_0_0_30px_#b76111]" style={{background:'radial-gradient(ellipse at 50% 42%,#fff5bd,#fbd35d 55%,#ac5014)'}} />
          <img src="/assets/icons/super-mega-win-assets/tiger-character.svg" alt="" draggable={false} className="tiger-win-character pointer-events-none absolute left-[23%] top-[12%] h-[29%] w-[54%] object-contain" />
          <div className="font-cabinet-display pointer-events-none absolute left-[8%] top-[43%] w-[84%] text-center text-[68px] font-black leading-tight" style={{color:'#fff6b2',textShadow:'0 5px 0 #914008, 0 0 18px #b34d09'}}>{tier === 'super' ? 'SUPER MEGA WIN' : 'MEGA WIN'}</div>
        </>
      )}
      <style>{`@keyframes tigerWinDance { 0%,100% { transform: translateY(0) rotate(-3deg); } 25% { transform: translateY(-12px) rotate(3deg); } 50% { transform: translateY(0) rotate(3deg); } 75% { transform: translateY(-10px) rotate(-3deg); } } .tiger-win-character { animation: tigerWinDance 1.15s ease-in-out infinite; transform-origin:center bottom; } @media(prefers-reduced-motion:reduce){.tiger-win-character{animation:none;}}`}</style>
      {/* Falling gold coin shower */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {coins.map((c) => (
          <div
            key={c.id}
            className="animate-coin-fall absolute top-0"
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
            <img src={tier === 'super' ? '/assets/icons/super-mega-win-assets/gold-coin.svg' : '/assets/icons/mega%20win/gold-coin.png.svg'} alt="" className="h-full w-full object-contain" />
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
        style={tier === 'big' ? {top: 680, fontSize: 100, fontStyle:'italic', color:'#ffe17a', WebkitTextStroke:'3px #9c2309', textShadow:'0 6px 0 #9c2309'} : {top:820,color:'#8b2607',textShadow:'0 2px 0 #fff4b0'}}
      >
        {formatINR(displayAmount)}
      </div>

      {/* Subtle tap-to-continue cue */}
      <div
        className="pointer-events-none absolute left-0 w-full text-center"
        style={{ top: tier === 'big' ? 1340 : 1090 }}
      >
        <span className="inline-block rounded-full border border-[#ffe28c]/45 bg-[#2a0c06]/80 px-6 py-2 text-[20px] font-bold tracking-[0.16em] text-[#ffe9b4]/90 shadow-lg">
          TAP TO CONTINUE
        </span>
      </div>
    </div>
  );
}
