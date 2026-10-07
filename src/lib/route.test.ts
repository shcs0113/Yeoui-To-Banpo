import { describe, it, expect } from 'vitest';
import { ROUTE_END_X } from '../constants/course';
import { routeProgress } from './route';

describe('routeProgress', () => {
  it('반포행 출발: 0%, 다음은 원효대교 1.30km', () => {
    expect(routeProgress(0, true)).toEqual({
      percent: 0,
      legKm: 0,
      next: { name: '원효대교', km: 1.3 },
    });
  });

  it('반포행 중간(3400m): 50%, 3.40km 달림, 다음은 동작대교', () => {
    const r = routeProgress(3400, true);
    expect(r.percent).toBe(50);
    expect(r.legKm).toBeCloseTo(3.4);
    expect(r.next?.name).toBe('동작대교');
    expect(r.next?.km).toBeCloseTo(1.9);
  });

  it('여의나루행은 반대로: 6000m면 0.8km 달렸고 다음은 동작대교', () => {
    const r = routeProgress(6000, false);
    expect(r.legKm).toBeCloseTo(0.8);
    expect(r.next).toEqual({ name: '동작대교', km: 0.7 });
  });

  it('도착하면 다음 지점이 없다', () => {
    expect(routeProgress(ROUTE_END_X, true).next).toBeNull();
    expect(routeProgress(0, false).next).toBeNull();
  });

  it('다리 바로 위에 있으면 그 다리는 지난 걸로 친다', () => {
    expect(routeProgress(1300, true).next?.name).toBe('한강대교');
  });
});
