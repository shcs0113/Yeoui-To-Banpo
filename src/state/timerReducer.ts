import type { HistoryRecord, TimerAction, TimerState } from './types';

const MIN = 60_000;

// 분 -> 실제로 기다릴 ms
export const minToMs = (min: number, speed: number) => (min * MIN) / speed;

// 앱 처음 켰을 때 상태
export function initState(): TimerState {
  return {
    settings: { focusMin: 30, breakMin: 5, cycles: 4 },
    speed: 1,
    phase: 'setup',
    status: 'idle',
    cycle: 0,
    durationMs: 0,
    remainingMs: 0,
    endAt: null,
    startedAt: null,
    lapse: null,
    history: [],
  };
}

// 집중 구간 준비 (run이 true면 출발, false면 출발선에서 대기)
function startFocus(state: TimerState, now: number, run: boolean): TimerState {
  const duration = minToMs(state.settings.focusMin, state.speed);
  return {
    ...state,
    phase: 'focus',
    status: run ? 'running' : 'idle',
    durationMs: duration,
    remainingMs: duration,
    endAt: run ? now + duration : null,
    startedAt: run ? now : null,
    lapse: null,
  };
}

// 지금 구간을 기록 한 줄로 만들어 맨 앞에 붙인 새 배열을 돌려준다
function addRecord(
  state: TimerState,
  now: number,
  kind: HistoryRecord['kind'],
  completed: boolean,
): HistoryRecord[] {
  const record: HistoryRecord = {
    id: `${now}-${state.history.length}`,
    kind,
    cycle: state.cycle,
    toBanpo: state.cycle % 2 === 0,
    startedAt: state.startedAt ?? now,
    elapsedMs: (state.durationMs - state.remainingMs) * state.speed,
    completed,
  };
  return [record, ...state.history];
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'START': {
      // 첫 출발
      if (state.phase === 'setup') {
        return startFocus({ ...state, cycle: 0 }, action.now, true);
      }
      // 출발선 대기
      if (state.phase === 'focus' && state.status === 'idle') {
        return {
          ...state,
          status: 'running',
          endAt: action.now + state.remainingMs,
          startedAt: action.now,
        };
      }
      return state;
    }

    case 'PAUSE': {
      // 달리는 중에만 멈춤
      if (state.status !== 'running' || state.phase === 'lapse' || state.endAt === null) {
        return state;
      }
      return {
        ...state,
        status: 'paused',
        remainingMs: state.endAt - action.now,
        endAt: null,
      };
    }

    case 'RESUME': {
      if (state.status !== 'paused') return state;
      return {
        ...state,
        status: 'running',
        endAt: action.now + state.remainingMs,
      };
    }

    case 'TICK': {
      // 달리는 중인 집중·휴식만 처리
      if (state.status !== 'running' || state.endAt === null) return state;
      if (state.phase !== 'focus' && state.phase !== 'break') return state;

      // 아직 안 끝났으면 상태는 그대로
      if (action.now < state.endAt) return state;

      const finished: TimerState = { ...state, remainingMs: 0 };

      // 집중 끝 -> 마지막 사이클이면 완주, 아니면 휴식 시작
      if (state.phase === 'focus') {
        const history = addRecord(finished, action.now, 'focus', true);
        if (state.cycle === state.settings.cycles - 1) {
          return { ...finished, history, phase: 'done', status: 'idle', endAt: null };
        }
        const duration = minToMs(state.settings.breakMin, state.speed);
        return {
          ...finished,
          history,
          phase: 'break',
          durationMs: duration,
          remainingMs: duration,
          endAt: action.now + duration,
          startedAt: action.now,
        };
      }

      // 휴식 끝 -> 다음 사이클 집중 (자동 출발이 꺼져 있으면 출발선에서 대기)
      const history = addRecord(finished, action.now, 'break', true);
      return startFocus(
        { ...finished, history, cycle: state.cycle + 1 },
        action.now,
        action.autoStart,
      );
    }

    default:
      return state;
  }
}
