import { describe, it, expect } from 'vitest';
import { dockCenterY, grassTopY } from './layout';

describe('grassTopY', () => {
  it('800px 화면: 수평선(368) 아래 자전거길 앞 가장자리', () => {
    // focal 640, 카메라 높이 3m, 길 앞 가장자리 8m -> 368 + 640 * 3 / 8 = 608
    expect(grassTopY(800)).toBeCloseTo(608);
  });
});

describe('dockCenterY', () => {
  it('잔디 띠가 넉넉하면 띠 한가운데', () => {
    expect(dockCenterY(800, 100)).toBeCloseTo((608 + 800) / 2); // 704
  });

  it('독이 커서 바닥에 닿으면 바닥에서 16px 위로 올린다', () => {
    expect(dockCenterY(800, 260)).toBe(800 - 16 - 130);
  });
});
