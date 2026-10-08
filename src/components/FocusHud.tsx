import { Pause, Play, SkipForward } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useElementHeight } from '../hooks/useElementHeight';
import { useWindowHeight } from '../hooks/useWindowHeight';
import { cx } from '../lib/cx';
import { dockCenterY } from '../scene/layout';
import { useTimer } from '../state/TimerContext';
import { RideClock } from './RideClock';
import { PillButton } from './ui/PillButton';

interface Props {
  toBanpo: boolean;
  remainingMs: number;
  onStart: () => void;
}

const ARM_MS = 3000; // 포기 버튼을 한 번 누르고 3초 안에 다시 눌러야 포기

// 하단 독: 왼쪽에 시계(집중 중), 오른쪽에 지금 할 수 있는 버튼. 잔디 띠 가운데에 놓는다
export function FocusHud({ toBanpo, remainingMs, onStart }: Props) {
  const { state } = useTimer();
  const resting = state.phase !== 'focus'; // 휴식·타임랩스엔 시계가 화면 가운데로 간다 (RestHud)

  const screenH = useWindowHeight();
  const [ref, dockH] = useElementHeight<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cx(
        'absolute left-1/2 flex w-[min(760px,calc(100vw-48px))] -translate-x-1/2 -translate-y-1/2 items-end justify-between gap-[18px] max-[560px]:flex-col max-[560px]:items-center',
        resting && 'justify-center',
      )}
      style={{ top: dockCenterY(screenH, dockH) }}
    >
      {!resting && (
        <div className="shrink-0 max-[560px]:text-center">
          <RideClock state={state} toBanpo={toBanpo} remainingMs={remainingMs} />
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-2 max-[560px]:justify-center">
        <Controls onStart={onStart} />
      </div>
    </div>
  );
}

const ICON = { size: 16, strokeWidth: 2.2 };

// 지금 할 수 있는 동작만 버튼으로
function Controls({ onStart }: { onStart: () => void }) {
  const { state, pause, resume, giveUp, skipBreak, toSetup } = useTimer();
  const { phase, status, cycle } = state;

  // 포기는 두 번: 한 번 누르면 빨갛게 바뀌고, 3초 안에 다시 누르면 포기
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []); // 사라질 때 타이머 정리
  const onGiveUp = () => {
    clearTimeout(timer.current);
    if (armed) {
      setArmed(false);
      giveUp();
      return;
    }
    setArmed(true);
    timer.current = setTimeout(() => setArmed(false), ARM_MS);
  };

  const pauseOrResume =
    status === 'running' ? (
      <PillButton onClick={pause}>
        <Pause {...ICON} /> 일시정지
      </PillButton>
    ) : (
      <PillButton onClick={resume}>
        <Play {...ICON} /> 재개
      </PillButton>
    );

  if (phase === 'focus' && status === 'idle') {
    return (
      <>
        <PillButton onClick={onStart}>
          <Play {...ICON} /> {cycle === 0 ? '출발' : `CYCLE ${cycle + 1} 출발`}
        </PillButton>
        <PillButton onClick={toSetup}>처음으로</PillButton>
      </>
    );
  }
  if (phase === 'focus') {
    return (
      <>
        {pauseOrResume}
        <PillButton variant={armed ? 'danger' : 'clear'} onClick={onGiveUp}>
          {armed ? '정말 포기? (구간 무효)' : '포기'}
        </PillButton>
      </>
    );
  }
  if (phase === 'break') {
    return (
      <>
        {pauseOrResume}
        <PillButton onClick={skipBreak}>
          <SkipForward {...ICON} /> 휴식 건너뛰기
        </PillButton>
      </>
    );
  }
  
  return null; // 5초 타임랩스 동안엔 버튼 없음
}
