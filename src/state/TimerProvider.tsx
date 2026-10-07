import { type ReactNode, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { derive } from './derive';
import { type TimerApi, TimerContext } from './TimerContext';
import { initState, timerReducer } from './timerReducer';

const TICK_MS = 200; // 구간이 끝났는지 확인하는 간격

// 앱 전체에 타이머를 하나 두고, 아래 컴포넌트들이 useTimer()로 꺼내 쓴다
export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(timerReducer, undefined, initState);
  const [autoStart, setAutoStart] = useState(true);

  // TICK이 읽을 최신 autoStart (바뀔 때마다 interval을 다시 만들지 않으려고 ref에)
  const autoStartRef = useRef(autoStart);
  useEffect(() => {
    autoStartRef.current = autoStart;
  }, [autoStart]);

  // 달리는 동안만 TICK. 구간이 끝나지 않았으면 reducer가 같은 state를 돌려줘서 리렌더도 없다
  const running = state.status === 'running';
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      dispatch({ type: 'TICK', now: Date.now(), autoStart: autoStartRef.current });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  const api = useMemo<TimerApi>(
    () => ({
      state,
      autoStart,
      setAutoStart,
      start: () => dispatch({ type: 'START', now: Date.now() }),
      pause: () => dispatch({ type: 'PAUSE', now: Date.now() }),
      resume: () => dispatch({ type: 'RESUME', now: Date.now() }),
      giveUp: () => dispatch({ type: 'GIVE_UP', now: Date.now() }),
      skipBreak: () => {
        const now = Date.now();
        dispatch({ type: 'SKIP_BREAK', now, fromT: derive(state, now).skyT }); // 지금 하늘에서 출발
      },
      toSetup: () => dispatch({ type: 'TO_SETUP' }),
      updateSettings: (patch) => dispatch({ type: 'UPDATE_SETTINGS', patch }),
      setSpeed: (speed) => dispatch({ type: 'SET_SPEED', speed }),
    }),
    [state, autoStart],
  );

  return <TimerContext value={api}>{children}</TimerContext>;
}
