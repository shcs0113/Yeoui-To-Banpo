import type { HistoryRecord, Settings, TimerAction, TimerState } from './types';

const MIN = 60_000;

export const SKIP_LAPSE_MS = 5_000; // 휴식 건너뛰기 타임랩스 길이

// 설정 하나의 허용 범위와 단위
interface Limit {
  min: number;
  max: number;
  step: number;
}

// 설정마다 허용 범위와 단위
export const SETTING_LIMITS = {
  focusMin: { min: 30, max: 60, step: 5 },
  breakMin: { min: 5, max: 30, step: 5 },
  cycles: { min: 1, max: 10, step: 1 },
} as const satisfies Record<keyof Settings, Limit>;

// 값을 단위에 맞춰 반올림하고 범위 안으로 자른다. 숫자가 아니면 이전 값 유지
function snap(value: number, limit: Limit, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const stepped = Math.round((value - limit.min) / limit.step) * limit.step + limit.min;
  return Math.min(limit.max, Math.max(limit.min, stepped));
}

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
    case 'UPDATE_SETTINGS': {
      // 출발 전에만 바꿀 수 있음 (출발 후 잠금)
      if (state.phase !== 'setup') return state;
      const next = { ...state.settings, ...action.patch };
      const prev = state.settings;
      return {
        ...state,
        settings: {
          focusMin: snap(next.focusMin, SETTING_LIMITS.focusMin, prev.focusMin),
          breakMin: snap(next.breakMin, SETTING_LIMITS.breakMin, prev.breakMin),
          cycles: snap(next.cycles, SETTING_LIMITS.cycles, prev.cycles),
        },
      };
    }

    case 'SET_SPEED': {
      // 달리는 중에는 못 바꿈. 멈춘 상태면 남은 "가상 시간"이 유지되도록 다시 계산
      if (state.status === 'running' || action.speed === state.speed) return state;
      const ratio = state.speed / action.speed;
      return {
        ...state,
        speed: action.speed,
        durationMs: state.durationMs * ratio,
        remainingMs: state.remainingMs * ratio,
      };
    }

    case 'TO_SETUP':
      // 처음 화면으로. 설정, 배속, 기록은 남긴다
      return {
        ...initState(),
        settings: state.settings,
        speed: state.speed,
        history: state.history,
      };

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
      // 모든 action을 처리했다면 여기는 절대 올 수 없다
      action satisfies never;
      return state;
  }
}
