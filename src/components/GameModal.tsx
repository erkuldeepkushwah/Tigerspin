import { useEffect } from 'react';
import {
  Pause,
  RotateCcw,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { ICON_ASSETS } from '../game/iconAssets';
import { PAYLINES, SYMBOLS } from '../game/constants';

export type ModalType = 'pause' | 'settings' | 'paytable' | 'lowBalance' | null;

interface GameModalProps {
  modal: ModalType;
  soundEnabled: boolean;
  turbo: boolean;
  hapticsEnabled: boolean;
  fullEffects: boolean;
  onToggleFullEffects: () => void;
  onClose: () => void;
  onOpenPaytable: () => void;
  onBackToSettings: () => void;
  onToggleSound: () => void;
  onToggleTurbo: () => void;
  onToggleHaptics: () => void;
  onRefill: (amount: number) => void;
  onResetBalance: () => void;
}

const SORTED_PAYTABLE = [...SYMBOLS].sort((a, b) => b.rate - a.rate);

export function GameModal({
  modal,
  soundEnabled,
  turbo,
  hapticsEnabled,
  fullEffects,
  onToggleFullEffects,
  onClose,
  onOpenPaytable,
  onBackToSettings,
  onToggleSound,
  onToggleTurbo,
  onToggleHaptics,
  onRefill,
  onResetBalance,
}: GameModalProps) {
  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal, onClose]);

  if (!modal) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tiger-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-overlay-in relative max-h-[88dvh] w-full max-w-[390px] overflow-y-auto rounded-3xl border-2 border-[#e7b964] bg-gradient-to-b from-[#3d140d] via-[#2b0d09] to-[#1e0806] p-5 text-[#ffe9b4] shadow-[0_24px_64px_rgba(0,0,0,0.85),0_0_32px_rgba(231,185,100,0.22)]">
        {/* Top bar */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {modal === 'pause' && <Pause className="h-5 w-5 text-[#ffd56b]" />}
            {modal === 'settings' && <img src="/assets/icons/super-mega-win-assets/settings.svg" alt="" className="h-6 w-6 object-contain" />}
            {(modal === 'paytable' || modal === 'lowBalance') && (
              <Sparkles className="h-5 w-5 text-[#ffd56b]" />
            )}
            <h2
              id="tiger-modal-title"
              className="font-cabinet-display text-xl font-black tracking-wide text-[#ffdf85]"
            >
              {modal === 'pause' && 'Game Paused'}
              {modal === 'settings' && 'Settings'}
              {modal === 'paytable' && 'Paytable & Lines'}
              {modal === 'lowBalance' && 'Demo Credits Low'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e7b964]/45 bg-[#531b11] text-[#ffe9b4] transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-[#ffd56b]"
          >
            <img src="/assets/icons/mega%20win/exit.png.svg" alt="" className="h-7 w-7 object-contain" />
          </button>
        </div>

        {/* PAUSE VIEW */}
        {modal === 'pause' && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-[#f6d9a2]/90">
              Tiger Spins demo arcade is paused. Auto-spin has been stopped safely.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#ffe27a] via-[#f2b830] to-[#d08212] px-4 text-base font-extrabold text-[#2a0c04] shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition-transform active:scale-[0.98]"
            >
              Resume Game
            </button>

            <button
              type="button"
              onClick={() => {
                onRefill(500);
                onClose();
              }}
              className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#e7b964]/50 bg-[#4b170e] px-4 text-sm font-bold text-[#ffe9b4] transition-transform active:scale-[0.98]"
            >
              Add +₹500.00 Demo Credits
            </button>

            <button
              type="button"
              onClick={() => {
                onResetBalance();
                onClose();
              }}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-[#e7b964]/30 bg-[#32100a] px-4 text-sm font-semibold text-[#f3cfa0]/90 transition-transform active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Demo Balance (₹3,942.50)
            </button>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {modal === 'settings' && (
          <div className="space-y-3">
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={onToggleSound}
              className="flex min-h-[54px] w-full items-center justify-between rounded-2xl border border-[#e7b964]/35 bg-[#36110b] px-4 text-left transition-transform active:scale-[0.99]"
            >
              <span className="flex items-center gap-3 text-sm font-bold text-[#ffe9b4]">
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-[#ffd56b]" />
                ) : (
                  <VolumeX className="h-5 w-5 text-[#c28a6c]" />
                )}
                Sound Effects
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold tracking-wide ${
                  soundEnabled
                    ? 'bg-[#2a7d46] text-[#d6ffe4]'
                    : 'bg-[#56241b] text-[#d9a88c]'
                }`}
              >
                {soundEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Turbo Toggle */}
            <button
              type="button"
              onClick={onToggleTurbo}
              className="flex min-h-[54px] w-full items-center justify-between rounded-2xl border border-[#e7b964]/35 bg-[#36110b] px-4 text-left transition-transform active:scale-[0.99]"
            >
              <span className="flex items-center gap-3 text-sm font-bold text-[#ffe9b4]">
                <Zap className="h-5 w-5 text-[#ffd56b]" />
                Turbo Spin Speed
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold tracking-wide ${
                  turbo
                    ? 'bg-[#d98714] text-[#280b04]'
                    : 'bg-[#56241b] text-[#d9a88c]'
                }`}
              >
                {turbo ? 'FAST' : 'NORMAL'}
              </span>
            </button>

            <button type="button" onClick={onToggleFullEffects} aria-pressed={fullEffects} className="flex min-h-[54px] w-full items-center justify-between rounded-2xl border border-[#e7b964]/35 bg-[#36110b] px-4 text-left text-sm font-bold">
              <span className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-[#ffd56b]" />Full Game Animations</span>
              <span className="text-xs text-[#ffd56b]">{fullEffects ? 'FULL' : 'SYSTEM'}</span>
            </button>
            {/* Haptics Toggle */}
            <button
              type="button"
              onClick={onToggleHaptics}
              className="flex min-h-[54px] w-full items-center justify-between rounded-2xl border border-[#e7b964]/35 bg-[#36110b] px-4 text-left transition-transform active:scale-[0.99]"
            >
              <span className="flex items-center gap-3 text-sm font-bold text-[#ffe9b4]">
                <Smartphone className="h-5 w-5 text-[#ffd56b]" />
                Touch Haptics
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold tracking-wide ${
                  hapticsEnabled
                    ? 'bg-[#2a7d46] text-[#d6ffe4]'
                    : 'bg-[#56241b] text-[#d9a88c]'
                }`}
              >
                {hapticsEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            <div className="pt-1 space-y-2.5">
              <button
                type="button"
                onClick={onOpenPaytable}
                className="flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#ffe27a] via-[#f2b830] to-[#d08212] px-4 text-sm font-extrabold text-[#2a0c04] shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition-transform active:scale-[0.98]"
              >
                View Paytable & 5 Paylines
              </button>

              <button
                type="button"
                onClick={() => {
                  onRefill(500);
                  onClose();
                }}
                className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#e7b964]/45 bg-[#4b170e] px-4 text-sm font-bold text-[#ffe9b4] transition-transform active:scale-[0.98]"
              >
                Refill +₹500.00 Demo Credits
              </button>
            </div>

            <details className="rounded-xl border border-[#e7b964]/35 p-3">
              <summary className="cursor-pointer text-sm font-bold">Game artwork library ({ICON_ASSETS.length})</summary>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {ICON_ASSETS.map(asset => <figure key={asset.url} className="min-w-0 rounded-lg bg-[#220a06] p-1 text-center">
                  <img src={asset.url} alt={asset.name} loading="lazy" className="h-16 w-full object-contain" />
                  <figcaption className="break-all text-[10px]">{asset.group} / {asset.name}</figcaption>
                </figure>)}
              </div>
            </details>
            <p className="pt-1 text-center text-xs text-[#e5be8b]/75">
              Tip: Swipe down on the reels to spin, or tap mid-spin for quick stop.
            </p>
          </div>
        )}

        {/* PAYTABLE VIEW */}
        {modal === 'paytable' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              {SORTED_PAYTABLE.map((sym) => (
                <div
                  key={sym.id}
                  className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 ${
                    sym.isWild
                      ? 'border-[#ffd966] bg-gradient-to-br from-[#5d200d] to-[#361009]'
                      : 'border-[#e7b964]/30 bg-[#32100a]'
                  }`}
                >
                  <img
                    src={sym.image}
                    alt={sym.label}
                    className="h-12 w-12 shrink-0 object-contain"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-[#ffe9b4]">
                      {sym.label}
                    </div>
                    <div className="font-cabinet-serif text-lg font-black text-[#ffda66]">
                      ×{sym.rate}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-[#e7b964]/35 bg-[#31100a] p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#ffda66]">
                  5 Active Paylines
                </span>
                <span className="text-xs font-bold text-[#8cf8b0]">
                  9 Wild Tigers = Super Mega Win
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {PAYLINES.map((line) => (
                  <div
                    key={line.index}
                    className="flex flex-col items-center rounded-xl bg-[#220a06] p-1.5"
                    title={line.name}
                  >
                    <div className="grid grid-cols-3 gap-1">
                      {[0, 1, 2].map((row) =>
                        [0, 1, 2].map((col) => {
                          const active = line.rows[col] === row;
                          return (
                            <span
                              key={`${row}-${col}`}
                              className={`h-2.5 w-2.5 rounded-[3px] ${
                                active ? 'bg-[#ffd85c]' : 'bg-[#5a281d]'
                              }`}
                            />
                          );
                        }),
                      )}
                    </div>
                    <span className="mt-1 text-[10px] font-bold text-[#e8c694]/80">
                      L{line.index + 1}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-2.5 text-xs leading-relaxed text-[#f2d4a0]/85">
                Three identical regular symbols on an active payline trigger Big Win. Three Wild Tigers on a payline trigger Mega Win and 10 free spins. Collect 9 Wild Tigers during free spins or land 9 Wild Tigers on the board for Super Mega Win. Free spins use no demo credits.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onBackToSettings}
                className="flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border border-[#e7b964]/45 bg-[#46160e] px-3 text-sm font-bold text-[#ffe9b4] transition-transform active:scale-[0.98]"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-gradient-to-b from-[#ffe27a] via-[#f2b830] to-[#d08212] px-3 text-sm font-extrabold text-[#2a0c04] transition-transform active:scale-[0.98]"
              >
                Play Now
              </button>
            </div>
          </div>
        )}

        {/* LOW BALANCE VIEW */}
        {modal === 'lowBalance' && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-[#f6d9a2]/90">
              Your demo credit balance is below the current bet amount. Top up free demo credits or lower your bet to keep spinning.
            </p>
            <button
              type="button"
              onClick={() => {
                onRefill(1000);
                onClose();
              }}
              className="flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-gradient-to-b from-[#ffe27a] via-[#f2b830] to-[#d08212] px-4 text-base font-extrabold text-[#2a0c04] shadow-[0_6px_18px_rgba(0,0,0,0.45)] transition-transform active:scale-[0.98]"
            >
              Add +₹1,000.00 Demo Credits
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
