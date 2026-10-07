import { useState } from 'react';
import { SceneCanvas } from './scene/SceneCanvas';

export default function App() {
  // 임시: 하늘 확인용 슬라이더 값 (타이머 연결 후 삭제)
  const [skyT, setSkyT] = useState(0);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-slate-900">
      <SceneCanvas cameraX={0} skyT={skyT} />

      <label className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/50 px-5 py-2 text-sm text-white">
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
    </div>
  );
}
