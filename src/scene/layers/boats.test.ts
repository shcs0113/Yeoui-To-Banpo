import { describe, it, expect } from 'vitest';
import { BOATS, LOOP_FROM, LOOP_TO, SPEED, type Boat, sternX } from './boats';

const east: Boat = { dir: 1, z: 95, offset: 0 };
const west: Boat = { dir: -1, z: 150, offset: 0 };

describe('sternX', () => {
  it('1초에 SPEED만큼, 방향대로 간다', () => {
    expect(sternX(east, 10) - sternX(east, 9)).toBeCloseTo(SPEED);
    expect(sternX(west, 10) - sternX(west, 9)).toBeCloseTo(-SPEED);
  });

  it('언제나 오가는 구간 안에 있다 (아주 큰 시각에도)', () => {
    for (const b of BOATS) {
      for (const clock of [0, 123.4, 1_791_466_678]) {
        const x = sternX(b, clock);
        expect(x).toBeGreaterThanOrEqual(LOOP_FROM);
        expect(x).toBeLessThanOrEqual(LOOP_TO);
      }
    }
  });

  it('끝에 닿으면 반대쪽 끝에서 다시 시작한다', () => {
    const lap = (LOOP_TO - LOOP_FROM) / SPEED; // 한 바퀴 걸리는 시간
    expect(sternX(east, 0)).toBe(LOOP_FROM);
    expect(sternX(east, lap)).toBeCloseTo(LOOP_FROM);
    expect(sternX(west, 0)).toBe(LOOP_TO);
  });
});