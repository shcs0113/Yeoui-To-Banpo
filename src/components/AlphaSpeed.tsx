import { Fragment } from 'react';
import { cx } from '../lib/cx';
import { TRIM } from '../lib/trim';
import { useTimer } from '../state/TimerContext';
import type { Speed } from '../state/types';

const SPEEDS = [1, 10, 60, 300] as const satisfies readonly Speed[];

// 알파 테스트용: 주행 중 오른쪽 아래 작은 배속 바꾸기 (달리는 중에도 바로)
// 넓은 화면: 가로 한 줄 "x1 | x10 | x60 | x300"
// 폰(560 미만): 하단 독(시계, 버튼)이 가운데를 차지해서 오른쪽 끝에 세로로
export function AlphaSpeed() {
  const { state, setSpeed } = useTimer();
  return (
    <div className="absolute right-4 bottom-4 z-30 text-center [text-shadow:0_1px_6px_rgba(0,0,0,.6)] max-[560px]:right-1.5 max-[560px]:bottom-[max(12px,env(safe-area-inset-bottom))]">
      <div
        className={cx(
          TRIM,
          'mb-1.5 text-[10px] font-bold tracking-[.18em] text-white/55 max-[560px]:mb-1 max-[560px]:text-[8.5px] max-[560px]:tracking-[.12em]',
        )}
      >
        <span className="max-[560px]:hidden">- ALPHA TEST -</span>
        <span className="min-[560px]:hidden">ALPHA</span>
      </div>
      <div className="flex items-center text-[12px] font-bold tabular-nums max-[560px]:flex-col">
        {SPEEDS.map((v, i) => (
          <Fragment key={v}>
            {/* 구분선: 글자 "|" 대신 선으로 (글꼴마다 높이가 달라 버튼 글자와 어긋나서) */}
            {i > 0 && <span aria-hidden className="h-3 w-px bg-white/30 max-[560px]:hidden" />}
            <button
              type="button"
              aria-pressed={state.speed === v}
              onClick={() => setSpeed(v)}
              className={cx(
                TRIM,
                'cursor-pointer px-1.5 py-1 transition-colors max-[560px]:py-1.5',
                state.speed === v ? 'text-white' : 'text-white/50 hover:text-white/85',
              )}
            >
              x{v}
            </button>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
