import { ROUTE_END_X } from '../constants/course';
import type { Settings } from '../state/types';

export interface Plan {
  totalMin: number; // 집중 + 사이클 사이 휴식 (마지막 사이클 뒤엔 휴식 없음)
  km: number; // 한 구간 6.8km * 사이클
  lastToBanpo: boolean; // 마지막에 도착하는 곳
}

// 설정만으로 오늘 라이딩을 미리 계산한다
export function planOf({ focusMin, breakMin, cycles }: Settings): Plan {
  return {
    totalMin: focusMin * cycles + breakMin * (cycles - 1),
    km: (ROUTE_END_X / 1000) * cycles,
    lastToBanpo: (cycles - 1) % 2 === 0, // 0번째 사이클이 반포행, 짝수 번째마다 반포행
  };
}

// 135 -> "2시간 15분", 60 -> "1시간", 45 -> "45분"
export function formatDuration(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

// 시각(ms) → "22:57" (24시간제)
export function formatTimeOfDay(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 120 -> "2:00", 45 -> "0:45" (완주 카드 집중 시간)
export function formatHoursMinutes(totalMin: number): string {
  return `${Math.floor(totalMin / 60)}:${String(totalMin % 60).padStart(2, '0')}`;
}