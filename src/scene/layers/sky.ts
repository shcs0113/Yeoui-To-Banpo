import { clamp01, lerp, rgba } from '../color';
import type { Light } from '../lighting';
import type { Vec2, View } from '../projection';
import { makeRandom } from '../random';

// 밤하늘: 북쪽을 보고 있으니(해가 왼쪽, 서쪽으로 진다) 앞쪽 하늘에 북극성이 있다
// 별은 북극성 둘레를 반시계 방향으로 돌고, 달은 오른쪽(동쪽)에서 떠서 왼쪽(서쪽)으로 간다
const NIGHT_FROM = 0.33; // 밤이 시작되는 하늘 시각 (lighting의 night와 맞춤)
const NIGHT_TO = 0.84; // 밤이 끝나는 하늘 시각
const STAR_TURN = Math.PI * 0.6; // 밤 동안 별이 도는 각도 (108도)
const POLE_X = 0.36; // 북극성 위치 (화면 폭 비율)
const POLE_Y = 0.32; // 북극성 위치 (수평선까지 높이 비율)

// 별 420개: 북극성 둘레 극좌표(거리 0~1, 각도)로 뿌린다. 돌려도 화면이 비지 않게 화면보다 넓게
// 거리에 sqrt를 씌워 면적 기준으로 고르게 (안 씌우면 가운데로 몰린다)
const rnd = makeRandom(11);
const STARS = Array.from({ length: 420 }, () => ({
  r: Math.sqrt(rnd()),
  a: rnd() * Math.PI * 2,
  phase: rnd() * 6, // 반짝임 박자
  big: rnd() < 0.08, // 조금 큰 별
}));

// 밤이 얼마나 지났나 0 ~ 1
const nightK = (skyT: number) => clamp01((skyT - NIGHT_FROM) / (NIGHT_TO - NIGHT_FROM));

export function drawSky(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  skyT: number,
  time: number,
) {
  const { width, horizon } = view;

  // 위에서 수평선까지 그라데이션
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, rgba(light.top));
  g.addColorStop(1, rgba(light.bottom));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, horizon + 2);

  drawStars(ctx, view, light, skyT, time);
  drawMoon(ctx, view, light, skyT);
  drawSun(ctx, view, skyT);
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  skyT: number,
  time: number,
) {
  if (light.stars <= 0) return;
  const px = view.width * POLE_X;
  const py = view.horizon * POLE_Y;
  // 북극성에서 가장 먼 화면 모서리까지: 이 반지름 안에 별을 뿌려야 어느 각도로 돌아도 꽉 찬다
  const reach = Math.hypot(Math.max(px, view.width - px), Math.max(py, view.horizon - py)) + 20;
  const turn = -nightK(skyT) * STAR_TURN; // 화면 좌표(y 아래)에선 각도가 줄어야 반시계 방향

  for (const s of STARS) {
    const a = s.a + turn;
    const x = px + Math.cos(a) * s.r * reach;
    const y = py + Math.sin(a) * s.r * reach;
    if (x < 0 || x > view.width || y < 0 || y > view.horizon) continue;
    const fade = clamp01((view.horizon - y) / 60); // 수평선 근처는 흐려지며 사라진다
    const twinkle = 0.35 + 0.5 * Math.abs(Math.sin(time * 1.3 + s.phase));
    ctx.fillStyle = `rgba(255,255,255,${light.stars * twinkle * fade})`;
    const size = s.big ? 2.2 : 1.5;
    ctx.fillRect(x, y, size, size);
  }

  // 북극성: 돌지 않고 제자리에서 조금 더 밝게
  ctx.fillStyle = `rgba(255,250,235,${light.stars})`;
  ctx.beginPath();
  ctx.arc(px, py, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

// 달은 상단 경로 바(지점 이름까지 약 118px) 아래에 둔다. 좁은 화면에선 바가 화면 끝까지 차서 겹치니까
const MOON_MIN_Y = 150;

// 달 위치: 오른쪽 하늘 중간쯤에서 떠서 가운데 위를 지나 왼쪽으로 (포물선)
function moonPosition(view: View, skyT: number): Vec2 {
  const k = nightK(skyT);
  const top = Math.min(Math.max(view.height * 0.13, MOON_MIN_Y), view.horizon - 40); // 수평선 아래로는 안 내려가게
  const low = lerp(top, view.horizon - 30, 0.45); // 수평선까지 안 내려가고 하늘 중간쯤에서 시작, 끝
  const x = lerp(0.95, 0.05, k) * view.width;
  const y = lerp(low, top, 1 - (2 * k - 1) ** 2); // 가운데(k = 0.5)에서 가장 높다
  return [x, y];
}

// 초승달: 밝은 원 위에 하늘색 원을 살짝 비켜 겹쳐서 깎는다
function drawMoon(ctx: CanvasRenderingContext2D, view: View, light: Light, skyT: number) {
  if (light.night <= 0.2) return;
  const [x, y] = moonPosition(view, skyT);
  ctx.fillStyle = `rgba(245,240,220,${light.night * 0.9})`;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(light.top, light.night);
  ctx.beginPath();
  ctx.arc(x + 5, y - 3, 10, 0, Math.PI * 2);
  ctx.fill();
}

// 해 위치: 집중 동안 왼쪽(서쪽)으로 지고, 휴식 끝 타임랩스 때 오른쪽(동쪽)에서 뜬다
function sunPosition(view: View, t: number): Vec2 | null {
  const top = view.height * 0.08;
  const below = view.horizon + 28;
  if (t <= 0.43) {
    const k = t / 0.43;
    return [lerp(0.68, 0.1, k) * view.width, lerp(top, below, k * k)];
  }
  if (t >= 0.8) {
    const k = (t - 0.8) / 0.2;
    return [lerp(0.97, 0.68, k) * view.width, lerp(below, top, 1 - (1 - k) * (1 - k))];
  }
  return null;
}

function drawSun(ctx: CanvasRenderingContext2D, view: View, skyT: number) {
  const pos = sunPosition(view, skyT);
  if (!pos) return;
  const [x, y] = pos;
  // 낮을수록(수평선 가까이) 크고 붉게
  const low = clamp01((y - view.height * 0.08) / (view.horizon - view.height * 0.08));
  const r = lerp(48, 75, low);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, 'rgba(255,245,215,1)');
  g.addColorStop(
    0.3,
    `rgba(255,${Math.round(lerp(220, 150, low))},${Math.round(lerp(150, 70, low))},.95)`,
  );
  g.addColorStop(1, 'rgba(255,160,80,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
