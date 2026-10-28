import type { Theme } from '../state/types';

// 계절 테마 고르기 버튼 (설정 창, 미리보기 패널이 같이 쓴다)
export const THEME_OPTIONS: readonly { value: Theme; label: string }[] = [
  { value: 'summer', label: '여름' },
  { value: 'autumn', label: '가을' },
];
