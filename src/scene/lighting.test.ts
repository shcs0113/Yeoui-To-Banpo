import { describe, it, expect } from 'vitest';
import { lightAt } from './lighting';

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
