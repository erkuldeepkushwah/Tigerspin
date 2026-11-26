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

    if (reducedMotion) {
      setDisplayAmount(amount);
      return;
    }

    setDisplayAmount(0);
    const countDuration = tier === 'super' ? 3000 : tier === 'mega' ? 2600 : 1800;
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
  }, [tier, amount]);

  // Auto-dismiss cleanly
  useEffect(() => {
    if (!tier) return;
    const timeoutMs = tier === 'big' ? (autoSpinActive ? 2600 : 3800) : (autoSpinActive ? 4400 : 6000);
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

      <div aria-hidden="true" className="tiger-celebration-glow pointer-events-none absolute inset-0" style={{background:'radial-gradient(ellipse at 50% 45%,rgba(255,215,65,.35),transparent 60%),radial-gradient(ellipse at 15% 82%,rgba(255,110,20,.5),transparent 30%),radial-gradient(ellipse at 85% 82%,rgba(255,110,20,.5),transparent 30%)'}} />
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
          <svg viewBox="0 0 674 1462" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <radialGradient id="tigerPrizeGlow"><stop stopColor="#fffde0"/><stop offset=".5" stopColor="#fff18b"/><stop offset=".8" stopColor="#ffba49"/><stop offset="1" stopColor="#f56855" stopOpacity=".9"/></radialGradient>
              <linearGradient id="tigerRailGold" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff2a3"/><stop offset=".3" stopColor="#d88720"/><stop offset=".55" stopColor="#ffdc76"/><stop offset="1" stopColor="#965019"/></linearGradient>
              <pattern id="tigerRailPattern" width="32" height="18" patternUnits="userSpaceOnUse"><path d="M-16 18Q0-10 16 18Q32-10 48 18M-8 18Q8 0 24 18" fill="none" stroke="#ff9267" strokeWidth="2" opacity=".5"/></pattern>
            </defs>
            <path d="M337 300Q430 270 501 330Q590 300 620 390Q690 415 663 500L663 940Q690 1030 605 1052Q560 1140 465 1094Q337 1195 209 1094Q114 1140 69 1052Q-16 1030 11 940V500Q-16 415 54 390Q84 300 173 330Q244 270 337 300Z" fill="url(#tigerPrizeGlow)" stroke="#ffb28a" strokeWidth="5"/>
            <circle cx="337" cy="735" r="283" fill="none" stroke="#fff7ba" strokeWidth="14" strokeDasharray="19 7" opacity=".7"/>
            <g stroke="url(#tigerRailGold)" strokeWidth="11" strokeLinejoin="round">
              <path d="M24 488L49 458Q85 523 163 495Q260 465 337 498Q414 465 511 495Q589 523 625 458L650 488L628 569H46Z" fill="#b21d26"/>
              <path d="M24 488L49 458Q85 523 163 495Q260 465 337 498Q414 465 511 495Q589 523 625 458L650 488L628 569H46Z" fill="url(#tigerRailPattern)" stroke="none"/>
              <path d="M25 938Q110 916 205 946L337 979L469 946Q564 916 649 938L632 1002Q549 970 468 1016L337 1055L206 1016Q125 970 42 1002Z" fill="#b21d26"/>
              <path d="M25 938Q110 916 205 946L337 979L469 946Q564 916 649 938L632 1002Q549 970 468 1016L337 1055L206 1016Q125 970 42 1002Z" fill="url(#tigerRailPattern)" stroke="none"/>
              <path d="M283 970H391L425 1034L391 1100H283L249 1034Z" fill="#b92026"/>
            </g>
            <text x="337" y="1060" textAnchor="middle" fontSize="62" fontWeight="bold" fill="#ffdf77">虎</text>
          </svg>
          <div className="tiger-win-character pointer-events-none absolute left-[16%] top-[17%] h-[25%] w-[68%]">
            <img src="/assets/tiger/dancing-tiger.png" alt="" draggable={false} className="tiger-pose-one absolute inset-0 h-full w-full object-contain" />
            <img src="/assets/tiger/dancing-tiger2.png" alt="" draggable={false} className="tiger-pose-two absolute inset-0 h-full w-full object-contain" />
          </div>
          <div className="pointer-events-none absolute left-[4%] top-[42%] w-[92%] text-center font-black italic leading-[.93]" style={{fontSize:tier === 'super'?88:100,color:'#ffe294',WebkitTextStroke:'5px #7230a3',paintOrder:'stroke fill',textShadow:'0 7px 0 #54217a,0 0 14px #ffcf70'}}>
            {tier === 'super' ? <>SUPER<br/>MEGA WIN</> : 'MEGA WIN'}
          </div>
        </>
      )}
      <style>{`@keyframes tigerWinDance { 0%,100% { transform: translateY(0) rotate(-3deg); } 25% { transform: translateY(-12px) rotate(3deg); } 50% { transform: translateY(0) rotate(3deg); } 75% { transform: translateY(-10px) rotate(-3deg); } } .tiger-win-character { animation: tigerWinDance 1.15s ease-in-out infinite; transform-origin:center bottom; } @keyframes tigerPoseOne{0%,49.99%{opacity:1}50%,100%{opacity:0}} @keyframes tigerPoseTwo{0%,49.99%{opacity:0}50%,100%{opacity:1}} .tiger-pose-one{animation:tigerPoseOne 4s step-end infinite} .tiger-pose-two{animation:tigerPoseTwo 4s step-end infinite} @media(prefers-reduced-motion:reduce){.tiger-win-character,.tiger-pose-one,.tiger-pose-two{animation:none;}.tiger-pose-two{opacity:0;}}`}</style>
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
        @keyframes tigerGlowPulse{0%,100%{opacity:.65}50%{opacity:1}}
        .tiger-celebration-glow{animation:tigerGlowPulse 1.7s ease-in-out infinite}
        @media(prefers-reduced-motion:reduce){.tiger-win-petal,.tiger-firework-ray{display:none}.tiger-celebration-glow{animation:none}}
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

      {/* Animated winning amount aligned precisely to original artwork slot (top: 729px) */}
      <div
        className="tiger-prize-amount font-cabinet-serif pointer-events-none absolute left-0 w-full text-center text-[56px] font-black leading-none tracking-tight"
        style={tier === 'big' ? {top: 680, fontSize: 100, fontStyle:'italic', color:'#ffe17a', WebkitTextStroke:'3px #9c2309', textShadow:'0 6px 0 #9c2309'} : {top:790,fontSize:100,fontStyle:'italic',color:'#ffe177',WebkitTextStroke:'3px #a3220c',textShadow:'0 7px 0 #a3220c'}}
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
