import { type View, project } from '../projection';

const BASE_Z = 11; // 이 깊이에서 원래 크기(56×44px)

// 프로토타입의 SVG 자전거를 그대로 Path2D로 (뷰박스 56×44, 바퀴 바닥이 y=42)
const WHEELS = new Path2D(
  'M21 33a9 9 0 1 1 -18 0a9 9 0 1 1 18 0M53 33a9 9 0 1 1 -18 0a9 9 0 1 1 18 0',
);
const FRAME = new Path2D('M12 33 L26 33 L22 16 Z M22 16 L38 17 L26 33 M38 17 L44 33');
const BARS = new Path2D('M18 14 H26 M38 17 L37 11 M34 11 L41 10');

// 자전거: 카메라 정면(camX), 차선 깊이 laneZ의 길 위에. 여의나루행이면 좌우 반전
export function drawBike(
  ctx: CanvasRenderingContext2D,
  view: View,
  laneZ: number,
  facingRight: boolean,
) {
  const [x, groundY] = project(view, [view.camX, 0, laneZ]);
  const scale = BASE_Z / laneZ;

  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(facingRight ? scale : -scale, scale);
  ctx.translate(-28, -42); // 뷰박스 가운데 아래(28, 42)를 기준점으로
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.4;
  ctx.stroke(WHEELS);

  ctx.strokeStyle = '#4f8cff';
  ctx.lineWidth = 2.6;
  ctx.stroke(FRAME);

  ctx.strokeStyle = '#fff';
  ctx.stroke(BARS);

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(26, 33, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
