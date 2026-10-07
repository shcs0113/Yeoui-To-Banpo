import { BRIDGES, type Bridge } from '../../constants/course';
import { fillPoly, strokeLine } from '../draw';
import { type Light, shade } from '../lighting';
import { type Vec3, type View, project } from '../projection';

const Z_START = -60; // 다리가 시작하는 깊이 (카메라 뒤쪽부터)
const Z_END = 1060; // 강 건너편까지
const SLICE = 20; // 다리를 20m씩 잘라서 먼 쪽부터 그린다
const VISIBLE_RANGE = 2600; // 이보다 멀리 있는 다리는 건너뛴다

// 다리 이름표: 전부 · 코스 위 다리만(장식용 마포대교 숨김) · 없음
export type LabelMode = 'all' | 'route' | 'none';

// 카메라에서 먼 다리부터 그려야 가까운 다리가 앞을 덮는다
export function drawBridges(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  time: number,
  labels: LabelMode,
) {
  const sorted = [...BRIDGES].sort((a, b) => Math.abs(b.x - view.camX) - Math.abs(a.x - view.camX));
  for (const b of sorted) {
    if (Math.abs(b.x - view.camX) > VISIBLE_RANGE) continue;
    drawBridge(ctx, view, light, time, b, labels);
  }
}

// 카메라가 x0~x1 범위 밖이면 그쪽 옆면이 보인다 (정면이면 null)
const visibleSide = (camX: number, x0: number, x1: number) =>
  camX < x0 ? x0 : camX > x1 ? x1 : null;

function drawBridge(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  time: number,
  b: Bridge,
  labels: LabelMode,
) {
  // 다리 양쪽 가장자리: 카메라에서 먼 쪽이 먼저
  const edges = [b.x - b.w / 2, b.x + b.w / 2].sort(
    (p, q) => Math.abs(q - view.camX) - Math.abs(p - view.camX),
  );

  if (b.island) drawIsland(ctx, view, light, b, b.island);

  // 먼 조각부터 가까운 조각 순서로: 교각 → 상판 → 난간
  for (let za = Math.floor((Z_END - SLICE) / SLICE) * SLICE; za >= Z_START; za -= SLICE) {
    const zb = Math.min(Z_END, za + SLICE);
    const pierZ = Math.round(za / b.span) * b.span;
    if (pierZ >= za && pierZ < zb && pierZ > 20 && pierZ < 1000) {
      if (b.style === 'banpo') {
        // 반포대교는 2층: 아래 잠수교 + 위 반포대교
        drawPier(ctx, view, light, b, pierZ, 0.6, -1, 0.42);
        drawPier(ctx, view, light, b, pierZ, b.yb, 2.2, 0.18);
      } else {
        drawPier(ctx, view, light, b, pierZ, b.yb);
      }
    }
    if (b.style === 'banpo') drawDeck(ctx, view, light, b, za, zb, 0.6, 2.2, 20, 46); // 잠수교
    drawDeck(ctx, view, light, b, za, zb, b.yb, b.yt, b.w, 54);
    for (const ex of edges) {
      strokeLine(
        ctx,
        view,
        [ex, b.yt + 1.2, za],
        [ex, b.yt + 1.2, zb],
        shade(light, b.hue, 10, 72, za),
        0.15,
      );
    }
  }

  // 아치: 한강대교는 교각마다 작은 아치, 동작대교는 가운데 큰 아치 두 개
  const lit = light.night > 0.3;
  for (const ex of edges) {
    if (b.style === 'arch') {
      const color = lit
        ? `rgba(255,236,190,${0.4 + 0.6 * light.night})`
        : shade(light, 200, 25, 47, 500);
      for (let z = 120; z < 1000; z += b.span)
        drawArch(ctx, view, b, z, z + b.span, 16, ex, color, 0.9, 6);
    }
    if (b.style === 'dongjak') {
      const color = lit
        ? `rgba(110,225,255,${0.4 + 0.6 * light.night})`
        : shade(light, 185, 35, 55, 450);
      drawArch(ctx, view, b, 330, 500, 32, ex, color, 1.4, 8);
      drawArch(ctx, view, b, 500, 670, 32, ex, color, 1.4, 8);
    }
  }

  if (light.night > 0.03) drawLamps(ctx, view, light, b, edges[1]);
  if (b.style === 'dongjak') drawTrain(ctx, view, light, time, b);
  drawLabel(ctx, view, b, labels);
}

// 노들섬 (한강대교 아래)
function drawIsland(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  b: Bridge,
  [za, zb]: readonly [number, number],
) {
  fillPoly(
    ctx,
    view,
    [
      [b.x - 260, 0.5, za],
      [b.x + 260, 0.5, za],
      [b.x + 220, 0.5, zb],
      [b.x - 220, 0.5, zb],
    ],
    shade(light, 120, 25, 28, za),
  );
  fillPoly(
    ctx,
    view,
    [
      [b.x - 260, -1, za],
      [b.x + 260, -1, za],
      [b.x + 260, 0.5, za],
      [b.x - 260, 0.5, za],
    ],
    shade(light, 40, 20, 32, za),
  );
}

// 교각 기둥 하나 (깊이 z 위치, yBot ~ yTop 높이, 폭은 다리 폭의 widthRatio 배)
function drawPier(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  b: Bridge,
  z: number,
  yTop: number,
  yBot = -1,
  widthRatio = 0.32,
) {
  const half = b.w * widthRatio;
  const d = 3;
  const x0 = b.x - half;
  const x1 = b.x + half;
  const sideX = visibleSide(view.camX, x0, x1);
  if (sideX !== null) {
    fillPoly(
      ctx,
      view,
      [
        [sideX, yBot, z - d],
        [sideX, yTop, z - d],
        [sideX, yTop, z + d],
        [sideX, yBot, z + d],
      ],
      shade(light, b.hue, b.sat, 32, z),
    );
  }
  fillPoly(
    ctx,
    view,
    [
      [x0, yBot, z - d],
      [x1, yBot, z - d],
      [x1, yTop, z - d],
      [x0, yTop, z - d],
    ],
    shade(light, b.hue, b.sat, 44, z),
  );
}

// 상판 한 조각: 아랫면 + 보이는 쪽 옆면
function drawDeck(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  b: Bridge,
  za: number,
  zb: number,
  yb: number,
  yt: number,
  w: number,
  l: number,
) {
  const x0 = b.x - w / 2;
  const x1 = b.x + w / 2;
  fillPoly(
    ctx,
    view,
    [
      [x0, yb, za],
      [x1, yb, za],
      [x1, yb, zb],
      [x0, yb, zb],
    ],
    shade(light, b.hue, b.sat, l * 0.55, za),
  );
  const sideX = visibleSide(view.camX, x0, x1);
  if (sideX !== null) {
    fillPoly(
      ctx,
      view,
      [
        [sideX, yb, za],
        [sideX, yt, za],
        [sideX, yt, zb],
        [sideX, yb, zb],
      ],
      shade(light, b.hue, b.sat + 5, l, za),
    );
  }
}

// 반원 아치 + 수직 행어. 다리 가장자리(ex) 위에 za~zb 구간, 높이 h
function drawArch(
  ctx: CanvasRenderingContext2D,
  view: View,
  b: Bridge,
  za: number,
  zb: number,
  h: number,
  ex: number,
  color: string,
  thick: number,
  hangers: number,
) {
  const points: Vec3[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    points.push([ex, b.yt + Math.sin(Math.PI * t) * h, za + (zb - za) * t]);
  }
  for (let i = 0; i < 16; i++) strokeLine(ctx, view, points[i], points[i + 1], color, thick);
  for (let i = 1; i < hangers; i++) {
    const t = i / hangers;
    const z = za + (zb - za) * t;
    strokeLine(
      ctx,
      view,
      [ex, b.yt, z],
      [ex, b.yt + Math.sin(Math.PI * t) * h, z],
      color,
      thick * 0.3,
    );
  }
}

// 밤: 다리 위 가로등 불빛 (카메라 쪽 가장자리)
function drawLamps(ctx: CanvasRenderingContext2D, view: View, light: Light, b: Bridge, ex: number) {
  ctx.fillStyle = `rgba(255,222,150,${light.night})`;
  for (let z = 15; z < 1000; z += 22) {
    const [x, y] = project(view, [ex, b.yt + 0.6, z]);
    if (x < -5 || x > view.width + 5) continue;
    const size = Math.max(1, (view.focal * 0.5) / z);
    ctx.fillRect(x, y, size, size);
  }
}

// 동작대교 위를 건너는 지하철 4호선 (시간에 따라 계속 지나감)
function drawTrain(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  time: number,
  b: Bridge,
) {
  const z = ((time * 40) % 1600) - 300;
  const za = Math.max(z, Z_START);
  const zb = Math.min(z + 160, Z_END);
  if (zb <= za) return;
  const x0 = b.x - 2;
  const x1 = b.x + 2;
  const y0 = b.yt;
  const y1 = b.yt + 3.5;
  const sideX = visibleSide(view.camX, x0, x1);
  if (sideX !== null) {
    const windows =
      light.night > 0.3
        ? `rgba(150,230,255,${0.6 + 0.4 * light.night})`
        : shade(light, 195, 80, 52, za);
    fillPoly(
      ctx,
      view,
      [
        [sideX, y0, za],
        [sideX, y1, za],
        [sideX, y1, zb],
        [sideX, y0, zb],
      ],
      windows,
    );
  }
  fillPoly(
    ctx,
    view,
    [
      [x0, y1, za],
      [x1, y1, za],
      [x1, y1, zb],
      [x0, y1, zb],
    ],
    shade(light, 195, 60, 70, za),
  );
}

// 다리 이름표: 배경 없이 글자 + 아래표시 (풍경의 일부라 앞의 가로등, 나무에 가려질 수 있다)
function drawLabel(ctx: CanvasRenderingContext2D, view: View, b: Bridge, labels: LabelMode) {
  if (labels === 'none') return;
  if (b.deco && (labels === 'route' || Math.abs(b.x - view.camX) >= 900)) return; // 장식용 다리는 가까울 때만
  const [x, y] = project(view, [b.x, b.yt + 45, 900]);
  if (x < -80 || x > view.width + 80) return;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.7)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 1;
  ctx.font = '700 13px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText(b.name, x, y - 6);
  ctx.beginPath();
  ctx.moveTo(x - 5, y + 1);
  ctx.lineTo(x + 5, y + 1);
  ctx.lineTo(x, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
