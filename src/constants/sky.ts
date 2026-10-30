import { SKY_LABELS } from '../lib/sky';
import type { SkyMode, SkyPreset } from '../state/types';

// 하늘 고르기 (출발 카드, 설정 창의 SkyPicker)
// 윗줄: 시간에 따라 바뀌는 하늘
export const SKY_MOVING_OPTIONS: { value: SkyMode; label: string }[] = [
  { value: 'flow', label: '흐름' },
  { value: 'real', label: '현재 시각' },
];

// 아랫줄: 고정 하늘
export const SKY_PRESET_OPTIONS: { value: SkyPreset; label: string }[] = (
  ['day', 'sunset', 'night', 'dawn'] as const
).map((value) => ({ value, label: SKY_LABELS[value] }));

// 달리는 중에 고르는 하늘: 모드와 고정 하늘을 한 줄로 (낮 ~ 새벽을 고르면 고정)
export const SKY_CHOICES: readonly { label: string; mode: SkyMode; preset?: SkyPreset }[] = [
  { label: '흐름', mode: 'flow' },
  ...SKY_PRESET_OPTIONS.map((o) => ({ label: o.label, mode: 'fixed' as const, preset: o.value })),
  { label: '현재 시각', mode: 'real' },
];
