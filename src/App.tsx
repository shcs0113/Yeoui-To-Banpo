import { useCallback, useState } from 'react';
import { FinishCard } from './components/FinishCard';
import { FocusHud } from './components/FocusHud';
import { HistoryModal } from './components/HistoryModal';
import { RestHud } from './components/RestHud';
import { RouteBar } from './components/RouteBar';
import { SettingsModal } from './components/SettingsModal';
import { SetupCard } from './components/SetupCard';
import { TitleScreen } from './components/TitleScreen';
import { TopBar } from './components/TopBar';
import { useNow } from './hooks/useNow';
import { SceneCanvas } from './scene/SceneCanvas';
import { derive } from './state/derive';
import { useTimer } from './state/TimerContext';
import { TimerProvider } from './state/TimerProvider';

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
  const [panel, setPanel] = useState<Panel>(null); // 열린 창
  const [uiHidden, setUiHidden] = useState(false);
  const togglePanel = (p: Exclude<Panel, null>) => setPanel((cur) => (cur === p ? null : p));
  const closePanel = useCallback(() => setPanel(null), []);

  const isSetup = state.phase === 'setup';
  const done = state.phase === 'done';
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
            : done
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

      {/* 휴식 시계: 하늘 가운데. 시계는 UI를 숨겨도 남긴다 */}
      {resting && <RestHud toBanpo={d.toBanpo} remainingMs={shownMs} routeBarVisible={!uiHidden} />}

      {/* 하단 독은 UI를 숨겨도 남긴다 (시간은 늘 보여야 하니까) */}
      {!isSetup && !done && (
        <FocusHud toBanpo={d.toBanpo} remainingMs={shownMs} onStart={startRide} />
      )}

      {/* 완주: 하단 독 자리에 결과 카드 */}
      {done && <FinishCard onHistory={() => setPanel('history')} />}

      {/* 팝업 창 */}
      {panel === 'history' && <HistoryModal onClose={closePanel} />}
      {panel === 'settings' && <SettingsModal onClose={closePanel} />}
    </div>
  );
}