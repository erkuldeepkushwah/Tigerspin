import {
  REEL_GAP,
  REEL_HEIGHT,
  REEL_LEFT,
  REEL_TOP,
  REEL_WIDTH,
  REELS_TOTAL_WIDTH,
  TILE_HEIGHT,
} from '../game/constants';
import type { WinningLine } from '../game/engine';

interface PaylineOverlayProps {
  winningLines: WinningLine[];
  isFullScreen: boolean;
  visible: boolean;
}

function getCellCenter(col: number, row: number): { x: number; y: number } {
  return {
    x: col * (REEL_WIDTH + REEL_GAP) + REEL_WIDTH / 2,
    y: row * TILE_HEIGHT + TILE_HEIGHT / 2,
  };
}

export function PaylineOverlay({
  winningLines,
  isFullScreen,
  visible,
}: PaylineOverlayProps) {
  if (!visible || winningLines.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute z-20 overflow-visible"
      style={{
        top: REEL_TOP,
        left: REEL_LEFT,
        width: REELS_TOTAL_WIDTH,
        height: REEL_HEIGHT,
      }}
    >
      <svg
        width={REELS_TOTAL_WIDTH}
        height={REEL_HEIGHT}
        viewBox={`0 0 ${REELS_TOTAL_WIDTH} ${REEL_HEIGHT}`}
        className="overflow-visible"
      >
        <defs>
          <filter id="tigerLineGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="tigerGoldStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffae19" />
            <stop offset="50%" stopColor="#fff7b8" />
            <stop offset="100%" stopColor="#ffae19" />
          </linearGradient>
        </defs>

        {winningLines.map((line) => {
          const p0 = getCellCenter(0, line.rows[0]);
          const p1 = getCellCenter(1, line.rows[1]);
          const p2 = getCellCenter(2, line.rows[2]);
          const points = `${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`;

          return (
            <g key={line.lineIndex} className="animate-payline-glow">
              {/* Soft wide gold aura */}
              <polyline
                points={points}
                fill="none"
                stroke={line.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.45"
                filter="url(#tigerLineGlow)"
                className="animate-payline-draw"
              />
              {/* Crisp bright metallic inner line */}
              <polyline
                points={points}
                fill="none"
                stroke="url(#tigerGoldStroke)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-payline-draw"
              />
              {/* Glowing anchor nodes */}
              {[p0, p1, p2].map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="10" fill={line.color} fillOpacity="0.5" />
                  <circle cx={pt.x} cy={pt.y} r="5.5" fill="#fffbe0" />
                </g>
              ))}
            </g>
          );
        })}
      </svg>

      {isFullScreen && (
        <div className="animate-overlay-in absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl border-2 border-[#ffe382] bg-gradient-to-b from-[#6e170a]/95 via-[#430c05]/95 to-[#2b0703]/95 px-7 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_28px_rgba(255,204,51,0.7)]">
            <p className="font-cabinet-display flex items-center justify-center gap-2 text-center text-[32px] font-black tracking-[0.06em] text-[#fff2a8] drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)]">
              <img src="/assets/tiger-spin-svg/18-multiplier.svg" alt="×10" className="h-14 w-14" />
              FULL SCREEN!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
