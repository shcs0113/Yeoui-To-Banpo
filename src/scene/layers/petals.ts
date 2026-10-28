import { type Light, shade } from '../lighting';
import { type View, project } from '../projection';
import { hash01 } from '../random';

const PETAL_HUE = 345; // 벚꽃 분홍
const PETAL_SAT = 60;
const PETAL_LIGHTNESS = [85, 90, 94] as const; // 연분홍 ~ 거의 흰색

const CELL = 1.2; // 흩날리는 꽃잎 하나가 맡는 칸 (m)
const FALL_H = 6; // 떨어지기 시작하는 높이
const NEAR_Z = 6.5; // 이보다 가까우면 너무 커 보여서 안 그린다
const FAR_Z = 19; // 강 바로 앞까지

// 흩날리는 꽃잎: 낙엽보다 작고 가볍게, 떨어지는 동안 바람에 옆으로 많이 흘러간다
// zMin ~ zMax 깊이에 있는 것만 (자전거 앞뒤로 나눠 그리려고)
export function drawFallingPetals(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  time: number,
  zMin: number,
  zMax: number,
) {
  const half = ((view.width / 2) * FAR_Z) / view.focal + 8; // 옆으로 흘러오는 것까지 넉넉히
  const c0 = Math.floor((view.camX - half) / CELL);
  const c1 = Math.ceil((view.camX + half) / CELL);
  for (let c = c0; c <= c1; c++) {
    if (hash01(c * 3.7) > 0.85) continue; // 칸의 85%만
    const z = NEAR_Z + hash01(c * 7.1) * (FAR_Z - NEAR_Z);
    if (z < zMin || z >= zMax) continue;
    const speed = 0.35 + hash01(c * 1.9) * 0.35; // 떨어지는 속도 (m/s), 낙엽보다 느리게
    const phase = hash01(c * 9.7) * 100;
    const t = (time * speed + phase) % (FALL_H + 0.5); // 떨어진 거리
    const y = FALL_H - t;
    if (y < 0) continue; // 바닥에 닿은 뒤 잠깐 쉬었다가 다시 위에서
    const x = c * CELL + Math.sin(time * 1.1 + phase) * 1.0 + t * 1.2; // 흔들림 + 떨어질수록 옆으로
    const [sx, sy] = project(view, [x, y, z]);
    const k = view.focal / z; // 1m가 화면에서 몇 px인지
    const l = PETAL_LIGHTNESS[Math.floor(hash01(c * 5.3) * PETAL_LIGHTNESS.length)];
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(time * 1.6 + phase);
    ctx.scale(1, 0.4 + 0.6 * Math.abs(Math.cos(time * 2.5 + phase))); // 뒤집히는 느낌
    ctx.fillStyle = shade(light, PETAL_HUE, PETAL_SAT, l);
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.06 * k, 0.04 * k, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 잔디에 떨어진 꽃잎: 움직이지 않는 작은 타원들. perStep: 0.45m마다 몇 장
export function drawFallenPetals(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  zMin: number,
  zMax: number,
  perStep: number,
) {
  const step = 0.45;
  const half = ((view.width / 2) * zMax) / view.focal + 2;
  const i0 = Math.floor((view.camX - half) / step);
  const i1 = Math.ceil((view.camX + half) / step);
  for (let i = i0; i <= i1; i++) {
    for (let j = 0; j < perStep; j++) {
      const n = i * 5 + j;
      const z = zMin + hash01(n * 2.9) * (zMax - zMin);
      const x = i * step + hash01(n * 4.3) * step;
      const [sx, sy] = project(view, [x, 0.01, z]);
      const k = view.focal / z;
      const l = PETAL_LIGHTNESS[Math.floor(hash01(n * 6.1) * PETAL_LIGHTNESS.length)];
      ctx.fillStyle = shade(light, PETAL_HUE, PETAL_SAT, l);
      ctx.beginPath();
      ctx.ellipse(sx, sy, 0.05 * k, 0.022 * k, hash01(n * 8.3) - 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
