import { describe, it, expect } from 'vitest';
import { makeRandom } from './random';

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
