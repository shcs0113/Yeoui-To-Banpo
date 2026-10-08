import { describe, it, expect } from 'vitest';
import { RIPPLE_ROWS, rippleXs, rippleZ } from './ripples';

describe('rippleZ', () => {
  it('가까운 줄 60m부터 먼 줄 960m까지', () => {
    expect(rippleZ(0)).toBeCloseTo(60);
    expect(rippleZ(RIPPLE_ROWS - 1)).toBeCloseTo(960);
    expect(rippleZ(5)).toBeGreaterThan(rippleZ(4));
  });
});

describe('rippleXs', () => {
  it('범위 안의 점만', () => {
    for (const x of rippleXs(3, 1000, 1500)) {
      expect(x).toBeGreaterThanOrEqual(1000);
      expect(x).toBeLessThanOrEqual(1500);
    }
  });

  it('장면에 고정: 보는 범위가 바뀌어도 겹치는 구간의 점은 같은 자리', () => {
    const a = rippleXs(3, 1000, 1500).filter((x) => x >= 1200);
    const b = rippleXs(3, 1200, 1800).filter((x) => x <= 1500);
    expect(a).toEqual(b);
  });

  it('간격은 깊이에 비례 (먼 줄일수록 듬성듬성)', () => {
    expect(rippleXs(0, 0, 10_000).length).toBeGreaterThan(rippleXs(15, 0, 10_000).length);
  });
});