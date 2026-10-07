import { describe, it, expect } from 'vitest';
import { cycleDots } from './cycleDots';

describe('cycleDots', () => {
  it('4사이클 중 두 번째 구간을 달리는 중: 앞 1개 채움, 2번째에 테두리', () => {
    expect(cycleDots(4, 1, false)).toEqual([
      { done: true, now: false },
      { done: false, now: true },
      { done: false, now: false },
      { done: false, now: false },
    ]);
  });

  it('집중을 끝내고 휴식 중이면 지금 구간도 채워진다', () => {
    expect(cycleDots(4, 1, true)[1]).toEqual({ done: true, now: true });
  });

  it('점 개수는 사이클 수와 같다', () => {
    expect(cycleDots(10, 0, false)).toHaveLength(10);
  });
});
