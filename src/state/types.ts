// 타이머 상태와 액션의 "모양"만 정의하는 파일

// 화면 단계
export type Phase = 'setup' | 'focus' | 'break' | 'lapse' | 'done';

// 타이머 동작 상태
export type Status = 'idle' | 'running' | 'paused';

// 테스트 배속
export type Speed = 1 | 10 | 60 | 300;

// 출발 전에 고르는 설정
export interface Settings {
  focusMin: number; // 30 - 60
  breakMin: number; // 5 - 30
  cycles: number; // 1 - 10
}

// 기록 한 줄
export interface HistoryRecord {
  id: string;
  kind: 'focus' | 'break';
  cycle: number;
  toBanpo: boolean; // true : 반포행, false : 여의도행
  startedAt: number;
  elapsedMs: number;
  completed: boolean;
}

// 휴식 건너뛰기 5초 타임랩스 정보
export interface Lapse {
  fromT: number;
  startAt: number;
  endAt: number;
}

// 타이머 전체 상태
export interface TimerState {
  settings: Settings;
  speed: Speed;
  phase: Phase;
  status: Status;
  cycle: number;
  durationMs: number; // 이번 구간 전체 길이
  remainingMs: number; // 멈춰 있을 때의 남은 시간
  endAt: number | null; // 달리는 중일 때만 값이 있음
  startedAt: number | null; // 이번 구간을 출발한 시각
  lapse: Lapse | null; // lapse 단계일 때만 값이 있음
  history: HistoryRecord[]; // 최신이 앞
}

// 상태를 바꾸는 모든 요청
export type TimerAction =
  | { type: 'UPDATE_SETTINGS'; patch: Partial<Settings> }
  | { type: 'SET_SPEED'; speed: Speed }
  | { type: 'START'; now: number }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESUME'; now: number }
  | { type: 'GIVE_UP'; now: number }
  | { type: 'SKIP_BREAK'; now: number; fromT: number }
  | { type: 'TICK'; now: number; autoStart: boolean }
  | { type: 'TO_SETUP' };
