import { Check, ClipboardList, SkipForward, X } from 'lucide-react';
import { cx } from '../lib/cx';
import { formatClock } from '../lib/format';
import { recordTitle, summarize } from '../lib/history';
import { formatHoursMinutes, formatTimeOfDay } from '../lib/plan';
import { useTimer } from '../state/TimerContext';
import type { HistoryRecord } from '../state/types';
import { Modal } from './ui/Modal';
import { StatList } from './ui/StatList';

interface Props {
  onClose: () => void;
}

// 끝난 모양: 완주 ✓ / 휴식 건너뜀 ⏭ / 집중 포기 ✕
function ResultMark({ record }: { record: HistoryRecord }) {
  if (record.completed) return <Check size={16} aria-label="완료" />;
  if (record.kind === 'break') return <SkipForward size={16} aria-label="건너뜀" />;
  return <X size={16} className="text-[#ff8a8a]" aria-label="포기" />;
}

// 라이딩 기록 창: 위에 요약, 아래에 최근 것부터 한 줄씩
export function HistoryModal({ onClose }: Props) {
  const { history } = useTimer().state;
  const sum = summarize(history);

  return (
    <Modal
      title="라이딩 기록"
      icon={<ClipboardList size={20} strokeWidth={1.8} />}
      onClose={onClose}
    >
      <StatList
        className="mb-4"
        stats={[
          { value: sum.km.toFixed(1), unit: 'km', label: '달린 거리' },
          { value: formatHoursMinutes(sum.focusMin), label: '집중 시간' },
          { value: String(sum.sections), label: '완료 구간' },
        ]}
      />

      {history.length === 0 ? (
        <p className="pt-1.5 text-sm text-white/70">아직 기록이 없어요. 출발해 보세요!</p>
      ) : (
        <ul>
          {history.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-2.5 border-t border-white/14 py-2.5 text-sm"
            >
              <span className="w-11 text-white/65 tabular-nums">
                {formatTimeOfDay(r.startedAt)}
              </span>
              <span className="flex flex-1 items-center gap-2">
                {/* 색 점: 집중은 파랑, 휴식은 초록 */}
                <span
                  className={cx(
                    'size-2 rounded-full',
                    r.kind === 'focus'
                      ? 'bg-accent shadow-[0_0_8px_var(--color-accent)]'
                      : 'bg-rest shadow-[0_0_8px_var(--color-rest)]',
                  )}
                />
                {recordTitle(r)}
              </span>
              <span className="text-white/70 tabular-nums">{formatClock(r.elapsedMs)}</span>
              <span className="flex w-[22px] justify-end text-white/85">
                <ResultMark record={r} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}