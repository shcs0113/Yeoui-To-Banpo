import { BRIDGES } from '../../constants/course';
import { strokeLine } from '../draw';
import { type Vec3, type View, project } from '../projection';
import { hash01 } from '../random';

const BANPO = BRIDGES.find((b) => b.style === 'banpo');

// 반포대교 달빛무지개분수: 다리 옆면에서 강으로 뿜는 물줄기 (k = 강도 0~1)
// 다리를 구간으로 나눠 구간마다 연한 색 하나, 끝으로 갈수록 흐려지고 빛을 더하듯 겹친다
const JET_GAP = 20; // 물줄기 간격 (m)
const JET_STEPS = 12; // 물줄기 하나를 몇 토막으로 그릴지
const BAND_LEN = 300; // 색 구간 길이 (m)
const BAND_HUES = [200, 280, 170, 320]; // 하늘, 보라, 민트, 핑크
const MIST_RGB = '200,190,255'; // 수면에 번지는 빛

export function drawFountain(ctx: CanvasRenderingContext2D, view: View, time: number, k: number) {
  if (!BANPO) return;
  const b = BANPO;
  const dir = view.camX < b.x ? -1 : 1; // 카메라 쪽으로 뿜는다
  const ex = b.x + (dir * b.w) / 2;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; // 물줄기가 겹치는 곳이 밝아지게

  // 강 건너편부터 먼 물줄기부터
  for (let z = 980; z >= 60; z -= JET_GAP) {
    const reach = 20 + 4 * Math.sin(time * 1.2 + z / 60); // 뿜는 길이가 천천히 출렁인다
    // 포물선: 다리 밑에서 위로 솟았다 수면으로
    const at = (t: number): Vec3 => [
      ex + dir * reach * t,
      b.yb - 0.5 + 3 * t - (b.yb + 1.5) * t * t,
      z,
    ];
    const band = Math.floor(z / BAND_LEN) % BAND_HUES.length;
    const hue = BAND_HUES[band] + 20 * Math.sin(time * 0.3); // 색은 아주 천천히만 흔들린다
    for (let i = 0; i < JET_STEPS; i++) {
      const t = i / JET_STEPS;
      const alpha = k * 0.5 * (1 - t * 0.8); // 뿜는 곳이 진하고 끝으로 갈수록 흐리게
      strokeLine(ctx, view, at(t), at(t + 1 / JET_STEPS), `hsla(${hue} 70% 78% / ${alpha})`, 0.5);
    }
  }

  // 수면 반사: 연한 빛이 강물에 번진다
  const [rx] = project(view, [b.x - dir * 10, -1, 400]);
  const [, ry] = project(view, [view.camX, -1, 300]);
  const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, 180);
  g.addColorStop(0, `rgba(${MIST_RGB},${0.14 * k})`);
  g.addColorStop(1, `rgba(${MIST_RGB},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(rx - 180, ry - 180, 360, 360);
  ctx.restore();
}

const GAP = 0.5; // 0.5초마다 한 발
const LIFE = 2.4; // 한 발이 보이는 시간
const SPARKS = 40; // 한 발의 불티 수

// 여의도 불꽃축제: n번째 불꽃의 위치, 색은 hash01(n)으로 정한다 (저장해 둘 필요 없음)
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
