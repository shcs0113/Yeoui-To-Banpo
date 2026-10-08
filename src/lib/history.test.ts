import { describe, it, expect } from 'vitest';
import type { HistoryRecord } from '../state/types';
import { recordTitle, summarize } from './history';

// 테스트용 기록 만들기: 필요한 값만 바꿔 쓴다
function rec(patch: Partial<HistoryRecord>): HistoryRecord {
  return {
    id: 'x',
    kind: 'focus',
    cycle: 0,
    toBanpo: true,
    startedAt: 0,
    elapsedMs: 30 * 60000,
    completed: true,
    ...patch,
  };
}

describe('summarize', () => {
  it('빈 기록은 전부 0', () => {
    expect(summarize([])).toEqual({ km: 0, focusMin: 0, sections: 0 });
  });

  it('끝까지 달린 집중만 센다 (포기·휴식 제외)', () => {
    const history = [
      rec({ cycle: 1, toBanpo: false }), // 완주 30분
      rec({ kind: 'break' }), // 휴식: 안 셈
      rec({ cycle: 0 }), // 완주 30분
      rec({ elapsedMs: 12 * 60000, completed: false }), // 포기: 안 셈
    ];
    expect(summarize(history)).toEqual({ km: 13.6, focusMin: 60, sections: 2 });
  });
});

describe('recordTitle', () => {
  it('집중은 사이클 번호와 방향', () => {
    expect(recordTitle(rec({ cycle: 0, toBanpo: true }))).toBe('CYCLE 1 · → 반포');
    expect(recordTitle(rec({ cycle: 1, toBanpo: false }))).toBe('CYCLE 2 · ← 여의나루');
  });

  it('휴식은 쉬는 장소', () => {
    expect(recordTitle(rec({ kind: 'break', toBanpo: true }))).toBe('휴식 · 반포');
    expect(recordTitle(rec({ kind: 'break', toBanpo: false }))).toBe('휴식 · 여의나루');
  });
});