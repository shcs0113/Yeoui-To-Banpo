import { hash01 } from './random';

// 강물 반짝임: 강 위 '장면 좌표'에 고정된 점들. 화면에 고정하면 카메라가 움직여도 따라오지 않는다
export const RIPPLE_ROWS = 16; // 깊이 줄 수
const NEAR_Z = 60; // 가장 가까운 줄
const FAR_Z = 960; // 가장 먼 줄
const GAP_PER_Z = 0.7; // 줄 안의 간격 = 깊이 × 0.7 (멀수록 듬성듬성 -> 화면에선 비슷한 밀도)

// r번째 줄의 깊이: 가까운 쪽은 촘촘하게, 먼 쪽은 넓게 (등비)
export function rippleZ(row: number): number {
  return NEAR_Z * (FAR_Z / NEAR_Z) ** (row / (RIPPLE_ROWS - 1));
}

// r번째 줄에서 fromX ~ toX 사이에 있는 반짝임들의 x
// 칸(cell)마다 하나씩, 칸 안의 위치는 hash01로 정한다 -> 어디서 잘라 봐도 같은 점은 같은 자리
export function rippleXs(row: number, fromX: number, toX: number): number[] {
  const gap = rippleZ(row) * GAP_PER_Z;
  const xs: number[] = [];
  for (let cell = Math.floor(fromX / gap); cell * gap <= toX; cell++) {
    const x = (cell + hash01(cell * 31 + row * 7919)) * gap;
    if (x >= fromX && x <= toX) xs.push(x);
  }
  return xs;
}