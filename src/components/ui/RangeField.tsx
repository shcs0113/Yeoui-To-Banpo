import { useId } from 'react';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string; // 표시 방식 (기본: 숫자 그대로)
}

// 이름, 현재 값, 슬라이더, 양 끝 눈금
export function RangeField({ label, value, min, max, step, onChange, format = String }: Props) {
  const id = useId();
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between text-sm">
        <label htmlFor={id} className="text-white/70">
          {label}
        </label>
        <b className="text-[17px] tabular-nums">{format(value)}</b>
      </div>
      <input
        id={id}
        type="range"
        className="range mt-1"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="flex justify-between text-[11px] text-white/50 tabular-nums">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}
