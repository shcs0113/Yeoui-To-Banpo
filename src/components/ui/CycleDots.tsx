import { cx } from '../../lib/cx';
import { cycleDots } from '../../lib/cycleDots';

interface Props {
  total: number; // 전체 사이클 수
  current: number; // 지금 사이클 (0부터)
  currentDone?: boolean; // 지금 사이클의 집중을 끝냈는지 (휴식 중이면 true)
}

// 사이클 진행 점: 끝낸 구간은 흰색, 지금 구간은 테두리
export function CycleDots({ total, current, currentDone = false }: Props) {
  return (
    <div role="img" aria-label={`사이클 ${current + 1} / ${total}`} className="flex gap-1.5">
      {cycleDots(total, current, currentDone).map((dot, i) => (
        <span
          key={i}
          className={cx(
            'size-[9px] rounded-full',
            dot.done ? 'bg-white' : 'bg-white/35',
            dot.now && 'outline-2 outline-offset-2 outline-white',
          )}
        />
      ))}
    </div>
  );
}
