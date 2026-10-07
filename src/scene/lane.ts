// 자전거 차선 계산 (캔버스 없이 동작하는 순수 함수)

// 우측통행: 반포행(동쪽)은 카메라 쪽 차선, 여의나루행은 건너편 차선
export const LANE_TO_BANPO = 9.5;
export const LANE_TO_YEOUI = 12.5;

export const laneFor = (toBanpo: boolean) => (toBanpo ? LANE_TO_BANPO : LANE_TO_YEOUI);

// current를 target 쪽으로 dt초만큼 부드럽게 당긴다 (rate가 클수록 빠름, 넘치지 않음)
export function approach(current: number, target: number, dt: number, rate = 3): number {
  return current + (target - current) * Math.min(1, dt * rate);
}
