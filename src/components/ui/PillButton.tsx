import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

type Variant = 'clear' | 'primary' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// 생김새별 색: 투명(기본), 흰색 채움(주 동작), 빨강(포기)
const VARIANTS: Record<Variant, string> = {
  clear: 'border-white/75 bg-white/[.06] text-white hover:bg-white/[.18]',
  primary: 'border-white bg-white text-ink [text-shadow:none] hover:bg-white/90',
  danger: 'border-[#ff9a9a] bg-warn/35 text-white hover:bg-warn/50',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[12.5px]',
  md: 'px-[22px] py-2.5 text-sm',
  lg: 'px-7 py-[13px] text-base',
};

// 흰 테두리 알약 버튼. 나머지 속성(onClick, disabled …)은 그대로 <button>에 넘긴다
export function PillButton({
  variant = 'clear',
  size = 'md',
  type = 'button',
  className,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] font-bold whitespace-nowrap backdrop-blur-[3px] transition [text-shadow:0_1px_8px_rgba(0,0,0,.35)] hover:-translate-y-px disabled:cursor-default disabled:opacity-40 disabled:hover:translate-y-0',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}
