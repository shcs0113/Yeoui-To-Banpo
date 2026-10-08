import { cx } from '../../lib/cx';

export interface Stat {
  value: string;
  unit?: string; // 숫자 옆 작은 단위 (km)
  label: string;
}

interface Props {
  stats: Stat[];
  className?: string; // 정렬, 여백은 쓰는 쪽에서
}

// 큰 숫자 + 작은 이름표 묶음 (완주 카드, 기록 창)
export function StatList({ stats, className }: Props) {
  return (
    <dl className={cx('flex gap-[26px]', className)}>
      {stats.map((s) => (
        // dt(이름)가 먼저 나와야 읽기 순서가 맞다. 화면엔 숫자를 위로: flex-col-reverse
        <div key={s.label} className="flex flex-col-reverse">
          <dt className="text-xs tracking-[.04em] text-white/70">{s.label}</dt>
          <dd className="text-[30px] leading-[1.1] font-bold tabular-nums [text-shadow:0_2px_14px_rgba(0,0,0,.5)]">
            {s.value}
            {s.unit && <small className="ml-0.5 text-[15px]">{s.unit}</small>}
          </dd>
        </div>
      ))}
    </dl>
  );
}