import { useCallback, useRef, useState } from 'react';
import { FinishCard } from './components/FinishCard';
import { FocusHud } from './components/FocusHud';
import { HistoryModal } from './components/HistoryModal';
import { PreviewPanel } from './components/PreviewPanel';
import { RestHud } from './components/RestHud';
import { RouteBar } from './components/RouteBar';
import { SettingsModal } from './components/SettingsModal';
import { SetupCard } from './components/SetupCard';
import { TitleScreen } from './components/TitleScreen';
import { TopBar } from './components/TopBar';
import { useKeyboard } from './hooks/useKeyboard';
import { useNow } from './hooks/useNow';
import { usePreview } from './hooks/usePreview';
import { SceneCanvas } from './scene/SceneCanvas';
import { derive } from './state/derive';
import { useTimer } from './state/TimerContext';
import { TimerProvider } from './state/TimerProvider';

type Panel = 'history' | 'settings' | null;

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
  const [panel, setPanel] = useState<Panel>(null); // 열린 팝업 창
  const [uiHidden, setUiHidden] = useState(false);
  const togglePanel = (p: Exclude<Panel, null>) => setPanel((cur) => (cur === p ? null : p));
  const closePanel = useCallback(() => setPanel(null), []);

  // 코스 미리보기 (자동 주행 포함)
  const pv = usePreview(state.settings);
  const { preview } = pv;
  const previewing = preview !== null;
  const previewDisabled = running && state.phase !== 'setup'; // 달리는 중엔 미리보기를 못 연다
  // 미리보기는 지금 방향으로 출발선에서 시작 (출발 전이면 반포행)
  const togglePreview = () => (previewing ? pv.close() : pv.open(d.toBanpo));

  const isSetup = state.phase === 'setup';
  const done = state.phase === 'done';
  const showTitle = isSetup && !setupOpen && !previewing;
  const startRide = () => {
    setSetupOpen(false); // 다음에 '처음으로' 오면 타이틀부터
    timer.start();
  };
  const resting = state.phase === 'break' || state.phase === 'lapse';
  // 다리 이름표: 첫 화면엔 장식용 마포대교 숨김, UI 숨김, 휴식 중엔 전부 숨김 (휴식 시계와 겹치지 않게)
  const labels = uiHidden
    ? 'none'
    : previewing
      ? 'all'
      : resting
        ? 'none'
        : isSetup
          ? 'route'
          : 'all';

  // Space: 지금 화면의 주 동작 하나
  const primaryAction = () => {
    if (showTitle) setSetupOpen(true);
    else if (isSetup || (state.phase === 'focus' && state.status === 'idle')) startRide();
    else if (running && state.phase !== 'lapse') timer.pause();
    else if (state.status === 'paused') timer.resume();
  };

  // 키보드 단축키
  const held = useRef({ left: false, right: false, shift: false }); // 지금 누르고 있는 키
  const updateScrub = () => {
    const h = held.current;
    pv.scrub(h.left === h.right ? 0 : h.right ? 1 : -1, h.shift);
  };
  useKeyboard({
    down: (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return; // Cmd+H 같은 OS, 브라우저 단축키는 그대로 둔다
      if (panel !== null) return; // 팝업 창이 열려 있으면 Esc만 (Modal이 직접 닫는다)
      // e.code는 자판 위치: 한글 입력 상태에서도 M 자리는 'KeyM' (e.key는 'ㅡ'가 된다)
      const { code } = e;

      if (code === 'Escape') {
        if (previewing) pv.close();
        else if (setupOpen) setSetupOpen(false);
        return;
      }
      if (code === 'KeyU') return setUiHidden((v) => !v);
      if (code === 'KeyH') return setPanel('history');
      if (code === 'KeyM') {
        if (!previewDisabled) togglePreview();
        return;
      }

      if (code === 'Space') {
        e.preventDefault(); // 페이지 스크롤 막기
        // 포커스된 버튼이 있으면 Space를 뗄 때 그 버튼도 눌린다 -> 포커스를 먼저 뺀다
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        if (previewing) pv.toggleAuto();
        else primaryAction();
        return;
      }

      if (!previewing) return;
      // 여기부터 미리보기 전용
      const digit = /^Digit([1-9])$/.exec(code);
      if (digit) return pv.jump(Number(digit[1]) - 1);
      if (code === 'ArrowLeft' || code === 'ArrowRight') {
        e.preventDefault(); // 포커스된 슬라이더가 같이 움직이지 않게
        if (e.repeat) return; // 꾹 누르면 keydown이 반복해서 오지만 처음 한 번만
        held.current[code === 'ArrowLeft' ? 'left' : 'right'] = true;
        updateScrub();
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        held.current.shift = true;
        updateScrub();
      }
    },
    up: (e) => {
      const h = held.current;
      if (e.code === 'ArrowLeft') h.left = false;
      else if (e.code === 'ArrowRight') h.right = false;
      else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') h.shift = false;
      else return;
      if (previewing) updateScrub();
    },
    blur: () => {
      held.current = { left: false, right: false, shift: false };
      pv.scrub(0, false);
    },
  });

  // 화면이 보여줄 위치, 방향: 미리보기 중이면 미리보기 값, 아니면 타이머 값
  const view = preview
    ? { cameraX: preview.x, toBanpo: preview.toBanpo }
    : { cameraX: d.cameraX, toBanpo: d.toBanpo };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-900">
      {/* 캔버스는 매 프레임 이 함수를 불러 지금 위치, 하늘을 받아 간다 */}
      <SceneCanvas
        getScene={(t) => {
          // 미리보기는 매 프레임 그 시각의 화면으로 (자동 주행이 부드럽게 움직이도록)
          const p = pv.at(t);
          return p
            ? { cameraX: p.x, toBanpo: p.toBanpo, skyT: p.skyT, labels }
            : { ...derive(state, t), labels };
        }}
      />

      <TopBar
        showBrand={!showTitle}
        tag={
          previewing
            ? '미리보기'
            : isSetup
              ? undefined
              : done
                ? '완주'
                : `CYCLE ${state.cycle + 1} / ${state.settings.cycles}`
        }
        previewOn={previewing}
        previewDisabled={previewDisabled}
        historyOn={panel === 'history'}
        settingsOn={panel === 'settings'}
        uiHidden={uiHidden}
        onPreview={togglePreview}
        onHistory={() => togglePanel('history')}
        onToggleUi={() => setUiHidden((v) => !v)}
        onSettings={() => togglePanel('settings')}
      />

      {showTitle && !uiHidden && (
        <TitleScreen onStart={() => setSetupOpen(true)} onPreview={togglePreview} />
      )}

      {/* 경로 바: 첫 화면(출발 전)엔 풍경만 보이게 숨긴다 */}
      {(previewing || !isSetup) && !uiHidden && (
        <RouteBar cameraX={view.cameraX} toBanpo={view.toBanpo} />
      )}

      {/* 미리보기 중엔 타이머 화면(설정 카드, 시계, 독, 완주 카드)을 모두 내린다 */}
      {previewing ? (
        !uiHidden && (
          <PreviewPanel
            preview={preview}
            auto={pv.auto}
            onChange={pv.change}
            onToggleAuto={pv.toggleAuto}
            onClose={pv.close}
          />
        )
      ) : (
        <>
          {isSetup && setupOpen && !uiHidden && (
            <SetupCard onStart={startRide} onBack={() => setSetupOpen(false)} />
          )}

          {/* 휴식 시계: 하늘 가운데. 시계는 UI를 숨겨도 남긴다 */}
          {resting && (
            <RestHud toBanpo={d.toBanpo} remainingMs={shownMs} routeBarVisible={!uiHidden} />
          )}

          {/* 하단 독은 UI를 숨겨도 남긴다 (시간은 늘 보여야 하니까) */}
          {!isSetup && !done && (
            <FocusHud toBanpo={d.toBanpo} remainingMs={shownMs} onStart={startRide} />
          )}

          {/* 완주: 하단 독 자리에 결과 카드 */}
          {done && <FinishCard onHistory={() => setPanel('history')} />}
        </>
      )}

      {/* 팝업 창 */}
      {panel === 'history' && <HistoryModal onClose={closePanel} />}
      {panel === 'settings' && <SettingsModal onClose={closePanel} />}
    </div>
  );
}