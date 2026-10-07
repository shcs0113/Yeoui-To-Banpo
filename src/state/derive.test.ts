import { describe, it, expect } from 'vitest';
import { ROUTE_END_X } from '../constants/course';
import { derive } from './derive';
import { SKIP_LAPSE_MS, initState, timerReducer } from './timerReducer';
import type { TimerAction, TimerState } from './types';

const MIN = 60_000;
const run = (s: TimerState, ...actions: TimerAction[]) => actions.reduce(timerReducer, s);
const tick = (now: number): TimerAction => ({ type: 'TICK', now, autoStart: true });
const started = run(initState(), { type: 'START', now: 0 }); // 30분 집중, 5분 휴식

describe('setup / focus', () => {
  it('출발 전에는 여의나루, 낮', () => {
    const d = derive(initState(), 0);
    expect(d).toMatchObject({ toBanpo: true, progress: 0, skyT: 0, cameraX: 0 });
  });

  it('반포행 15분째: 절반 지점, 하늘은 노을 쪽(0.25)', () => {
    const d = derive(started, 15 * MIN);
    expect(d.remainingMs).toBe(15 * MIN);
    expect(d.progress).toBeCloseTo(0.5);
    expect(d.skyT).toBeCloseTo(0.25);
    expect(d.cameraX).toBeCloseTo(ROUTE_END_X / 2);
  });

  it('멈춰 있으면 시간이 지나도 위치가 그대로다', () => {
    const paused = run(started, { type: 'PAUSE', now: 10 * MIN });
    expect(derive(paused, 10 * MIN)).toEqual(derive(paused, 50 * MIN));
  });

  it('여의나루행(cycle 1)은 반포에서 출발해 거꾸로 간다', () => {
    const s = run(started, tick(30 * MIN), tick(35 * MIN)); // cycle 1 시작
    expect(derive(s, 35 * MIN).cameraX).toBeCloseTo(ROUTE_END_X);
    expect(derive(s, 50 * MIN).cameraX).toBeCloseTo(ROUTE_END_X / 2);
    expect(derive(s, 50 * MIN).toBanpo).toBe(false);
  });

  it('남은 시간은 음수가 되지 않는다', () => {
    expect(derive(started, 40 * MIN).remainingMs).toBe(0);
  });
});

describe('break: 마지막 1분 타임랩스', () => {
  const resting = run(started, tick(30 * MIN)); // 30~35분 휴식

  it('휴식 초반은 밤(0.5)', () => {
    const d = derive(resting, 31 * MIN);
    expect(d.progress).toBe(1);
    expect(d.skyT).toBeCloseTo(0.5);
    expect(d.cameraX).toBeCloseTo(ROUTE_END_X);
  });

  it('마지막 30초면 0.75, 끝나는 순간 1(아침)', () => {
    expect(derive(resting, 35 * MIN - 30_000).skyT).toBeCloseTo(0.75);
    expect(derive(resting, 35 * MIN).skyT).toBeCloseTo(1);
  });

  it('배속을 써도 타임랩스는 가상 시간 1분 기준이다', () => {
    const fast = run({ ...initState(), speed: 60 }, { type: 'START', now: 0 }, tick(30_000));
    // 휴식 5분 = 실제 5초. 마지막 가상 30초 = 실제 0.5초
    expect(derive(fast, 30_000 + 4_500).skyT).toBeCloseTo(0.75);
  });
});

describe('lapse / done', () => {
  const skipped = run(started, tick(30 * MIN), {
    type: 'SKIP_BREAK',
    now: 31 * MIN,
    fromT: 0.5,
  });

  it('건너뛰기: 5초 동안 밤에서 아침으로', () => {
    expect(derive(skipped, 31 * MIN).skyT).toBeCloseTo(0.5);
    expect(derive(skipped, 31 * MIN + SKIP_LAPSE_MS / 2).skyT).toBeCloseTo(0.75);
    expect(derive(skipped, 31 * MIN + SKIP_LAPSE_MS).skyT).toBeCloseTo(1);
  });

  it('완주하면 도착지, 밤', () => {
    const one = { ...initState(), settings: { focusMin: 30, breakMin: 5, cycles: 1 } };
    const done = run(one, { type: 'START', now: 0 }, tick(30 * MIN));
    expect(derive(done, 40 * MIN)).toMatchObject({ progress: 1, skyT: 0.5, cameraX: ROUTE_END_X });
  });
});
