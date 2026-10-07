import { useState } from 'react';
import { RouteBar } from './components/RouteBar';
import { SetupCard } from './components/SetupCard';
import { TitleScreen } from './components/TitleScreen';
import { TopBar } from './components/TopBar';
import { Badge, type Tone } from './components/ui/Badge';
import { CycleDots } from './components/ui/CycleDots';
import { GlassPanel } from './components/ui/GlassPanel';
import { PillButton } from './components/ui/PillButton';
import { Segmented } from './components/ui/Segmented';
import { Toggle } from './components/ui/Toggle';
import { useNow } from './hooks/useNow';
import { formatClock } from './lib/format';
import { SceneCanvas } from './scene/SceneCanvas';
import { derive } from './state/derive';
import { useTimer } from './state/TimerContext';
import { TimerProvider } from './state/TimerProvider';
import type { Speed, TimerState } from './state/types';

const SPEEDS = [1, 10, 60, 300] as const satisfies readonly Speed[];
const SPEED_OPTIONS = SPEEDS.map((v) => ({ value: v, label: `${v}배` }));

type Panel = 'preview' | 'history' | 'settings' | null;

const dest = (toBanpo: boolean) => (toBanpo ? '반포' : '여의나루');

// 단계별 배지 (출발 전엔 없음)
function badgeFor(state: TimerState, toBanpo: boolean): { tone: Tone; text: string } | null {
  switch (state.phase) {
    case 'focus':
      return { tone: 'focus', text: `집중 · ${toBanpo ? '→' : '←'} ${dest(toBanpo)}` };
    case 'break':
      return { tone: 'rest', text: `휴식 · ${dest(toBanpo)}` };
    case 'lapse':
      return { tone: 'lapse', text: '타임랩스' };
    case 'done':
      return { tone: 'rest', text: '완주' };
    default:
      return null;
  }
}

export default function App() {
  return (
    <TimerProvider>
      <RidingScreen />
    </TimerProvider>
  );
}

function RidingScreen() {
  const timer = useTimer();
  const { state } = timer;
  const running = state.status === 'running';

  // 남은 시간 숫자: 달리는 중에만 0.25초마다 다시 그린다
  const now = useNow(250, running);
  const d = derive(state, now);
  const badge = badgeFor(state, d.toBanpo);
  const shownMs = d.remainingMs * state.speed; // 배속이어도 가상 시간으로

  // 화면 상태 (타이머와 상관없는 UI 상태라 여기에 둔다)
  const [setupOpen, setSetupOpen] = useState(false); // 출발 전: 타이틀 <-> 설정 카드
  const [panel, setPanel] = useState<Panel>(null); // 열린 창 (모달은 5단계에서)
  const [uiHidden, setUiHidden] = useState(false);
  const togglePanel = (p: Exclude<Panel, null>) => setPanel((cur) => (cur === p ? null : p));

  const isSetup = state.phase === 'setup';
  const showTitle = isSetup && !setupOpen;
  const startRide = () => {
    setSetupOpen(false); // 다음에 '처음으로' 오면 타이틀부터
    timer.start();
  };
  const resting = state.phase === 'break' || state.phase === 'lapse';
  // 다리 이름표: 첫 화면엔 장식용 마포대교 숨김, UI 숨김, 휴식 중엔 전부 숨김 (휴식 시계와 겹치지 않게)
  const labels = uiHidden || resting ? 'none' : isSetup ? 'route' : 'all';

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-900">
      {/* 캔버스는 매 프레임 이 함수를 불러 지금 위치, 하늘을 받아 간다 */}
      <SceneCanvas getScene={(t) => ({ ...derive(state, t), labels })} />

      <TopBar
        showBrand={!showTitle}
        tag={
          isSetup
            ? undefined
            : state.phase === 'done'
              ? '완주'
              : `CYCLE ${state.cycle + 1} / ${state.settings.cycles}`
        }
        previewOn={panel === 'preview'}
        previewDisabled={running && !isSetup}
        historyOn={panel === 'history'}
        settingsOn={panel === 'settings'}
        uiHidden={uiHidden}
        onPreview={() => togglePanel('preview')}
        onHistory={() => togglePanel('history')}
        onToggleUi={() => setUiHidden((v) => !v)}
        onSettings={() => togglePanel('settings')}
      />

      {showTitle && !uiHidden && (
        <TitleScreen onStart={() => setSetupOpen(true)} onPreview={() => togglePanel('preview')} />
      )}

      {/* 경로 바: 첫 화면(출발 전)엔 풍경만 보이게 숨긴다 */}
      {!isSetup && !uiHidden && <RouteBar cameraX={d.cameraX} toBanpo={d.toBanpo} />}

      {isSetup && setupOpen && !uiHidden && (
        <SetupCard onStart={startRide} onBack={() => setSetupOpen(false)} />
      )}

      {/* 임시 조작판: 4단계에서 화면별 컴포넌트로 나눈다 (출발 후에만) */}
      {!isSetup && (
        <GlassPanel className="absolute bottom-4 left-1/2 flex w-[min(400px,calc(100%-32px))] -translate-x-1/2 flex-col gap-3 px-5 py-4">
          <div className="flex min-h-5 flex-wrap items-center justify-center gap-3">
            {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
            <CycleDots
              total={state.settings.cycles}
              current={state.cycle}
              currentDone={state.phase !== 'focus'}
            />
          </div>
          <div className="text-center text-6xl font-extrabold tabular-nums">
            {formatClock(shownMs)}
          </div>
          <p className="text-center text-xs text-white/50">
            {state.phase} · {state.status} · {(d.cameraX / 1000).toFixed(2)}km · 하늘{' '}
            {d.skyT.toFixed(2)}
          </p>

          <Toggle
            label="휴식 끝나면 다음 사이클 자동 출발"
            checked={timer.autoStart}
            onChange={timer.setAutoStart}
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">배속</span>
            <Segmented
              options={SPEED_OPTIONS}
              value={state.speed}
              onChange={timer.setSpeed}
              disabled={running}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Controls onStart={startRide} />
          </div>
        </GlassPanel>
      )}
    </div>
  );
}

// 지금 할 수 있는 동작만 버튼으로 보여준다
function Controls({ onStart }: { onStart: () => void }) {
  const { state, pause, resume, giveUp, skipBreak, toSetup } = useTimer();
  const { phase, status } = state;

  if (phase === 'focus' && status === 'idle') {
    return (
      <PillButton variant="primary" onClick={onStart}>
        출발
      </PillButton>
    );
  }
  if (phase === 'focus') {
    return (
      <>
        {status === 'running' ? (
          <PillButton onClick={pause}>일시정지</PillButton>
        ) : (
          <PillButton variant="primary" onClick={resume}>
            재개
          </PillButton>
        )}
        <PillButton variant="danger" onClick={giveUp}>
          포기
        </PillButton>
      </>
    );
  }
  if (phase === 'break') {
    return (
      <>
        {status === 'running' ? (
          <PillButton onClick={pause}>일시정지</PillButton>
        ) : (
          <PillButton variant="primary" onClick={resume}>
            재개
          </PillButton>
        )}
        <PillButton onClick={skipBreak}>휴식 건너뛰기</PillButton>
      </>
    );
  }
  if (phase === 'done') {
    return (
      <PillButton variant="primary" onClick={toSetup}>
        처음으로
      </PillButton>
    );
  }
  return null; // lapse: 5초 동안은 누를 게 없다
}
