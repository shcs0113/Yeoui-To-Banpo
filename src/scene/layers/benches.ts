import { fillPoly, strokeLine } from '../draw';
import { type Light, shade } from '../lighting';
import { type Vec3, type View, inView, project } from '../projection';
import { ROUTE_END_X } from '../../constants/course';

// 휴식 지점 벤치: 길 뒤 잔디띠에 나무 벤치 + 공원 둥근 등
const BENCH_XS = [5, ROUTE_END_X + 5]; // 여의나루, 반포 휴식 지점 옆
const BENCH_Z = 15.4; // 벤치 앞면 깊이
const HALF = 0.9; // 벤치 반 길이 (m)
const LAMP_OFFSET = 2.2; // 벤치 가운데에서 등까지 (m)
const LAMP_Z = BENCH_Z + 0.3;
const POLE_H = 2.45; // 기둥 높이
const GLOBE_Y = 2.65; // 둥근 갓 가운데 높이
const GLOBE_R = 0.2; // 둥근 갓 반지름
const WARM = '255,200,130'; // 따뜻한 주황 빛 (자전거길 LED와 구분)

type Poly = Vec3[];
// 정면을 보는 세로 사각형
const face = (x0: number, x1: number, y0: number, y1: number, z: number): Poly => [
  [x0, y0, z],
  [x1, y0, z],
  [x1, y1, z],
  [x0, y1, z],
];
// 바닥과 나란한 가로 사각형
const flat = (x0: number, x1: number, y: number, z0: number, z1: number): Poly => [
  [x0, y, z0],
  [x1, y, z0],
  [x1, y, z1],
  [x0, y, z1],
];

// 바닥 빛 -> 벤치 -> 등 (빛 웅덩이가 벤치 밑에 깔리게)
export function drawBenches(ctx: CanvasRenderingContext2D, view: View, light: Light) {
  for (const bx of BENCH_XS) {
    if (!inView(view, bx, BENCH_Z, 5)) continue;
    const lampX = bx + LAMP_OFFSET;
    if (light.night > 0) drawPool(ctx, view, (bx + lampX) / 2, light.night);
    drawBench(ctx, view, light, bx);
    drawLamp(ctx, view, light, lampX, bx);
  }
}

// 길 쪽을 보는 나무 벤치: 뒤 다리, 등받이 -> 좌판 -> 앞 다리
function drawBench(ctx: CanvasRenderingContext2D, view: View, light: Light, bx: number) {
  const wood = shade(light, 28, 45, 42);
  const woodTop = shade(light, 30, 45, 52);
  const iron = shade(light, 220, 10, 20);
  const fill = (ps: Poly, c: string) => fillPoly(ctx, view, ps, c);
  const legs = [bx - HALF + 0.1, bx + HALF - 0.1];
  const back = BENCH_Z + 0.45;
  const front = BENCH_Z + 0.05;

  fill(
    flat(bx - HALF - 0.1, bx + HALF + 0.1, 0.01, BENCH_Z - 0.05, BENCH_Z + 0.6),
    'rgba(0,0,0,.18)',
  );
  for (const x of legs) fill(face(x - 0.03, x + 0.03, 0, 0.85, back), iron);
  fill(face(bx - HALF, bx + HALF, 0.55, 0.65, back), wood);
  fill(face(bx - HALF, bx + HALF, 0.7, 0.8, back), wood);
  fill(flat(bx - HALF, bx + HALF, 0.45, front, back), woodTop);
  fill(face(bx - HALF, bx + HALF, 0.4, 0.45, front), wood);
  for (const x of legs) fill(face(x - 0.03, x + 0.03, 0, 0.42, front), iron);
}

// 공원 둥근 등: 기둥 + 받침 + 둥근 갓, 밤에는 갓과 벤치 쪽으로 빛이 번진다
function drawLamp(ctx: CanvasRenderingContext2D, view: View, light: Light, x: number, bx: number) {
  const metal = shade(light, 210, 10, 22);
  const n = light.night;

  ctx.lineCap = 'round';
  strokeLine(ctx, view, [x, 0, LAMP_Z], [x, POLE_H, LAMP_Z], metal, 0.08);
  ctx.lineCap = 'butt'; // 다른 레이어에 영향 주지 않게 되돌린다
  fillPoly(ctx, view, face(x - 0.12, x + 0.12, 0, 0.25, LAMP_Z - 0.01), metal);

  const [gx, gy] = project(view, [x, GLOBE_Y, LAMP_Z]);
  ctx.fillStyle = n > 0 ? `rgba(255,228,190,${0.4 + 0.6 * n})` : shade(light, 40, 8, 82);
  ctx.beginPath();
  ctx.arc(gx, gy, (view.focal * GLOBE_R) / LAMP_Z, 0, Math.PI * 2);
  ctx.fill();
  fillPoly(ctx, view, face(x - 0.08, x + 0.08, POLE_H - 0.01, POLE_H + 0.05, LAMP_Z - 0.02), metal);

  if (n > 0) {
    drawGlow(ctx, view, [x, GLOBE_Y, LAMP_Z - 0.05], 1.1, 0.85 * n); // 갓 번짐
    drawGlow(ctx, view, [bx, 0.6, BENCH_Z], 2.2, 0.12 * n); // 벤치를 비추는 빛
  }
}

// 동그란 빛 번짐. 'lighter'로 더해서 아래 그림(벤치 나무)이 밝아 보이게 한다
function drawGlow(
  ctx: CanvasRenderingContext2D,
  view: View,
  p: Vec3,
  radius: number,
  alpha: number,
) {
  const [x, y] = project(view, p);
  const r = (view.focal * radius) / p[2];
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${WARM},${alpha})`);
  g.addColorStop(0.3, `rgba(${WARM},${alpha * 0.35})`);
  g.addColorStop(1, `rgba(${WARM},0)`);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// 잔디 위 납작한 빛 웅덩이: 동그란 그라데이션을 세로로 눌러서 원근을 낸다
function drawPool(ctx: CanvasRenderingContext2D, view: View, x: number, night: number) {
  const R = 2.8; // 빛 웅덩이 반지름 (m)
  const [cx, cy] = project(view, [x, 0.02, LAMP_Z - 0.2]);
  const [, yNear] = project(view, [x, 0.02, LAMP_Z - R * 0.6]);
  const [, yFar] = project(view, [x, 0.02, LAMP_Z + R * 0.6]);
  const rx = (view.focal * R) / LAMP_Z;
  const ry = Math.max(2, (yNear - yFar) / 2);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(${WARM},${0.42 * night})`);
  g.addColorStop(0.5, `rgba(${WARM},${0.16 * night})`);
  g.addColorStop(1, `rgba(${WARM},0)`);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  ctx.fillStyle = g;
  ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}