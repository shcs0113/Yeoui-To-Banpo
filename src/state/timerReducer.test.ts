import { describe, it, expect } from 'vitest';
import { initState, timerReducer } from './timerReducer';
import type { TimerState } from './types';

const MIN = 60_000;

// 출발한 상태를 빠르게
const started = (now = 0): TimerState => timerReducer(initState(), { type: 'START', now });

describe('START', () => {
  it('설정 화면에서 출발하면 집중이 시작된다', () => {
    const s = started(1000);
    expect(s.phase).toBe('focus');
    expect(s.status).toBe('running');
    expect(s.cycle).toBe(0);
    expect(s.endAt).toBe(1000 + 30 * MIN);
  });

  it('배속 60이면 30분이 30초가 된다', () => {
    const s = timerReducer({ ...initState(), speed: 60 }, { type: 'START', now: 0 });
    expect(s.durationMs).toBe(30_000);
  });

  it('이미 달리는 중이면 아무것도 바뀌지 않는다', () => {
    const s = started();
    expect(timerReducer(s, { type: 'START', now: 5 * MIN })).toBe(s);
  });
});

describe('PAUSE / RESUME', () => {
  it('10분 달리고 멈추면 20분이 남는다', () => {
    const s = timerReducer(started(0), { type: 'PAUSE', now: 10 * MIN });
    expect(s.status).toBe('paused');
    expect(s.remainingMs).toBe(20 * MIN);
    expect(s.endAt).toBeNull();
  });

  it('5분 쉬었다 재개하면 끝나는 시각이 5분 밀린다', () => {
    let s = started(0);
    s = timerReducer(s, { type: 'PAUSE', now: 10 * MIN });
    s = timerReducer(s, { type: 'RESUME', now: 15 * MIN });
    expect(s.status).toBe('running');
    expect(s.endAt).toBe(35 * MIN);
  });

  it('달리는 중이 아니면 PAUSE는 무시된다', () => {
    const s = initState();
    expect(timerReducer(s, { type: 'PAUSE', now: 0 })).toBe(s);
  });

  it('멈춘 상태가 아니면 RESUME은 무시된다', () => {
    const s = started();
    expect(timerReducer(s, { type: 'RESUME', now: 0 })).toBe(s);
  });
});
