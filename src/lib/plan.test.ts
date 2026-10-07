import { describe, it, expect } from 'vitest';
import { formatDuration, formatTimeOfDay, planOf } from './plan';

describe('planOf', () => {
  it('4사이클(30분·5분): 집중 4번 + 휴식 3번 = 135분, 27.2km, 마지막은 여의나루', () => {
    expect(planOf({ focusMin: 30, breakMin: 5, cycles: 4 })).toEqual({
      totalMin: 135,
      km: 27.2,
      lastToBanpo: false,
    });
  });

  it('1사이클이면 휴식 없이 반포에서 끝난다', () => {
    expect(planOf({ focusMin: 45, breakMin: 10, cycles: 1 })).toEqual({
      totalMin: 45,
      km: 6.8,
      lastToBanpo: true,
    });
  });

  it('홀수 사이클은 반포, 짝수 사이클은 여의나루에서 끝난다', () => {
    expect(planOf({ focusMin: 30, breakMin: 5, cycles: 3 }).lastToBanpo).toBe(true);
    expect(planOf({ focusMin: 30, breakMin: 5, cycles: 10 }).lastToBanpo).toBe(false);
  });
});

describe('formatDuration', () => {
  it('시간과 분을 한국어로', () => {
    expect(formatDuration(135)).toBe('2시간 15분');
    expect(formatDuration(60)).toBe('1시간');
    expect(formatDuration(45)).toBe('45분');
  });
});

describe('formatTimeOfDay', () => {
  it('24시간제 두 자리', () => {
    expect(formatTimeOfDay(new Date(2026, 9, 8, 22, 57).getTime())).toBe('22:57');
    expect(formatTimeOfDay(new Date(2026, 9, 8, 7, 5).getTime())).toBe('07:05');
  });
});
