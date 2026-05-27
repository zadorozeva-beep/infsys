import { useEffect, useState } from 'react';

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
  shape: 'square' | 'circle' | 'triangle';
}

/** Читаємо актуальні значення CSS-змінних теми, щоб конфетті відповідало вибраному акценту. */
function getThemeColors(): string[] {
  const css = getComputedStyle(document.documentElement);
  const shades = ['--mint-300', '--mint-400', '--mint-500', '--mint-600'];
  const colors = shades
    .map((v) => css.getPropertyValue(v).trim())
    .filter(Boolean)
    .map((rgb) => `rgb(${rgb})`);
  // Додаємо теплу акцент-точку (золотистий) для контрасту — гарно святково
  colors.push('#fbbf24');
  return colors.length > 1 ? colors : ['#14b8a6', '#fbbf24'];
}

let confettiId = 0;

interface Props {
  /** Лічильник: при кожній зміні запускає нову хвилю конфетті. */
  trigger: number;
  count?: number;
}

export function Confetti({ trigger, count = 60 }: Props): JSX.Element | null {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const palette = getThemeColors();
    const newPieces: Piece[] = Array.from({ length: count }, () => ({
      id: ++confettiId,
      left: Math.random() * 100,
      delay: Math.random() * 200,
      duration: 1800 + Math.random() * 1400,
      color: palette[Math.floor(Math.random() * palette.length)] ?? '#14b8a6',
      rotate: Math.random() * 720 - 360,
      shape: (['square', 'circle', 'triangle'] as const)[Math.floor(Math.random() * 3)] ?? 'square',
    }));
    setPieces(newPieces);
    const maxLifetime = Math.max(...newPieces.map((p) => p.delay + p.duration)) + 500;
    const t = window.setTimeout(() => setPieces([]), maxLifetime);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[150] overflow-hidden">
      <style>{confettiStyle}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`confetti-piece confetti-${p.shape}`}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            background: p.shape === 'triangle' ? 'transparent' : p.color,
            borderBottomColor: p.shape === 'triangle' ? p.color : undefined,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

const confettiStyle = `
.confetti-piece {
  position: absolute;
  top: -12px;
  width: 10px;
  height: 14px;
  opacity: 0;
  animation-name: confettiFall;
  animation-timing-function: cubic-bezier(0.3, 0.7, 0.4, 1);
  animation-fill-mode: forwards;
}
.confetti-circle { border-radius: 50%; height: 10px; }
.confetti-triangle {
  width: 0; height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 12px solid;
}
@keyframes confettiFall {
  0% { transform: translate3d(0, -20px, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(0, 100vh, 0) rotate(720deg); opacity: 0; }
}
`;
