import { describe, it, expect } from 'vitest';
import { SKY_PRESETS, skyAtClock, skyFor, skyLabelOf } from './sky';

const at = (h: number, m = 0) => new Date(2026, 9, 29, h, m);

describe('skyAtClock', () => {
  it('기준 시각에서는 표의 하늘 값', () => {
    expect(skyAtClock(at(5))).toBeCloseTo(0.72);
    expect(skyAtClock(at(8))).toBeCloseTo(0); // 아침 8시: 1.0 -> 0 (낮)
    expect(skyAtClock(at(18))).toBeCloseTo(0.36);
    expect(skyAtClock(at(19, 30))).toBeCloseTo(0.5);
  });

  it('1분 사이에 크게 튀는 곳이 없다 (자정, 아침 8시 넘어갈 때 포함)', () => {
    for (let m = 0; m < 24 * 60; m++) {
      const a = skyAtClock(at(0, m));
      const b = skyAtClock(at(0, m + 1));
      const diff = Math.abs(b - a);
      expect(Math.min(diff, 1 - diff)).toBeLessThan(0.01); // 0.999 -> 0.001 은 끊김이 아니다
    }
  });
});

describe('skyLabelOf', () => {
  it('고정 하늘 값은 자기 이름으로', () => {
    expect(skyLabelOf(SKY_PRESETS.day)).toBe('낮');
    expect(skyLabelOf(SKY_PRESETS.sunset)).toBe('노을');
    expect(skyLabelOf(SKY_PRESETS.night)).toBe('밤');
    expect(skyLabelOf(SKY_PRESETS.dawn)).toBe('새벽');
  });
});

describe('skyFor', () => {
  it('흐름은 타이머 값, 고정은 고른 값', () => {
    expect(skyFor('flow', 'night', 0.3, 0)).toBe(0.3);
    expect(skyFor('fixed', 'dawn', 0.3, 0)).toBe(0.72);
  });
});
