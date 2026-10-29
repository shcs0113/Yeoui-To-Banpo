import { type Light, shade } from '../lighting';
import { type View, project } from '../projection';
import { hash01 } from '../random';

// 단풍 색 (빨강, 주황, 노랑)
export const MAPLE_HUES = [4, 14, 26, 38] as const;

const CELL = 1; // 떨어지는 낙엽 하나가 맡는 칸 (m)
const FALL_H = 5.5; // 떨어지기 시작하는 높이
const NEAR_Z = 6.5; // 이보다 가까우면 너무 커 보여서 안 그린다
const FAR_Z = 19; // 강 바로 앞까지
const WIND = 0.25; // 바람에 밀리는 속도 (m/s)

// 떨어지는 낙엽: 장면에 고정된 칸마다 하나씩, 시간에 따라 떨어지고 흔들리며 돈다
// zMin ~ zMax 깊이에 있는 것만 (자전거 앞뒤로 나눠 그리려고)
export function drawFallingLeaves(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  time: number,
  zMin: number,
  zMax: number,
) {
  const half = ((view.width / 2) * FAR_Z) / view.focal + 4; // 가장 먼 깊이에서 화면 반 폭 (m)
  const c0 = Math.floor((view.camX - half) / CELL);
  const c1 = Math.ceil((view.camX + half) / CELL);
  for (let c = c0; c <= c1; c++) {
    if (hash01(c * 3.1) > 0.6) continue; // 칸의 60%만
    const z = NEAR_Z + hash01(c * 7.7) * (FAR_Z - NEAR_Z);
    if (z < zMin || z >= zMax) continue;
    const speed = 0.55 + hash01(c * 1.3) * 0.5; // 떨어지는 속도 (m/s)
    const phase = hash01(c * 9.2) * 100;
    const fallen = (time * speed + phase) % (FALL_H + 0.5); // 이번에 떨어진 거리 (바닥에 닿으면 0부터 다시)
    const y = FALL_H - fallen;
    if (y < 0) continue; // 바닥에 닿은 뒤 잠깐 쉬었다가 다시 위에서
    const sway = Math.sin(time * 1.4 + phase) * 0.7; // 좌우 흔들림
    // 바람: 떨어지는 동안만 옆으로 밀린다 (time에 곱하면 시간이 갈수록 칸에서 계속 멀어져 화면 밖으로 사라진다)
    const wind = (fallen / speed) * WIND;
    const x = c * CELL + sway + wind;
    const [sx, sy] = project(view, [x, y, z]);
    const k = view.focal / z; // 1m가 화면에서 몇 px인지
    const hue = MAPLE_HUES[Math.floor(hash01(c * 5.5) * MAPLE_HUES.length)];
    const color = shade(light, hue, 78, 50);
    drawLeaf(ctx, sx, sy, 0.1 * k, time * 2.2 + phase, Math.cos(time * 3 + phase), color);
  }
}

// 바닥에 떨어진 낙엽: 움직이지 않는 납작한 타원들
export function drawFallenLeaves(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  zMin: number,
  zMax: number,
) {
  const step = 0.55; // 0.55m마다 3장
  const half = ((view.width / 2) * zMax) / view.focal + 2;
  const i0 = Math.floor((view.camX - half) / step);
  const i1 = Math.ceil((view.camX + half) / step);
  for (let i = i0; i <= i1; i++) {
    for (let j = 0; j < 3; j++) {
      const n = i * 3 + j;
      const z = zMin + hash01(n * 2.3) * (zMax - zMin);
      const x = i * step + hash01(n * 4.1) * step;
      const [sx, sy] = project(view, [x, 0.01, z]);
      const k = view.focal / z;
      const hue = MAPLE_HUES[Math.floor(hash01(n * 6.6) * MAPLE_HUES.length)];
      ctx.fillStyle = shade(light, hue, 60, 38 + hash01(n) * 10);
      ctx.beginPath();
      ctx.ellipse(sx, sy, 0.08 * k, 0.03 * k, hash01(n * 8.8) - 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// 잎 하나: 양끝이 뾰족한 잎 모양. flip(-1 ~ 1)으로 세로를 눌러서 뒤집히는 느낌
function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
  flip: number,
  color: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(1, 0.35 + 0.65 * Math.abs(flip));
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.quadraticCurveTo(0, -r * 0.8, r, 0);
  ctx.quadraticCurveTo(0, r * 0.8, -r, 0);
  ctx.fill();
  ctx.restore();
}
