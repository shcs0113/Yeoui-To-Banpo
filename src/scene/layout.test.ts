import { describe, it, expect } from 'vitest';
import { dockCenterY, grassTopY, phoneDockFit, restCenterY } from './layout';

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

describe('phoneDockFit', () => {
  it('잔디 띠가 넉넉하면 줄이지 않는다', () => {
    // 800px: 잔디 띠 608 ~ 800, 쓸 수 있는 높이 192 - 6 - 22 = 164
    const fit = phoneDockFit(800, 150);
    expect(fit.scale).toBe(1);
    expect(fit.centerY).toBeCloseTo(608 + 6 + 164 / 2); // 696
  });

  it('독이 띠보다 크면 띠에 맞게 줄인다', () => {
    expect(phoneDockFit(800, 328).scale).toBeCloseTo(0.5); // 164 / 328
  });

  it('높이를 아직 못 쟀으면(0) 그대로', () => {
    expect(phoneDockFit(800, 0).scale).toBe(1);
  });
});

describe('restCenterY', () => {
  it('키 큰 화면: 시계 아래가 수평선(368) 14px 위에 닿는다', () => {
    // 368 - 200/2 - 14 = 254
    expect(restCenterY(800, 200, 142)).toBe(254);
  });

  it('낮은 화면: 경로 바와 겹치지 않게 아래로 내린다', () => {
    // 수평선 0.46 × 560 = 257.6 → 257.6 - 100 - 14 = 143.6 보다
    // 경로 바 아래 142 + 12 + 100 = 254 가 더 아래라서 254
    expect(restCenterY(560, 200, 142)).toBe(254);
  });
});
