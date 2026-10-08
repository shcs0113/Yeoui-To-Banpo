import { useElementHeight } from '../hooks/useElementHeight';
import { useWindowHeight } from '../hooks/useWindowHeight';
import { restCenterY } from '../scene/layout';
import { useTimer } from '../state/TimerContext';
import { RideClock } from './RideClock';

interface Props {
  toBanpo: boolean;
  remainingMs: number;
  routeBarVisible: boolean; // 경로 바가 보이면 그 아래로 피한다
}

const ROUTE_BAR_BOTTOM = 142; // 경로 바 아래 끝 (top 68px + 높이 약 74px)
const SCREEN_TOP = 56; // 경로 바가 없을 때: 상단 아이콘 줄 아래

// 휴식, 타임랩스: 시계를 하늘 한가운데(수평선 바로 위)에 크게. '쉬는 시간'임을 분명하게
export function RestHud({ toBanpo, remainingMs, routeBarVisible }: Props) {
  const { state } = useTimer();
  const screenH = useWindowHeight();
  const [ref, clockH] = useElementHeight<HTMLDivElement>();
  const topLimit = routeBarVisible ? ROUTE_BAR_BOTTOM : SCREEN_TOP;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-x-4 -translate-y-1/2"
      style={{ top: restCenterY(screenH, clockH, topLimit) }}
    >
      <RideClock state={state} toBanpo={toBanpo} remainingMs={remainingMs} big />
    </div>
  );
}
