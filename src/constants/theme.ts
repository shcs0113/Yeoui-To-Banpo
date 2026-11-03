import type { Theme } from '../state/types';

// 계절 테마 고르기 버튼 (설정 창, 미리보기 패널이 같이 쓴다)
export const THEME_OPTIONS: readonly { value: Theme; label: string }[] = [
  { value: 'spring', label: '봄' },
  { value: 'summer', label: '여름' },
  { value: 'autumn', label: '가을' },
  { value: 'winter', label: '겨울' },
];

// 계절마다 흩날림 기본값: 여름은 맑은 날(비 없음)로 시작, 나머지는 켜고 시작
export const effectsDefault = (theme: Theme) => theme !== 'summer';
