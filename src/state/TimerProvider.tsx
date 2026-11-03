import { type ReactNode, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { effectsDefault } from '../constants/theme';
import { parseHistory, parsePrefs, restoreSession, toSession } from '../lib/persist';
import { KEYS, load, save } from '../lib/storage';
import { derive } from './derive';
import { type TimerApi, TimerContext } from './TimerContext';
import { initState, timerReducer } from './timerReducer';
import type { SkyMode, SkyPreset, Theme, TimerState } from './types';

const TICK_MS = 200; // 구간이 끝났는지 확인하는 간격

// 앱을 켤 때 한 번: 저장해 둔 설정, 기록, 진행 중이던 구간을 불러온다 (없으면 기본값)
function loadSaved() {
  const prefs = parsePrefs(load(KEYS.prefs));
  const base: TimerState = {
    ...initState(),
    settings: prefs.settings,
    history: parseHistory(load(KEYS.history)),
  };
  return { prefs, state: restoreSession(base, load(KEYS.session)) };
}

// 앱 전체에 타이머를 하나 두고, 아래 컴포넌트들이 useTimer()로 꺼내 쓴다
export function TimerProvider({ children }: { children: ReactNode }) {
  const [saved] = useState(loadSaved); // 처음 한 번만 읽는다
  const [state, dispatch] = useReducer(timerReducer, saved.state);
  const [autoStart, setAutoStart] = useState(saved.prefs.autoStart);
  const [theme, setTheme] = useState<Theme>(saved.prefs.theme);
  const [effects, setEffects] = useState(saved.prefs.effects);
  const [skyMode, setSkyMode] = useState<SkyMode>(saved.prefs.skyMode);
  const [skyPreset, setSkyPreset] = useState<SkyPreset>(saved.prefs.skyPreset);

  // 저장: 바뀔 때마다
  const { settings, history } = state;
  useEffect(() => {
    save(KEYS.prefs, { settings, theme, effects, skyMode, skyPreset, autoStart });
  }, [settings, theme, effects, skyMode, skyPreset, autoStart]);
  useEffect(() => save(KEYS.history, history), [history]);

  // 진행 중인 구간: 상태가 바뀔 때 + 창을 닫거나 다른 앱으로 넘어갈 때(그 순간의 남은 시간으로)
  // 달리는 중엔 상태가 그대로라(끝나는 시각만 들고 있다) 닫히는 순간에 한 번 더 저장해야 맞는다
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
    save(KEYS.session, toSession(state, Date.now()));
  }, [state]);
  useEffect(() => {
    const flush = () => save(KEYS.session, toSession(stateRef.current, Date.now()));
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

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
      theme,
      // 계절을 바꾸면 흩날림도 그 계절 기본값으로 (바꾼 뒤엔 직접 켜고 끌 수 있다)
      setTheme: (next) => {
        setTheme(next);
        setEffects(effectsDefault(next));
      },
      effects,
      setEffects,
      skyMode,
      setSkyMode,
      skyPreset,
      setSkyPreset,
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
    [state, autoStart, theme, effects, skyMode, skyPreset],
  );

  return <TimerContext value={api}>{children}</TimerContext>;
}
