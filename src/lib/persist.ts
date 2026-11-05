import { effectsDefault } from '../constants/theme';
import { HISTORY_LIMIT, initState, remainingAt, SETTING_LIMITS, snap } from '../state/timerReducer';
import type {
  HistoryRecord,
  Settings,
  SkyMode,
  SkyPreset,
  Theme,
  TimerState,
  Todo,
} from '../state/types';

// 저장소에서 읽은 값 확인하기 (순수 함수)
// 다른 버전이 저장했거나 손상된 값일 수 있으니, 모양과 범위를 하나씩 확인하고 아니면 기본값

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const oneOf = <T extends string>(v: unknown, all: readonly T[], fallback: T): T =>
  all.includes(v as T) ? (v as T) : fallback;

// ---- 설정, 취향 ----

export interface Prefs {
  settings: Settings;
  theme: Theme;
  effects: boolean;
  skyMode: SkyMode;
  skyPreset: SkyPreset;
  autoStart: boolean;
}

const THEMES = ['spring', 'summer', 'autumn', 'winter'] as const;
const SKY_MODES = ['flow', 'fixed', 'real'] as const;
const SKY_PRESETS = ['day', 'sunset', 'night', 'dawn'] as const;

export function parsePrefs(raw: unknown): Prefs {
  const r = isObj(raw) ? raw : {};
  const s = isObj(r.settings) ? r.settings : {};
  const base = initState().settings;
  const theme = oneOf(r.theme, THEMES, 'summer');
  return {
    settings: {
      focusMin: snap(Number(s.focusMin), SETTING_LIMITS.focusMin, base.focusMin),
      breakMin: snap(Number(s.breakMin), SETTING_LIMITS.breakMin, base.breakMin),
      cycles: snap(Number(s.cycles), SETTING_LIMITS.cycles, base.cycles),
    },
    theme,
    effects: typeof r.effects === 'boolean' ? r.effects : effectsDefault(theme),
    skyMode: oneOf(r.skyMode, SKY_MODES, 'flow'),
    skyPreset: oneOf(r.skyPreset, SKY_PRESETS, 'night'),
    autoStart: typeof r.autoStart === 'boolean' ? r.autoStart : true,
  };
}

// ---- 작업 기록, 할 일 ----

function isRecord(v: unknown): v is HistoryRecord {
  return (
    isObj(v) &&
    typeof v.id === 'string' &&
    (v.kind === 'focus' || v.kind === 'break') &&
    isNum(v.cycle) &&
    typeof v.toBanpo === 'boolean' &&
    isNum(v.startedAt) &&
    isNum(v.elapsedMs) &&
    typeof v.completed === 'boolean'
  );
}

// 최신이 앞. 이상한 줄은 버리고 HISTORY_LIMIT개까지만
export function parseHistory(raw: unknown): HistoryRecord[] {
  return Array.isArray(raw) ? raw.filter(isRecord).slice(0, HISTORY_LIMIT) : [];
}

function isTodo(v: unknown): v is Todo {
  return (
    isObj(v) &&
    typeof v.id === 'string' &&
    typeof v.text === 'string' &&
    v.text.trim() !== '' &&
    typeof v.done === 'boolean'
  );
}

export function parseTodos(raw: unknown): Todo[] {
  return Array.isArray(raw) ? raw.filter(isTodo) : [];
}

// ---- 진행 중인 타이머 ----

// 다시 열면 이어 달릴 구간. 달리던 중이었어도 일시정지로, 배속이었어도 1배로 돌아온다
export interface Session {
  phase: 'focus' | 'break';
  status: 'idle' | 'paused'; // idle: 다음 사이클 출발선에서 대기 중이었음
  cycle: number;
  durationMs: number; // 1배 기준 (배속 주행이었으면 가상 시간으로 바꿔 둔다)
  remainingMs: number; // 닫힌 순간의 남은 시간, 1배 기준 (닫혀 있던 동안은 흐르지 않는다)
  startedAt: number | null;
}

// 지금 상태를 저장할 모양으로. 주행 중이 아니면(첫 화면, 완주) null = 지운다
export function toSession(state: TimerState, now: number): Session | null {
  if (state.phase !== 'focus' && state.phase !== 'break' && state.phase !== 'lapse') return null;
  return {
    // 휴식 건너뛰기 5초 연출 중이었으면: 연출은 버리고 그 휴식으로 (다시 건너뛸 수 있다)
    phase: state.phase === 'focus' ? 'focus' : 'break',
    status: state.status === 'idle' ? 'idle' : 'paused',
    cycle: state.cycle,
    // 배속은 저장하지 않아 다시 열면 1배: 실제 ms × 배속 = 1배로 같은 남은 시간(가상 시간)
    durationMs: state.durationMs * state.speed,
    remainingMs: remainingAt(state, now) * state.speed,
    startedAt: state.startedAt,
  };
}

// 저장된 구간을 base(설정, 기록을 불러온 첫 상태)에 얹는다. 이상하면 base 그대로
export function restoreSession(base: TimerState, raw: unknown): TimerState {
  if (!isObj(raw)) return base;
  const { phase, status, cycle, durationMs, remainingMs, startedAt } = raw;
  const ok =
    (phase === 'focus' || phase === 'break') &&
    (status === 'paused' || (status === 'idle' && phase === 'focus')) &&
    isNum(cycle) &&
    Number.isInteger(cycle) &&
    cycle >= 0 &&
    cycle < base.settings.cycles &&
    isNum(durationMs) &&
    durationMs > 0 &&
    isNum(remainingMs) &&
    remainingMs >= 0 &&
    remainingMs <= durationMs &&
    (startedAt === null || isNum(startedAt));
  if (!ok) return base;
  return {
    ...base,
    phase,
    status,
    cycle,
    durationMs,
    remainingMs,
    startedAt,
    endAt: null,
    lapse: null,
  };
}
