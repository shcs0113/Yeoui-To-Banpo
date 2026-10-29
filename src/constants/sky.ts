import { SKY_LABELS } from '../lib/sky';
import type { SkyMode, SkyPreset } from '../state/types';

// 출발 카드의 하늘 고르기
export const SKY_MODE_OPTIONS: { value: SkyMode; label: string }[] = [
  { value: 'flow', label: '흐름' },
  { value: 'fixed', label: '고정' },
  { value: 'real', label: '실제 시간' },
];

export const SKY_PRESET_OPTIONS: { value: SkyPreset; label: string }[] = (
  ['day', 'sunset', 'night', 'dawn'] as const
).map((value) => ({ value, label: SKY_LABELS[value] }));

// 달리는 중에 고르는 하늘: 모드와 고정 하늘을 한 줄로 (낮 ~ 새벽을 고르면 고정)
export const SKY_CHOICES: readonly { label: string; mode: SkyMode; preset?: SkyPreset }[] = [
  { label: '흐름', mode: 'flow' },
  ...SKY_PRESET_OPTIONS.map((o) => ({ label: o.label, mode: 'fixed' as const, preset: o.value })),
  { label: '실제 시간', mode: 'real' },
];
