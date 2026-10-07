import { mixRGB, rgba } from '../color';
import { fillPoly } from '../draw';
import { type Light, shade } from '../lighting';
import { NEAR, type View, project } from '../projection';

export const RIVER_Z0 = 19; // 강이 시작하는 깊이 (자전거길 바로 뒤)
export const RIVER_Z1 = 1000; // 강 건너편 둔치
const FAR_BANK_Z = 1100; // 건너편 도시가 시작하는 깊이
const SPAN = 20000; // 좌우로 충분히 넓게

// 앞에서부터: 내 쪽 잔디, 강물(+ 반짝임), 건너편 둔치
export function drawRiver(ctx: CanvasRenderingContext2D, view: View, light: Light, time: number) {
  const L = view.camX - SPAN;
  const R = view.camX + SPAN;

  // 건너편 둔치
  fillPoly(
    ctx,
    view,
    [
      [L, 0, RIVER_Z1],
      [R, 0, RIVER_Z1],
      [R, 0, FAR_BANK_Z],
      [L, 0, FAR_BANK_Z],
    ],
    shade(light, 140, 12, 24, 1050),
  );

  // 강물: 멀수록 하늘을 비추고, 가까울수록 짙은 파랑
  const [, yFar] = project(view, [view.camX, -1, RIVER_Z1]);
  const [, yNear] = project(view, [view.camX, -1, RIVER_Z0]);
  const g = ctx.createLinearGradient(0, yFar, 0, yNear);
  g.addColorStop(0, rgba(mixRGB(light.bottom, [30, 50, 90], 0.35)));
  g.addColorStop(1, shade(light, 220, 55, 28));
  fillPoly(
    ctx,
    view,
    [
      [L, -1, RIVER_Z0],
      [R, -1, RIVER_Z0],
      [R, -1, RIVER_Z1],
      [L, -1, RIVER_Z1],
    ],
    g,
  );

  // 물결 반짝임 40개 (위치는 고정 패턴, 시간에 따라 살짝 일렁임)
  ctx.fillStyle = `rgba(255,255,255,${0.06 + (1 - light.night) * 0.08})`;
  for (let i = 0; i < 40; i++) {
    const z = 60 + ((i * 97) % 900);
    const x = view.camX + ((((i * 263) % 1000) - 500) * z) / 300 + Math.sin(time + i) * 3;
    const [sx, sy] = project(view, [x, -1, z]);
    ctx.fillRect(sx, sy, Math.max(1, (view.focal / z) * 4), 1);
  }

  // 내 쪽 잔디 (카메라 발밑부터 강 앞까지)
  fillPoly(
    ctx,
    view,
    [
      [L, 0, NEAR],
      [R, 0, NEAR],
      [R, 0, RIVER_Z0],
      [L, 0, RIVER_Z0],
    ],
    shade(light, 130, 25, 24),
  );
}
