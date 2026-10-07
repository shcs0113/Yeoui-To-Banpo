import { useState } from 'react';
import { ROUTE_END_X } from './constants/course';
import { SceneCanvas } from './scene/SceneCanvas';

export default function App() {
  // 임시: 배경 확인용 슬라이더 값 (타이머 연결 후 삭제)
  const [skyT, setSkyT] = useState(0);
  const [cameraX, setCameraX] = useState(0);
  const [toBanpo, setToBanpo] = useState(true);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-900">
      <SceneCanvas cameraX={cameraX} skyT={skyT} toBanpo={toBanpo} />

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col gap-2 rounded-2xl bg-black/50 px-5 py-3 text-sm text-white">
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
        <button
          type="button"
          onClick={() => setToBanpo((v) => !v)}
          className="rounded-full border border-white/40 py-1"
        >
          방향: {toBanpo ? '→ 반포' : '← 여의나루'}
        </button>
      </div>
    </div>
  );
}
