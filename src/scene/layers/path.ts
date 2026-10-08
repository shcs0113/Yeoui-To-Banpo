import { fillPoly, strokeLine } from '../draw';
import { type Light, shade } from '../lighting';
import { type View, project } from '../projection';

export const PATH_NEAR_Z = 8; // 자전거길 앞 가장자리
export const PATH_FAR_Z = 14; // 자전거길 뒤 가장자리 (가로등 줄)
const CENTER_Z = 11; // 가운데 점선

// 가로등: 한강 자전거길 LED 가로등 (기둥 끝이 꺾여 LED 바가 길 쪽으로)
// 크기는 LAMP_H 하나로 정하고, 나머지 치수는 그 비율로 따라간다
const LAMP_H = 4; // LED 머리 높이 (m)
const BASE_H = 5.9; // 굵기, 빛 크기 같은 세부 치수를 처음 잡았던 기준 높이
const SCALE = LAMP_H / BASE_H;
const LAMP_GAP = 35; // 가로등 간격 (m)
const LAMP_Z = PATH_FAR_Z;
const BEND_Y = LAMP_H * 0.9; // 기둥이 꺾이는 높이
const HEAD_Y = LAMP_H;
const HEAD_X = LAMP_H * 0.25; // 기둥에서 머리 끝까지 (코스 방향)
const LIGHT_X = HEAD_X * 0.73; // 기둥에서 LED 가운데까지: 빛줄기와 바닥 빛의 중심
const LED_RGB = '225,238,255'; // 차가운 하얀 LED 빛
const BEAM_ALPHA = 0.16; // 빛줄기 진하기
const POOL_ALPHA = 0.22; // 바닥 빛 진하기
const POOL_Z = LAMP_Z - 2.2; // 바닥 빛 가운데 (길 위)

// 가로등 -> 길 바닥 -> 가운데 점선 -> 바닥 빛
export function drawPath(ctx: CanvasRenderingContext2D, view: View, light: Light) {
  drawLamps(ctx, view, light);

  const L = view.camX - 200;
  const R = view.camX + 200;
  fillPoly(
    ctx,
    view,
    [
      [L, 0.02, PATH_NEAR_Z],
      [R, 0.02, PATH_NEAR_Z],
      [R, 0.02, PATH_FAR_Z],
      [L, 0.02, PATH_FAR_Z],
    ],
    shade(light, 225, 8, 32),
  );

  // 점선: 6m마다 3m짜리 흰 줄. 밤엔 조금 어둡게
  const dash = `rgba(255,255,255,${0.75 - light.night * 0.35})`;
  for (let x = Math.floor((view.camX - 30) / 6) * 6; x < view.camX + 30; x += 6) {
    fillPoly(
      ctx,
      view,
      [
        [x, 0.03, CENTER_Z - 0.1],
        [x + 3, 0.03, CENTER_Z - 0.1],
        [x + 3, 0.03, CENTER_Z + 0.1],
        [x, 0.03, CENTER_Z + 0.1],
      ],
      dash,
    );
  }

  // 바닥 빛은 길을 칠한 다음에 (먼저 그리면 길 바닥에 덮인다)
  if (light.night > 0) drawLampPools(ctx, view, light);
}

// 카메라 근처 가로등 위치들 (화면 밖은 계산하지 않음). 출발 지점(여의나루)에는 없다
function lampXs(view: View): number[] {
  const xs: number[] = [];
  const first = Math.floor((view.camX - 40) / LAMP_GAP) * LAMP_GAP;
  for (let x = first; x < view.camX + 40; x += LAMP_GAP) {
    if (x !== 0) xs.push(x);
  }
  return xs;
}

// 기둥, 꺾인 목, LED 머리. 밤엔 빛줄기와 번짐
function drawLamps(ctx: CanvasRenderingContext2D, view: View, light: Light) {
  const metal = shade(light, 220, 10, 30);
  const dark = shade(light, 220, 12, 20);
  // LED: 낮엔 어두운 금속, 밤엔 하얗게 켜진다
  const led = light.night > 0 ? `rgba(235,245,255,${0.35 + light.night * 0.65})` : dark;

  ctx.lineCap = 'round'; // 꺾이는 이음새가 끊겨 보이지 않게
  for (const x of lampXs(view)) {
    const bend = [x + 0.3 * SCALE, HEAD_Y - 0.05 * SCALE, LAMP_Z] as const;
    strokeLine(ctx, view, [x, 0, LAMP_Z], [x, BEND_Y, LAMP_Z], metal, 0.1 * SCALE);
    strokeLine(ctx, view, [x, BEND_Y, LAMP_Z], bend, metal, 0.09 * SCALE);
    strokeLine(ctx, view, bend, [x + HEAD_X, HEAD_Y, LAMP_Z], dark, 0.1 * SCALE);
    strokeLine(
      ctx,
      view,
      [x + HEAD_X * 0.47, HEAD_Y - 0.06 * SCALE, LAMP_Z],
      [x + HEAD_X - 0.05 * SCALE, HEAD_Y - 0.03 * SCALE, LAMP_Z],
      led,
      0.05 * SCALE,
    );

    if (light.night > 0) drawBeam(ctx, view, x + LIGHT_X, light.night);
  }
  ctx.lineCap = 'butt'; // 다른 레이어에 영향 주지 않게 되돌린다
}

// LED 아래로 퍼지는 빛줄기(사다리꼴) + 머리의 번짐
function drawBeam(ctx: CanvasRenderingContext2D, view: View, hx: number, night: number) {
  const [lx, ly] = project(view, [hx, HEAD_Y, LAMP_Z]);
  const [ax, ay] = project(view, [hx - 0.3 * SCALE, HEAD_Y, LAMP_Z]);
  const [bx, by] = project(view, [hx - 2.6 * SCALE, 0.02, LAMP_Z - 1.5]);
  const [cx, cy] = project(view, [hx + 2.6 * SCALE, 0.02, LAMP_Z - 1.5]);

  const beam = ctx.createLinearGradient(lx, ly, lx, by);
  beam.addColorStop(0, `rgba(${LED_RGB},${BEAM_ALPHA * night})`);
  beam.addColorStop(1, `rgba(${LED_RGB},0)`);
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(lx + (lx - ax), ly);
  ctx.lineTo(cx, cy);
  ctx.lineTo(bx, by);
  ctx.closePath();
  ctx.fill();

  const r = (view.focal * 0.6 * SCALE) / LAMP_Z;
  const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
  glow.addColorStop(0, `rgba(${LED_RGB},${night})`);
  glow.addColorStop(0.35, `rgba(${LED_RGB},${night * 0.45})`);
  glow.addColorStop(1, `rgba(${LED_RGB},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
}

// 길 위의 납작한 빛 웅덩이: 동그란 그라데이션을 세로로 눌러서 원근을 낸다
function drawLampPools(ctx: CanvasRenderingContext2D, view: View, light: Light) {
  for (const x of lampXs(view)) {
    const hx = x + LIGHT_X;
    const [cx, cy] = project(view, [hx, 0.03, POOL_Z]);
    const [, yNear] = project(view, [hx, 0.03, POOL_Z - 2.2]);
    const [, yFar] = project(view, [hx, 0.03, POOL_Z + 2]);
    const rx = (view.focal * 3.4 * SCALE) / POOL_Z; // 가로 반지름 (3.4m * 크기 비율)
    const ry = Math.max(2, (yNear - yFar) / 2); // 세로 반지름 (깊이 방향 4.2m가 화면에서 얼마나 되나)

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    pool.addColorStop(0, `rgba(${LED_RGB},${POOL_ALPHA * light.night})`);
    pool.addColorStop(1, `rgba(${LED_RGB},0)`);
    ctx.fillStyle = pool;
    ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
    ctx.restore();
  }
}