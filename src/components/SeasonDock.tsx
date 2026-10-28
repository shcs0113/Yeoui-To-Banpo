import { Wind } from 'lucide-react';
import { useElementHeight } from '../hooks/useElementHeight';
import { useWindowHeight } from '../hooks/useWindowHeight';
import { seasonDockTop } from '../scene/layout';
import { useTimer } from '../state/TimerContext';
import { RoundButton, SeasonButtons } from './SeasonButtons';

const ICON = { size: 18, strokeWidth: 1.9 };
const MIN_TOP = 104; // 위쪽 메뉴 아이콘과 이만큼은 떨어뜨린다 (px)

// 오른쪽 세로 줄: 계절 4개 + 흩날림 켜기/끄기. 넓은 화면(데스크톱)에서만 보인다
// 하늘(맨 위 ~ 수평선) 가운데에 두되, 화면이 낮으면 위쪽 메뉴 바로 아래(MIN_TOP)에 멈춘다
export function SeasonDock() {
  const { effects, setEffects } = useTimer();
  const screenH = useWindowHeight();
  const [ref, dockH] = useElementHeight<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="absolute right-4 flex w-[42px] flex-col items-center gap-1 max-[900px]:hidden"
      style={{ top: seasonDockTop(screenH, dockH, MIN_TOP) }}
    >
      <SeasonButtons />
      <span className="my-0.5 h-px w-5 bg-white/50 shadow-[0_0_4px_rgba(0,0,0,.5)]" />
      <RoundButton
        label={effects ? '흩날림 끄기' : '흩날림 켜기'}
        on={effects}
        onClick={() => setEffects(!effects)}
      >
        <Wind {...ICON} />
      </RoundButton>
    </div>
  );
}
