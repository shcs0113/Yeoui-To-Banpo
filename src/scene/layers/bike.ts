import type { Light } from '../lighting';
import { type View, project } from '../projection';

const BASE_Z = 11; // 이 깊이에서 원래 크기(56×44px)
const WHEEL_R_M = 0.34; // 실제 바퀴 반지름 (m): 달린 거리 -> 바퀴 회전각
const BOB_EVERY = 4; // 바퀴가 이만큼 도는 동안(라디안 × 2π) 한 번 들썩
const BOB_PX = 0.5; // 들썩이는 높이 (뷰박스 단위)
const FRONT_OFFSET = 2.4; // 앞바퀴 띠를 뒷바퀴보다 이만큼(라디안) 엇갈리게

// 프로토타입의 SVG 자전거를 그대로 Path2D로 (뷰박스 56×44, 바퀴 바닥이 y=42)
const WHEEL_R = 9;
const REAR = { x: 12, y: 33 };
const FRONT = { x: 44, y: 33 };
const FRAME = new Path2D('M12 33 L26 33 L22 16 Z M22 16 L38 17 L26 33 M38 17 L44 33');
const BARS = new Path2D('M18 14 H26 M38 17 L37 11 M34 11 L41 10');

// 자전거: 카메라 정면(camX), 차선 깊이 laneZ의 길 위에. 여의나루행이면 좌우 반전
// 바퀴 띠와 들썩임은 시간이 아니라 '달린 거리(camX)'로 정한다 -> 멈추면 같이 멈춘다
export function drawBike(
  ctx: CanvasRenderingContext2D,
  view: View,
  light: Light,
  time: number,
  laneZ: number,
  facingRight: boolean,
) {
  const [x, groundY] = project(view, [view.camX, 0, laneZ]);
  const scale = BASE_Z / laneZ;

  // 앞으로 간 거리 -> 바퀴 각도 (반대 방향으로 갈 땐 부호를 뒤집어야 그림을 뒤집어도 앞으로 굴러간다)
  const forward = facingRight ? view.camX : -view.camX;
  const wheelAngle = forward / WHEEL_R_M;
  const bob = Math.sin(wheelAngle / BOB_EVERY) * BOB_PX;
  const night = light.night;

  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(facingRight ? scale : -scale, scale);
  ctx.translate(-28, -42); // 뷰박스 가운데 아래(28, 42)를 기준점으로
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 바닥 그림자 (들썩여도 그림자는 바닥에)
  ctx.fillStyle = `rgba(0,0,0,${0.14 - night * 0.06})`;
  ctx.beginPath();
  ctx.ellipse(28, 42.5, 25, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, bob);
  drawWheel(ctx, REAR.x, REAR.y, wheelAngle);
  drawWheel(ctx, FRONT.x, FRONT.y, wheelAngle + FRONT_OFFSET);

  ctx.strokeStyle = '#4f8cff';
  ctx.lineWidth = 2.6;
  ctx.stroke(FRAME);

  ctx.strokeStyle = '#fff';
  ctx.stroke(BARS);

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(26, 33, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // 밤: 안장 뒤 빨간 후미등 (1초에 두 번 깜빡)
  if (night > 0) {
    const on = Math.sin(time * Math.PI * 4) > 0 ? 1 : 0.25;
    ctx.fillStyle = `rgba(255,70,70,${night * on})`;
    ctx.beginPath();
    ctx.arc(17, 18, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// 바퀴: 흰 테 + 테를 따라 도는 연한 회색 띠 하나 (바퀴살 없이 회전을 보여준다)
function drawWheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number) {
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx, cy, WHEEL_R, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(175,185,200,.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, WHEEL_R, angle, angle + 1.4); // 약 80° 길이
  ctx.stroke();
}