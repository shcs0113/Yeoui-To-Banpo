import { type Light } from '../lighting';
import { type View, project } from '../projection';
import { hash01 } from '../random';

const FALL_H = 12; // 떨어지기 시작하는 높이 (m)
const SPEED = 8; // 떨어지는 속도 (m/s)
const WIND = 0.18; // 기울기: 1m 떨어질 때 옆으로 0.18m
const DROP_LEN = 0.4; // 빗줄기 길이 (m)
const DROP_W = 0.008; // 빗줄기 굵기 (m)
const ALPHA = 0.24; // 빗줄기 진하기 (밤엔 더 연하게)
const DENSITY = 0.13; // 칸 크기 = 깊이 * DENSITY (클수록 비가 적다)
// 깊이 띠: 멀수록 칸을 넓게 잡아서 화면에서 보이는 빗줄기 밀도가 비슷하게 (눈과 같은 방식)
const BANDS: readonly (readonly [number, number])[] = [
  [4, 7],
  [7, 11],
  [11, 17],
  [17, 26],
  [26, 40],
];

// 내리는 비: 짧은 사선. 장면에 고정된 칸마다 한 줄씩, 계속 위에서 다시 떨어진다
// zMin ~ zMax 깊이에 있는 것만 (자전거 앞뒤로 나눠 그리려고)
export function drawRain(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  time: number,
  zMin: number,
  zMax: number,
) {
  ctx.strokeStyle = `rgba(215,228,245,${ALPHA - light.night * 0.12})`;
  ctx.lineCap = 'round';
  BANDS.forEach(([z0, z1], band) => {
    if (z1 <= zMin || z0 >= zMax) return; // 이 띠는 이번 구간과 안 겹친다
    const cell = z1 * DENSITY;
    const half = ((view.width / 2) * z1) / view.focal + 3; // 기울어 들어오는 것까지 넉넉히
    const c0 = Math.floor((view.camX - half) / cell);
    const c1 = Math.ceil((view.camX + half) / cell);
    for (let c = c0; c <= c1; c++) {
      const n = c * 11 + band * 100019; // 띠마다 다른 난수가 나오게
      const z = z0 + hash01(n * 7.3) * (z1 - z0);
      if (z < zMin || z >= zMax) continue;
      const speed = SPEED * (0.85 + hash01(n * 1.7) * 0.3);
      const phase = hash01(n * 9.1) * 100;
      const y = FALL_H - ((time * speed + phase * FALL_H) % FALL_H);
      const x = c * cell - (FALL_H - y) * WIND; // 떨어진 만큼 옆으로
      const [x0, y0] = project(view, [x, y, z]);
      const [x1, y1] = project(view, [x - DROP_LEN * WIND, y - DROP_LEN, z]);
      ctx.lineWidth = Math.max(0.6, (view.focal / z) * DROP_W);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  });
  ctx.lineCap = 'butt'; // 다른 레이어에 영향 주지 않게 되돌린다
}
