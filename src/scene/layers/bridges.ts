import { BRIDGES, type Bridge } from '../../constants/course';
import { fillPoly, strokeLine } from '../draw';
import { type Light, shade } from '../lighting';
import { type Vec3, type View, clipSegment, inView, project } from '../projection';

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
    if (b.style === 'twin' || b.style === 'arch') {
      drawTwinSlice(ctx, view, light, b, za, zb); // 마포대교는 따로
      continue;
    }
    if (b.style === 'dongjak') {
      drawDongjakSlice(ctx, view, light, b, za, zb); // 동작대교는 따로
      continue;
    }
    if (b.style === 'box') {
      drawBoxSlice(ctx, view, light, b, za, zb); // 원효대교는 따로
      continue;
    }
    if (b.style === 'banpo') {
      drawBanpoSlice(ctx, view, light, b, za, zb); // 반포대교 + 잠수교는 따로
      continue;
    }
    const pierZ = Math.round(za / b.span) * b.span;
    if (pierZ >= za && pierZ < zb && pierZ > 20 && pierZ < 1000) {
      drawPier(ctx, view, light, b, pierZ, b.yb);
    }
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
    if (b.style === 'arch' && ex === edges[0]) {
      // 쌍둥이 다리 두 개, 다리마다 양쪽 가장자리에 흰 아치 (4줄을 한 번만, 먼 가장자리부터)
      const color = lit
        ? `rgba(255,236,190,${0.4 + 0.6 * light.night})`
        : shade(light, 210, 6, 90, 300);
      const half = (TWIN_W + TWIN_GAP) / 2; // 다리 가운데에서 각 쌍둥이 다리 가운데까지
      const archEdges = [
        -half - TWIN_W / 2,
        -half + TWIN_W / 2,
        half - TWIN_W / 2,
        half + TWIN_W / 2,
      ]
        .map((o) => b.x + o)
        .sort((p, q) => Math.abs(q - view.camX) - Math.abs(p - view.camX));
      for (const ax of archEdges) {
        for (let z = 120; z < 1000; z += b.span) {
          drawArch(ctx, view, b, z, z + b.span, 14, ax, color, 1.1, 9);
        }
      }
    }
    if (b.style === 'dongjak') {
      const color = lit
        ? `rgba(110,225,255,${0.4 + 0.6 * light.night})`
        : shade(light, 195, 55, 52, 450);
      // 랭거 아치: 얇은 아치가 경간마다 이어진다 (무게는 아래 상판이 받는다)
      for (let z = DJ_ARCH_FROM; z < DJ_ARCH_TO; z += b.span) {
        drawArch(ctx, view, b, z, z + b.span, 15, ex, color, 0.8, 9);
      }
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
const TRUSS_LOW = 4; // 트러스 높이 (경간 가운데, 오목하게 처진 곳)
const TRUSS_HIGH = 10; // 트러스 높이 (교각 위 봉우리)
const TRUSS_CURVE = 2.6; // 클수록 봉우리 근처가 가파르고 가운데가 평평하다
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
    if (!inView(view, cx, zb, RAIL_W)) continue; // 화면 밖 조각은 건너뛰기 (먼 쪽 zb에서도 밖이면 전부 밖)
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

    // 교각은 상판 다음에: 상판 아래로 받치고 있어서, 밑에서 보면 같은 조각의 뒤쪽 상판보다 앞에 있다
    const pierZ = Math.round(za / b.span) * b.span;
    if (pierZ >= za && pierZ < zb && pierZ > 20 && pierZ < 1000) {
      drawRailPier(ctx, view, light, b, cx, pierZ);
    }
  }
}

// 교각 위가 뾰족하게 높고, 경간 가운데로 오목하게 처진다
function trussTop(b: Bridge, z: number) {
  const t = (((z % b.span) + b.span) % b.span) / b.span; // 경간 안 위치 0 ~ 1
  const u = Math.abs(2 * t - 1); // 교각 위 1 -> 가운데 0 -> 교각 위 1
  return b.yt + TRUSS_LOW + (TRUSS_HIGH - TRUSS_LOW) * u ** TRUSS_CURVE;
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
    const t2 = trussTop(b, z2);
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

// 원효대교: 변단면 박스거더 (교각 위는 두껍고 경간 가운데는 얇다) + Y자 교각
// 가운데 상자 + 양옆 날개. 상자 아랫면이 교각 사이에서 아치처럼 올라간다
const BOX_HALF = 5.5; // 가운데 상자 반 폭 (나머지는 날개)
const WING_T = 0.8; // 날개 두께
const HAUNCH = 2.8; // 교각 위에서 상자가 더 깊어지는 만큼
const BOX_STEP = 10; // 변단면이라 조각을 더 잘게 (m)
const SEAM = 0.5; // 조각끼리 겹치는 길이 (가장자리가 반투명하게 칠해져 생기는 틈을 막는다)
const Y_TOP = 5; // Y자 교각 갈래 바깥 끝 (다리 가운데에서)
const Y_BOT = 2.2; // 아래 기둥 반 폭
const Y_ARM = 2.6; // 갈래 윗부분 폭
const Y_GAP = 0.2; // 갈래가 갈라지는 곳의 틈 (반)
const Y_SPLIT = 0.45; // 높이의 몇 % 지점에서 두 갈래로 갈라지나
const Y_D = 2; // 교각 앞뒤 두께의 반

// z에서의 상자 아랫면 높이: 교각(span 배수) 위에서 가장 낮고, 경간 가운데서 yb
function boxBottom(b: Bridge, z: number) {
  const t = (((z % b.span) + b.span) % b.span) / b.span; // 0 ~ 1
  const k = Math.cos(Math.PI * t) ** 2; // 교각 위 1, 가운데 0
  return b.yb - HAUNCH * k * k; // 제곱을 한 번 더 해서 교각 근처에서만 깊어지게
}

// 조각(za ~ zb) 하나: 날개 아랫면 -> 상자 아랫면, 옆벽 -> 날개 끝 옆면 -> 교각
// 날개가 먼저: 상자 아랫면이 더 낮아서(카메라에 가까워서) 밑에서 보면 날개를 덮는다
function drawBoxSlice(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  b: Bridge,
  za: number,
  zb: number,
) {
  const x0 = b.x - b.w / 2;
  const x1 = b.x + b.w / 2;
  const bx0 = b.x - BOX_HALF;
  const bx1 = b.x + BOX_HALF;
  const wingY = b.yt - WING_T; // 날개 아랫면 높이

  // 날개 아랫면 (그늘)
  for (const [a, c] of [
    [x0, bx0],
    [bx1, x1],
  ] as const) {
    fillPoly(
      ctx,
      view,
      [
        [a, wingY, za - SEAM],
        [c, wingY, za - SEAM],
        [c, wingY, zb],
        [a, wingY, zb],
      ],
      shade(light, b.hue, b.sat, 30, za),
    );
  }

  // 상자: 10m씩 먼 쪽부터. 아랫면은 곡선이라 조각마다 양 끝 높이가 다르다
  const boxSide = visibleSide(view.camX, bx0, bx1);
  for (let z = zb; z > za; z -= BOX_STEP) {
    const z0 = Math.max(za, z - BOX_STEP) - SEAM; // 앞 조각과 살짝 겹쳐서 이음새 틈을 없앤다
    const y0 = boxBottom(b, z0);
    const y1 = boxBottom(b, z);
    fillPoly(
      ctx,
      view,
      [
        [bx0, y0, z0],
        [bx1, y0, z0],
        [bx1, y1, z],
        [bx0, y1, z],
      ],
      shade(light, b.hue, b.sat, 26, z0),
    );
    // 상자 옆벽: 아랫면 곡선부터 날개 아래까지
    if (boxSide !== null) {
      fillPoly(
        ctx,
        view,
        [
          [boxSide, y0, z0],
          [boxSide, wingY, z0],
          [boxSide, wingY, z],
          [boxSide, y1, z],
        ],
        shade(light, b.hue, b.sat, 42, z0),
      );
    }
  }

  // 날개 끝 옆면 + 흰 난간
  const side = visibleSide(view.camX, x0, x1);
  if (side !== null) {
    fillPoly(
      ctx,
      view,
      [
        [side, wingY, za - SEAM],
        [side, b.yt, za - SEAM],
        [side, b.yt, zb],
        [side, wingY, zb],
      ],
      shade(light, b.hue, b.sat, 62, za),
    );
    strokeLine(
      ctx,
      view,
      [side, b.yt + 0.9, za],
      [side, b.yt + 0.9, zb],
      shade(light, 210, 4, 84, za),
      0.1,
    );
  }

  const pierZ = Math.round(za / b.span) * b.span;
  if (pierZ >= za && pierZ < zb && pierZ > 20 && pierZ < 1000) {
    drawYPier(ctx, view, light, b, pierZ);
  }
}

// Y자 교각: 아래는 네모 기둥 하나, 위로 가며 두 갈래로 벌어져 상자를 받친다
// 갈래도 두께가 있어서, 보이는 비탈면(바깥쪽, 갈래 사이 구멍 쪽)을 먼저 그리고 앞면으로 덮는다
function drawYPier(ctx: CanvasRenderingContext2D, view: View, light: Light, b: Bridge, z: number) {
  const top = boxBottom(b, z);
  const split = -1 + (top + 1) * Y_SPLIT;
  slantedBox(ctx, view, light, b.x, -1, split, Y_BOT, Y_BOT, z, Y_D, b.hue, b.sat, 56);

  const fz = z - Y_D; // 앞면 깊이
  const sideColor = shade(light, b.hue, b.sat, 42, z);
  const fronts: Vec3[][] = [];
  for (const s of [-1, 1]) {
    // 갈래 앞면 꼭짓점: 안쪽 아래, 바깥 아래, 바깥 위, 안쪽 위
    const inB: Vec3 = [b.x + s * Y_GAP, split, fz];
    const outB: Vec3 = [b.x + s * Y_BOT, split, fz];
    const outT: Vec3 = [b.x + s * Y_TOP, top, fz];
    const inT: Vec3 = [b.x + s * (Y_TOP - Y_ARM), top, fz];
    // 바깥 비탈은 카메라가 그 갈래 바깥쪽에 있을 때, 안쪽 비탈은 반대편에 있을 때 보인다
    const edges: Vec3[][] = [];
    if (s * (view.camX - (outB[0] + outT[0]) / 2) > 0) edges.push([outB, outT]);
    if (s * (view.camX - (inB[0] + inT[0]) / 2) < 0) edges.push([inB, inT]);
    for (const [p, q] of edges) {
      fillPoly(ctx, view, [p, q, [q[0], q[1], z + Y_D], [p[0], p[1], z + Y_D]], sideColor);
    }
    fronts.push([inB, outB, outT, inT]);
  }
  for (const f of fronts) fillPoly(ctx, view, f, shade(light, b.hue, b.sat, 56, z));
}

// 동작대교: 랭거 아치교. 가운데 지하철(4호선) + 양옆 차도가 한 상판
// 강철판 상판 아래로 두꺼운 파란 강철 보(주형)가 길게 뻗고, 강 가운데 구간에 얇은 파란 아치가 이어진다
// 교각은 네모 기둥 4개 위에 사다리꼴 가로보
const DJ_ARCH_FROM = 220; // 아치가 시작하는 깊이
const DJ_ARCH_TO = 800; // 아치가 끝나는 깊이
const DJ_RAIL_HALF = 3; // 가운데 지하철 구간 반 폭
const DJ_GIRDERS = 3; // 차도 한쪽마다 주형 개수
const DJ_GIRDER_HALF = 0.35; // 주형 반 폭
const DJ_GIRDER_H = 1.2; // 주형이 상판 아래로 튀어나온 높이
const DJ_COLS = [-9, -3.2, 3.2, 9]; // 기둥 위치 (다리 가운데에서)
const DJ_COL_HALF = 1.1; // 기둥 반 폭
const DJ_CAP_H = 1.8; // 가로보 높이

// 조각(za ~ zb) 하나: 아랫면 -> 주형 -> 바깥 옆면 -> 교각
function drawDongjakSlice(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  b: Bridge,
  za: number,
  zb: number,
) {
  const x0 = b.x - b.w / 2;
  const x1 = b.x + b.w / 2;

  // 아랫면: 차도(회색 철판) + 가운데 지하철(어두운 콘크리트)
  fillPoly(
    ctx,
    view,
    [
      [x0, b.yb, za],
      [x1, b.yb, za],
      [x1, b.yb, zb],
      [x0, b.yb, zb],
    ],
    shade(light, 210, 5, 44, za),
  );
  fillPoly(
    ctx,
    view,
    [
      [b.x - DJ_RAIL_HALF, b.yb - 0.05, za],
      [b.x + DJ_RAIL_HALF, b.yb - 0.05, za],
      [b.x + DJ_RAIL_HALF, b.yb - 0.05, zb],
      [b.x - DJ_RAIL_HALF, b.yb - 0.05, zb],
    ],
    shade(light, 200, 10, 26, za),
  );

  // 주형: 아래로 튀어나온 파란 강철 보. 카메라 쪽 옆면 -> 아랫면
  const blue = shade(light, 198, 60, 46, za);
  const blueDark = shade(light, 200, 55, 34, za);
  const gy = b.yb - DJ_GIRDER_H;
  for (const [a, c] of [
    [x0, b.x - DJ_RAIL_HALF],
    [b.x + DJ_RAIL_HALF, x1],
  ] as const) {
    for (let i = 1; i <= DJ_GIRDERS; i++) {
      const gx = a + ((c - a) * i) / (DJ_GIRDERS + 1);
      const sx = view.camX < gx ? gx - DJ_GIRDER_HALF : gx + DJ_GIRDER_HALF;
      fillPoly(
        ctx,
        view,
        [
          [sx, gy, za],
          [sx, b.yb, za],
          [sx, b.yb, zb],
          [sx, gy, zb],
        ],
        blueDark,
      );
      fillPoly(
        ctx,
        view,
        [
          [gx - DJ_GIRDER_HALF, gy, za],
          [gx + DJ_GIRDER_HALF, gy, za],
          [gx + DJ_GIRDER_HALF, gy, zb],
          [gx - DJ_GIRDER_HALF, gy, zb],
        ],
        blue,
      );
    }
  }

  // 바깥 옆면: 파란 철판 + 흰 난간
  const side = visibleSide(view.camX, x0, x1);
  if (side !== null) {
    fillPoly(
      ctx,
      view,
      [
        [side, b.yb, za],
        [side, b.yt, za],
        [side, b.yt, zb],
        [side, b.yb, zb],
      ],
      shade(light, 198, 55, 50, za),
    );
    strokeLine(
      ctx,
      view,
      [side, b.yt + 1, za],
      [side, b.yt + 1, zb],
      shade(light, 200, 6, 86, za),
      0.1,
    );
  }

  // 교각은 상판 다음에 (받침이 상판 아래로 내려와 있어서 밑에서 보면 앞에 있다)
  const pierZ = Math.round(za / b.span) * b.span;
  if (pierZ >= za && pierZ < zb && pierZ > 20 && pierZ < 1000) {
    const capBottom = gy - DJ_CAP_H; // 주형 아래에 가로보
    for (const off of DJ_COLS) {
      slantedBox(
        ctx,
        view,
        light,
        b.x + off,
        -1,
        capBottom,
        DJ_COL_HALF,
        DJ_COL_HALF,
        pierZ,
        DJ_COL_HALF,
        40,
        4,
        74,
      );
    }
    slantedBox(
      ctx,
      view,
      light,
      b.x,
      capBottom,
      gy,
      b.w / 2 - 1.5,
      b.w / 2 - 0.5,
      pierZ,
      1.4,
      40,
      4,
      80,
    );
  }
}

const JS_HALF = 9; // 잠수교 반 폭
const JS_YB = 0.6; // 잠수교 아랫면 (솟지 않은 곳)
const JS_T = 1.6; // 잠수교 두께
const JS_LIFT = 4; // 가운데 솟은 높이
const JS_LIFT_FROM = 380; // 솟기 시작하는 깊이
const JS_LIFT_TO = 620; // 다시 내려오는 깊이
const JS_STEP = 10; // 솟은 곳을 그리려고 잘게 나누는 조각 (m)
const BP_SEAM = 0.5; // 조각 이음새 틈 막기
const BP_COL_X = 10.8; // 기둥 위치 (다리 가운데에서)
const BP_COL_HALF = 1.2; // 기둥 반 폭
const BP_CAP_H = 1.6; // 위 가로보 두께
const BP_LOW_CAP_H = 0.9; // 아래 가로보 두께 (잠수교 받침)
const BP_BOXES = 3; // 상자형 보 개수
const BP_BOX_HALF = 2; // 상자형 보 반 폭
const BP_BOX_H = 1.4; // 상자형 보 깊이

// z에서 잠수교가 솟은 높이 (가운데 구간에서만, 부드럽게)
function jamsuLift(z: number) {
  const t = (z - JS_LIFT_FROM) / (JS_LIFT_TO - JS_LIFT_FROM);
  if (t <= 0 || t >= 1) return 0;
  return JS_LIFT * Math.sin(Math.PI * t) ** 2;
}

// 반포대교 + 잠수교: 잠수교 -> 위 다리 상판 -> 교각 (교각 하나가 두 다리를 같이 받친다)
function drawBanpoSlice(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  b: Bridge,
  za: number,
  zb: number,
) {
  const gray = (l: number, z = za) => shade(light, 210, 4, l, z);
  const quad = (x0: number, x1: number, y: number, c: string) =>
    fillPoly(
      ctx,
      view,
      [
        [x0, y, za],
        [x1, y, za],
        [x1, y, zb],
        [x0, y, zb],
      ],
      c,
    );
  const wall = (x: number, y0: number, y1: number, c: string) =>
    fillPoly(
      ctx,
      view,
      [
        [x, y0, za],
        [x, y1, za],
        [x, y1, zb],
        [x, y0, zb],
      ],
      c,
    );

  // 잠수교: 솟은 곳이 있어서 10m씩. 윗면(카메라가 더 높으니 보인다) + 보이는 옆면
  const jsSide = visibleSide(view.camX, b.x - JS_HALF, b.x + JS_HALF);
  for (let z = zb; z > za; z -= JS_STEP) {
    const z0 = Math.max(za, z - JS_STEP) - BP_SEAM;
    const t0 = JS_YB + JS_T + jamsuLift(z0);
    const t1 = JS_YB + JS_T + jamsuLift(z);
    fillPoly(
      ctx,
      view,
      [
        [b.x - JS_HALF, t0, z0],
        [b.x + JS_HALF, t0, z0],
        [b.x + JS_HALF, t1, z],
        [b.x - JS_HALF, t1, z],
      ],
      gray(34, z0),
    );
    if (jsSide !== null)
      fillPoly(
        ctx,
        view,
        [
          [jsSide, t0 - JS_T, z0],
          [jsSide, t0, z0],
          [jsSide, t1, z],
          [jsSide, t1 - JS_T, z],
        ],
        gray(48, z0),
      );
  }

  // 위 다리: 아랫면 -> 상자형 보 (옆면 -> 아랫면) -> 바깥 옆면, 난간
  const x0 = b.x - b.w / 2;
  const x1 = b.x + b.w / 2;
  quad(x0, x1, b.yb, gray(52));
  const by = b.yb - BP_BOX_H;
  for (let i = 0; i < BP_BOXES; i++) {
    const gx = x0 + (b.w * (i + 0.5)) / BP_BOXES;
    const sx = view.camX < gx ? gx - BP_BOX_HALF : gx + BP_BOX_HALF;
    if (Math.abs(view.camX - gx) > BP_BOX_HALF) wall(sx, by, b.yb, gray(38)); // 바로 밑이면 옆면 안 보임
    quad(gx - BP_BOX_HALF, gx + BP_BOX_HALF, by, gray(60));
  }
  const side = visibleSide(view.camX, x0, x1);
  if (side !== null) {
    wall(side, b.yb, b.yt, gray(64));
    strokeLine(ctx, view, [side, b.yt + 1, za], [side, b.yt + 1, zb], gray(78), 0.1);
  }

  // 교각 (상판 다음에): 기둥 2개 -> 아래 가로보(잠수교) -> 위 가로보(반포대교)
  const pierZ = Math.round(za / b.span) * b.span;
  if (pierZ >= za && pierZ < zb && pierZ > 20 && pierZ < 1000) {
    const lowTop = JS_YB + jamsuLift(pierZ); // 잠수교 아랫면, 솟은 곳에선 같이 올라감
    const capY = by - BP_CAP_H; // 상자형 보 아래에 위 가로보
    for (const s of [-1, 1]) {
      slantedBox(
        ctx,
        view,
        light,
        b.x + s * BP_COL_X,
        -1,
        capY,
        BP_COL_HALF,
        BP_COL_HALF,
        pierZ,
        BP_COL_HALF,
        210,
        4,
        60,
      );
    }
    const span = BP_COL_X + BP_COL_HALF;
    slantedBox(
      ctx,
      view,
      light,
      b.x,
      lowTop - BP_LOW_CAP_H,
      lowTop,
      span,
      span,
      pierZ,
      1.3,
      210,
      4,
      54,
    );
    slantedBox(ctx, view, light, b.x, capY, by, span, b.w / 2 - 0.6, pierZ, 1.3, 210, 4, 66);
  }
}
