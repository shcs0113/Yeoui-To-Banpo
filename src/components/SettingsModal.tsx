import { SlidersHorizontal } from 'lucide-react';
import { useTimer } from '../state/TimerContext';
import type { Speed } from '../state/types';
import { Modal } from './ui/Modal';
import { Segmented } from './ui/Segmented';
import { Toggle } from './ui/Toggle';

const SPEEDS = [1, 10, 60, 300] as const satisfies readonly Speed[];
const SPEED_OPTIONS = SPEEDS.map((v) => ({ value: v, label: `${v}배` }));

interface Props {
  onClose: () => void;
}

// 설정 창: 자동 출발 + 테스트 배속
export function SettingsModal({ onClose }: Props) {
  const { state, autoStart, setAutoStart, setSpeed } = useTimer();
  const running = state.status === 'running'; // 달리는 중엔 배속을 못 바꾼다

  return (
    <Modal
      title="설정"
      icon={<SlidersHorizontal size={20} strokeWidth={1.8} />}
      onClose={onClose}
    >
      <div className="border-t border-white/14 py-3">
        <Toggle
          label="휴식 끝나면 다음 사이클 자동 출발"
          checked={autoStart}
          onChange={setAutoStart}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/14 py-3 text-sm">
        <div>
          테스트 배속
          {running && (
            <small className="mt-0.5 block text-[11.5px] text-white/60">
              일시정지하면 바꿀 수 있어요
            </small>
          )}
        </div>
        <Segmented
          options={SPEED_OPTIONS}
          value={state.speed}
          onChange={setSpeed}
          disabled={running}
        />
      </div>
    </Modal>
  );
}