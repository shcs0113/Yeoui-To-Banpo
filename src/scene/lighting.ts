import { type RGB, clamp01, lerp, mixRGB, ramp } from './color';

// 하늘 시간 t(0~1)에 따른 하늘색. 사이 값은 앞뒤 키를 섞어서 만든다
interface SkyKey {
  at: number;
  top: RGB; // 하늘 꼭대기
  bottom: RGB; // 수평선 근처
}

const SKY_KEYS: readonly SkyKey[] = [
  { at: 0.0, top: [58, 123, 213], bottom: [165, 208, 240] }, // 낮
  { at: 0.25, top: [58, 123, 213], bottom: [165, 208, 240] },
  { at: 0.37, top: [74, 72, 135], bottom: [248, 150, 88] }, // 노을
  { at: 0.45, top: [22, 36, 88], bottom: [58, 80, 150] }, // 블루아워
  { at: 0.5, top: [7, 11, 30], bottom: [20, 28, 62] }, // 밤
  { at: 0.62, top: [7, 11, 30], bottom: [20, 28, 62] },
  { at: 0.76, top: [26, 42, 95], bottom: [115, 92, 152] }, // 여명
  { at: 0.88, top: [72, 122, 192], bottom: [252, 178, 120] }, // 일출
  { at: 1.0, top: [58, 123, 213], bottom: [165, 208, 240] }, // 다시 낮
];

// 한 프레임의 빛 정보. 모든 레이어가 이걸 보고 색을 정한다
export interface Light {
  top: RGB;
  bottom: RGB;
  night: number; // 불빛이 켜진 정도 0 ~ 1
  stars: number; // 별이 보이는 정도 0 ~ 1
  daylight: number; // 물체 밝기 배율 (낮 1, 밤 0.3)
}

export function lightAt(skyT: number): Light {
  const t = clamp01(skyT);

  let top = SKY_KEYS[0].top;
  let bottom = SKY_KEYS[0].bottom;
  for (let i = 0; i < SKY_KEYS.length - 1; i++) {
    const a = SKY_KEYS[i];
    const b = SKY_KEYS[i + 1];
    if (t <= b.at) {
      const k = (t - a.at) / (b.at - a.at);
      top = mixRGB(a.top, b.top, k);
      bottom = mixRGB(a.bottom, b.bottom, k);
      break;
    }
  }

  const night = ramp(t, 0.33, 0.47) * (1 - ramp(t, 0.7, 0.84));
  const stars = ramp(t, 0.44, 0.52) * (1 - ramp(t, 0.64, 0.74));
  const sunsetDip = 0.12 * ramp(t, 0.3, 0.37) * (1 - ramp(t, 0.42, 0.47));
  const daylight = lerp(1, 0.3, night) * (1 - sunsetDip);

  return { top, bottom, night, stars, daylight };
}
