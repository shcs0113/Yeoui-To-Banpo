// 3D 장면 좌표 → 2D 화면 좌표 (원근 투영)
//
// 장면 좌표: x = 코스 방향(m), y = 높이(m), z = 화면 안쪽 깊이(m)
// 화면 좌표: 왼쪽 위가 (0, 0), 오른쪽·아래로 갈수록 커짐 (px)

export type Vec3 = readonly [x: number, y: number, z: number];
export type Vec2 = readonly [x: number, y: number];

export const CAM_Y = 3; // 카메라 눈높이 (m)
export const NEAR = 0.5; // 이보다 가까운 건 그리지 않음 (카메라 바로 앞 평면)

// 한 프레임을 그릴 때 필요한 화면·카메라 정보
export interface View {
  width: number; // 화면 너비 (px)
  height: number; // 화면 높이 (px)
  focal: number; // 초점 거리: 클수록 망원(확대), 작을수록 광각
  horizon: number; // 수평선의 화면 y (px)
  camX: number; // 카메라의 코스 위치 (m)
}

export function makeView(width: number, height: number, camX: number): View {
  return {
    width,
    height,
    // 높이에만 묶는다: 창을 옆으로 늘리면 확대되는 대신 양옆이 더 보인다
    focal: Math.max(height * 0.8, 320),
    horizon: height * 0.46,
    camX,
  };
}

// 핵심 공식: 멀수록(z가 클수록) 화면 중심으로 모인다
export function project(view: View, [x, y, z]: Vec3): Vec2 {
  return [
    view.width / 2 + (view.focal * (x - view.camX)) / z,
    view.horizon - (view.focal * (y - CAM_Y)) / z,
  ];
}

// 두 점 사이에서 z가 NEAR가 되는 지점
function cutAtNear(a: Vec3, b: Vec3): Vec3 {
  const t = (NEAR - a[2]) / (b[2] - a[2]);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR];
}

// 다각형에서 카메라 뒤(NEAR보다 가까운) 부분을 잘라낸다 (Sutherland–Hodgman)
export function clipPolygon(points: readonly Vec3[]): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const aIn = a[2] >= NEAR;
    const bIn = b[2] >= NEAR;
    if (aIn) out.push(a);
    if (aIn !== bIn) out.push(cutAtNear(a, b));
  }
  return out;
}

// 선분 버전. 전부 카메라 뒤면 null
export function clipSegment(a: Vec3, b: Vec3): [Vec3, Vec3] | null {
  const aIn = a[2] >= NEAR;
  const bIn = b[2] >= NEAR;
  if (!aIn && !bIn) return null;
  if (!aIn) return [cutAtNear(a, b), b];
  if (!bIn) return [a, cutAtNear(a, b)];
  return [a, b];
}

// x 위치(폭 margin 포함)의 물체가 깊이 z에서 화면 안에 들어오는지 (밖이면 그리지 않고 건너뜀)
export function inView(view: View, x: number, z: number, margin = 0): boolean {
  const halfWidthAtZ = ((view.width / 2 + 60) * z) / view.focal;
  return Math.abs(x - view.camX) - margin < halfWidthAtZ;
}
