import { clamp01, lerp, rgba } from '../color';
import type { Light } from '../lighting';
import type { Vec2, View } from '../projection';
import { makeRandom } from '../random';

// 별 80개: 화면 비율 위치(0~1) + 반짝임 박자
const rnd = makeRandom(7);
const STARS = Array.from({ length: 80 }, () => ({
  x: rnd(),
  y: rnd() * 0.85,
  phase: rnd() * 6,
}));

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

  drawStars(ctx, view, light, time);
  drawMoon(ctx, view, light);
  drawSun(ctx, view, skyT);
}

function drawStars(ctx: CanvasRenderingContext2D, view: View, light: Light, time: number) {
  if (light.stars <= 0) return;
  for (const s of STARS) {
    const twinkle = 0.35 + 0.5 * Math.abs(Math.sin(time * 1.3 + s.phase));
    ctx.fillStyle = `rgba(255,255,255,${light.stars * twinkle})`;
    ctx.fillRect(s.x * view.width, s.y * view.horizon, 1.5, 1.5);
  }
}

// 초승달: 밝은 원 위에 하늘색 원을 살짝 비켜 겹쳐서 깎는다
function drawMoon(ctx: CanvasRenderingContext2D, view: View, light: Light) {
  if (light.night <= 0.2) return;
  const x = view.width * 0.83;
  const y = view.height * 0.13;
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
