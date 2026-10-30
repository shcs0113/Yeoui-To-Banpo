import { SlidersHorizontal } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { THEME_OPTIONS } from '../constants/theme';
import { cx } from '../lib/cx';
import { TRIM } from '../lib/trim';
import { useTimer } from '../state/TimerContext';
import type { Speed } from '../state/types';
import { SkyPicker } from './SkyPicker';
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

const TABS = ['풍경', '타이머', '단축키'] as const;
type Tab = (typeof TABS)[number];

interface Props {
  onClose: () => void;
}

// 설정 창: 탭 셋 (풍경: 계절, 하늘, 흩날림 / 타이머: 자동 출발, 배속 / 단축키)
// 뒤 풍경이 비치는 투명 유리. 탭을 바꿔도 창 크기는 그대로
export function SettingsModal({ onClose }: Props) {
  const { state, autoStart, setAutoStart, setSpeed, theme, setTheme, effects, setEffects } =
    useTimer();
  const running = state.status === 'running'; // 달리는 중엔 배속을 못 바꾼다
  const [tab, setTab] = useState<Tab>('풍경');

  return (
    <Modal
      title="설정"
      icon={<SlidersHorizontal size={20} strokeWidth={1.8} />}
      onClose={onClose}
      clear
    >
      <div role="tablist" className="mb-1 flex gap-5 border-b border-white/14">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cx(
              TRIM,
              '-mb-px cursor-pointer border-b-2 pt-1 pb-3 text-sm font-bold transition-colors',
              t === '단축키' && 'max-[560px]:hidden', // 키보드가 없는 좁은 화면(폰)에선 숨긴다
              tab === t
                ? 'border-white text-white'
                : 'border-transparent text-white/55 hover:text-white/85',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 탭 내용을 한 칸에 겹쳐 두고 고른 것만 보이게(나머지는 invisible).
          칸 높이 = 가장 긴 탭이라 탭을 바꿔도 창 크기가 그대로다 */}
      <div className="grid">
        <TabPanel on={tab === '풍경'}>
          <Row label="계절">
            <Segmented options={THEME_OPTIONS} value={theme} onChange={setTheme} />
          </Row>
          <SkyPicker className="py-3" />
          <div className="py-3">
            <Toggle label="흩날리는 꽃잎, 비, 낙엽, 눈" checked={effects} onChange={setEffects} />
          </div>
        </TabPanel>

        <TabPanel on={tab === '타이머'}>
          <div className="py-3">
            <Toggle
              label="휴식 끝나면 다음 사이클 자동 출발"
              checked={autoStart}
              onChange={setAutoStart}
            />
          </div>
          <Row label="테스트 배속" hint={running ? '일시정지하면 바꿀 수 있어요' : undefined}>
            <Segmented
              options={SPEED_OPTIONS}
              value={state.speed}
              onChange={setSpeed}
              disabled={running}
            />
          </Row>
        </TabPanel>

        <TabPanel on={tab === '단축키'} className="max-[560px]:hidden">
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 pt-3 text-[12.5px] text-white/70">
            {SHORTCUTS.map(([key, desc]) => (
              <div key={key} className="contents">
                <dt className="justify-self-start">
                  <Kbd>{key}</Kbd>
                </dt>
                <dd className={TRIM}>{desc}</dd>
              </div>
            ))}
          </dl>
        </TabPanel>
      </div>
    </Modal>
  );
}

function TabPanel({
  on,
  className,
  children,
}: {
  on: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      aria-hidden={!on}
      className={cx('divide-y divide-white/10 [grid-area:1/1]', !on && 'invisible', className)}
    >
      {children}
    </div>
  );
}

// 한 줄 설정: 왼쪽 이름(+ 작은 안내), 오른쪽 고르기. 좁아서 줄이 꺾여도 오른쪽 끝에 붙인다
function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3 text-sm">
      <div>
        <div className={TRIM}>{label}</div>
        {hint && (
          <small className={cx(TRIM, 'mt-2 block text-[11.5px] text-white/60')}>{hint}</small>
        )}
      </div>
      <div className="ml-auto">{children}</div>
    </div>
  );
}
