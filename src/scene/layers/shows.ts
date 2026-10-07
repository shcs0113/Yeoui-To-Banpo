import { BRIDGES } from '../../constants/course';
import { strokeLine } from '../draw';
import { type Vec3, type View, project } from '../projection';
import { hash01 } from '../random';

const BANPO = BRIDGES.find((b) => b.style === 'banpo');

// 반포대교 달빛무지개분수: 다리 옆면에서 강으로 뿜는 무지개색 물줄기 (k = 강도 0~1)
export function drawFountain(ctx: CanvasRenderingContext2D, view: View, time: number, k: number) {
  if (!BANPO) return;
  const b = BANPO;
  const dir = view.camX < b.x ? -1 : 1; // 카메라 쪽으로 뿜는다
  const ex = b.x + (dir * b.w) / 2;

  // 강 건너편부터 12m 간격으로, 먼 물줄기부터
  for (let z = 980; z >= 60; z -= 12) {
    const hue = (z * 0.6 + time * 90) % 360; // 위치와 시간에 따라 색이 흐른다
    const reach = 22 + 6 * Math.sin(time * 2 + z / 40); // 뿜는 길이가 출렁인다
    const points: Vec3[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const y = b.yb - 0.5 + 4 * t - (b.yb + 1.5) * t * t; // 포물선: 위로 솟았다 수면으로
      points.push([ex + dir * reach * t, y, z]);
    }
    const color = `hsla(${hue} 95% 65% / ${0.85 * k})`;
    for (let i = 0; i < 10; i++) strokeLine(ctx, view, points[i], points[i + 1], color, 0.6);
  }

  // 수면 반사: 무지개빛이 강물에 번진다
  const [rx] = project(view, [b.x - dir * 10, -1, 400]);
  const [, ry] = project(view, [view.camX, -1, 300]);
  const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, 160);
  g.addColorStop(0, `hsla(${(time * 90) % 360} 90% 60% / ${0.25 * k})`);
  g.addColorStop(1, 'hsla(0 0% 0% / 0)');
  ctx.fillStyle = g;
  ctx.fillRect(rx - 160, ry - 160, 320, 320);
}

const GAP = 0.5; // 0.5초마다 한 발
const LIFE = 2.4; // 한 발이 보이는 시간
const SPARKS = 40; // 한 발의 불티 수

// 여의도 불꽃축제: n번째 불꽃의 위치·색은 hash01(n)으로 정한다 (저장해 둘 필요 없음)
export function drawFireworks(ctx: CanvasRenderingContext2D, view: View, time: number, k: number) {
  const latest = Math.floor(time / GAP);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; // 겹칠수록 밝아지게 (빛을 더하는 합성)

  for (let n = latest - 5; n <= latest; n++) {
    const age = time - n * GAP;
    if (age < 0 || age > LIFE) continue;
    const cx = -380 + hash01(n) * 760;
    const cz = 500 + hash01(n + 0.3) * 300;
    const cy = 60 + hash01(n + 0.7) * 90;
    const hue = hash01(n + 0.9) * 360;
    const alpha = k * (1 - age / LIFE);

    // 터지는 순간 하늘이 번쩍
    if (age < 0.25) {
      const [fx, fy] = project(view, [cx, cy, cz]);
      const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 220);
      g.addColorStop(0, `hsla(${hue} 80% 70% / ${0.25 * k * (1 - age / 0.25)})`);
      g.addColorStop(1, 'hsla(0 0% 0% / 0)');
      ctx.fillStyle = g;
      ctx.fillRect(fx - 220, fy - 220, 440, 440);
    }

    // 퍼지는 반지름은 빠르게 커졌다 느려지고, 불티는 중력으로 처진다
    const r = 42 * (1 - Math.exp(-age * 3));
    const drop = 6 * age * age;
    const dot = Math.max(1, (view.focal * 1.3) / cz);
    ctx.fillStyle = `hsla(${hue} 95% 65% / ${alpha})`;
    ctx.strokeStyle = `hsla(${hue} 95% 65% / ${alpha * 0.5})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < SPARKS; i++) {
      const a = (i / SPARKS) * Math.PI * 2 + n;
      const [px, py] = project(view, [cx + Math.cos(a) * r, cy + Math.sin(a) * r - drop, cz]);
      const [qx, qy] = project(view, [
        cx + Math.cos(a) * r * 0.8,
        cy + Math.sin(a) * r * 0.8 - drop,
        cz,
      ]);
      ctx.beginPath(); // 꼬리
      ctx.moveTo(qx, qy);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.beginPath(); // 불티
      ctx.arc(px, py, dot, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
