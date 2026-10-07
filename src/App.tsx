import { ClipboardList, EyeIcon, MapIcon, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Badge, type Tone } from './components/ui/Badge';
import { CycleDots } from './components/ui/CycleDots';
import { GlassPanel } from './components/ui/GlassPanel';
import { IconButton } from './components/ui/IconButton';
import { PillButton } from './components/ui/PillButton';
import { RangeField } from './components/ui/RangeField';
import { Segmented } from './components/ui/Segmented';
import { Stepper } from './components/ui/Stepper';
import { Toggle } from './components/ui/Toggle';
import { useNow } from './hooks/useNow';
import { formatClock } from './lib/format';
import { SceneCanvas } from './scene/SceneCanvas';
import { derive } from './state/derive';
import { useTimer } from './state/TimerContext';
import { TimerProvider } from './state/TimerProvider';
import { SETTING_LIMITS } from './state/timerReducer';
import type { Speed, TimerState } from './state/types';

// 아이콘 공통 크기, 굵기 (프로토타입: 24px, 선 1.8)
const ICON = { size: 24, strokeWidth: 1.8 };

const SPEEDS = [1, 10, 60, 300] as const satisfies readonly Speed[];
const SPEED_OPTIONS = SPEEDS.map((v) => ({ value: v, label: `${v}배` }));

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
  const shownMs =
    state.phase === 'setup' ? state.settings.focusMin * 60_000 : d.remainingMs * state.speed; // 배속이어도 가상 시간으로

  // 임시: 아이콘 활성 점 확인용 (TopBar 커밋에서 실제 동작으로 교체)
  const [active, setActive] = useState<string | null>(null);
  const toggle = (key: string) => setActive((cur) => (cur === key ? null : key));

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-900">
      {/* 캔버스는 매 프레임 이 함수를 불러 지금 위치, 하늘을 받아 간다 */}
      <SceneCanvas getScene={(t) => derive(state, t)} />

      <div className="absolute top-3 right-3 flex gap-0.5">
        <IconButton label="코스 미리보기" active={active === 'map'} onClick={() => toggle('map')}>
          <MapIcon {...ICON} />
        </IconButton>
        <IconButton label="기록" active={active === 'history'} onClick={() => toggle('history')}>
          <ClipboardList {...ICON} />
        </IconButton>
        <IconButton label="UI 숨기기" active={active === 'hide'} onClick={() => toggle('hide')}>
          <EyeIcon {...ICON} />
        </IconButton>
        <IconButton label="설정" active={active === 'settings'} onClick={() => toggle('settings')}>
          <SlidersHorizontal {...ICON} />
        </IconButton>
      </div>

      {/* 임시 조작판: 4단계에서 화면별 컴포넌트로 나눈다 */}
      <GlassPanel className="absolute bottom-4 left-1/2 flex w-[min(400px,calc(100%-32px))] -translate-x-1/2 flex-col gap-3 px-5 py-4">
        <div className="flex min-h-5 flex-wrap items-center justify-center gap-3">
          {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
          <CycleDots
            total={state.settings.cycles}
            current={state.cycle}
            currentDone={state.phase !== 'setup' && state.phase !== 'focus'}
          />
        </div>
        <div className="text-center text-6xl font-extrabold tabular-nums">
          {formatClock(shownMs)}
        </div>
        <p className="text-center text-xs text-white/50">
          {state.phase} · {state.status} · {(d.cameraX / 1000).toFixed(2)}km · 하늘{' '}
          {d.skyT.toFixed(2)}
        </p>

        {state.phase === 'setup' && (
          <>
            <RangeField
              label="집중"
              value={state.settings.focusMin}
              {...SETTING_LIMITS.focusMin}
              onChange={(v) => timer.updateSettings({ focusMin: v })}
              format={(v) => `${v}분`}
            />
            <RangeField
              label="휴식"
              value={state.settings.breakMin}
              {...SETTING_LIMITS.breakMin}
              onChange={(v) => timer.updateSettings({ breakMin: v })}
              format={(v) => `${v}분`}
            />
            <Stepper
              label="사이클"
              value={state.settings.cycles}
              min={SETTING_LIMITS.cycles.min}
              max={SETTING_LIMITS.cycles.max}
              onChange={(v) => timer.updateSettings({ cycles: v })}
            />
          </>
        )}

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
          <Controls />
        </div>
      </GlassPanel>
    </div>
  );
}

// 지금 할 수 있는 동작만 버튼으로 보여준다
function Controls() {
  const { state, start, pause, resume, giveUp, skipBreak, toSetup } = useTimer();
  const { phase, status } = state;

  if (phase === 'setup' || (phase === 'focus' && status === 'idle')) {
    return (
      <PillButton variant="primary" onClick={start}>
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
