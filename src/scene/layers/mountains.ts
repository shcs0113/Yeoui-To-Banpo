import { fillPoly } from '../draw';
import { type Light, shade } from '../lighting';
import { CAM_Y, type View, project } from '../projection';

const MOUNTAIN_Z = 9000; // 아주 먼 산 능선
const NAMSAN = { x: 4300, z: 3200, top: 243 }; // 남산 (중간 거리)
const TOWER_TOP = 440;

export function drawMountains(ctx: CanvasRenderingContext2D, view: View, light: Light) {
  drawRidge(ctx, view, light);
  drawNamsan(ctx, view, light);
}

// 먼 능선: 화면 x를 왼쪽부터 8px씩 훑으며 사인파 두 개를 겹친 높이로 선을 긋는다
function drawRidge(ctx: CanvasRenderingContext2D, view: View, light: Light) {
  const { width, horizon, focal, camX } = view;
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  for (let sx = 0; sx <= width + 8; sx += 8) {
    const worldX = camX + ((sx - width / 2) * MOUNTAIN_Z) / focal; // 화면 x -> 장면 x (투영의 역산)
    const height = 300 + 260 * Math.sin(worldX / 2300) + 160 * Math.sin(worldX / 900 + 1.3);
    ctx.lineTo(sx, horizon - (focal * (height - CAM_Y)) / MOUNTAIN_Z);
  }
  ctx.lineTo(width, horizon);
  ctx.closePath();
  ctx.fillStyle = shade(light, 230, 18, 30, MOUNTAIN_Z);
  ctx.fill();
}

// 남산 + N서울타워. 밤엔 꼭대기에 분홍 불빛
function drawNamsan(ctx: CanvasRenderingContext2D, view: View, light: Light) {
  const { x, z, top } = NAMSAN;
  fillPoly(
    ctx,
    view,
    [
      [x - 900, 0, z],
      [x - 300, 200, z],
      [x, top, z],
      [x + 400, 190, z],
      [x + 1100, 0, z],
    ],
    shade(light, 150, 15, 22, z),
  );
  fillPoly(
    ctx,
    view,
    [
      [x - 6, top, z],
      [x + 6, top, z],
      [x + 3, TOWER_TOP, z],
      [x - 3, TOWER_TOP, z],
    ],
    shade(light, 220, 8, 70, z),
  );
  fillPoly(
    ctx,
    view,
    [
      [x - 14, 400, z],
      [x + 14, 400, z],
      [x + 14, 420, z],
      [x - 14, 420, z],
    ],
    shade(light, 220, 8, 75, z),
  );
  if (light.night > 0) {
    const [tx, ty] = project(view, [x, 425, z]);
    ctx.fillStyle = `rgba(255,120,200,${light.night})`;
    ctx.beginPath();
    ctx.arc(tx, ty, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
