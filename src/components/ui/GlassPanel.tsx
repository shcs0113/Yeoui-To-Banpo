import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

interface Props extends HTMLAttributes<HTMLDivElement> {
  clear?: boolean; // 어두운 색 없이 흐림만 (뒤 풍경이 비치게. 설정 창)
}

// 유리 패널: 설정 카드, 미리보기, 모달, 완주 카드가 같이 쓰는 반투명 판
export function GlassPanel({ clear = false, className, ...rest }: Props) {
  return (
    <div
      className={cx(
        'rounded-[22px] border-[1.5px] border-white/35 backdrop-blur-[16px]',
        clear
          ? 'shadow-[0_20px_60px_rgba(0,0,0,.25)]'
          : 'bg-[rgba(10,16,34,.55)] shadow-[0_20px_60px_rgba(0,0,0,.35)]',
        className,
      )}
      {...rest}
    />
  );
}
