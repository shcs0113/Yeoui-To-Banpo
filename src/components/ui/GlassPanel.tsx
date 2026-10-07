import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

// 유리 패널: 설정 카드, 미리보기, 모달, 완주 카드가 같이 쓰는 반투명 판
export function GlassPanel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'rounded-[22px] border-[1.5px] border-white/35 bg-[rgba(10,16,34,.55)] shadow-[0_20px_60px_rgba(0,0,0,.35)] backdrop-blur-[16px]',
        className,
      )}
      {...rest}
    />
  );
}
