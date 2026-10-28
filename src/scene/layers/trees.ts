import { type Light, shade } from '../lighting';
import { type View, inView, project } from '../projection';
import { hash01, makeRandom } from '../random';
import { MAPLE_HUES } from './leaves';
import type { Theme } from '../../state/types';

interface Tree {
  x: number;
  z: number; // 자전거길 뒤 둔치 (16.5 ~ 18.5)
  h: number; // 높이 (m)
  hue: number;
  maple: boolean; // 가을에 단풍나무로 그릴 나무 (나머지는 가을에도 상록수, 겨울엔 전부 상록수)
  mapleHue: number; // 단풍 색
}

const EVERGREEN_SHARE = 0.35; // 가을에도 초록으로 남는 상록수 비율

// 둔치의 상록수(침엽수). 작게, 듬성듬성
const TREES: readonly Tree[] = (() => {
  const rnd = makeRandom(23);
  const kind = makeRandom(77); // 나무 종류는 따로 뽑는다 (rnd를 더 부르면 나무 위치가 전부 바뀐다)
  const list: Tree[] = [];
  for (let x = -800; x < 7600; x += 13 + rnd() * 16) {
    list.push({
      x,
      z: 16.5 + rnd() * 2,
      h: 2.2 + rnd() * 1.1,
      hue: 95 + rnd() * 40,
      maple: kind() >= EVERGREEN_SHARE,
      mapleHue: MAPLE_HUES[Math.floor(hash01(Math.round(x * 10)) * MAPLE_HUES.length)],
    });
  }
  return list.sort((a, b) => b.z - a.z); // 먼 나무부터
})();

export function drawTrees(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  theme: Theme = 'summer',
) {
  for (const t of TREES) {
    if (!inView(view, t.x, t.z, 4)) continue;
    if (theme === 'autumn' && t.maple) drawMaple(ctx, view, light, t);
    else drawTree(ctx, view, light, t, theme === 'winter');
  }
}

// 나무는 면 하나하나를 3D로 만들지 않고, 밑동 위치만 투영한 뒤 화면 크기로 그린다 (빌보드)
// snowy: 겨울이면 단마다 위쪽에 눈을 얹는다
function drawTree(ctx: CanvasRenderingContext2D, view: View, light: Light, t: Tree, snowy = false) {
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
    if (snowy) drawSnowCap(ctx, light, bx, yb, yt, w, i === 2);
  }
}

// 삼각형 한 단 위쪽에 쌓인 눈: 꼭대기에서 내려오다 아래 끝이 들쭉날쭉 (흘러내린 눈)
function drawSnowCap(
  ctx: CanvasRenderingContext2D,
  light: Light,
  bx: number,
  yb: number,
  yt: number,
  w: number,
  top: boolean,
) {
  const h = yb - yt; // 이 단의 높이 (px)
  const d = top ? 0.55 : 0.42; // 꼭대기에서 어디까지 눈이 덮나 (맨 위 단은 더 많이)
  const yc = yt + h * d; // 눈이 끝나는 높이
  const wc = w * d; // 그 높이에서 삼각형 반 폭
  ctx.fillStyle = shade(light, 210, 30, 94);
  ctx.beginPath();
  ctx.moveTo(bx, yt);
  ctx.lineTo(bx + wc, yc);
  // 아래 끝: 오른쪽에서 왼쪽으로 가며 아래, 위 번갈아
  const n = 4;
  for (let j = 1; j < n; j++) {
    const x = bx + wc - (2 * wc * j) / n;
    ctx.lineTo(x, yc + (j % 2 === 1 ? h * 0.1 : -h * 0.04));
  }
  ctx.lineTo(bx - wc, yc);
  ctx.closePath();
  ctx.fill();
}

// 단풍나무: 둥근 수관을 가로 띠 3개로 (위 밝게 -> 아래 어둡게)
function drawMaple(ctx: CanvasRenderingContext2D, view: View, light: Light, t: Tree) {
  const k = view.focal / t.z;
  const [bx, by] = project(view, [t.x, 0, t.z]);
  const H = t.h * 1.05 * k;
  const hue = t.mapleHue;

  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath();
  ctx.ellipse(bx, by, H * 0.34, H * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // 줄기
  ctx.fillStyle = shade(light, 22, 30, 20);
  ctx.beginPath();
  ctx.moveTo(bx - 0.08 * k, by);
  ctx.lineTo(bx + 0.08 * k, by);
  ctx.lineTo(bx + 0.04 * k, by - H * 0.5);
  ctx.lineTo(bx - 0.04 * k, by - H * 0.5);
  ctx.closePath();
  ctx.fill();

  // 수관: 타원 안쪽만 칠하도록 잘라 두고(clip), 위에서부터 띠를 겹쳐 칠한다
  const cy = by - H * 0.68;
  const rx = H * 0.28;
  const ry = H * 0.3;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(bx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  const lightness = [54, 45, 36];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = shade(light, hue + (2 - i) * 3, 80 - i * 4, lightness[i]);
    const y0 = cy - ry + (i * 2 * ry) / 3; // 이 띠가 시작하는 높이
    ctx.beginPath();
    ctx.ellipse(bx, y0 + ry, rx * 1.6, ry, 0, Math.PI, Math.PI * 2); // 띠 윗선을 살짝 둥글게
    ctx.rect(bx - rx, y0 + ry, rx * 2, ry * 2); // 그 아래는 전부 채운다 (다음 띠가 덮는다)
    ctx.fill();
  }
  ctx.restore();
}
