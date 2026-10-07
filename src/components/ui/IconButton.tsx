import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../../lib/cx';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // 화면 낭독기와 마우스 툴팁에 쓰는 이름
  active?: boolean; // 켜져 있으면 아래에 파란 점
  children: ReactNode; // 아이콘
}

// 우상단 라인 아이콘 버튼: 테두리 없이, 마우스를 올리면 동그란 배경이 생긴다
export function IconButton({
  label,
  active = false,
  type = 'button',
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'relative grid size-[42px] cursor-pointer place-items-center rounded-full text-white drop-shadow-[0_1px_6px_rgba(0,0,0,.6)]',
        // 동그란 hover 배경: ::before 가상 요소를 평소엔 숨겨 두었다가 키운다
        "before:absolute before:inset-[3px] before:scale-80 before:rounded-full before:bg-white/16 before:opacity-0 before:transition before:content-['']",
        'hover:before:scale-100 hover:before:opacity-100 focus-visible:before:scale-100 focus-visible:before:opacity-100',
        'active:before:scale-95 active:before:bg-white/25 active:before:opacity-100',
        'disabled:cursor-default disabled:opacity-35 disabled:before:hidden',
        className,
      )}
      {...rest}
    >
      <span className="relative">{children}</span>
      {active && (
        <span className="absolute bottom-0.5 left-1/2 size-[5px] -translate-x-1/2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
      )}
    </button>
  );
}
