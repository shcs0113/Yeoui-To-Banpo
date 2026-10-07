import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

export type Tone = 'focus' | 'rest' | 'lapse';

interface Props {
  tone: Tone;
  size?: 'sm' | 'md';
  children: ReactNode;
}

// 단계별 점 색: 집중 파랑, 휴식 초록, 타임랩스 금색 (빛나는 그림자 포함)
const DOT: Record<Tone, string> = {
  focus: 'bg-accent shadow-[0_0_10px_var(--color-accent)]',
  rest: 'bg-rest shadow-[0_0_10px_var(--color-rest)]',
  lapse: 'bg-gold shadow-[0_0_10px_var(--color-gold)]',
};

// 빛나는 점 + 글자 배지 (배경 없이 글자만, 풍경 위에서 읽히게 그림자)
export function Badge({ tone, size = 'sm', children }: Props) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-[7px] font-extrabold tracking-[.08em] [text-shadow:0_1px_8px_rgba(0,0,0,.6)]',
        size === 'sm' ? 'text-xs' : 'text-sm',
      )}
    >
      <span aria-hidden className={cx('size-2 rounded-full', DOT[tone])} />
      {children}
    </span>
  );
}
