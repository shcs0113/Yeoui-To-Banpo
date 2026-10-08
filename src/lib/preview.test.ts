import { describe, it, expect } from 'vitest';
import type { Settings } from '../state/types';
import { jumpTo, previewKm, simAt, simOf, simSpan, skyWord } from './preview';

// 집중 30분 + 휴식 5분 = 35분
const S: Settings = { focusMin: 30, breakMin: 5, cycles: 2 };

describe('simSpan', () => {
  it('집중·타임랩스 비율', () => {
    const span = simSpan(S);
    expect(span.totalMs).toBe(35 * 60_000);
    expect(span.focusShare).toBeCloseTo(30 / 35);
    expect(span.lapseShare).toBeCloseTo(1 / 35);
  });
});

describe('simAt', () => {
  it('출발: 여의나루, 낮', () => {
    expect(simAt(0, true, S)).toMatchObject({ x: 0, skyT: 0 });
  });

  it('집중 절반: 코스 가운데, 하늘 0.25', () => {
    const p = simAt((30 / 35) * 0.5, true, S);
    expect(p.x).toBeCloseTo(3400);
    expect(p.skyT).toBeCloseTo(0.25);
  });

  it('여의나루행은 위치가 반대', () => {
    expect(simAt(0, false, S).x).toBe(6800);
  });

  it('휴식 중엔 도착 지점에서 밤, 끝에서 아침', () => {
    const resting = simAt(31 / 35, true, S); // 휴식 1분째 (타임랩스 전)
    expect(resting).toMatchObject({ x: 6800, skyT: 0.5 });
    expect(simAt(1, true, S).skyT).toBeCloseTo(1, 3);
  });
});

describe('simOf', () => {
  it('타임라인으로 옮겼으면 그 값', () => {
    expect(simOf(simAt(0.3, true, S), S)).toBe(0.3);
  });

  it('자유 조작 중이면 위치로 거꾸로 계산', () => {
    const free = { toBanpo: true, sim: null, x: 3400, skyT: 0.9 };
    expect(simOf(free, S)).toBeCloseTo((30 / 35) * 0.5);
  });
});

describe('jumpTo', () => {
  it('다리는 150m 앞에서, 그 시각의 하늘로', () => {
    const p = jumpTo(3400, true, S);
    expect(p.x).toBeCloseTo(3250);
    expect(p.skyT).toBeCloseTo((3250 / 6800) * 0.5);
  });

  it('여의나루행은 반대쪽(동쪽)으로 150m', () => {
    expect(jumpTo(3400, false, S).x).toBeCloseTo(3550);
  });

  it('출발·도착 지점은 그 자리', () => {
    expect(jumpTo(0, true, S).x).toBe(0);
    expect(jumpTo(6800, true, S).x).toBeCloseTo(6800);
  });
});

describe('previewKm', () => {
  it('방향 기준으로 달린 거리', () => {
    expect(previewKm({ toBanpo: true, sim: null, x: 1300, skyT: 0 })).toBeCloseTo(1.3);
    expect(previewKm({ toBanpo: false, sim: null, x: 1300, skyT: 0 })).toBeCloseTo(5.5);
  });
});

describe('skyWord', () => {
  it('하늘 이름', () => {
    expect(skyWord(0)).toBe('낮');
    expect(skyWord(0.35)).toBe('노을');
    expect(skyWord(0.5)).toBe('밤');
    expect(skyWord(0.9)).toBe('일출');
  });
});