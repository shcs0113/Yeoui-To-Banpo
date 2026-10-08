import { SlidersHorizontal } from 'lucide-react';
import { useTimer } from '../state/TimerContext';
import type { Speed } from '../state/types';
import { Kbd } from './ui/Kbd';
import { Modal } from './ui/Modal';
import { Segmented } from './ui/Segmented';
import { Toggle } from './ui/Toggle';

const SPEEDS = [1, 10, 60, 300] as const satisfies readonly Speed[];
const SPEED_OPTIONS = SPEEDS.map((v) => ({ value: v, label: `${v}배` }));

// 단축키 안내 (키, 설명)
const SHORTCUTS = [
  ['Space', '출발 · 일시정지 · 재개'],
  ['M', '코스 미리보기'],
  ['H', '기록'],
  ['U', 'UI 숨기기'],
  ['Esc', '닫기'],
] as const;

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

      {/* 단축키: 키보드가 없는 좁은 화면(폰)에선 숨긴다 */}
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 border-t border-white/14 pt-3 text-[12.5px] text-white/70 max-[560px]:hidden">
        {SHORTCUTS.map(([key, desc]) => (
          <div key={key} className="contents">
            <dt className="justify-self-start">
              <Kbd>{key}</Kbd>
            </dt>
            <dd>{desc}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}