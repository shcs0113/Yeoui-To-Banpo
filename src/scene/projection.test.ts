import { describe, it, expect } from 'vitest';
import {
  CAM_Y,
  NEAR,
  type Vec3,
  clipPolygon,
  clipSegment,
  inView,
  makeView,
  project,
} from './projection';

// 1000 × 800 화면, 카메라는 코스 100m 지점
const view = makeView(1000, 800, 100);

describe('makeView', () => {
  it('수평선은 화면 높이의 46%', () => {
    expect(view.horizon).toBeCloseTo(368);
  });

  it('창을 옆으로 늘려도 초점 거리(확대 정도)는 그대로다', () => {
    expect(makeView(2000, 800, 0).focal).toBe(makeView(1000, 800, 0).focal);
  });
});

describe('project', () => {
  it('카메라 정면, 눈높이의 점은 화면 중앙 수평선 위에 찍힌다', () => {
    const [x, y] = project(view, [100, CAM_Y, 50]);
    expect(x).toBeCloseTo(500);
    expect(y).toBeCloseTo(view.horizon);
  });

  it('같은 옆 거리라도 두 배 멀면 중심에서 절반만 떨어진다', () => {
    const [nearX] = project(view, [110, CAM_Y, 20]);
    const [farX] = project(view, [110, CAM_Y, 40]);
    expect(farX - 500).toBeCloseTo((nearX - 500) / 2);
  });

  it('높은 곳은 화면 위쪽(y가 작은 쪽)에 찍힌다', () => {
    const [, low] = project(view, [100, 0, 30]);
    const [, high] = project(view, [100, 20, 30]);
    expect(high).toBeLessThan(low);
  });
});

describe('clipPolygon', () => {
  const square = (z0: number, z1: number): Vec3[] => [
    [0, 0, z0],
    [10, 0, z0],
    [10, 0, z1],
    [0, 0, z1],
  ];

  it('전부 카메라 앞이면 그대로', () => {
    expect(clipPolygon(square(5, 10))).toEqual(square(5, 10));
  });

  it('전부 카메라 뒤면 빈 배열', () => {
    expect(clipPolygon(square(-10, -5))).toEqual([]);
  });

  it('걸쳐 있으면 NEAR에서 잘리고, 모든 점이 NEAR 이상이 된다', () => {
    const clipped = clipPolygon(square(-5, 10));
    expect(clipped.length).toBeGreaterThanOrEqual(3);
    expect(clipped.every((p) => p[2] >= NEAR)).toBe(true);
    expect(clipped.some((p) => p[2] === NEAR)).toBe(true);
  });
});

describe('clipSegment', () => {
  it('전부 뒤면 null', () => {
    expect(clipSegment([0, 0, -1], [0, 0, -2])).toBeNull();
  });

  it('한쪽만 뒤면 그쪽 끝을 NEAR로 당긴다', () => {
    const seg = clipSegment([0, 0, -10], [0, 10, 10]);
    expect(seg?.[0][2]).toBe(NEAR);
    expect(seg?.[1]).toEqual([0, 10, 10]);
  });
});

describe('inView', () => {
  it('카메라 정면은 보이고, 옆으로 아주 멀면 안 보인다', () => {
    expect(inView(view, 100, 50)).toBe(true);
    expect(inView(view, 5000, 50)).toBe(false);
  });

  it('멀리 있을수록 옆으로 더 넓게 보인다', () => {
    expect(inView(view, 400, 50)).toBe(false);
    expect(inView(view, 400, 500)).toBe(true);
  });
});
