import { describe, it, expect } from 'vitest';
import { LANE_TO_BANPO, LANE_TO_YEOUI, approach, laneFor } from './lane';

describe('laneFor', () => {
  it('반포행은 카메라 쪽 차선, 여의나루행은 건너편 차선 (우측통행)', () => {
    expect(laneFor(true)).toBe(LANE_TO_BANPO);
    expect(laneFor(false)).toBe(LANE_TO_YEOUI);
    expect(LANE_TO_BANPO).toBeLessThan(LANE_TO_YEOUI);
  });
});

describe('approach', () => {
  it('한 프레임엔 조금만 움직인다', () => {
    const next = approach(9.5, 12.5, 1 / 60);
    expect(next).toBeGreaterThan(9.5);
    expect(next).toBeLessThan(10);
  });

  it('프레임이 아무리 길어도 목표를 넘어가지 않는다', () => {
    expect(approach(9.5, 12.5, 5)).toBe(12.5);
  });

  it('1초쯤 지나면 거의 도착한다', () => {
    let z = 9.5;
    for (let i = 0; i < 60; i++) z = approach(z, 12.5, 1 / 60);
    expect(z).toBeGreaterThan(12.3);
  });
});
