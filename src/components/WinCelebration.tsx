import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { BOARD_HEIGHT, BOARD_WIDTH, formatINR } from '../game/constants';

interface WinCelebrationProps {
  tier: 'big' | 'mega' | 'super' | null;
  amount: number;
  autoSpinActive: boolean;
  fullEffects: boolean;
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

function CelebrationFrame() {
  return (
    <svg aria-hidden="true" viewBox="0 0 674 700" className="pointer-events-none absolute left-0 w-full" style={{top:370,height:700}}>
      <defs>
        <linearGradient id="winFrameGold" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fff5ad"/><stop offset=".28" stopColor="#f7c449"/><stop offset=".53" stopColor="#ac580b"/><stop offset=".75" stopColor="#ffdf76"/><stop offset="1" stopColor="#95500a"/>
        </linearGradient>
        <linearGradient id="winFrameRed" x2="0" y2="1"><stop stopColor="#e93b29"/><stop offset="1" stopColor="#8d101a"/></linearGradient>
        <radialGradient id="winFrameLight"><stop stopColor="#fffcc2" stopOpacity=".95"/><stop offset=".7" stopColor="#ffdc5d" stopOpacity=".65"/><stop offset="1" stopColor="#ffac35" stopOpacity="0"/></radialGradient>
        <pattern id="winFrameWaves" width="42" height="21" patternUnits="userSpaceOnUse"><path d="M-21 21Q0 -1 21 21T63 21 M-21 14Q0 -8 21 14T63 14" fill="none" stroke="#ffad47" strokeWidth="1.5" opacity=".34"/></pattern>
      </defs>
      <ellipse cx="337" cy="332" rx="330" ry="325" fill="url(#winFrameLight)"/>
      <ellipse cx="337" cy="332" rx="306" ry="299" fill="none" stroke="#ffdb70" strokeWidth="5" opacity=".5"/>
      <g strokeLinejoin="round">
        <path d="M23 49Q42 92 100 92H219L249 68H425L455 92H574Q632 92 651 49L660 88Q650 134 603 142H71Q24 134 14 88Z" fill="url(#winFrameRed)" stroke="#79400a" strokeWidth="15"/>
        <path d="M23 49Q42 92 100 92H219L249 68H425L455 92H574Q632 92 651 49L660 88Q650 134 603 142H71Q24 134 14 88Z" fill="url(#winFrameWaves)" stroke="url(#winFrameGold)" strokeWidth="9"/>
        <path d="M28 558Q44 536 78 536H218L247 557H427L456 536H596Q630 536 646 558L658 595Q638 583 599 583H457L425 612H249L217 583H75Q36 583 16 595Z" fill="url(#winFrameRed)" stroke="#79400a" strokeWidth="15"/>
        <path d="M28 558Q44 536 78 536H218L247 557H427L456 536H596Q630 536 646 558L658 595Q638 583 599 583H457L425 612H249L217 583H75Q36 583 16 595Z" fill="url(#winFrameWaves)" stroke="url(#winFrameGold)" strokeWidth="9"/>
        <path d="M282 548H392L423 608L392 668H282L251 608Z" fill="url(#winFrameRed)" stroke="#79400a" strokeWidth="14"/>
        <path d="M282 548H392L423 608L392 668H282L251 608Z" fill="url(#winFrameWaves)" stroke="url(#winFrameGold)" strokeWidth="8"/>
      </g>
      <g fill="none" stroke="#ffe18a" strokeWidth="5" strokeLinecap="round"><path d="M31 73Q65 111 124 110M643 73Q609 111 550 110M38 573Q85 551 142 555M636 573Q589 551 532 555"/></g>
      <text x="337" y="631" fontSize="62" textAnchor="middle" fontFamily="serif" fontWeight="bold" fill="#ffe594">虎</text>
    </svg>
  );
}

function WinLettering({ tier, value }: { tier: 'big' | 'mega' | 'super'; value: number }) {
  const amountText = value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });
  const amountWidth = Math.min(552, Math.max(180, amountText.length * 75));
  const title = tier === 'big' ? ['BIG WIN'] : tier === 'mega' ? ['MEGA WIN'] : ['SUPER', 'MEGA WIN'];
  const titleTop = tier === 'super' ? 510 : 560;
  const amountTop = tier === 'super' ? 735 : 680;
  return (
    <>
      <svg aria-hidden="true" viewBox="0 0 674 230" className="pointer-events-none absolute left-0 w-full overflow-visible" style={{top:titleTop,height:230}}>
        <defs><linearGradient id="winTitleMetal" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fffac6"/><stop offset=".3" stopColor="#ffe47b"/><stop offset=".64" stopColor="#ffb735"/><stop offset="1" stopColor="#e37c14"/></linearGradient></defs>
        {title.map((line, index) => {
          const y=90+index*100;
          const width=line === 'SUPER' ? 360 : line === 'BIG WIN' ? 450 : 530;
          const props={x:337,y,textAnchor:'middle' as const,textLength:width,lengthAdjust:'spacingAndGlyphs' as const,fontFamily:'Impact, Arial Black, system-ui, sans-serif',fontWeight:1000,fontStyle:'italic' as const,fontSize:100,strokeLinejoin:'round' as const};
          return <g key={line}><text {...props} y={y+7} fill="#57236f" stroke="#4a185f" strokeWidth="12">{line}</text><text {...props} fill="#ffe7a1" stroke="#fff0bc" strokeWidth="11">{line}</text><text {...props} fill="url(#winTitleMetal)" stroke="#71309b" strokeWidth="7" paintOrder="stroke fill">{line}</text></g>;
        })}
      </svg>
      <svg aria-hidden="true" viewBox="0 0 674 150" className="tiger-golden-amount pointer-events-none absolute left-0 w-full overflow-visible" style={{top:amountTop,height:150}}>
        <defs>
          <linearGradient id="winAmountMetal" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fffbd2"/><stop offset=".28" stopColor="#fff0a0"/><stop offset=".57" stopColor="#ffc43e"/><stop offset="1" stopColor="#f29b1e"/></linearGradient>
          <pattern id="winAmountStripes" width="46" height="42" patternUnits="userSpaceOnUse"><path d="M0 5Q17 11 25 3L14 16Z M32 24Q15 30 8 22L16 37Z" fill="#9b3d12" opacity=".65"/></pattern>
        </defs>
        <g textAnchor="middle" fontFamily="Georgia, Times New Roman, serif" fontWeight="900" fontStyle="italic" fontSize="112" strokeLinejoin="round">
          <text x="337" y="120" textLength={amountWidth} lengthAdjust="spacingAndGlyphs" fill="#9c2109" stroke="#711b0c" strokeWidth="13">{amountText}</text>
          <text x="337" y="109" textLength={amountWidth} lengthAdjust="spacingAndGlyphs" fill="#fff2a8" stroke="#ffdf79" strokeWidth="12">{amountText}</text>
          <text x="337" y="109" textLength={amountWidth} lengthAdjust="spacingAndGlyphs" fill="url(#winAmountMetal)" stroke="#ae2c12" strokeWidth="7" paintOrder="stroke fill">{amountText}</text>
          <text x="337" y="109" textLength={amountWidth} lengthAdjust="spacingAndGlyphs" fill="url(#winAmountStripes)">{amountText}</text>
        </g>
      </svg>
    </>
  );
}

export function WinCelebration({
  tier,
  amount,
  autoSpinActive,
  fullEffects,
  onDismiss,
}: WinCelebrationProps) {
  const [displayAmount, setDisplayAmount] = useState(0);

  const coins = useMemo<CoinParticle[]>(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: 26 + ((i * 33) % 622),
        size: 22 + (i % 7) * 12,
        duration: 2.2 + (i % 5) * 0.35,
        delay: -(i % 13) * 0.19,
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

    if (!fullEffects && reducedMotion) {
      setDisplayAmount(amount);
      return;
    }

    setDisplayAmount(0);
    const countDuration = tier === 'super' ? 5000 : tier === 'mega' ? 4000 : 3000;
    const start = performance.now();
    let rafId = 0;

    const step = (now: number) => {
      const p = Math.min(1, (now - start) / countDuration);
      const eased = p * (2 - p);
      setDisplayAmount(amount * eased);
      if (p < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setDisplayAmount(amount);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [tier, amount, fullEffects]);

  // Auto-dismiss cleanly
  useEffect(() => {
    if (!tier) return;
    const countMs = tier === 'super' ? 5000 : tier === 'mega' ? 4000 : 3000;
    const timeoutMs = countMs + (autoSpinActive ? 800 : 2000);
    const timer = window.setTimeout(onDismiss, timeoutMs);
    return () => window.clearTimeout(timer);
  }, [tier, autoSpinActive, onDismiss]);

  if (!tier) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${tier === 'super' ? 'Super Mega Win' : tier === 'big' ? 'Big Win' : 'Mega Win'} ${formatINR(amount)}. Tap to continue.`}
      onClick={() => { if (displayAmount >= amount) onDismiss(); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          if (displayAmount >= amount) onDismiss();
        }
      }}
      className="tiger-celebration-screen animate-overlay-in absolute inset-0 z-[100] cursor-pointer overflow-hidden bg-black/90"
      style={{
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
        opacity: 1,
        isolation: 'isolate',
        transform: 'translateZ(0)',
      }}
    >
      {/* Shared uploaded celebration background for all win tiers. */}
      <img src="/assets/tiger/golden-win-background.png" alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden="true" className="tiger-golden-burst pointer-events-none absolute inset-0" />
      {/* Golden radial spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(255,200,55,0.34)_0%,rgba(120,30,8,0.12)_48%,transparent_72%)]"
      />

      <div aria-hidden="true" className="tiger-celebration-glow pointer-events-none absolute inset-0" style={{background:'radial-gradient(ellipse at 50% 45%,rgba(255,215,65,.35),transparent 60%),radial-gradient(ellipse at 15% 82%,rgba(255,110,20,.5),transparent 30%),radial-gradient(ellipse at 85% 82%,rgba(255,110,20,.5),transparent 30%)'}} />
      <CelebrationFrame />
      {tier === 'big' ? (
        <div className="pointer-events-none absolute inset-0">
          
          <img src="/assets/tiger/golden-bull.png" alt="" draggable={false} className="tiger-win-character absolute left-[17%] top-[69%] h-[21%] w-[66%] object-contain" />
        </div>
      ) : (
        <>
          
          <div className="tiger-win-character pointer-events-none absolute left-[16%] top-[17%] h-[25%] w-[68%]">
            <img src="/assets/tiger/dancing-tiger.png" alt="" draggable={false} className="tiger-pose-one absolute inset-0 h-full w-full object-contain" />
            <img src="/assets/tiger/dancing-tiger2.png" alt="" draggable={false} className="tiger-pose-two absolute inset-0 h-full w-full object-contain" />
          </div>
        </>
      )}
      <style>{`@keyframes tigerWinDance { 0%,100% { transform: translateY(0) rotate(-3deg); } 25% { transform: translateY(-12px) rotate(3deg); } 50% { transform: translateY(0) rotate(3deg); } 75% { transform: translateY(-10px) rotate(-3deg); } } .tiger-win-character { animation: tigerWinDance 1.15s ease-in-out infinite; transform-origin:center bottom; } @keyframes tigerPoseOne{0%,49.99%{opacity:1}50%,100%{opacity:0}} @keyframes tigerPoseTwo{0%,49.99%{opacity:0}50%,100%{opacity:1}} .tiger-pose-one{animation:tigerPoseOne 4s step-end infinite} .tiger-pose-two{animation:tigerPoseTwo 4s step-end infinite} @media(prefers-reduced-motion:reduce){.tiger-respect-motion .tiger-win-character,.tiger-respect-motion .tiger-pose-one,.tiger-respect-motion .tiger-pose-two{animation:none;}.tiger-respect-motion .tiger-pose-two{opacity:0;}}`}</style>
      {/* Decorative firework bursts and falling petals. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {[{x:12,y:77,d:0},{x:86,y:80,d:.7},{x:88,y:18,d:1.3},{x:15,y:24,d:2}].map((burst,i)=>(
          <div key={i} className="absolute" style={{left:burst.x+'%',top:burst.y+'%'}}>
            {Array.from({length:18},(_,j)=>(
              <span key={j} className="tiger-firework-ray absolute" style={{'--angle':(j*20)+'deg','--distance':(55+(j%4)*18)+'px',animationDelay:burst.d+'s'} as CSSProperties}/>
            ))}
          </div>
        ))}
        {Array.from({length:12},(_,i)=>(
          <span key={i} className="tiger-win-petal absolute" style={{left:((i*67)%100)+'%',animationDelay:-(i%7)*.5+'s',animationDuration:(3+(i%4)*.45)+'s'}}/>
        ))}
      </div>
      <style>{`
        @keyframes tigerFireworkRay{0%,12%{opacity:0;transform:rotate(var(--angle)) translateX(0) scaleX(.1)}25%{opacity:1}65%{opacity:.8;transform:rotate(var(--angle)) translateX(var(--distance)) scaleX(.8)}100%{opacity:0;transform:rotate(var(--angle)) translateX(var(--distance)) scaleX(.05)}}
        .tiger-firework-ray{width:26px;height:3px;border-radius:100%;background:linear-gradient(90deg,transparent,#ffbc39,#fffbd4);box-shadow:0 0 10px #ffb13c;transform-origin:left center;animation:tigerFireworkRay 2.8s ease-out infinite}
        @keyframes tigerPetalFall{0%{transform:translate3d(0,-70px,0) rotate(0deg);opacity:0}12%{opacity:.9}90%{opacity:.8}100%{transform:translate3d(80px,1530px,0) rotate(490deg);opacity:0}}
        .tiger-win-petal{top:0;width:24px;height:36px;border-radius:85% 10% 85% 15%;background:linear-gradient(140deg,#ffb4dd,#ff4b98);animation:tigerPetalFall linear infinite}
        .tiger-golden-burst{background:radial-gradient(ellipse at 50% 48%,rgba(255,247,175,.65),rgba(255,184,35,.3) 35%,transparent 72%);animation:tigerGoldenBurst 1.5s ease-out both}
        @keyframes tigerGoldenBurst{0%{opacity:.15;transform:scale(.7)}35%{opacity:1;transform:scale(1)}100%{opacity:.35;transform:scale(1.12)}}
        .tiger-golden-amount{animation:tigerAmountGlow 2s ease-in-out infinite}
        @keyframes tigerAmountGlow{0%,100%{filter:drop-shadow(0 0 5px #ffb52a)}50%{filter:drop-shadow(0 0 18px #ffe36b) brightness(1.12)}}
        @media(prefers-reduced-motion:reduce){.tiger-respect-motion .tiger-golden-burst,.tiger-respect-motion .tiger-golden-amount{animation:none}}
        @keyframes tigerGlowPulse{0%,100%{opacity:.65}50%{opacity:1}}
        .tiger-celebration-glow{animation:tigerGlowPulse 1.7s ease-in-out infinite}
        @media(prefers-reduced-motion:reduce){.tiger-respect-motion .tiger-win-petal,.tiger-respect-motion .tiger-firework-ray{display:none}.tiger-respect-motion .tiger-celebration-glow{animation:none}}
      `}</style>
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
            <img src={'/assets/icons/super-mega-win-assets/gold-coin.svg'} alt="" className="h-full w-full object-contain" />
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

      <WinLettering tier={tier} value={displayAmount} />

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
