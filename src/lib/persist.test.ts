import { describe, it, expect } from 'vitest';
import { HISTORY_LIMIT, initState, timerReducer } from '../state/timerReducer';
import type { HistoryRecord, TimerState } from '../state/types';
import { parseHistory, parsePrefs, parseTodos, restoreSession, toSession } from './persist';

const MIN = 60_000;
const started = (now = 0): TimerState => timerReducer(initState(), { type: 'START', now });
const rec = (id: string): HistoryRecord => ({
  id,
  kind: 'focus',
  cycle: 0,
  toBanpo: true,
  startedAt: 0,
  elapsedMs: 30 * MIN,
  completed: true,
});

describe('parsePrefs', () => {
  it('저장된 게 없으면 기본값 (여름이라 흩날림 꺼짐)', () => {
    expect(parsePrefs(undefined)).toEqual({
      settings: { focusMin: 30, breakMin: 5, cycles: 4 },
      theme: 'summer',
      effects: false,
      skyMode: 'flow',
      skyPreset: 'night',
      autoStart: true,
    });
  });

  it('저장된 값은 그대로, 범위를 벗어난 값은 단위에 맞춰 자른다', () => {
    const p = parsePrefs({
      settings: { focusMin: 999, breakMin: 12, cycles: 3 },
      theme: 'winter',
      effects: false,
      skyMode: 'real',
      skyPreset: 'dawn',
      autoStart: false,
    });
    expect(p.settings).toEqual({ focusMin: 60, breakMin: 10, cycles: 3 });
    expect(p).toMatchObject({ theme: 'winter', effects: false, skyMode: 'real', autoStart: false });
  });

  it('모르는 값은 기본값 (흩날림이 없으면 계절 기본값)', () => {
    const p = parsePrefs({ theme: 'rainy', skyMode: 1, settings: 'x' });
    expect(p.theme).toBe('summer');
    expect(p.skyMode).toBe('flow');
    expect(parsePrefs({ theme: 'autumn' }).effects).toBe(true);
  });
});

describe('parseHistory, parseTodos', () => {
  it('모양이 이상한 줄은 버린다', () => {
    expect(parseHistory([rec('a'), { id: 'b' }, null, rec('c')]).map((r) => r.id)).toEqual([
      'a',
      'c',
    ]);
    expect(parseHistory('oops')).toEqual([]);
    expect(
      parseTodos([{ id: '1', text: '운동', done: true }, { id: '2', text: '  ', done: false }, 3]),
    ).toEqual([{ id: '1', text: '운동', done: true }]);
  });

  it(`기록은 최근 ${HISTORY_LIMIT}개까지만`, () => {
    const many = Array.from({ length: HISTORY_LIMIT + 5 }, (_, i) => rec(String(i)));
    const kept = parseHistory(many);
    expect(kept).toHaveLength(HISTORY_LIMIT);
    expect(kept[0].id).toBe('0'); // 앞(최신)부터 남긴다
  });
});

describe('toSession, restoreSession', () => {
  it('첫 화면이면 저장할 게 없다', () => {
    expect(toSession(initState(), 0)).toBeNull();
  });

  it('달리던 중에 닫히면: 닫힌 순간의 남은 시간으로, 다시 열면 일시정지', () => {
    const session = toSession(started(0), 10 * MIN); // 10분 달린 뒤 닫힘
    expect(session).toMatchObject({ phase: 'focus', status: 'paused', remainingMs: 20 * MIN });

    const restored = restoreSession(initState(), JSON.parse(JSON.stringify(session)));
    expect(restored).toMatchObject({
      phase: 'focus',
      status: 'paused',
      cycle: 0,
      remainingMs: 20 * MIN,
      endAt: null,
    });
    // 이어서 재개하면 남은 20분부터
    const resumed = timerReducer(restored, { type: 'RESUME', now: 100 * MIN });
    expect(resumed.endAt).toBe(120 * MIN);
  });

  it('배속 주행 중이었으면 1배 기준 남은 시간으로 (다시 열면 1배, 일시정지)', () => {
    const fast = timerReducer({ ...initState(), speed: 60 }, { type: 'START', now: 0 }); // 30분 = 실제 30초
    const session = toSession(fast, 10_000); // 실제 10초 = 가상 10분 지남
    expect(session).toMatchObject({ durationMs: 30 * MIN, remainingMs: 20 * MIN });

    const restored = restoreSession(initState(), session);
    expect(restored).toMatchObject({ speed: 1, status: 'paused', remainingMs: 20 * MIN });
  });

  it('휴식 건너뛰기 연출 중이었으면 그 휴식으로 (일시정지)', () => {
    let s = timerReducer(started(0), { type: 'TICK', now: 30 * MIN, autoStart: true }); // 휴식 시작
    s = timerReducer(s, { type: 'SKIP_BREAK', now: 31 * MIN, fromT: 0.5 });
    expect(s.phase).toBe('lapse');
    expect(toSession(s, 31 * MIN)).toMatchObject({
      phase: 'break',
      status: 'paused',
      remainingMs: 4 * MIN,
    });
  });

  it('이상한 값이거나 사이클이 설정보다 크면 첫 화면 그대로', () => {
    const base = initState();
    expect(restoreSession(base, undefined)).toBe(base);
    const bad = { phase: 'focus', status: 'paused', cycle: 9, durationMs: 1, remainingMs: 1 };
    expect(restoreSession(base, bad)).toBe(base); // 기본 4사이클인데 10번째
    expect(restoreSession(base, { ...bad, cycle: 0, remainingMs: 5 })).toBe(base); // 남은 > 전체
  });
});

describe('작업 기록 개수 제한', () => {
  it(`기록이 ${HISTORY_LIMIT}개를 넘으면 오래된 것부터 버린다`, () => {
    const full = {
      ...started(0),
      history: Array.from({ length: HISTORY_LIMIT }, (_, i) => rec(String(i))),
    };
    const s = timerReducer(full, { type: 'GIVE_UP', now: 5 * MIN });
    expect(s.history).toHaveLength(HISTORY_LIMIT);
    expect(s.history[0].completed).toBe(false); // 방금 포기한 기록이 맨 앞
    expect(s.history.at(-1)?.id).toBe(String(HISTORY_LIMIT - 2)); // 맨 끝 하나가 빠졌다
  });
});
