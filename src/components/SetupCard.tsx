import { SKY_MODE_OPTIONS, SKY_PRESET_OPTIONS } from '../constants/sky';
import { useNow } from '../hooks/useNow';
import { formatDuration, formatTimeOfDay, planOf } from '../lib/plan';
import { SKY_LABELS, skyAtClock, skyLabelOf } from '../lib/sky';
import { useTimer } from '../state/TimerContext';
import { SETTING_LIMITS } from '../state/timerReducer';
import { GlassPanel } from './ui/GlassPanel';
import { PillButton } from './ui/PillButton';
import { RangeField } from './ui/RangeField';
import { Segmented } from './ui/Segmented';
import { Stepper } from './ui/Stepper';

interface Props {
  onStart: () => void;
  onBack: () => void; // 타이틀로
}

const minutes = (v: number) => `${v}분`;

// "오늘의 라이딩": 출발 전에 집중, 휴식, 사이클을 고르고, 오늘 계획을 미리 보여준다
export function SetupCard({ onStart, onBack }: Props) {
  const { state, updateSettings, skyMode, setSkyMode, skyPreset, setSkyPreset } = useTimer();
  const { settings } = state;
  const plan = planOf(settings);
  const now = useNow(30_000); // 예상 도착 시각은 분 단위라 30초마다면 충분하다

  // 하늘 설명 한 줄
  const skyNote =
    skyMode === 'flow'
      ? '낮에 출발하면 도착 땐 밤 (도착 쇼)'
      : skyMode === 'fixed'
        ? `내내 ${SKY_LABELS[skyPreset]} 하늘`
        : `지금 시각 기준: ${skyLabelOf(skyAtClock(new Date(now)))} (${formatTimeOfDay(now)})`;

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

      {/* 하늘: 흐름(지금처럼 낮 -> 밤), 고정(고른 하늘 그대로), 실제 시간. 뒤 배경이 바로 바뀌어 미리 볼 수 있다 */}
      <div className="mt-3 border-t border-white/15 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          하늘
          <Segmented options={SKY_MODE_OPTIONS} value={skyMode} onChange={setSkyMode} />
        </div>
        {skyMode === 'fixed' && (
          <div className="mt-2 flex justify-end">
            <Segmented options={SKY_PRESET_OPTIONS} value={skyPreset} onChange={setSkyPreset} />
          </div>
        )}
        <p className="mt-1.5 text-right text-[12px] text-white/55">{skyNote}</p>
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
