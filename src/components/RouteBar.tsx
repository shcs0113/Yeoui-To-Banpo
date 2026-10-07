import { ROUTE, ROUTE_END_X } from '../constants/course';
import { cx } from '../lib/cx';
import { routeProgress } from '../lib/route';

interface Props {
  cameraX: number;
  toBanpo: boolean;
}

const dest = (toBanpo: boolean) => (toBanpo ? '반포' : '여의나루');

// 상단 경로 바: 여의나루 ─ 원효 ─ 한강 ─ 동작 ─ 반포, 내 위치와 다음 지점까지 거리
export function RouteBar({ cameraX, toBanpo }: Props) {
  const { percent, legKm, next } = routeProgress(cameraX, toBanpo);
  // 채움은 출발점에서 내 위치까지: 반포행이면 왼쪽부터, 여의나루행이면 오른쪽부터
  const fill = toBanpo ? { left: 0, width: percent } : { left: percent, width: 100 - percent };

  return (
    <div className="absolute inset-x-4 top-[68px] mx-auto max-w-[640px] rounded-[18px] border border-white/15 bg-[rgba(12,18,38,.5)] px-[18px] pt-2.5 pb-[9px] shadow-[0_8px_30px_rgba(0,0,0,.22)] backdrop-blur-[12px]">
      <div className="relative mx-1.5 h-[30px]">
        <div className="absolute inset-x-0 top-[9px] h-1 rounded bg-white/25" />
        <div
          className="absolute top-[9px] h-1 rounded bg-accent transition-[left,width] duration-300 ease-linear"
          style={{ left: `${fill.left}%`, width: `${fill.width}%` }}
        />

        {ROUTE.map((p, i) => {
          const end = i === 0 || i === ROUTE.length - 1;
          return (
            <div
              key={p.name}
              className={cx(
                'absolute -translate-x-1/2 rounded-full',
                end
                  ? 'top-1 size-3.5 border-[3px] border-white bg-accent'
                  : 'top-1.5 size-2.5 bg-white',
              )}
              style={{ left: `${(p.x / ROUTE_END_X) * 100}%` }}
            >
              <span
                className={cx(
                  'absolute top-[15px] left-1/2 -translate-x-1/2 text-[10.5px] whitespace-nowrap opacity-85',
                  !end && 'max-[520px]:hidden',
                )}
              >
                {p.name.replace('대교', '')}
              </span>
            </div>
          );
        })}

        {/* 내 위치: 가는 방향 화살표 */}
        <div
          aria-hidden
          className="absolute top-px grid size-5 -translate-x-1/2 place-items-center rounded-full bg-white text-[11px] font-black text-accent shadow-[0_0_0_4px_rgba(79,140,255,.45)] transition-[left] duration-300 ease-linear"
          style={{ left: `${percent}%` }}
        >
          {toBanpo ? '▶' : '◀'}
        </div>
      </div>

      <div className="mt-1.5 flex justify-between gap-2.5 text-xs text-white/70 tabular-nums [&_b]:text-white">
        <span>
          <b>{legKm.toFixed(2)}</b> / 6.80km
        </span>
        <span>
          {next ? (
            <>
              다음 <b>{next.name}</b> {next.km.toFixed(2)}km
            </>
          ) : (
            <>
              <b>{dest(toBanpo)}</b> 도착
            </>
          )}
        </span>
      </div>
    </div>
  );
}
