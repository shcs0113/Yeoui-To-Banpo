import { type Light, shade } from '../lighting';
import { type View, inView, project } from '../projection';
import { makeRandom } from '../random';

interface Tree {
  x: number;
  z: number; // 자전거길 뒤 둔치 (16.5 ~ 18.5)
  h: number; // 높이 (m)
  hue: number;
}

// 둔치의 상록수(침엽수). 작게, 듬성듬성
const TREES: readonly Tree[] = (() => {
  const rnd = makeRandom(23);
  const list: Tree[] = [];
  for (let x = -800; x < 7600; x += 13 + rnd() * 16) {
    list.push({
      x,
      z: 16.5 + rnd() * 2,
      h: 2.2 + rnd() * 1.1,
      hue: 95 + rnd() * 40,
    });
  }
  return list.sort((a, b) => b.z - a.z); // 먼 나무부터
})();

export function drawTrees(ctx: CanvasRenderingContext2D, view: View, light: Light) {
  for (const t of TREES) {
    if (!inView(view, t.x, t.z, 4)) continue;
    drawTree(ctx, view, light, t);
  }
}

// 나무는 면 하나하나를 3D로 만들지 않고, 밑동 위치만 투영한 뒤 화면 크기로 그린다 (빌보드)
function drawTree(ctx: CanvasRenderingContext2D, view: View, light: Light, t: Tree) {
  const k = view.focal / t.z; // 1m가 화면에서 몇 px인지
  const [bx, by] = project(view, [t.x, 0, t.z]);
  const H = t.h * k;

  // 줄기 (위로 갈수록 가늘게)
  ctx.fillStyle = shade(light, 25, 28, 22);
  ctx.beginPath();
  ctx.moveTo(bx - 0.07 * k, by);
  ctx.lineTo(bx + 0.07 * k, by);
  ctx.lineTo(bx + 0.035 * k, by - H * 0.55);
  ctx.lineTo(bx - 0.035 * k, by - H * 0.55);
  ctx.closePath();
  ctx.fill();

  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath();
  ctx.ellipse(bx, by, H * 0.32, H * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // 잎: 삼각형 3단 (아래 두 단은 어둡게, 맨 위는 밝게)
  const dark = shade(light, t.hue, 32, 20);
  const mid = shade(light, t.hue, 38, 28);
  for (let i = 0; i < 3; i++) {
    const w = H * (0.26 - i * 0.06);
    const yb = by - H * (0.3 + i * 0.22);
    const yt = yb - H * 0.34;
    ctx.fillStyle = i === 2 ? mid : dark;
    ctx.beginPath();
    ctx.moveTo(bx - w, yb);
    ctx.lineTo(bx + w, yb);
    ctx.lineTo(bx, yt);
    ctx.closePath();
    ctx.fill();
  }
}
