export interface DotState {
  done: boolean; // 채워진 점: 끝낸 구간
  now: boolean; // 테두리 점: 지금 구간
}

// 사이클 점 상태 계산. 지금 구간은 집중을 끝내고 휴식 중이면(currentDone) 채워진다
export function cycleDots(total: number, current: number, currentDone: boolean): DotState[] {
  return Array.from({ length: total }, (_, i) => ({
    done: i < current || (i === current && currentDone),
    now: i === current,
  }));
}
