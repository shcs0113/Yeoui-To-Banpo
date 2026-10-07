import { cx } from '../../lib/cx';

interface Props {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// 켜고 끄는 스위치. 글자를 눌러도 켜지도록 줄 전체가 버튼이다
export function Toggle({ label, checked, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full cursor-pointer items-center justify-between gap-4 text-left text-sm"
    >
      <span>{label}</span>
      <span
        aria-hidden
        className={cx(
          'relative h-[26px] w-[46px] shrink-0 rounded-full border-[1.5px] transition',
          checked ? 'border-white bg-accent/40' : 'border-white/75 bg-white/[.06]',
        )}
      >
        <span
          className={cx(
            'absolute top-[3px] size-[17px] rounded-full transition-all',
            checked
              ? 'left-[23px] bg-white shadow-[0_0_8px_rgba(79,140,255,.9)]'
              : 'left-[3px] bg-white/70',
          )}
        />
      </span>
    </button>
  );
}
