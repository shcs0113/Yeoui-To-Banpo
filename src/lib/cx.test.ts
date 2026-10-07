import { describe, it, expect } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
  it('여러 클래스를 공백으로 잇는다', () => {
    expect(cx('a', 'b c')).toBe('a b c');
  });

  it('조건부 클래스: false·null·undefined·빈 문자열은 빠진다', () => {
    const active = false;
    expect(cx('base', active && 'on', null, undefined, '')).toBe('base');
  });
});
