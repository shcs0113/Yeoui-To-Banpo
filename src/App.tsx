import { useState } from 'react';
import { FocusHud } from './components/FocusHud';
import { RouteBar } from './components/RouteBar';
import { SetupCard } from './components/SetupCard';
import { TitleScreen } from './components/TitleScreen';
import { TopBar } from './components/TopBar';
import { GlassPanel } from './components/ui/GlassPanel';
import { Segmented } from './components/ui/Segmented';
import { Toggle } from './components/ui/Toggle';
import { useNow } from './hooks/useNow';
import { SceneCanvas } from './scene/SceneCanvas';
import { derive } from './state/derive';
import { useTimer } from './state/TimerContext';
import { TimerProvider } from './state/TimerProvider';
import type { Speed } from './state/types';

const SPEEDS = [1, 10, 60, 300] as const satisfies readonly Speed[];
const SPEED_OPTIONS = SPEEDS.map((v) => ({ value: v, label: `${v}배` }));

type Panel = 'preview' | 'history' | 'settings' | null;

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
  // 다리 이름표: 첫 화면엔 장식용 마포대교 숨김, UI 숨김·휴식 중엔 전부 숨김 (휴식 시계와 겹치지 않게)
  const labels = uiHidden || resting ? 'none' : isSetup ? 'route' : 'all';

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-900">
      {/* 캔버스는 매 프레임 이 함수를 불러 지금 위치·하늘을 받아 간다 */}
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

      {/* 하단 독은 UI를 숨겨도 남긴다 (시간은 늘 보여야 하니까) */}
      {!isSetup && <FocusHud toBanpo={d.toBanpo} remainingMs={shownMs} onStart={startRide} />}

      {/* 임시 개발 도구: 설정 모달(5단계)로 옮길 때까지 */}
      {!isSetup && !uiHidden && (
        <GlassPanel className="absolute top-[156px] left-4 flex w-[290px] flex-col gap-2 px-4 py-3 text-xs max-[560px]:hidden">
          <span className="text-white/50">개발용 (임시)</span>
          <Toggle label="자동 출발" checked={timer.autoStart} onChange={timer.setAutoStart} />
          <Segmented
            options={SPEED_OPTIONS}
            value={state.speed}
            onChange={timer.setSpeed}
            disabled={running}
          />
        </GlassPanel>
      )}
    </div>
  );
}
