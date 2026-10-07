import type { HistoryRecord, TimerAction, TimerState } from './types';

const MIN = 60_000;

export const SKIP_LAPSE_MS = 5_000; // 휴식 건너뛰기 타임랩스 길이

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

// 지금 시점의 남은 시간 (달리는 중이면 endAt으로 계산, 멈춰 있으면 저장된 값)
function remainingAt(state: TimerState, now: number): number {
  if (state.status === 'running' && state.endAt !== null) {
    return Math.max(0, state.endAt - now);
  }
  return state.remainingMs;
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

    case 'GIVE_UP': {
      // 집중 중(달리는 중, 멈춘 중)에만. 이번 구간 출발선으로 돌아간다
      if (state.phase !== 'focus' || state.status === 'idle') return state;
      const history = addRecord(
        { ...state, remainingMs: remainingAt(state, action.now) },
        action.now,
        'focus',
        false,
      );
      return {
        ...state,
        history,
        status: 'idle',
        remainingMs: state.durationMs,
        endAt: null,
        startedAt: null,
      };
    }

    case 'SKIP_BREAK': {
      // 휴식 중에만. 5초 타임랩스로 아침을 만든 뒤 다음 사이클로
      if (state.phase !== 'break') return state;
      return {
        ...state,
        phase: 'lapse',
        status: 'running',
        remainingMs: remainingAt(state, action.now),
        endAt: null,
        lapse: { fromT: action.fromT, startAt: action.now, endAt: action.now + SKIP_LAPSE_MS },
      };
    }

    case 'TICK': {
      if (state.status !== 'running') return state;

      // 건너뛰기 타임랩스가 끝나면 → 다음 사이클 집중
      if (state.phase === 'lapse') {
        if (state.lapse === null || action.now < state.lapse.endAt) return state;
        const history = addRecord(state, action.now, 'break', false);
        return startFocus(
          { ...state, history, cycle: state.cycle + 1 },
          action.now,
          action.autoStart,
        );
      }

      // 여기부터는 달리는 중인 집중·휴식
      if (state.endAt === null) return state;
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
