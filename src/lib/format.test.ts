import { describe, it, expect } from 'vitest';
import { formatClock } from './format';

describe('formatClock', () => {
  it('분:초 두 자리씩', () => {
    expect(formatClock(30 * 60_000)).toBe('30:00');
    expect(formatClock(65_000)).toBe('01:05');
  });

  it('남은 시간이라 초는 올림한다', () => {
    expect(formatClock(200)).toBe('00:01');
    expect(formatClock(59_001)).toBe('01:00');
  });

  it('0 이하는 00:00', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(-500)).toBe('00:00');
  });
});
