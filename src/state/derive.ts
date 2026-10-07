import { SKIP_LAPSE_MS, remainingAt } from './timerReducer';
import type { TimerState } from './types';

export const ROUTE_END_X = 6800; // 반포 도착 지점 (여의나루 = 0), 단위는 장면 좌표(m)
export const TIMELAPSE_MS = 60_000; // 휴식 마지막 1분 동안 밤 -> 아침 (가상 시간)

// 화면과 배경이 쓰는 값. state에 저장하지 않고 매번 계산한다
export interface Derived {
  toBanpo: boolean; // 이번 구간 방향
  remainingMs: number; // 화면에 보여줄 남은 시간 (실제 ms)
  progress: number; // 이번 구간 진행률 0 ~ 1
  skyT: number; // 하늘 0 = 낮, 0.5 = 밤, 1 = 다시 아침
  cameraX: number; // 카메라 위치 0(여의나루) ~ ROUTE_END_X(반포)
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// 0~1을 처음과 끝이 부드러운 0~1로 바꾼다
const smoothstep = (k: number) => k * k * (3 - 2 * k);

export function derive(state: TimerState, now: number): Derived {
  const toBanpo = state.cycle % 2 === 0;
  const remainingMs = remainingAt(state, now);
  let progress = 0;
  let skyT = 0;

  switch (state.phase) {
    case 'setup':
      break;

    case 'focus':
      // 출발선 대기 중이면 0, 아니면 지난 시간 비율. 하늘은 낮 -> 밤
      progress = state.status === 'idle' ? 0 : clamp01(1 - remainingMs / state.durationMs);
      skyT = progress * 0.5;
      break;

    case 'break': {
      // 도착해서 밤. 마지막 1분(가상 시간) 동안만 밤 -> 아침
      progress = 1;
      const virtualRemaining = remainingMs * state.speed;
      skyT = 0.5 + 0.5 * clamp01(1 - virtualRemaining / TIMELAPSE_MS);
      break;
    }

    case 'lapse': {
      // 건너뛴 순간의 하늘에서 아침까지 5초 동안
      progress = 1;
      const from = state.lapse?.fromT ?? 0.5;
      const k = state.lapse ? clamp01((now - state.lapse.startAt) / SKIP_LAPSE_MS) : 1;
      skyT = from + (1 - from) * smoothstep(k);
      break;
    }

    case 'done':
      progress = 1;
      skyT = 0.5;
      break;
  }

  const cameraX = (toBanpo ? progress : 1 - progress) * ROUTE_END_X;
  return { toBanpo, remainingMs, progress, skyT, cameraX };
}
