import { type Light } from '../lighting';
import { type View, project } from '../projection';
import { hash01 } from '../random';

const FALL_H = 10; // 떨어지기 시작하는 높이 (m)
const WIND = 0.15; // 바람에 밀리는 속도 (m/s)
const DENSITY = 0.03; // 칸 크기 = 깊이 * DENSITY (작을수록 눈이 많다)
// 깊이 띠: 멀수록 칸을 넓게 잡아서, 화면에서 보이는 눈송이 밀도가 깊이와 상관없이 비슷하게
const BANDS: readonly (readonly [number, number])[] = [
  [5, 8],
  [8, 12],
  [12, 18],
  [18, 27],
  [27, 40],
];

// 내리는 눈: 장면에 고정된 칸마다 하나씩. 천천히 떨어지며 좌우로 흔들린다
// zMin ~ zMax 깊이에 있는 것만 (자전거 앞뒤로 나눠 그리려고)
export function drawSnowfall(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  time: number,
  zMin: number,
  zMax: number,
) {
  ctx.fillStyle = `rgba(255,255,255,${0.95 - light.night * 0.35})`; // 밤엔 조금 어둡게
  BANDS.forEach(([z0, z1], band) => {
    if (z1 <= zMin || z0 >= zMax) return; // 이 띠는 이번 구간과 안 겹친다
    const cell = z1 * DENSITY;
    const half = ((view.width / 2) * z1) / view.focal + 1; // 띠 안쪽 끝에서 화면 반 폭 (m)
    const c0 = Math.floor((view.camX - half) / cell);
    const c1 = Math.ceil((view.camX + half) / cell);
    for (let c = c0; c <= c1; c++) {
      const n = c * 7 + band * 100003; // 띠마다 다른 난수가 나오게
      const z = z0 + hash01(n * 7.7) * (z1 - z0);
      if (z < zMin || z >= zMax) continue;
      const speed = 0.6 + hash01(n * 1.3) * 0.5; // 떨어지는 속도 (m/s)
      const phase = hash01(n * 9.2) * 100;
      const fallen = (time * speed + phase) % FALL_H; // 이번에 떨어진 거리 (바닥에 닿으면 0부터 다시)
      const y = FALL_H - fallen;
      // 바람: 떨어지는 동안만 옆으로 밀린다 (time에 곱하면 시간이 갈수록 칸에서 계속 멀어져 화면 밖으로 사라진다)
      const wind = (fallen / speed) * WIND;
      const x = c * cell + Math.sin(time * 0.9 + phase) * 0.5 + wind; // 흔들림 + 바람
      const [sx, sy] = project(view, [x, y, z]);
      const r = Math.max(0.8, (view.focal / z) * 0.035); // 지름 7cm, 멀어도 최소 0.8px
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
