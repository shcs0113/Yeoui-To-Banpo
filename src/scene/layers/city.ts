import { fillPoly } from '../draw';
import { type Light, shade } from '../lighting';
import { type View, inView, project } from '../projection';
import { makeRandom } from '../random';

interface Building {
  x: number; // 가운데 위치
  z: number; // 깊이 (강 건너편)
  w: number; // 폭
  d: number; // 깊이 방향 두께
  h: number; // 높이
  hue: number;
  windows: readonly (readonly [u: number, v: number])[]; // 창문 위치 (건물 앞면 비율 0~1)
}

// 강 건너편 건물들: 시드 난수로 한 번만 만들어 둔다
const BUILDINGS: readonly Building[] = (() => {
  const rnd = makeRandom(11);
  const list: Building[] = [];
  for (let x = -3000; x < 11000; x += 30 + rnd() * 35) {
    const h = 15 + rnd() * rnd() * 140; // rnd*rnd: 낮은 건물이 많고 고층은 드물게
    const windows: [number, number][] = [];
    for (let i = 0; i < Math.min(16, 2 + h / 8); i++) {
      if (rnd() < 0.6) windows.push([0.12 + rnd() * 0.76, 0.1 + rnd() * 0.82]);
    }
    list.push({
      x,
      z: 1100 + rnd() * 600,
      w: 18 + rnd() * 40,
      d: 15 + rnd() * 25,
      h,
      hue: 220 + rnd() * 20,
      windows,
    });
  }
  // 먼 것부터 그려야 가까운 건물이 앞을 덮는다 (화가 알고리즘)
  return list.sort((a, b) => b.z - a.z);
})();

export function drawCity(ctx: CanvasRenderingContext2D, view: View, light: Light) {
  const lightsOn = light.night > 0.02;
  for (const b of BUILDINGS) {
    if (!inView(view, b.x, b.z, b.w)) continue;
    const x0 = b.x - b.w / 2;
    const x1 = b.x + b.w / 2;

    // 옆면: 카메라가 건물 왼쪽에 있으면 왼쪽 면이, 오른쪽에 있으면 오른쪽 면이 보인다
    const sideX = view.camX < x0 ? x0 : view.camX > x1 ? x1 : null;
    if (sideX !== null) {
      fillPoly(
        ctx,
        view,
        [
          [sideX, 0, b.z],
          [sideX, b.h, b.z],
          [sideX, b.h, b.z + b.d],
          [sideX, 0, b.z + b.d],
        ],
        shade(light, b.hue, 15, 19, b.z),
      );
    }

    // 앞면
    fillPoly(
      ctx,
      view,
      [
        [x0, 0, b.z],
        [x1, 0, b.z],
        [x1, b.h, b.z],
        [x0, b.h, b.z],
      ],
      shade(light, b.hue, 18, 27, b.z),
    );

    // 창문 불빛: 밤이 되면 켜진다
    if (lightsOn) {
      const size = Math.max(1.2, (view.focal * 1.6) / b.z);
      ctx.fillStyle = `rgba(255,212,140,${light.night * 0.85})`;
      for (const [u, v] of b.windows) {
        const [wx, wy] = project(view, [x0 + u * b.w, v * b.h, b.z]);
        ctx.fillRect(wx, wy, size, size);
      }
    }
  }
}
