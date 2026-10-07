import { fillPoly } from '../draw';
import { type Light, shade } from '../lighting';
import { type View, project } from '../projection';

export const PATH_NEAR_Z = 8; // 자전거길 앞 가장자리
export const PATH_FAR_Z = 14; // 자전거길 뒤 가장자리 (가로등 줄)
const CENTER_Z = 11; // 가운데 점선
const LAMP_GAP = 35; // 가로등 간격 (m)
const LAMP_H = 4.2;

// 가로등 -> 길 바닥 -> 가운데 점선
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
}

// 카메라 근처 가로등만 (화면 밖은 계산하지 않음). 밤엔 동그랗게 번지는 불빛
function drawLamps(ctx: CanvasRenderingContext2D, view: View, light: Light) {
  const first = Math.floor((view.camX - 40) / LAMP_GAP) * LAMP_GAP;
  for (let x = first; x < view.camX + 40; x += LAMP_GAP) {
    if (x === 0) continue; // 출발 지점(여의나루)에는 가로등이 없다
    fillPoly(
      ctx,
      view,
      [
        [x - 0.06, 0, PATH_FAR_Z],
        [x + 0.06, 0, PATH_FAR_Z],
        [x + 0.06, LAMP_H, PATH_FAR_Z],
        [x - 0.06, LAMP_H, PATH_FAR_Z],
      ],
      shade(light, 220, 10, 35),
    );
    if (light.night > 0) {
      const [lx, ly] = project(view, [x, LAMP_H, PATH_FAR_Z]);
      const r = (view.focal * 0.9) / PATH_FAR_Z;
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
      g.addColorStop(0, `rgba(255,225,160,${light.night})`);
      g.addColorStop(1, 'rgba(255,225,160,0)');
      ctx.fillStyle = g;
      ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
    }
  }
}
