import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { TRIM } from '../../lib/trim';

interface Props {
  label: string;
  hint?: string; // 이름 밑 작은 안내
  className?: string; // 바깥 여백, 구분선은 쓰는 쪽에서
  children: ReactNode; // 오른쪽 고르기 (Segmented 등)
}

// 한 줄 설정: 왼쪽 이름(+ 작은 안내), 오른쪽 고르기. 좁아서 줄이 꺾여도 오른쪽 끝에 붙인다
// (설정 창, 출발 카드가 같이 쓴다)
export function SettingRow({ label, hint, className, children }: Props) {
  return (
    <div
      className={cx(
        'flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-sm',
        className,
      )}
    >
      <div>
        <div className={TRIM}>{label}</div>
        {hint && (
          <small className={cx(TRIM, 'mt-2 block text-[11.5px] text-white/60')}>{hint}</small>
        )}
      </div>
      <div className="ml-auto">{children}</div>
    </div>
  );
}
