import { ClipboardList, EyeIcon, MapIcon, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Badge } from './components/ui/Badge';
import { CycleDots } from './components/ui/CycleDots';
import { GlassPanel } from './components/ui/GlassPanel';
import { IconButton } from './components/ui/IconButton';
import { PillButton } from './components/ui/PillButton';
import { ROUTE_END_X } from './constants/course';
import { SceneCanvas } from './scene/SceneCanvas';

// 아이콘 공통 크기·굵기 (프로토타입: 24px, 선 1.8)
const ICON = { size: 24, strokeWidth: 1.8 };

export default function App() {
  // 임시: 배경 확인용 슬라이더 값 (타이머 연결 후 삭제)
  const [skyT, setSkyT] = useState(0);
  const [cameraX, setCameraX] = useState(0);
  const [toBanpo, setToBanpo] = useState(true);
  // 임시: 아이콘 활성 점 확인용 (TopBar 커밋에서 실제 동작으로 교체)
  const [active, setActive] = useState<string | null>(null);
  const toggle = (key: string) => setActive((cur) => (cur === key ? null : key));

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

      <GlassPanel className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col gap-2 px-5 py-4 text-sm">
        {/* 임시: 배지·사이클 점 확인용 */}
        <div className="mb-1 flex flex-wrap items-center justify-center gap-3">
          <Badge tone="focus">집중 · → 반포</Badge>
          <Badge tone="rest">휴식 · 반포</Badge>
          <Badge tone="lapse">타임랩스</Badge>
          <CycleDots total={4} current={1} />
        </div>
        <label className="flex items-center justify-between gap-3">
          하늘 {skyT.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={skyT}
            onChange={(e) => setSkyT(Number(e.target.value))}
            className="w-64"
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          위치 {Math.round(cameraX)}m
          <input
            type="range"
            min={0}
            max={ROUTE_END_X}
            step={10}
            value={cameraX}
            onChange={(e) => setCameraX(Number(e.target.value))}
            className="w-64"
          />
        </label>
        <div className="mt-1 flex justify-center gap-2">
          <PillButton onClick={() => setToBanpo((v) => !v)}>
            방향: {toBanpo ? '→ 반포' : '← 여의나루'}
          </PillButton>
          <PillButton variant="primary">출발</PillButton>
          <PillButton variant="danger">포기</PillButton>
        </div>
      </GlassPanel>
    </div>
  );
}
