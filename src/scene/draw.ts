import { type Vec3, type View, clipPolygon, clipSegment, project } from './projection';

// 3D 꼭짓점들로 된 면을 칠한다 (카메라 뒤는 잘라내고 투영)
export function fillPoly(
  ctx: CanvasRenderingContext2D,
  view: View,
  points: readonly Vec3[],
  fill: string | CanvasGradient,
) {
  const clipped = clipPolygon(points);
  if (clipped.length < 3) return;
  ctx.beginPath();
  clipped.forEach((p, i) => {
    const [x, y] = project(view, p);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

// 3D 선분을 긋는다. thick은 장면 단위(m) 굵기라서 멀수록 가늘어진다
export function strokeLine(
  ctx: CanvasRenderingContext2D,
  view: View,
  a: Vec3,
  b: Vec3,
  stroke: string,
  thick: number,
) {
  const seg = clipSegment(a, b);
  if (!seg) return;
  const [p, q] = seg;
  const [x1, y1] = project(view, p);
  const [x2, y2] = project(view, q);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(0.6, (view.focal * thick) / ((p[2] + q[2]) / 2));
  ctx.stroke();
}
