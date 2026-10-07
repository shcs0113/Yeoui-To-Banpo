import { describe, it, expect } from 'vitest';
import { hash01, makeRandom } from './random';

describe('makeRandom', () => {
  it('같은 seed면 같은 수열이 나온다', () => {
    const a = makeRandom(42);
    const b = makeRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('값은 0 이상 1 미만이다', () => {
    const r = makeRandom(1);
    const values = Array.from({ length: 1000 }, r);
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });
});

describe('hash01', () => {
  it('같은 n이면 항상 같은 값, 다른 n이면 다른 값', () => {
    expect(hash01(7)).toBe(hash01(7));
    expect(hash01(7)).not.toBe(hash01(8));
  });

  it('값은 0 이상 1 미만이다', () => {
    const values = Array.from({ length: 1000 }, (_, i) => hash01(i - 500));
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });
});
