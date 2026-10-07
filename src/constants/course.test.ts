import { describe, it, expect } from 'vitest';
import { ROUTE, ROUTE_END_X } from './course';

describe('ROUTE: 경로 지점', () => {
  it('여의나루에서 출발해 반포에서 끝난다', () => {
    expect(ROUTE.at(0)).toEqual({ name: '여의나루', x: 0 });
    expect(ROUTE.at(-1)).toEqual({ name: '반포', x: ROUTE_END_X });
  });

  it('장식용 다리와 도착점 너머 다리는 빠진다', () => {
    expect(ROUTE.map((p) => p.name)).toEqual([
      '여의나루',
      '원효대교',
      '한강대교',
      '동작대교',
      '반포',
    ]);
  });

  it('지점은 출발 → 도착 순서로 정렬돼 있다', () => {
    const xs = ROUTE.map((p) => p.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });
});
