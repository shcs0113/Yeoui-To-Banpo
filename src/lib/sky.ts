import type { SkyMode, SkyPreset } from '../state/types';

// 하늘 값(skyT): 0 낮 -> 0.37 노을 -> 0.5 밤 -> 0.76 여명 -> 0.88 일출 -> 1 다시 낮 (lighting.ts의 SKY_KEYS)

// 고정 모드에서 고를 수 있는 하늘
export const SKY_PRESETS: Record<SkyPreset, number> = {
  day: 0.12,
  sunset: 0.36,
  night: 0.55,
  dawn: 0.72,
};

export const SKY_LABELS: Record<SkyPreset, string> = {
  day: '낮',
  sunset: '노을',
  night: '밤',
  dawn: '새벽',
};

// 실제 시각(하루 중 몇 분째) -> 하늘 값. 사이는 앞뒤를 섞어서 끊김 없이 이어진다 (서울 가을 기준)
// 하늘 값이 1을 넘어가는 건 "다음 날 낮"이라 1로 나눈 나머지를 쓴다 (1.36 = 0.36 노을)
const CLOCK_KEYS: readonly (readonly [minute: number, skyT: number])[] = [
  [0, 0.58], // 자정: 밤
  [3 * 60, 0.62], // 깊은 밤 끝
  [5 * 60, 0.72], // 새벽
  [6 * 60 + 30, 0.88], // 일출
  [8 * 60, 1], // 낮
  [16 * 60 + 30, 1.25], // 낮 끝
  [18 * 60, 1.36], // 노을
  [19 * 60 + 30, 1.5], // 밤
  [24 * 60, 1.58], // 다시 자정 (= 0.58)
];

// 실제 시각의 하늘 값
export function skyAtClock(date: Date): number {
  const minute = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
  for (let i = 0; i < CLOCK_KEYS.length - 1; i++) {
    const [m0, t0] = CLOCK_KEYS[i];
    const [m1, t1] = CLOCK_KEYS[i + 1];
    if (minute <= m1) return (t0 + ((minute - m0) / (m1 - m0)) * (t1 - t0)) % 1;
  }
  return CLOCK_KEYS[0][1];
}

// 하늘 값 -> 가장 가까운 이름 (출발 카드의 "지금 시각 기준: 노을" 같은 설명용)
export function skyLabelOf(skyT: number): string {
  if (skyT >= 0.3 && skyT < 0.45) return SKY_LABELS.sunset;
  if (skyT >= 0.45 && skyT < 0.66) return SKY_LABELS.night;
  if (skyT >= 0.66 && skyT < 0.84) return SKY_LABELS.dawn;
  return SKY_LABELS.day;
}

// 화면에 쓸 하늘 값: 흐름이면 타이머가 계산한 값(flowT) 그대로, 고정이면 고른 값, 실제 시간이면 지금 시각
export function skyFor(mode: SkyMode, preset: SkyPreset, flowT: number, now: number): number {
  if (mode === 'fixed') return SKY_PRESETS[preset];
  if (mode === 'real') return skyAtClock(new Date(now));
  return flowT;
}
