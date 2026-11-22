import { useCallback, useEffect, useRef, useState } from 'react';
import { GameModal, type ModalType } from './components/GameModal';
import { PaylineOverlay } from './components/PaylineOverlay';
import { ReelColumn } from './components/ReelColumn';
import { WinCelebration } from './components/WinCelebration';
import { soundEngine, triggerHaptic } from './game/audio';
import {
  ASSETS,
  BETS,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  DEFAULT_BALANCE,
  DEFAULT_BANNER_TEXT,
  HOTSPOTS,
  INITIAL_GRID,
  REEL_GAP,
  REEL_HEIGHT,
  REEL_LEFT,
  REEL_TOP,
  REELS_TOTAL_WIDTH,
  SYMBOLS,
  formatINR,
  type Grid,
} from './game/constants';
import {
  evaluateGrid,
  generateSpinGrid,
  loadPersistedState,
  savePersistedState,
  type SpinEvaluation,
} from './game/engine';

function useAnimatedValue(target: number, durationMs = 420): number {
  const [displayed, setDisplayed] = useState(target);
  const currentRef = useRef(target);

  useEffect(() => {
    const startVal = currentRef.current;
    if (Math.abs(target - startVal) < 0.005) {
      currentRef.current = target;
      setDisplayed(target);
      return;
    }

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || durationMs <= 0) {
      currentRef.current = target;
      setDisplayed(target);
      return;
    }

    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = startVal + (target - startVal) * eased;
      currentRef.current = val;
      setDisplayed(val);
      if (p < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        currentRef.current = target;
        setDisplayed(target);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs]);

  return displayed;
}

export default function App() {
  const [persisted] = useState(() => loadPersistedState());

  const [balance, setBalance] = useState(persisted.balance);
  const [betIndex, setBetIndex] = useState(persisted.betIndex);
  const [soundEnabled, setSoundEnabled] = useState(persisted.soundEnabled);
  const [turbo, setTurbo] = useState(persisted.turbo);
  const [hapticsEnabled, setHapticsEnabled] = useState(persisted.hapticsEnabled);

  const [grid, setGrid] = useState<Grid>(INITIAL_GRID);
  const [spinId, setSpinId] = useState(0);
  const [slamSignal, setSlamSignal] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);

  const [lastWin, setLastWin] = useState(0);
  const [evaluation, setEvaluation] = useState<SpinEvaluation | null>(null);
  const [showWinVisuals, setShowWinVisuals] = useState(false);
  const [celebration, setCelebration] = useState<{
    tier: 'mega' | 'super';
    amount: number;
  } | null>(null);

  const [bannerText, setBannerText] = useState(DEFAULT_BANNER_TEXT);
  const [bannerIsWin, setBannerIsWin] = useState(false);
  const [bannerKey, setBannerKey] = useState(0);

  const [modal, setModal] = useState<ModalType>(null);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const [pullOffset, setPullOffset] = useState(0);
  const [scale, setScale] = useState(1);

  const bet = BETS[betIndex];
  const animatedBalance = useAnimatedValue(balance, 440);
  const animatedWin = useAnimatedValue(lastWin, 520);

  // Refs for clean async callbacks without stale closures
  const spinningRef = useRef(false);
  const balanceRef = useRef(balance);
  const betRef = useRef(bet);
  const autoSpinRef = useRef(autoSpin);
  const turboRef = useRef(turbo);
  const hapticsRef = useRef(hapticsEnabled);
  const modalRef = useRef<ModalType>(modal);
  const pendingEvalRef = useRef<SpinEvaluation | null>(null);
  const settledColsRef = useRef<Set<number>>(new Set());
  const autoTimerRef = useRef<number | null>(null);
  const swipeRef = useRef<{
    pointerId: number;
    startY: number;
    maxDeltaY: number;
    moved: boolean;
  } | null>(null);

  balanceRef.current = balance;
  betRef.current = bet;
  autoSpinRef.current = autoSpin;
  turboRef.current = turbo;
  hapticsRef.current = hapticsEnabled;
  modalRef.current = modal;

  // Keep audio engine synced with setting
  useEffect(() => {
    soundEngine.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Persist user preferences and demo balance
  useEffect(() => {
    savePersistedState({
      balance,
      betIndex,
      soundEnabled,
      turbo,
      hapticsEnabled,
    });
  }, [balance, betIndex, soundEnabled, turbo, hapticsEnabled]);

  // Preload all cabinet, celebration, and symbol WebP images once
  useEffect(() => {
    const urls = [
      ASSETS.board,
      ASSETS.mega,
      ASSETS.super,
      ...SYMBOLS.map((s) => s.image),
    ];
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, []);

  // Responsive viewport scaling tuned for mobile browsers (visualViewport-aware)
  useEffect(() => {
    const computeScale = () => {
      const vv = window.visualViewport;
      const vw = vv ? vv.width : window.innerWidth;
      const vh = vv ? vv.height : window.innerHeight;
      const nextScale = Math.min(vw / BOARD_WIDTH, vh / BOARD_HEIGHT);
      setScale(Math.max(0.2, nextScale));
    };

    computeScale();
    window.addEventListener('resize', computeScale);
    window.addEventListener('orientationchange', computeScale);
    window.visualViewport?.addEventListener('resize', computeScale);

    return () => {
      window.removeEventListener('resize', computeScale);
      window.removeEventListener('orientationchange', computeScale);
      window.visualViewport?.removeEventListener('resize', computeScale);
    };
  }, []);

  const clearAutoTimer = useCallback(() => {
    if (autoTimerRef.current !== null) {
      window.clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const updateBanner = useCallback((text: string, isWin = false) => {
    setBannerText(text);
    setBannerIsWin(isWin);
    setBannerKey((k) => k + 1);
  }, []);

  const triggerSpin = useCallback(() => {
    soundEngine.unlock();
    clearAutoTimer();

    if (modalRef.current !== null) return;

    // If currently spinning, tapping spin acts as instant quick-slam!
    if (spinningRef.current) {
      setSlamSignal((s) => s + 1);
      triggerHaptic(10, hapticsRef.current);
      return;
    }

    const currentBet = betRef.current;
    if (balanceRef.current < currentBet) {
      setAutoSpin(false);
      setModal('lowBalance');
      updateBanner('Add demo credits or lower bet');
      triggerHaptic([18, 40, 18], hapticsRef.current);
      return;
    }

    const nextBalance = Math.round((balanceRef.current - currentBet) * 100) / 100;
    const nextGrid = generateSpinGrid();
    const nextEval = evaluateGrid(nextGrid, currentBet);

    spinningRef.current = true;
    settledColsRef.current = new Set();
    pendingEvalRef.current = nextEval;

    setBalance(nextBalance);
    setLastWin(0);
    setEvaluation(null);
    setShowWinVisuals(false);
    setCelebration(null);
    setSpinning(true);
    setGrid(nextGrid);
    setSpinId((id) => id + 1);

    updateBanner(
      autoSpinRef.current
        ? turboRef.current
          ? 'Auto Turbo spinning...'
          : 'Auto spinning...'
        : turboRef.current
          ? 'Turbo spin!'
          : 'Good luck!',
    );

    soundEngine.playSpinStart(turboRef.current);
    triggerHaptic(14, hapticsRef.current);
  }, [clearAutoTimer, updateBanner]);

  const scheduleNextAutoSpin = useCallback(
    (delayMs: number) => {
      clearAutoTimer();
      if (!autoSpinRef.current || modalRef.current !== null) return;
      autoTimerRef.current = window.setTimeout(() => {
        autoTimerRef.current = null;
        if (autoSpinRef.current && !spinningRef.current && modalRef.current === null) {
          triggerSpin();
        }
      }, delayMs);
    },
    [clearAutoTimer, triggerSpin],
  );

  // Called at the exact frame a reel touches down for crisp audio + haptic sync
  const handleColumnTouchdown = useCallback((colIndex: number, hasWild: boolean) => {
    soundEngine.playReelStop(colIndex, hasWild);
    triggerHaptic(hasWild ? [12, 24, 16] : 8, hapticsRef.current);
  }, []);

  // Called once a column finishes its elastic settle animation
  const handleColumnSettled = useCallback(
    (colIndex: number) => {
      if (!spinningRef.current) return;
      settledColsRef.current.add(colIndex);
      if (settledColsRef.current.size < 3) return;

      spinningRef.current = false;
      setSpinning(false);

      const res = pendingEvalRef.current;
      pendingEvalRef.current = null;
      if (!res) return;

      setEvaluation(res);

      if (res.totalWin > 0) {
        const credited = Math.round((balanceRef.current + res.totalWin) * 100) / 100;
        setBalance(credited);
        setLastWin(res.totalWin);
        setShowWinVisuals(true);

        soundEngine.playWin(res.multiplier, res.isFullScreen);
        triggerHaptic(
          res.celebrationTier ? [20, 45, 30, 45, 35] : [16, 32, 20],
          hapticsRef.current,
        );

        if (res.isFullScreen) {
          updateBanner(`FULL SCREEN ×10! WON ${formatINR(res.totalWin)}`, true);
        } else {
          updateBanner(
            `WIN ${formatINR(res.totalWin)} · ${res.multiplier}×`,
            true,
          );
        }

        if (res.celebrationTier) {
          setCelebration({
            tier: res.celebrationTier,
            amount: res.totalWin,
          });
          // Auto-spin will resume cleanly when celebration dismisses
          return;
        }

        if (autoSpinRef.current) {
          scheduleNextAutoSpin(turboRef.current ? 460 : 880);
        }
      } else {
        updateBanner(DEFAULT_BANNER_TEXT, false);
        if (autoSpinRef.current) {
          scheduleNextAutoSpin(turboRef.current ? 260 : 540);
        }
      }
    },
    [scheduleNextAutoSpin, updateBanner],
  );

  const handleDismissCelebration = useCallback(() => {
    setCelebration(null);
    if (autoSpinRef.current) {
      scheduleNextAutoSpin(turboRef.current ? 300 : 520);
    }
  }, [scheduleNextAutoSpin]);

  // Pause auto-spin safely when mobile tab goes into background
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && autoSpinRef.current) {
        clearAutoTimer();
        setAutoSpin(false);
        updateBanner('Auto spin paused');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [clearAutoTimer, updateBanner]);

  // Cleanup timers on unmount
  useEffect(() => clearAutoTimer, [clearAutoTimer]);

  // Bet stepping handlers
  const stepBet = useCallback(
    (delta: number) => {
      soundEngine.unlock();
      if (spinningRef.current) return;
      setBetIndex((prev) => {
        const next = Math.max(0, Math.min(BETS.length - 1, prev + delta));
        if (next !== prev) {
          soundEngine.playBetStep(delta > 0);
          triggerHaptic(10, hapticsRef.current);
          updateBanner(`Bet ${formatINR(BETS[next])}`);
        }
        return next;
      });
    },
    [updateBanner],
  );

  const toggleTurbo = useCallback(() => {
    soundEngine.unlock();
    setTurbo((prev) => {
      const next = !prev;
      soundEngine.playButtonClick(next ? 620 : 420);
      triggerHaptic(12, hapticsRef.current);
      updateBanner(next ? 'Turbo spin ON' : 'Turbo spin OFF');
      return next;
    });
  }, [updateBanner]);

  const toggleAuto = useCallback(() => {
    soundEngine.unlock();
    setAutoSpin((prev) => {
      const next = !prev;
      soundEngine.playButtonClick(next ? 580 : 390);
      triggerHaptic(12, hapticsRef.current);
      if (next) {
        updateBanner('Auto spin ON');
        if (!spinningRef.current && modalRef.current === null) {
          window.setTimeout(() => {
            if (autoSpinRef.current && !spinningRef.current) {
              triggerSpin();
            }
          }, 80);
        }
      } else {
        clearAutoTimer();
        updateBanner('Auto spin stopped');
      }
      return next;
    });
  }, [clearAutoTimer, triggerSpin, updateBanner]);

  // Desktop keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (modalRef.current !== null) return;
      if (celebration) {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
          e.preventDefault();
          handleDismissCelebration();
        }
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        triggerSpin();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        stepBet(1);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        stepBet(-1);
      } else if (e.key === 't' || e.key === 'T') {
        toggleTurbo();
      } else if (e.key === 'a' || e.key === 'A') {
        toggleAuto();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [celebration, handleDismissCelebration, triggerSpin, stepBet, toggleTurbo, toggleAuto]);

  // Smooth touch swipe-down-to-spin & tap-to-slam on the reel window
  const handleReelPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    soundEngine.unlock();
    e.currentTarget.setPointerCapture(e.pointerId);
    swipeRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      maxDeltaY: 0,
      moved: false,
    };
  };

  const handleReelPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    if (!swipe || swipe.pointerId !== e.pointerId) return;
    const rawDeltaY = (e.clientY - swipe.startY) / Math.max(0.25, scale);
    if (Math.abs(rawDeltaY) > 10) {
      swipe.moved = true;
    }
    if (rawDeltaY > swipe.maxDeltaY) {
      swipe.maxDeltaY = rawDeltaY;
    }
    if (!spinningRef.current && rawDeltaY > 0) {
      // Soft resistance pull curve
      const resisted = Math.min(38, rawDeltaY * 0.42);
      setPullOffset(resisted);
    }
  };

  const handleReelPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    if (!swipe || swipe.pointerId !== e.pointerId) return;
    swipeRef.current = null;
    setPullOffset(0);

    if (spinningRef.current) {
      // Short tap on reels during spin triggers quick-slam
      if (!swipe.moved || swipe.maxDeltaY < 24) {
        setSlamSignal((s) => s + 1);
        triggerHaptic(10, hapticsRef.current);
      }
      return;
    }

    // Pull down >= 38px on the logical board triggers spin
    if (swipe.maxDeltaY >= 38) {
      soundEngine.playSwipeCue();
      triggerSpin();
    }
  };

  const handleReelPointerCancel = () => {
    swipeRef.current = null;
    setPullOffset(0);
  };

  const handleRefill = useCallback(
    (amount: number) => {
      soundEngine.playWin(2, false);
      setBalance((b) => Math.round((b + amount) * 100) / 100);
      updateBanner(`Added +${formatINR(amount)} demo credits`, true);
      triggerHaptic([12, 24, 16], hapticsRef.current);
    },
    [updateBanner],
  );

  const handleResetBalance = useCallback(() => {
    soundEngine.playButtonClick(520);
    setBalance(DEFAULT_BALANCE);
    setLastWin(0);
    setShowWinVisuals(false);
    updateBanner(`Demo balance reset to ${formatINR(DEFAULT_BALANCE)}`);
  }, [updateBanner]);

  // Tactile press helpers for board hotspots
  const bindPress = (id: string) => ({
    onPointerDown: () => {
      soundEngine.unlock();
      setPressedButton(id);
    },
    onPointerUp: () => setPressedButton(null),
    onPointerLeave: () => setPressedButton(null),
    onPointerCancel: () => setPressedButton(null),
  });

  const hitCells = evaluation?.hitCells ?? new Set<string>();
  const winningLines = evaluation?.winningLines ?? [];
  const isFullScreen = evaluation?.isFullScreen ?? false;

  return (
    <main
      className={`relative flex h-[100dvh] w-screen items-center justify-center overflow-hidden transition-colors duration-500 ${
        showWinVisuals ? 'tiger-stage-bg-win' : 'tiger-stage-bg'
      }`}
    >
      {/* Subtle ambient crimson-gold glow behind cabinet on wide viewports */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,186,66,0.12)_0%,transparent_58%)]"
      />

      {/* Responsive scaled 674x1462 Tiger Spins Cabinet */}
      <div
        className="relative shrink-0 overflow-hidden will-change-transform"
        style={{
          width: BOARD_WIDTH,
          height: BOARD_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Exact Cabinet Frame Artwork */}
        <img
          src={ASSETS.board}
          alt="Tiger Spins Arcade Cabinet"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none"
        />

        {/* 3 Fluid Physics Reel Columns */}
        <div
          className="absolute flex"
          style={{
            top: REEL_TOP,
            left: REEL_LEFT,
            gap: REEL_GAP,
          }}
        >
          {[0, 1, 2].map((colIndex) => (
            <ReelColumn
              key={colIndex}
              colIndex={colIndex}
              symbols={grid[colIndex]}
              spinId={spinId}
              turbo={turbo}
              slamSignal={slamSignal}
              pullOffset={pullOffset}
              hitCells={hitCells}
              showWin={showWinVisuals}
              onColumnTouchdown={handleColumnTouchdown}
              onColumnSettled={handleColumnSettled}
            />
          ))}
        </div>

        {/* Animated Winning Paylines & Full-Screen Banner */}
        <PaylineOverlay
          winningLines={winningLines}
          isFullScreen={isFullScreen}
          visible={showWinVisuals}
        />

        {/* Touch Gesture Layer over Reels (Swipe Down to Spin / Tap to Quick-Slam) */}
        <div
          role="presentation"
          onPointerDown={handleReelPointerDown}
          onPointerMove={handleReelPointerMove}
          onPointerUp={handleReelPointerEnd}
          onPointerCancel={handleReelPointerCancel}
          className="absolute z-[25] cursor-grab touch-none active:cursor-grabbing"
          style={{
            top: REEL_TOP,
            left: REEL_LEFT,
            width: REELS_TOTAL_WIDTH,
            height: REEL_HEIGHT,
          }}
        />

        {/* Status Banner */}
        <div
          key={bannerKey}
          aria-live="polite"
          className={`animate-banner-pop font-cabinet-serif pointer-events-none absolute text-center text-[25px] font-bold italic leading-tight tracking-tight ${
            bannerIsWin ? 'tiger-banner-win' : 'tiger-banner-text'
          }`}
          style={{
            top: 960,
            left: 50,
            width: 574,
          }}
        >
          {bannerText}
        </div>

        {/* Credits, Bet, Win Readouts */}
        <div
          aria-label={`Balance ${formatINR(balance)}`}
          className="tiger-money-text pointer-events-none absolute text-center text-[22px] font-extrabold leading-none"
          style={{ top: 1080, left: 42, width: 176 }}
        >
          {formatINR(animatedBalance)}
        </div>
        <div
          aria-label={`Current bet ${formatINR(bet)}`}
          className="tiger-money-text pointer-events-none absolute text-center text-[22px] font-extrabold leading-none"
          style={{ top: 1080, left: 264, width: 176 }}
        >
          {formatINR(bet)}
        </div>
        <div
          aria-label={`Last win ${formatINR(lastWin)}`}
          className={`tiger-money-text pointer-events-none absolute text-center text-[22px] font-extrabold leading-none transition-transform duration-200 ${
            showWinVisuals && lastWin > 0 ? 'scale-105 text-[#fff7b2]' : ''
          }`}
          style={{ top: 1080, left: 487, width: 176 }}
        >
          {formatINR(animatedWin)}
        </div>

        {/* Demo Credits Footer */}
        <div
          className="pointer-events-none absolute left-0 w-full text-center text-[15px] font-extrabold tracking-[0.14em] text-[#ffd498]/75"
          style={{ top: 1370 }}
        >
          DEMO CREDITS
        </div>

        {/* === INTERACTIVE BOARD HOTSPOTS (aligned pixel-for-pixel to board.webp) === */}

        {/* Pause Button */}
        <button
          type="button"
          aria-label="Pause game"
          {...bindPress('pause')}
          onClick={() => {
            soundEngine.playButtonClick(440);
            triggerHaptic(10, hapticsEnabled);
            clearAutoTimer();
            setAutoSpin(false);
            setModal('pause');
          }}
          className={`absolute z-30 cursor-pointer rounded-full border-0 bg-transparent transition-transform duration-100 focus-visible:outline-4 focus-visible:outline-[#ffd56b] ${
            pressedButton === 'pause'
              ? 'scale-95 bg-[#ffe07a]/20 shadow-[inset_0_0_24px_rgba(255,220,110,0.6)]'
              : ''
          }`}
          style={HOTSPOTS.pause}
        />

        {/* Settings Button */}
        <button
          type="button"
          aria-label="Open settings and paytable"
          {...bindPress('settings')}
          onClick={() => {
            soundEngine.playButtonClick(500);
            triggerHaptic(10, hapticsEnabled);
            setModal('settings');
          }}
          className={`absolute z-30 cursor-pointer rounded-full border-0 bg-transparent transition-transform duration-100 focus-visible:outline-4 focus-visible:outline-[#ffd56b] ${
            pressedButton === 'settings'
              ? 'scale-95 bg-[#ffe07a]/20 shadow-[inset_0_0_24px_rgba(255,220,110,0.6)]'
              : ''
          }`}
          style={HOTSPOTS.settings}
        />

        {/* Turbo Toggle Button */}
        <button
          type="button"
          aria-label={turbo ? 'Disable turbo spin' : 'Enable turbo spin'}
          aria-pressed={turbo}
          {...bindPress('turbo')}
          onClick={toggleTurbo}
          className={`absolute z-30 cursor-pointer rounded-full border-0 bg-transparent transition-transform duration-100 focus-visible:outline-4 focus-visible:outline-[#ffd56b] ${
            pressedButton === 'turbo' ? 'scale-[0.92]' : ''
          }`}
          style={HOTSPOTS.turbo}
        >
          {turbo && (
            <>
              <span
                aria-hidden="true"
                className="animate-pulse-ring pointer-events-none absolute -inset-1 rounded-full border-[4px] border-[#ffd659] shadow-[0_0_22px_rgba(255,204,54,0.9),inset_0_0_16px_rgba(255,214,89,0.45)]"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-[#ffe89a] bg-[#8f2606] px-2.5 py-0.5 text-[13px] font-black tracking-wider text-[#fff4b8] shadow-md"
              >
                ON
              </span>
            </>
          )}
          {pressedButton === 'turbo' && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full bg-[#ffe58f]/25"
            />
          )}
        </button>

        {/* Decrease Bet Button */}
        <button
          type="button"
          aria-label="Decrease bet"
          disabled={spinning || betIndex === 0}
          {...bindPress('minus')}
          onClick={() => stepBet(-1)}
          className={`absolute z-30 cursor-pointer rounded-full border-0 bg-transparent transition-transform duration-100 disabled:cursor-not-allowed focus-visible:outline-4 focus-visible:outline-[#ffd56b] ${
            pressedButton === 'minus'
              ? 'scale-[0.92] bg-[#ffe07a]/22 shadow-[inset_0_0_22px_rgba(255,220,110,0.55)]'
              : ''
          }`}
          style={HOTSPOTS.minus}
        />

        {/* Main Spin Button */}
        <button
          type="button"
          aria-label={spinning ? 'Quick stop reels' : 'Spin reels'}
          {...bindPress('spin')}
          onClick={triggerSpin}
          className={`absolute z-30 cursor-pointer rounded-full border-0 bg-transparent transition-transform duration-100 focus-visible:outline-4 focus-visible:outline-[#ffd56b] ${
            pressedButton === 'spin' ? 'scale-[0.94]' : ''
          }`}
          style={HOTSPOTS.spin}
        >
          {/* Orbiting golden ring while reels are spinning */}
          {spinning && (
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute -inset-2 rounded-full border-[5px] border-transparent border-t-[#fff5b8] border-r-[#ffbd2e] shadow-[0_0_26px_rgba(255,198,58,0.85)] ${
                turbo ? 'animate-spin-orbit-fast' : 'animate-spin-orbit'
              }`}
            />
          )}
          {pressedButton === 'spin' && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-1 rounded-full bg-[radial-gradient(circle,rgba(255,244,180,0.42)_0%,rgba(255,190,48,0.12)_65%,transparent_100%)]"
            />
          )}
        </button>

        {/* Increase Bet Button */}
        <button
          type="button"
          aria-label="Increase bet"
          disabled={spinning || betIndex === BETS.length - 1}
          {...bindPress('plus')}
          onClick={() => stepBet(1)}
          className={`absolute z-30 cursor-pointer rounded-full border-0 bg-transparent transition-transform duration-100 disabled:cursor-not-allowed focus-visible:outline-4 focus-visible:outline-[#ffd56b] ${
            pressedButton === 'plus'
              ? 'scale-[0.92] bg-[#ffe07a]/22 shadow-[inset_0_0_22px_rgba(255,220,110,0.55)]'
              : ''
          }`}
          style={HOTSPOTS.plus}
        />

        {/* Auto-Spin Toggle Button */}
        <button
          type="button"
          aria-label={autoSpin ? 'Stop auto spin' : 'Start auto spin'}
          aria-pressed={autoSpin}
          {...bindPress('auto')}
          onClick={toggleAuto}
          className={`absolute z-30 cursor-pointer rounded-full border-0 bg-transparent transition-transform duration-100 focus-visible:outline-4 focus-visible:outline-[#ffd56b] ${
            pressedButton === 'auto' ? 'scale-[0.92]' : ''
          }`}
          style={HOTSPOTS.auto}
        >
          {autoSpin && (
            <>
              <span
                aria-hidden="true"
                className="animate-pulse-ring pointer-events-none absolute -inset-1 rounded-full border-[4px] border-[#8cf8b0] shadow-[0_0_22px_rgba(104,245,154,0.85),inset_0_0_16px_rgba(140,248,176,0.4)]"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-[#b4ffd0] bg-[#14592c] px-2.5 py-0.5 text-[13px] font-black tracking-wider text-[#e2ffec] shadow-md"
              >
                STOP
              </span>
            </>
          )}
          {pressedButton === 'auto' && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full bg-[#ffe58f]/25"
            />
          )}
        </button>

        {/* Mega Win / Super Win Full-Cabinet Celebration Overlay */}
        <WinCelebration
          tier={celebration?.tier ?? null}
          amount={celebration?.amount ?? 0}
          autoSpinActive={autoSpin}
          onDismiss={handleDismissCelebration}
        />
      </div>

      {/* Native-scale Mobile-Friendly Modals (Pause, Settings, Paytable, Low Balance) */}
      <GameModal
        modal={modal}
        soundEnabled={soundEnabled}
        turbo={turbo}
        hapticsEnabled={hapticsEnabled}
        onClose={() => setModal(null)}
        onOpenPaytable={() => {
          soundEngine.playButtonClick(560);
          setModal('paytable');
        }}
        onBackToSettings={() => {
          soundEngine.playButtonClick(460);
          setModal('settings');
        }}
        onToggleSound={() => {
          setSoundEnabled((prev) => {
            const next = !prev;
            soundEngine.setEnabled(next);
            if (next) soundEngine.playButtonClick(540);
            triggerHaptic(10, hapticsEnabled);
            return next;
          });
        }}
        onToggleTurbo={toggleTurbo}
        onToggleHaptics={() => {
          setHapticsEnabled((prev) => {
            const next = !prev;
            soundEngine.playButtonClick(next ? 540 : 400);
            if (next) triggerHaptic(14, true);
            return next;
          });
        }}
        onRefill={handleRefill}
        onResetBalance={handleResetBalance}
      />
    </main>
  );
}
