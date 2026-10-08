import type { ReactNode } from 'react';
import { ROUTE, ROUTE_END_X } from '../constants/course';
import { cx } from '../lib/cx';
import { simSpan } from '../lib/preview';
import type { Settings } from '../state/types';

interface Props {
  sim: number; // 0~1
  toBanpo: boolean;
  settings: Settings;
  onChange: (sim: number) => void;
}

// 한 사이클 타임라인: 집중(파랑), 휴식(초록), 타임랩스(금색) 띠 위에 슬라이더
export function SimTimeline({ sim, toBanpo, settings, onChange }: Props) {
  const { focusShare, lapseShare } = simSpan(settings);
  const restShare = 1 - focusShare - lapseShare;
  const pct = (v: number) => `${v * 100}%`;

  return (
    <div>
      <div className="relative mt-2 mb-[22px] flex h-2.5">
        <div className="rounded-l-md bg-accent" style={{ width: pct(focusShare) }} />
        <div className="bg-rest" style={{ width: pct(restShare) }} />
        <div className="rounded-r-md bg-gold" style={{ width: pct(lapseShare) }} />

        {/* 다리 눈금: 그 다리를 지나는 시점 */}
        {ROUTE.map((p) => {
          const progress = toBanpo ? p.x / ROUTE_END_X : 1 - p.x / ROUTE_END_X;
          const start = progress === 0;
          return (
            <i
              key={p.name}
              className={cx(
                'pointer-events-none absolute -top-0.5 h-3.5 w-0.5 -translate-x-px',
                !start && 'bg-white/85',
              )}
              style={{ left: pct(progress * focusShare) }}
            >
              <span
                className={cx(
                  'absolute top-4 text-[10px] whitespace-nowrap text-white/60 not-italic',
                  start ? 'left-0' : 'left-1/2 -translate-x-1/2',
                )}
              >
                {p.name.replace('대교', '')}
              </span>
            </i>
          );
        })}

        {/* 실제로 잡고 움직이는 건 투명한 슬라이더. 손잡이 반지름(9px)만큼 양옆으로 넓혀 눈금과 맞춘다 */}
        <input
          type="range"
          aria-label="주행 타임라인"
          className="range range-bare absolute top-1/2 -right-[9px] -left-[9px] w-[calc(100%+18px)] -translate-y-1/2"
          min={0}
          max={1}
          step={0.0005}
          value={sim}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[11.5px] text-white/65">
        <Legend color="bg-accent">집중 {settings.focusMin}분 · 6.8km</Legend>
        <Legend color="bg-rest">휴식 {settings.breakMin}분</Legend>
        <Legend color="bg-gold">아침 타임랩스 1분</Legend>
      </div>
    </div>
  );
}

function Legend({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-[5px]">
      <i className={cx('size-2 rounded-full', color)} />
      {children}
    </span>
  );
}