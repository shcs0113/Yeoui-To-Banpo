import { cx } from '../../lib/cx';

export interface Option<T> {
  value: T;
  label: string;
}

interface Props<T> {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

// 여러 개 중 하나 고르기 (예: 배속 1배, 10배, 60배, 300배). 고른 것은 흰색으로 채운다
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  disabled = false,
}: Props<T>) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cx(
              'cursor-pointer rounded-full border-[1.5px] px-3 py-1.5 text-[12.5px] font-bold transition disabled:cursor-default disabled:opacity-40',
              selected
                ? 'border-white bg-white text-ink'
                : 'border-white/55 bg-white/[.04] hover:bg-white/[.14]',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
