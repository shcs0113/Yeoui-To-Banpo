import { BRIDGES, type Bridge } from '../../constants/course';
import { fillPoly, strokeLine } from '../draw';
import { type Light, shade } from '../lighting';
import { type Vec3, type View, clipSegment, project } from '../projection';

const Z_START = -60; // 다리가 시작하는 깊이 (카메라 뒤쪽부터)
const Z_END = 1060; // 강 건너편까지
const SLICE = 20; // 다리를 20m씩 잘라서 먼 쪽부터 그린다
const VISIBLE_RANGE = 2600; // 이보다 멀리 있는 다리는 건너뛴다

// 다리 이름표: 전부, 코스 위 다리만(장식용 마포대교 숨김), 없음
export type LabelMode = 'all' | 'route' | 'none';

// 이번 프레임에 그린 이름표 자리 (클릭 판정용). 그릴 때마다 새로 채운다
export interface LabelHit {
  name: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
export const labelHits: LabelHit[] = [];

// 다리 사이(깊이 z)에 끼워 그릴 것: 그 깊이보다 먼 교각 다음, 가까운 교각 전에 그린다 (예: 한강버스)
export interface DepthLayer {
  z: number;
  draw: () => void;
}

// 카메라에서 먼 다리부터 그려야 가까운 다리가 앞을 덮는다
// inserts가 있으면 다리를 깊이 구간으로 나눠, 먼 구간 -> 끼울 것 -> 가까운 구간 순서로 그린다
export function drawBridges(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  time: number,
  labels: LabelMode,
  inserts: readonly DepthLayer[] = [],
) {
  const sorted = [...BRIDGES]
    .filter((b) => Math.abs(b.x - view.camX) <= VISIBLE_RANGE)
    .sort((a, b) => Math.abs(b.x - view.camX) - Math.abs(a.x - view.camX));
  const layers = [...inserts].sort((a, b) => b.z - a.z); // 먼 것부터

  labelHits.length = 0; // 지난 프레임 이름표 자리 비우기
  for (const b of sorted) if (b.island) drawIsland(ctx, view, light, b, b.island);
  // 상판 위의 것(아치, 불빛, 지하철)을 먼저: 카메라가 상판보다 낮아서, 상판에 가려져야 맞다
  for (const b of sorted) drawTop(ctx, view, light, time, b);

  let maxZ = Infinity;
  for (const layer of layers) {
    for (const b of sorted) drawSlices(ctx, view, light, time, b, layer.z, maxZ);
    layer.draw();
    maxZ = layer.z;
  }
  for (const b of sorted) drawSlices(ctx, view, light, time, b, -Infinity, maxZ);

  for (const b of sorted) drawLabel(ctx, view, b, labels); // 이름표는 화면 안내라 맨 위에
}

// 카메라가 x0~x1 범위 밖이면 그쪽 옆면이 보인다 (정면이면 null)
const visibleSide = (camX: number, x0: number, x1: number) =>
  camX < x0 ? x0 : camX > x1 ? x1 : null;

// 다리 양쪽 가장자리: 카메라에서 먼 쪽이 먼저
const edgesOf = (view: View, b: Bridge) =>
  [b.x - b.w / 2, b.x + b.w / 2].sort((p, q) => Math.abs(q - view.camX) - Math.abs(p - view.camX));

// 깊이 minZ ~ maxZ 구간의 조각만. 먼 조각부터 가까운 조각 순서로: 교각 -> 상판 -> 난간
function drawSlices(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  time: number,
  b: Bridge,
  minZ: number,
  maxZ: number,
) {
  const edges = edgesOf(view, b);
  for (let za = Math.floor((Z_END - SLICE) / SLICE) * SLICE; za >= Z_START; za -= SLICE) {
    if (za < minZ || za >= maxZ) continue;
    const zb = Math.min(Z_END, za + SLICE);
    if (b.style === 'rail') {
      drawRailSlice(ctx, view, light, time, b, za, zb); // 한강철교는 따로
      continue;
    }
    if (b.style === 'twin') {
      drawTwinSlice(ctx, view, light, b, za, zb); // 마포대교는 따로
      continue;
    }
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
}

// 상판 위에 올라가는 것들: 아치, 다리 위 불빛, 지하철 (상판보다 먼저 그려서 다리 밑에서는 가려진다)
function drawTop(ctx: CanvasRenderingContext2D, view: View, light: Light, time: number, b: Bridge) {
  const edges = edgesOf(view, b);
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
  const half = ctx.measureText(b.name).width / 2 + 8; // 글자 폭 + 여유
  labelHits.push({ name: b.name, x0: x - half, y0: y - 24, x1: x + half, y1: y + 12 });
  ctx.beginPath();
  ctx.moveTo(x - 5, y + 1);
  ctx.lineTo(x + 5, y + 1);
  ctx.lineTo(x, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 한강철교: 철도 다리 4개가 나란히, 상판 위로 낙타등 모양 트러스(철골 격자)
const RAIL_OFFSETS = [-23, -8, 8, 23]; // 다리 중심에서 각 철교 중심까지 (m)
const RAIL_W = 9; // 철교 하나의 폭
const TRUSS_LOW = 4.5; // 트러스 높이 (교각 위)
const TRUSS_HIGH = 8; // 트러스 높이 (경간 가운데)
const PANELS = 8; // 경간 하나의 격자 칸 수
const WHITE = 2; // 이 번호의 철교만 흰색

// 기차: [몇 번 철교, 방향(1 = 강 건너로, -1 = 이쪽으로), 시간 오프셋(초)]
// 안쪽 철교는 바깥 철교 상판에 가려서 안 보이니 바깥 두 개에만
const TRAINS: readonly (readonly [number, 1 | -1, number])[] = [
  [0, 1, 0],
  [3, -1, 14],
];
const TRAIN_SPEED = 30; // m/s
const TRAIN_LEN = 140; // 기차 길이 (m)
const TRAIN_LOOP = 1700; // 한 바퀴 거리 (강 폭 + 안 보이는 구간)

// 기차가 차지하는 깊이 구간 [앞, 뒤]
function trainSpan(time: number, dir: 1 | -1, offset: number): [number, number] {
  const p = ((time + offset) * TRAIN_SPEED) % TRAIN_LOOP; // 0 ~ LOOP
  const head = dir === 1 ? p - 300 : 1300 - p; // 카메라 뒤에서 나와 강 건너로 (또는 반대)
  return dir === 1 ? [head - TRAIN_LEN, head] : [head, head + TRAIN_LEN];
}

// 철교 4개를 한 조각(za ~ zb)씩: 먼 철교부터
// 철교마다 먼 쪽 트러스 -> 기차 -> 가까운 쪽 트러스 -> 교각 -> 상판
function drawRailSlice(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  time: number,
  b: Bridge,
  za: number,
  zb: number,
) {
  const subs = RAIL_OFFSETS.map((o, i) => ({ cx: b.x + o, i })).sort(
    (p, q) => Math.abs(q.cx - view.camX) - Math.abs(p.cx - view.camX),
  );
  for (const { cx, i } of subs) {
    const x0 = cx - RAIL_W / 2;
    const x1 = cx + RAIL_W / 2;
    const [h, s, l] = i === WHITE ? [150, 6, 86] : [b.hue, b.sat, 46];
    const color = shade(light, h, s, l, za);
    const [farEdge, nearEdge] = [x0, x1].sort(
      (p, q) => Math.abs(q - view.camX) - Math.abs(p - view.camX),
    );

    // 트러스와 기차는 상판 위라서 상판보다 먼저 (밑에서 보면 상판에 가려진다)
    drawTruss(ctx, view, b, farEdge, za, zb, color);
    for (const [track, dir, offset] of TRAINS) {
      if (track !== i) continue;
      const [ta, tb] = trainSpan(time, dir, offset);
      const a = Math.max(ta, za, Z_START);
      const c = Math.min(tb, zb, Z_END);
      if (a < c) drawRailTrain(ctx, view, light, b, cx, a, c);
    }
    drawTruss(ctx, view, b, nearEdge, za, zb, color);
    const panel = b.span / PANELS;
    for (let z = Math.ceil(za / panel) * panel; z < zb; z += panel) {
      if (z < 0 || z >= 1000) continue;
      const y = trussTop(b, z);
      strokeLine(ctx, view, [x0, y, z], [x1, y, z], color, 0.15); // 위 가로보
    }

    const pierZ = Math.round(za / b.span) * b.span;
    if (pierZ >= za && pierZ < zb && pierZ > 20 && pierZ < 1000) {
      drawRailPier(ctx, view, light, b, cx, pierZ);
    }

    // 상판: 아랫면 + 보이는 옆면
    fillPoly(
      ctx,
      view,
      [
        [x0, b.yb, za],
        [x1, b.yb, za],
        [x1, b.yb, zb],
        [x0, b.yb, zb],
      ],
      shade(light, h, s * 0.6, l * 0.5, za),
    );
    const sideX = visibleSide(view.camX, x0, x1);
    if (sideX !== null) {
      fillPoly(
        ctx,
        view,
        [
          [sideX, b.yb, za],
          [sideX, b.yt, za],
          [sideX, b.yt, zb],
          [sideX, b.yb, zb],
        ],
        shade(light, h, s, l * 0.85, za),
      );
    }
  }
}

// 낙타등: 교각 위는 낮고 경간 가운데가 높다
function trussTop(b: Bridge, z: number) {
  const t = (((z % b.span) + b.span) % b.span) / b.span;
  return b.yt + TRUSS_LOW + (TRUSS_HIGH - TRUSS_LOW) * Math.sin(Math.PI * t);
}

// 트러스 한 면 (가장자리 ex): 아래 현, 위 현, X자 사재, 수직재
function drawTruss(
  ctx: CanvasRenderingContext2D,
  view: View,
  b: Bridge,
  ex: number,
  za: number,
  zb: number,
  color: string,
) {
  const panel = b.span / PANELS;
  for (let z = Math.ceil(za / panel) * panel; z < zb; z += panel) {
    if (z < 0 || z >= 1000) continue;
    const z2 = z + panel;
    const t1 = trussTop(b, z);
    const t2 = z2 % b.span < 1e-6 ? b.yt + TRUSS_LOW : trussTop(b, z2); // 경간 끝은 다시 낮게
    strokeLine(ctx, view, [ex, b.yt, z], [ex, b.yt, z2], color, 0.35); // 아래 현
    strokeLine(ctx, view, [ex, t1, z], [ex, t2, z2], color, 0.35); // 위 현
    strokeLine(ctx, view, [ex, b.yt, z], [ex, t2, z2], color, 0.18); // X자 사재
    strokeLine(ctx, view, [ex, t1, z], [ex, b.yt, z2], color, 0.18);
    strokeLine(ctx, view, [ex, b.yt, z], [ex, t1, z], color, 0.22); // 수직재
  }
}

// 철교 위 기차: 옆면(흰 차체, 파란 띠, 창문 띠) + 지붕. 밤에는 창문에 불이 켜진다
function drawRailTrain(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  b: Bridge,
  cx: number,
  za: number,
  zb: number,
) {
  const x0 = cx - 1.6;
  const x1 = cx + 1.6;
  const y0 = b.yt + 0.4;
  const y1 = b.yt + 3.6;
  const sideX = visibleSide(view.camX, x0, x1);
  if (sideX !== null) {
    const band = (ya: number, yb: number, c: string) =>
      fillPoly(
        ctx,
        view,
        [
          [sideX, ya, za],
          [sideX, yb, za],
          [sideX, yb, zb],
          [sideX, ya, zb],
        ],
        c,
      );
    const windows =
      light.night > 0.3
        ? `rgba(255,236,190,${0.55 + 0.45 * light.night})`
        : shade(light, 210, 25, 30, za);
    band(y0, y1, shade(light, 210, 8, 78, za)); // 차체
    band(y0 + 0.5, y0 + 0.8, shade(light, 215, 70, 45, za)); // 파란 띠
    band(y0 + 1.4, y0 + 2.5, windows); // 창문 띠
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
    shade(light, 210, 6, 70, za),
  );
}

// 교각: 밝은 베이지 육면체. 위로 갈수록 넓어지고(앞에서 보면 사다리꼴) 꼭대기에 받침
// 앞면 + 카메라 쪽 옆면만 그린다 (윗면은 상판에 가리고, 뒷면은 안 보인다)
function drawRailPier(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  b: Bridge,
  cx: number,
  z: number,
) {
  const d = 2.5; // 앞뒤 두께의 반 (강 건너는 방향)
  slantedBox(ctx, view, light, cx, -1, b.yb - 0.6, 2.2, 3.2, z, d, 35, 18, 72); // 몸통
  slantedBox(ctx, view, light, cx, b.yb - 0.6, b.yb, 3.4, 3.4, z, d + 0.1, 35, 18, 64); // 받침
}

// 위아래 폭이 다른 육면체 (앞뒤 두께는 같다). 색은 hue, sat, l로 받고 옆면은 앞면보다 어둡게
// 한강철교 교각(베이지)과 마포대교 교각(회청색)이 같이 쓴다
function slantedBox(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  cx: number,
  y0: number,
  y1: number,
  halfBot: number,
  halfTop: number,
  z: number,
  d: number,
  hue: number,
  sat: number,
  l: number,
) {
  // 카메라가 기둥 왼쪽 밖이면 왼쪽 옆면, 오른쪽 밖이면 오른쪽 옆면이 보인다
  const side = view.camX < cx - halfBot ? -1 : view.camX > cx + halfBot ? 1 : 0;
  if (side !== 0) {
    const xb = cx + side * halfBot;
    const xt = cx + side * halfTop;
    fillPoly(
      ctx,
      view,
      [
        [xb, y0, z - d],
        [xt, y1, z - d],
        [xt, y1, z + d],
        [xb, y0, z + d],
      ],
      shade(light, hue, sat - 2, l - 16, z),
    );
  }
  fillPoly(
    ctx,
    view,
    [
      [cx - halfBot, y0, z - d],
      [cx + halfBot, y0, z - d],
      [cx + halfTop, y1, z - d],
      [cx - halfTop, y1, z - d],
    ],
    shade(light, hue, sat, l, z),
  );
}

// 마포대교: 쌍둥이 다리 두 개가 나란히. 교각은 네모 기둥 2개 + 위로 넓어지는 사다리꼴 받침
const TWIN_W = 12; // 다리 하나의 폭
const TWIN_GAP = 3; // 두 다리 사이 틈
const COL_HALF = 1.1; // 기둥 반 폭
const COL_OFF = 3.2; // 다리 가운데에서 기둥 가운데까지
const CAP_H = 2.6; // 받침 높이
const CAP_INSET = 0.8; // 받침 윗변이 상판 가장자리보다 안쪽으로 들어간 만큼
const UNDER_LINES = 3; // 상판 아랫면 선 개수

// 조각(za ~ zb) 하나: 먼 다리부터, 다리마다 상판 -> 교각
// 교각을 나중에: 받침이 상판 아래로 매달려 있어서, 밑에서 보면 같은 조각의 뒤쪽 상판보다 앞에 있다
function drawTwinSlice(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  b: Bridge,
  za: number,
  zb: number,
) {
  const half = (TWIN_W + TWIN_GAP) / 2;
  const subs = [b.x - half, b.x + half].sort(
    (p, q) => Math.abs(q - view.camX) - Math.abs(p - view.camX),
  );
  const pierZ = Math.round(za / b.span) * b.span;
  const hasPier = pierZ >= za && pierZ < zb && pierZ > 20 && pierZ < 1000;

  for (const cx of subs) {
    const x0 = cx - TWIN_W / 2;
    const x1 = cx + TWIN_W / 2;

    // 상판 아랫면 + 단순한 세로선
    fillPoly(
      ctx,
      view,
      [
        [x0, b.yb, za],
        [x1, b.yb, za],
        [x1, b.yb, zb],
        [x0, b.yb, zb],
      ],
      shade(light, b.hue, b.sat, 30, za),
    );
    const lineColor = shade(light, b.hue, b.sat, 22, za);
    for (let i = 1; i <= UNDER_LINES; i++) {
      const x = x0 + (TWIN_W * i) / (UNDER_LINES + 1);
      hairline(ctx, view, [x, b.yb, za], [x, b.yb, zb], lineColor);
    }

    // 바깥 옆면: 밝은 회청색 철판 + 흰 난간
    const sideX = visibleSide(view.camX, x0, x1);
    if (sideX !== null) {
      fillPoly(
        ctx,
        view,
        [
          [sideX, b.yb, za],
          [sideX, b.yt, za],
          [sideX, b.yt, zb],
          [sideX, b.yb, zb],
        ],
        shade(light, b.hue, b.sat + 6, 60, za),
      );
      strokeLine(
        ctx,
        view,
        [sideX, b.yt + 1, za],
        [sideX, b.yt + 1, zb],
        shade(light, b.hue, 6, 86, za),
        0.12,
      );
    }

    if (hasPier) drawTwinPier(ctx, view, light, b, cx, pierZ);
  }
}

// 교각: 네모 기둥 2개 위에 사다리꼴 받침 (아랫변은 두 기둥 바깥 면, 윗변은 상판보다 조금 안쪽)
function drawTwinPier(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  b: Bridge,
  cx: number,
  z: number,
) {
  const capBottom = b.yb - CAP_H;
  for (const off of [-COL_OFF, COL_OFF]) {
    slantedBox(
      ctx,
      view,
      light,
      cx + off,
      -1,
      capBottom,
      COL_HALF,
      COL_HALF,
      z,
      COL_HALF,
      210,
      6,
      50,
    );
  }
  const capBot = COL_OFF + COL_HALF;
  const capTop = TWIN_W / 2 - CAP_INSET;
  slantedBox(ctx, view, light, cx, capBottom, b.yb, capBot, capTop, z, 1.4, 210, 6, 58);
}

// 굵기가 거리와 상관없이 일정한 선 (strokeLine은 가까울수록 굵어진다)
function hairline(ctx: CanvasRenderingContext2D, view: View, a: Vec3, c: Vec3, color: string) {
  const seg = clipSegment(a, c);
  if (!seg) return;
  const [p, q] = seg;
  const [x1, y1] = project(view, p);
  const [x2, y2] = project(view, q);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}
