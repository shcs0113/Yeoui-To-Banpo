import { Clock, X } from 'lucide-react';
import { SKY_CHOICES } from '../constants/sky';
import { useNow } from '../hooks/useNow';
import { cx } from '../lib/cx';
import { formatTimeOfDay } from '../lib/plan';
import { SKY_LABELS } from '../lib/sky';
import { TRIM } from '../lib/trim';
import { useTimer } from '../state/TimerContext';
import { DockToggle } from './SeasonButtons';

const ICON = { size: 18, strokeWidth: 1.9 };

interface Props {
  open: boolean;
  onToggle: () => void;
}

// 계절 줄 왼쪽의 하늘 고르기: 접혔을 땐 시계 버튼, 펼치면 X + 하늘 이름 알약 세로 줄
// (하늘은 아이콘만으로는 낮, 노을, 새벽이 잘 구분되지 않아 글자로). 골라도 그대로, X를 눌러야 접힌다
export function SkyMenu({ open, onToggle }: Props) {
  const { skyMode, skyPreset, setSkyMode, setSkyPreset } = useTimer();

  return (
    <div className="absolute top-0 right-[46px] flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1.5">
        {!open && skyMode !== 'flow' && (
          <span
            className={cx(
              TRIM,
              'text-[12.5px] font-bold whitespace-nowrap text-white tabular-nums [text-shadow:0_1px_6px_rgba(0,0,0,.55)]',
            )}
          >
            {skyMode === 'real' ? <ClockTime /> : SKY_LABELS[skyPreset]}
          </span>
        )}
        <DockToggle label={open ? '하늘 목록 닫기' : '하늘 바꾸기'} open={open} onClick={onToggle}>
          {open ? <X {...ICON} /> : <Clock {...ICON} />}
        </DockToggle>
      </div>

      {open &&
        SKY_CHOICES.map((c) => {
          const on = c.mode === skyMode && (c.mode !== 'fixed' || c.preset === skyPreset);
          return (
            <button
              key={c.label}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setSkyMode(c.mode);
                if (c.preset) setSkyPreset(c.preset);
              }}
              className={cx(
                'flex h-7 cursor-pointer items-center rounded-full px-3 text-[12.5px] font-bold whitespace-nowrap transition-colors',
                on
                  ? 'bg-white text-ink shadow-[0_1px_6px_rgba(0,0,0,.45)]'
                  : 'text-white [text-shadow:0_1px_6px_rgba(0,0,0,.55)] hover:bg-white/15',
              )}
            >
              <span className={TRIM}>{c.label}</span>
            </button>
          );
        })}
    </div>
  );
}

// 실제 시간일 때 지금 시각 (분 단위라 30초마다 갱신이면 충분하다)
function ClockTime() {
  const now = useNow(30_000);
  return formatTimeOfDay(now);
}
