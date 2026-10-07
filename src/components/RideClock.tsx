import { cx } from '../lib/cx';
import { formatClock } from '../lib/format';
import type { TimerState } from '../state/types';
import { Badge, type Tone } from './ui/Badge';
import { CycleDots } from './ui/CycleDots';

interface Props {
  state: TimerState;
  toBanpo: boolean;
  remainingMs: number; // 화면에 보여줄 남은 시간 (가상 시간)
  big?: boolean; // 휴식 때 화면 가운데 크게
}

const dest = (toBanpo: boolean) => (toBanpo ? '반포' : '여의나루');

// 단계별 배지
function badgeFor(state: TimerState, toBanpo: boolean): { tone: Tone; text: string } | null {
  switch (state.phase) {
    case 'focus':
      return { tone: 'focus', text: `집중 · ${toBanpo ? '→' : '←'} ${dest(toBanpo)}` };
    case 'break':
      return { tone: 'rest', text: `휴식 · ${dest(toBanpo)}` };
    case 'lapse':
      return { tone: 'lapse', text: '타임랩스' };
    default:
      return null;
  }
}

// 배지 + 사이클 점 / 큰 시간 / 상태 한 줄 (카드 없이 풍경 위에 글자만)
export function RideClock({ state, toBanpo, remainingMs, big = false }: Props) {
  const badge = badgeFor(state, toBanpo);
  return (
    <div className={cx(big && 'text-center')}>
      <div
        className={cx(
          'flex items-center gap-3 max-[560px]:justify-center',
          big && 'justify-center',
        )}
      >
        {badge && (
          <Badge tone={badge.tone} size={big ? 'md' : 'sm'}>
            {badge.text}
          </Badge>
        )}
        <CycleDots
          total={state.settings.cycles}
          current={state.cycle}
          currentDone={state.phase !== 'focus'}
        />
      </div>
      <div
        className={cx(
          'leading-none font-bold tracking-[-.01em] tabular-nums [text-shadow:0_2px_18px_rgba(0,0,0,.45)]',
          big
            ? 'mt-2.5 mb-1.5 text-[clamp(72px,12vw,120px)]'
            : 'mt-1.5 mb-1 text-7xl max-[560px]:text-6xl',
        )}
      >
        {formatClock(remainingMs)}
      </div>
      <div
        className={cx(
          'min-h-[18px] text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,.6)]',
          big ? 'text-[15px]' : 'text-[13px]',
        )}
      >
        {state.status === 'paused' ? '일시정지' : ''}
      </div>
    </div>
  );
}
