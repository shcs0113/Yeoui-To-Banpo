import { Minus, Plus } from 'lucide-react';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const ROUND =
  'grid size-9 cursor-pointer place-items-center rounded-full border-[1.5px] border-white/70 bg-white/[.06] transition hover:bg-white/[.16] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white/[.06]';

// 이름 ······ [−] 값 [+]   (끝에 닿으면 버튼이 꺼진다)
export function Stepper({ label, value, min, max, onChange }: Props) {
  return (
    <div className="flex w-full items-center justify-between text-sm">
      <span className="text-white/70">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`${label} 줄이기`}
          className={ROUND}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <Minus size={18} />
        </button>
        <b aria-live="polite" className="min-w-7 text-center text-xl tabular-nums">
          {value}
        </b>
        <button
          type="button"
          aria-label={`${label} 늘리기`}
          className={ROUND}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
