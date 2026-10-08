import { fillPoly } from '../draw';
import { clamp01 } from '../color';
import { type Light, shade } from '../lighting';
import { type Vec3, type View, inView, project } from '../projection';
import type { DepthLayer } from './bridges';
import { WATER_Y } from './river';

// 한강버스: 흰 쌍동선 + 아래로 파란 그러데이션 + 옆으로 긴 통창 (로고 없이 단순화)
const LENGTH = 35; // 배 길이 (m)
export const SPEED = 8; // m/s (약 16노트)
export const LOOP_FROM = -600; // 서쪽 끝: 화면 밖에서 나타나고 사라진다
export const LOOP_TO = 6860; // 동쪽 끝: 반포대교(잠수교) 바로 앞. 잠수교 상판이 낮아 그 밑으로는 보내지 않는다
const FADE_M = 80; // 동쪽 끝 이 거리 안에서 서서히 사라지고 나타난다

export interface Boat {
  dir: 1 | -1; // 1 = 반포(동쪽)행, -1 = 여의도(서쪽)행
  z: number; // 강 위 깊이 (항로)
  offset: number; // 출발 위치 차이 (m): 같은 항로의 배끼리 간격
}

// 가까운 항로는 반포행, 먼 항로는 여의도행. 방향마다 2척
export const BOATS: readonly Boat[] = [
  { dir: 1, z: 95, offset: 0 },
  { dir: 1, z: 95, offset: 4000 },
  { dir: -1, z: 150, offset: 1800 },
  { dir: -1, z: 150, offset: 5800 },
];

// clock(초, 실제 시각)일 때 배 꼬리(선미)의 x. 실제 시각 기준이라 새로고침해도 이어진다
export function sternX(b: Boat, clock: number): number {
  const span = LOOP_TO - LOOP_FROM;
  const d = (((b.offset + clock * SPEED) % span) + span) % span; // 0 ~ span (음수 나머지 방지)
  return b.dir === 1 ? LOOP_FROM + d : LOOP_TO - d;
}

// 항로 깊이별로 "그 깊이에서 배를 그리는 함수"를 돌려준다 (다리 교각 사이에 끼워 그리기 위해)
export function boatLayers(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  clock: number,
): DepthLayer[] {
  const lanes = [...new Set(BOATS.map((b) => b.z))];
  return lanes.map((z) => ({
    z,
    draw: () => {
      for (const b of BOATS) {
        if (b.z !== z) continue;
        const x0 = sternX(b, clock);
        if (!inView(view, x0 + (b.dir * LENGTH) / 2, z, LENGTH)) continue;
        drawBoat(ctx, view, light, b, x0, clock);
      }
    },
  }));
}

function drawBoat(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  b: Boat,
  x0: number,
  clock: number,
) {
  const { z, dir } = b;
  // 동쪽 끝(잠수교 앞)에 가까울수록 투명하게: 순간이동하는 게 보이지 않게
  const eastEdge = Math.max(x0, x0 + dir * LENGTH);
  ctx.save();
  ctx.globalAlpha = clamp01((LOOP_TO - eastEdge) / FADE_M);
  // 배 기준 좌표(u: 선미 -> 선수 m, v: 수면 위 높이 m) -> 장면 좌표
  const P = (u: number, v: number): Vec3 => [x0 + dir * u, WATER_Y + v, z];
  const night = light.night;

  drawWake(ctx, view, b, x0, night);
  if (night > 0) drawReflection(ctx, view, P, night, clock);

  // 선체: 위는 흰색, 아래로 파란 그러데이션
  const [, hullTop] = project(view, P(0, 1.4));
  const [, hullBottom] = project(view, P(0, -0.3));
  const hull = ctx.createLinearGradient(0, hullTop, 0, hullBottom);
  hull.addColorStop(0, shade(light, 210, 20, 94));
  hull.addColorStop(0.45, shade(light, 205, 70, 72));
  hull.addColorStop(1, shade(light, 215, 80, 42));
  fillPoly(
    ctx,
    view,
    [P(0, -0.3), P(LENGTH - 4, -0.3), P(LENGTH, 0.9), P(LENGTH - 0.5, 1.4), P(0.3, 1.4), P(0, 1)],
    hull,
  );

  // 선실: 흰 벽, 앞이 비스듬 + 지붕 띠
  fillPoly(
    ctx,
    view,
    [P(1.5, 1.4), P(LENGTH - 5, 1.4), P(LENGTH - 8.5, 4.2), P(2.5, 4.2)],
    shade(light, 210, 15, 92),
  );
  fillPoly(
    ctx,
    view,
    [P(2.3, 4.2), P(LENGTH - 8.4, 4.2), P(LENGTH - 8.8, 4.5), P(2.8, 4.5)],
    shade(light, 210, 25, 80),
  );

  // 파노라마 통창: 낮엔 어두운 유리, 밤엔 불 켜진 창 + 창틀
  const glass = night > 0.3 ? `rgba(255,226,170,${0.55 + 0.4 * night})` : shade(light, 212, 45, 30);
  fillPoly(ctx, view, [P(3, 2), P(LENGTH - 7, 2), P(LENGTH - 8.9, 3.6), P(3.3, 3.6)], glass);
  const frame = shade(light, 210, 15, 85);
  for (let u = 6; u < LENGTH - 9; u += 3.2) {
    fillPoly(ctx, view, [P(u, 2), P(u + 0.25, 2), P(u + 0.25, 3.6), P(u, 3.6)], frame);
  }

  // 밤: 지붕 위 흰 등
  if (night > 0) {
    const [mx, my] = project(view, P(LENGTH * 0.5, 5.2));
    ctx.fillStyle = `rgba(255,255,255,${night})`;
    ctx.beginPath();
    ctx.arc(mx, my, Math.max(1.5, (view.focal * 0.25) / z), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 배 뒤 물보라: 수면 위 짧은 흰 줄 3개 (뒤로 갈수록 길고 옅게)
function drawWake(ctx: CanvasRenderingContext2D, view: View, b: Boat, x0: number, night: number) {
  const base = ctx.globalAlpha; // 배 전체 투명도(끝에서 사라지는 중)를 이어받는다
  ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.15 * (1 - night)})`;
  for (let i = 0; i < 3; i++) {
    const back = 2 + i * 3;
    const len = 10 + i * 6;
    const z = b.z + i * 2 - 2;
    const [ax, ay] = project(view, [x0 - b.dir * back, WATER_Y + 0.05, z]);
    const [bx] = project(view, [x0 - b.dir * (back + len), WATER_Y + 0.05, z]);
    ctx.globalAlpha = base * (1 - i * 0.3);
    ctx.fillRect(Math.min(ax, bx), ay, Math.abs(bx - ax), 1);
  }
  ctx.globalAlpha = base;
}

// 밤: 물에 비친 창 불빛. 아래로 갈수록 짧고 흐린 가로줄이 일렁인다
function drawReflection(
  ctx: CanvasRenderingContext2D,
  view: View,
  P: (u: number, v: number) => Vec3,
  night: number,
  clock: number,
) {
  const [ax, y] = project(view, P(4, 0));
  const [bx] = project(view, P(LENGTH - 8, 0));
  const left = Math.min(ax, bx);
  const width = Math.abs(bx - ax);
  for (let k = 0; k < 6; k++) {
    const shrink = width * k * 0.08; // 아래 줄일수록 양옆이 줄어든다
    const wobble = Math.sin(clock * 2 + k * 1.7) * 3;
    ctx.fillStyle = `rgba(255,220,160,${0.32 * night * (1 - k / 6)})`;
    ctx.fillRect(left + shrink + wobble, y + 2 + k * 3, width - shrink * 2, 1.5);
  }
}