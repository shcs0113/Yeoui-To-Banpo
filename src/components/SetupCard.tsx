import { Bike } from 'lucide-react';
import { THEME_OPTIONS } from '../constants/theme';
import { useNow } from '../hooks/useNow';
import { cx } from '../lib/cx';
import { formatDuration, formatTimeOfDay, planOf } from '../lib/plan';
import { TRIM } from '../lib/trim';
import { useTimer } from '../state/TimerContext';
import { SETTING_LIMITS } from '../state/timerReducer';
import { SkyPicker } from './SkyPicker';
import { GlassPanel } from './ui/GlassPanel';
import { PillButton } from './ui/PillButton';
import { RangeField } from './ui/RangeField';
import { Segmented } from './ui/Segmented';
import { SettingRow } from './ui/SettingRow';
import { Stepper } from './ui/Stepper';

interface Props {
  onStart: () => void;
  onBack: () => void; // 타이틀로
}

const minutes = (v: number) => `${v}분`;

// "오늘의 라이딩": 출발 전에 집중, 휴식, 사이클, 계절, 하늘을 고르고, 오늘 계획을 미리 보여준다
// 설정 창과 같은 투명 유리 + 제목 줄 + 얇은 구분선 줄
export function SetupCard({ onStart, onBack }: Props) {
  const { state, updateSettings, theme, setTheme } = useTimer();
  const { settings } = state;
  const plan = planOf(settings);
  const now = useNow(30_000); // 예상 도착 시각은 분 단위라 30초마다면 충분하다

  return (
    // 위쪽 메뉴 줄(68px) 아래 ~ 바닥 16px 위 사이 가운데.
    // 낮은 화면(높이 700 이하)에선 여백을 조금씩 줄여 작은 폰(375×667, 640)에서도 스크롤 없이 들어가게.
    // 그래도 안 들어가면(더 낮은 화면) 카드 안에서 스크롤
    <div className="absolute inset-x-4 top-[68px] bottom-4 flex items-center justify-center">
      <GlassPanel
        clear
        className="max-h-full w-full max-w-[440px] overflow-y-auto p-[22px] [@media(max-height:700px)]:p-[18px]"
      >
        <header className="mb-4 [@media(max-height:700px)]:mb-3">
          <h2 className="flex items-center gap-2.5 text-[17px] font-bold">
            <Bike size={20} strokeWidth={1.8} />
            <span className={TRIM}>오늘의 라이딩</span>
          </h2>
          <p className={cx(TRIM, 'mt-2.5 text-[12.5px] text-white/60')}>
            한 사이클 = 여의나루 ⇄ 반포 한 구간 (6.8km)
          </p>
        </header>

        {/* 줄마다 위아래 여백: 보통 12px, 낮은 화면 8px */}
        <div className="divide-y divide-white/10 border-t border-white/14 [&>*]:py-3 [@media(max-height:700px)]:[&>*]:py-2">
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
          </div>
          <div>
            <Stepper
              label="사이클"
              value={settings.cycles}
              min={SETTING_LIMITS.cycles.min}
              max={SETTING_LIMITS.cycles.max}
              onChange={(v) => updateSettings({ cycles: v })}
            />
          </div>

          {/* 계절, 하늘: 고르면 뒤 배경이 바로 바뀌어 미리 볼 수 있다 */}
          <SettingRow label="계절">
            <Segmented options={THEME_OPTIONS} value={theme} onChange={setTheme} />
          </SettingRow>
          <SkyPicker />

          <p className="text-[13px] leading-[1.7] text-white/70 [&_b]:text-white">
            총 <b>{formatDuration(plan.totalMin)}</b> · {plan.km.toFixed(1)}km · 지금 출발하면{' '}
            <b>{formatTimeOfDay(now + plan.totalMin * 60_000)}</b> 도착
            <br />
            마지막 도착지 <b>{plan.lastToBanpo ? '반포' : '여의나루'}</b>
          </p>
        </div>

        <div className="mt-2 flex justify-center gap-2">
          <PillButton variant="primary" onClick={onStart}>
            출발
          </PillButton>
          <PillButton onClick={onBack}>뒤로</PillButton>
        </div>
      </GlassPanel>
    </div>
  );
}
