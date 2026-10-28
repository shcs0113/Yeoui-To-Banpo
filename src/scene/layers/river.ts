import { mixRGB, rgba } from '../color';
import { fillPoly } from '../draw';
import { type Light, shade } from '../lighting';
import { NEAR, type View, project } from '../projection';
import { RIPPLE_ROWS, rippleXs, rippleZ } from '../ripples';
import type { Theme } from '../../state/types';

export const WATER_Y = -1; // 강물 높이 (둔치보다 1m 낮다)
export const RIVER_Z0 = 19; // 강이 시작하는 깊이 (자전거길 바로 뒤)
export const RIVER_Z1 = 1000; // 강 건너편 둔치
const FAR_BANK_Z = 1100; // 건너편 도시가 시작하는 깊이
const SPAN = 20000; // 좌우로 충분히 넓게

type HSL = readonly [number, number, number];
// 계절마다 땅 색 [색상, 채도, 밝기]: 내 쪽 잔디, 건너편 둔치
const GROUND: Record<Theme, { near: HSL; far: HSL }> = {
  summer: { near: [130, 25, 24], far: [140, 12, 24] },
  autumn: { near: [44, 38, 29], far: [38, 18, 26] }, // 마른 황갈색
  winter: { near: [212, 22, 80], far: [215, 14, 66] }, // 푸른빛 도는 눈밭
};

// 앞에서부터: 내 쪽 잔디, 강물(+ 반짝임), 건너편 둔치. 땅 색은 계절 테마에 따라
export function drawRiver(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  time: number,
  theme: Theme = 'summer',
) {
  const ground = GROUND[theme];
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
    shade(light, ...ground.far, 1050),
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

  // 물결 반짝임: 장면에 고정된 점이라 다른 풍경과 같은 원근 속도로 흘러간다. 시간에 따라 살짝 일렁임
  ctx.fillStyle = `rgba(255,255,255,${0.06 + (1 - light.night) * 0.08})`;
  for (let row = 0; row < RIPPLE_ROWS; row++) {
    const z = rippleZ(row);
    const half = ((view.width / 2) * z) / view.focal + 10; // 화면 폭이 그 깊이에서 몇 m인지 (+여유)
    for (const x of rippleXs(row, view.camX - half, view.camX + half)) {
      const [sx, sy] = project(view, [x + Math.sin(time + x) * 3, -1, z]);
      ctx.fillRect(sx, sy, Math.max(1, (view.focal / z) * 4), 1);
    }
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
    shade(light, ...ground.near),
  );
}
