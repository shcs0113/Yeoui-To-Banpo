import { type Vec3, type View, clipPolygon, project } from './projection';

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
