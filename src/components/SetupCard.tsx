import { useNow } from '../hooks/useNow';
import { formatDuration, formatTimeOfDay, planOf } from '../lib/plan';
import { useTimer } from '../state/TimerContext';
import { SETTING_LIMITS } from '../state/timerReducer';
import { GlassPanel } from './ui/GlassPanel';
import { PillButton } from './ui/PillButton';
import { RangeField } from './ui/RangeField';
import { Stepper } from './ui/Stepper';

interface Props {
  onStart: () => void;
  onBack: () => void; // 타이틀로
}

const minutes = (v: number) => `${v}분`;

// "오늘의 라이딩": 출발 전에 집중, 휴식, 사이클을 고르고, 오늘 계획을 미리 보여준다
export function SetupCard({ onStart, onBack }: Props) {
  const { state, updateSettings } = useTimer();
  const { settings } = state;
  const plan = planOf(settings);
  const now = useNow(30_000); // 예상 도착 시각은 분 단위라 30초마다면 충분하다

  return (
    <GlassPanel className="absolute inset-x-4 top-[150px] mx-auto max-w-[470px] px-[18px] pt-[18px] pb-4 max-[640px]:top-[132px]">
      <h2 className="mb-1 text-lg font-extrabold">오늘의 라이딩</h2>
      <p className="mb-3 text-[13px] text-white/70">한 사이클 = 여의나루 ⇄ 반포 한 구간 (6.8km)</p>

      <div className="flex flex-col gap-3">
        <RangeField
          label="집중"
          value={settings.focusMin}
          {...SETTING_LIMITS.focusMin}
          onChange={(v) => updateSettings({ focusMin: v })}
          format={minutes}
        />
        <RangeField
          label="휴식"
          value={settings.breakMin}
          {...SETTING_LIMITS.breakMin}
          onChange={(v) => updateSettings({ breakMin: v })}
          format={minutes}
        />
        <Stepper
          label="사이클"
          value={settings.cycles}
          min={SETTING_LIMITS.cycles.min}
          max={SETTING_LIMITS.cycles.max}
          onChange={(v) => updateSettings({ cycles: v })}
        />
      </div>

      <p className="mt-3 border-t border-white/15 pt-3 text-[13px] leading-[1.7] text-white/70 [&_b]:text-white">
        총 <b>{formatDuration(plan.totalMin)}</b> · {plan.km.toFixed(1)}km · 지금 출발하면{' '}
        <b>{formatTimeOfDay(now + plan.totalMin * 60_000)}</b> 도착
        <br />
        마지막 도착지 <b>{plan.lastToBanpo ? '반포' : '여의나루'}</b>
      </p>

      <div className="mt-3.5 flex justify-center gap-2">
        <PillButton variant="primary" onClick={onStart}>
          출발
        </PillButton>
        <PillButton onClick={onBack}>뒤로</PillButton>
      </div>
    </GlassPanel>
  );
}
