import { createContext, useContext } from 'react';
import type { Settings, Speed, TimerState } from './types';

// 화면이 타이머를 쓰는 창구: 상태 + 동작 함수들 (현재 시각은 함수가 알아서 넣는다)
export interface TimerApi {
  state: TimerState;
  autoStart: boolean; // 휴식 끝나면 다음 사이클 자동 출발
  setAutoStart: (on: boolean) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  giveUp: () => void;
  skipBreak: () => void;
  toSetup: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setSpeed: (speed: Speed) => void;
}

export const TimerContext = createContext<TimerApi | null>(null);

export function useTimer(): TimerApi {
  const api = useContext(TimerContext);
  if (!api) throw new Error('useTimer는 <TimerProvider> 안에서만 쓸 수 있어요');
  return api;
}
