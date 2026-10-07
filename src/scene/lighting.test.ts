import { describe, it, expect } from 'vitest';
import { lightAt, shade } from './lighting';

describe('lightAt', () => {
  it('0과 1은 같은 낮 하늘이다 (하루가 한 바퀴 돈다)', () => {
    expect(lightAt(1)).toEqual(lightAt(0));
  });

  it('낮에는 불빛, 별이 없고 밝기 100%', () => {
    expect(lightAt(0.1)).toMatchObject({ night: 0, stars: 0, daylight: 1 });
  });

  it('한밤(0.55)에는 불빛, 별이 다 켜지고 밝기 30%', () => {
    const l = lightAt(0.55);
    expect(l.night).toBe(1);
    expect(l.stars).toBe(1);
    expect(l.daylight).toBeCloseTo(0.3);
  });

  it('키 사이 값은 앞뒤 색을 섞는다 (낮 -> 노을 중간)', () => {
    const day = lightAt(0.25).bottom;
    const sunset = lightAt(0.37).bottom;
    const mid = lightAt(0.31).bottom;
    expect(mid[0]).toBeCloseTo((day[0] + sunset[0]) / 2);
  });

  it('범위 밖 값은 잘라서 처리한다', () => {
    expect(lightAt(-1)).toEqual(lightAt(0));
    expect(lightAt(2)).toEqual(lightAt(1));
  });
});

describe('shade', () => {
  const day = lightAt(0);
  const night = lightAt(0.55);

  it('가까운 물체는 낮에 원래 색 그대로', () => {
    expect(shade(day, 0, 100, 50)).toBe('rgba(255,0,0,1)');
  });

  it('밤에는 같은 물체가 어두워진다', () => {
    expect(shade(night, 0, 100, 50)).toBe('rgba(77,0,0,1)'); // 밝기 50% × 0.3
  });

  it('멀수록 수평선 하늘색에 가까워진다', () => {
    const [r, g, b] = day.bottom;
    const far = `rgba(${Math.round(255 * 0.2 + r * 0.8)},${Math.round(g * 0.8)},${Math.round(b * 0.8)},1)`;
    expect(shade(day, 0, 100, 50, 5000)).toBe(far);
  });
});
