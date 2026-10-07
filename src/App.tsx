import { ClipboardList, EyeIcon, MapIcon, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Badge } from './components/ui/Badge';
import { CycleDots } from './components/ui/CycleDots';
import { GlassPanel } from './components/ui/GlassPanel';
import { IconButton } from './components/ui/IconButton';
import { PillButton } from './components/ui/PillButton';
import { RangeField } from './components/ui/RangeField';
import { Segmented } from './components/ui/Segmented';
import { Stepper } from './components/ui/Stepper';
import { Toggle } from './components/ui/Toggle';
import { ROUTE_END_X } from './constants/course';
import { SceneCanvas } from './scene/SceneCanvas';
import { SETTING_LIMITS } from './state/timerReducer';
import type { Speed } from './state/types';

// 아이콘 공통 크기, 굵기 (프로토타입: 24px, 선 1.8)
const ICON = { size: 24, strokeWidth: 1.8 };

const SPEEDS = [1, 10, 60, 300] as const satisfies readonly Speed[];
const SPEED_OPTIONS = SPEEDS.map((v) => ({ value: v, label: `${v}배` }));

export default function App() {
  // 임시: 배경 확인용 슬라이더 값 (타이머 연결 후 삭제)
  const [skyT, setSkyT] = useState(0);
  const [cameraX, setCameraX] = useState(0);
  const [toBanpo, setToBanpo] = useState(true);
  // 임시: 아이콘 활성 점 확인용 (TopBar 커밋에서 실제 동작으로 교체)
  const [active, setActive] = useState<string | null>(null);
  const toggle = (key: string) => setActive((cur) => (cur === key ? null : key));
  // 임시: 입력 부품 확인용 (설정 카드, 설정 모달 커밋에서 reducer와 연결)
  const [focusMin, setFocusMin] = useState(30);
  const [cycles, setCycles] = useState(4);
  const [autoStart, setAutoStart] = useState(true);
  const [speed, setSpeed] = useState<Speed>(1);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-900">
      <SceneCanvas cameraX={cameraX} skyT={skyT} toBanpo={toBanpo} />

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

      <GlassPanel className="absolute bottom-4 left-1/2 flex w-[min(400px,calc(100%-32px))] -translate-x-1/2 flex-col gap-3 px-5 py-4">
        {/* 임시: 배지, 사이클 점 확인용 */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Badge tone="focus">집중 · → 반포</Badge>
          <Badge tone="rest">휴식 · 반포</Badge>
          <Badge tone="lapse">타임랩스</Badge>
          <CycleDots total={cycles} current={1} />
        </div>
        <RangeField
          label="하늘"
          value={skyT}
          min={0}
          max={1}
          step={0.01}
          onChange={setSkyT}
          format={(v) => v.toFixed(2)}
        />
        <RangeField
          label="위치"
          value={cameraX}
          min={0}
          max={ROUTE_END_X}
          step={10}
          onChange={setCameraX}
          format={(v) => `${(v / 1000).toFixed(1)}km`}
        />
        <RangeField
          label="집중"
          value={focusMin}
          {...SETTING_LIMITS.focusMin}
          onChange={setFocusMin}
          format={(v) => `${v}분`}
        />
        <Stepper
          label="사이클"
          value={cycles}
          min={SETTING_LIMITS.cycles.min}
          max={SETTING_LIMITS.cycles.max}
          onChange={setCycles}
        />
        <Toggle
          label="휴식 끝나면 다음 사이클 자동 출발"
          checked={autoStart}
          onChange={setAutoStart}
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">배속</span>
          <Segmented options={SPEED_OPTIONS} value={speed} onChange={setSpeed} />
        </div>
        <div className="flex justify-center gap-2">
          <PillButton onClick={() => setToBanpo((v) => !v)}>
            방향: {toBanpo ? '→ 반포' : '← 여의나루'}
          </PillButton>
          <PillButton variant="primary">출발</PillButton>
        </div>
      </GlassPanel>
    </div>
  );
}
