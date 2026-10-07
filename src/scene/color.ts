// 색, 숫자 계산 도우미 (캔버스 없이 동작하는 순수 함수)

export type RGB = readonly [r: number, g: number, b: number];

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// t가 a → b 구간을 지나는 동안 0 → 1 (구간 앞은 0, 뒤는 1)
export const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

export const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

// 캔버스가 읽는 색 문자열로
export const rgba = (c: RGB, alpha = 1) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha})`;
