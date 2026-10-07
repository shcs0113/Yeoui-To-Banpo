import { useEffect, useRef } from 'react';
import { drawScene } from './drawScene';
import { makeView } from './projection';

interface Props {
  cameraX: number;
  skyT: number;
}

// 배경 캔버스. React는 캔버스를 한 번만 만들고, 그리기는 rAF 루프가 맡는다
export function SceneCanvas({ cameraX, skyT }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 루프가 읽을 최신 값. ref라서 바뀌어도 리렌더가 일어나지 않는다
  const latest = useRef({ cameraX, skyT });
  useEffect(() => {
    latest.current = { cameraX, skyT };
  }, [cameraX, skyT]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // 화면 크기에 맞춰 캔버스 해상도 조정 (레티나는 2배로 그려야 선명하다)
    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    // 매 프레임: 최신 값으로 장면을 다시 그린다
    let frameId = 0;
    const frame = (ms: number) => {
      const { cameraX, skyT } = latest.current;
      drawScene(ctx, makeView(width, height, cameraX), skyT, ms / 1000);
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);

    // 컴포넌트가 사라질 때 루프와 감시를 정리
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
