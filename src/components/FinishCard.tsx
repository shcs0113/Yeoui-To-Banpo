import { useElementHeight } from '../hooks/useElementHeight';
import { useWindowHeight } from '../hooks/useWindowHeight';
import { formatHoursMinutes, planOf } from '../lib/plan';
import { dockCenterY } from '../scene/layout';
import { useTimer } from '../state/TimerContext';
import { GlassPanel } from './ui/GlassPanel';
import { PillButton } from './ui/PillButton';
import { StatList, type Stat } from './ui/StatList';

interface Props {
  onHistory: () => void; // 기록 보기
}

// 완주 카드: 하단 독 자리(잔디 띠 가운데)에 오늘 달린 결과
export function FinishCard({ onHistory }: Props) {
  const { state, toSetup } = useTimer();
  const { settings } = state;
  const plan = planOf(settings);

  const screenH = useWindowHeight();
  const [ref, cardH] = useElementHeight<HTMLDivElement>();

  const stats: Stat[] = [
    { value: plan.km.toFixed(1), unit: 'km', label: '달린 거리' },
    { value: formatHoursMinutes(settings.focusMin * settings.cycles), label: '집중 시간' },
    { value: String(settings.cycles), label: '완료 구간' },
  ];

  return (
    <div
      ref={ref}
      className="absolute inset-x-4 mx-auto max-w-[440px] -translate-y-1/2"
      style={{ top: dockCenterY(screenH, cardH) }}
    >
      <GlassPanel className="px-6 pt-[22px] pb-5 text-center">
        <h2 className="mb-3.5 text-2xl font-extrabold [text-shadow:0_2px_14px_rgba(0,0,0,.45)]">
          CYCLE {settings.cycles} 완주
        </h2>

        <StatList className="mb-[18px] justify-center" stats={stats} />

        <div className="flex justify-center gap-2">
          <PillButton onClick={toSetup}>처음으로</PillButton>
          <PillButton onClick={onHistory}>기록 보기</PillButton>
        </div>
      </GlassPanel>
    </div>
  );
}