import { describe, it, expect } from 'vitest';
import { initState, timerReducer } from './timerReducer';
import type { TimerAction, TimerState } from './types';

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

// 여러 액션을 차례로 적용하는 도우미
const run = (s: TimerState, ...actions: TimerAction[]) => actions.reduce(timerReducer, s);
const tick = (now: number, autoStart = true): TimerAction => ({ type: 'TICK', now, autoStart });

describe('TICK: 집중 -> 휴식 -> 다음 사이클', () => {
  it('아직 시간이 남았으면 같은 상태를 돌려준다', () => {
    const s = started(0);
    expect(timerReducer(s, tick(10 * MIN))).toBe(s);
  });

  it('30분이 지나면 휴식이 시작되고 기록이 남는다', () => {
    const s = run(started(0), tick(30 * MIN));
    expect(s.phase).toBe('break');
    expect(s.endAt).toBe(35 * MIN);
    expect(s.history).toHaveLength(1);
    expect(s.history[0]).toMatchObject({ kind: 'focus', cycle: 0, toBanpo: true, completed: true });
  });

  it('휴식이 끝나면 다음 사이클이 반대 방향으로 시작된다', () => {
    const s = run(started(0), tick(30 * MIN), tick(35 * MIN));
    expect(s.phase).toBe('focus');
    expect(s.status).toBe('running');
    expect(s.cycle).toBe(1);
    expect(s.history[0]).toMatchObject({ kind: 'break', completed: true });
  });

  it('자동 출발이 꺼져 있으면 출발선에서 기다린다', () => {
    const s = run(started(0), tick(30 * MIN), tick(35 * MIN, false));
    expect(s.phase).toBe('focus');
    expect(s.status).toBe('idle');
    expect(s.endAt).toBeNull();
  });

  it('마지막 사이클의 집중이 끝나면 휴식 없이 완주한다', () => {
    const one = { ...initState(), settings: { focusMin: 30, breakMin: 5, cycles: 1 } };
    const s = run(one, { type: 'START', now: 0 }, tick(30 * MIN));
    expect(s.phase).toBe('done');
    expect(s.status).toBe('idle');
  });

  it('2사이클을 끝까지 달리면 기록이 3개(집중, 휴식, 집중) 남는다', () => {
    const two = { ...initState(), settings: { focusMin: 30, breakMin: 5, cycles: 2 } };
    const s = run(two, { type: 'START', now: 0 }, tick(30 * MIN), tick(35 * MIN), tick(65 * MIN));
    expect(s.phase).toBe('done');
    expect(s.history.map((r) => r.kind)).toEqual(['focus', 'break', 'focus']);
    expect(s.history[0].toBanpo).toBe(false);
  });

  it('일시정지 중에는 시간이 지나도 넘어가지 않는다', () => {
    const s = run(started(0), { type: 'PAUSE', now: 10 * MIN });
    expect(timerReducer(s, tick(60 * MIN))).toBe(s);
  });

  it('배속을 써도 기록에는 가상 시간(30분)이 남는다', () => {
    const fast = timerReducer({ ...initState(), speed: 60 }, { type: 'START', now: 0 });
    const s = timerReducer(fast, tick(30_000));
    expect(s.history[0].elapsedMs).toBe(30 * MIN);
  });
});
