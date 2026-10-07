import { useSyncExternalStore } from 'react';

// 창 높이를 React 상태처럼 쓴다 (창 크기가 바뀌면 다시 렌더)
const subscribe = (onChange: () => void) => {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
};

export const useWindowHeight = () => useSyncExternalStore(subscribe, () => window.innerHeight);
