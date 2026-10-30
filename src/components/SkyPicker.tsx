import { SKY_MOVING_OPTIONS, SKY_PRESET_OPTIONS } from '../constants/sky';
import { useNow } from '../hooks/useNow';
import { cx } from '../lib/cx';
import { formatTimeOfDay } from '../lib/plan';
import { SKY_LABELS, skyAtClock, skyLabelOf } from '../lib/sky';
import { TRIM } from '../lib/trim';
import { useTimer } from '../state/TimerContext';
import { Segmented } from './ui/Segmented';

// 하늘 고르기: 윗줄 흐름 / 현재 시각, 아랫줄 낮 노을 밤 새벽 (아랫줄을 고르면 그 하늘로 고정)
// 두 줄을 통틀어 하나만 흰색으로 채운다. 바깥 여백, 구분선은 쓰는 쪽에서 (className)
export function SkyPicker({ className }: { className?: string }) {
  const { skyMode, setSkyMode, skyPreset, setSkyPreset } = useTimer();
  const fixed = skyMode === 'fixed';

  return (
    <div className={cx('text-sm', className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div>
          <div className={TRIM}>하늘</div>
          <small className={cx(TRIM, 'mt-2 block text-[11.5px] text-white/60')}>
            {skyMode === 'real' ? (
              <RealNote />
            ) : fixed ? (
              `내내 ${SKY_LABELS[skyPreset]} 하늘`
            ) : (
              '낮에서 밤으로 (도착 쇼)'
            )}
          </small>
        </div>
        <div className="ml-auto">
          <Segmented
            options={SKY_MOVING_OPTIONS}
            value={fixed ? null : skyMode}
            onChange={setSkyMode}
          />
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <Segmented
          options={SKY_PRESET_OPTIONS}
          value={fixed ? skyPreset : null}
          onChange={(preset) => {
            setSkyMode('fixed');
            setSkyPreset(preset);
          }}
        />
      </div>
    </div>
  );
}

// 현재 시각일 때 설명: 지금 시각과 그 하늘 이름 (분 단위라 30초마다 갱신이면 충분하다)
function RealNote() {
  const now = useNow(30_000);
  return `지금 시각 기준: ${skyLabelOf(skyAtClock(new Date(now)))} (${formatTimeOfDay(now)})`;
}
