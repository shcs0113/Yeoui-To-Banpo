import type { TimerAction, TimerState } from './types';

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

    default:
      return state;
  }
}
