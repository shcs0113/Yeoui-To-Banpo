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

// 이름 + 고를 수 있는 범위(30~60분), 현재 값, 슬라이더
export function RangeField({ label, value, min, max, step, onChange, format = String }: Props) {
  const id = useId();
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between text-sm">
        <label htmlFor={id} className="flex items-baseline gap-2">
          {label}
          {/* 범위: 숫자만 붙이고 단위는 끝에 한 번 (30~60분) */}
          <span className="text-[11.5px] text-white/60 tabular-nums">
            {min}~{format(max)}
          </span>
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
    </div>
  );
}
