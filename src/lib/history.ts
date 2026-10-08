import { ROUTE_END_X } from '../constants/course';
import type { HistoryRecord } from '../state/types';

export interface HistorySummary {
  km: number; // 다 달린 구간 * 6.8km
  focusMin: number; // 다 달린 집중 시간 (분)
  sections: number; // 다 달린 구간 수
}

// 기록 요약: 끝까지 달린 집중만 센다 (포기한 집중, 휴식은 빼고)
export function summarize(history: readonly HistoryRecord[]): HistorySummary {
  const finished = history.filter((r) => r.kind === 'focus' && r.completed);
  const focusMs = finished.reduce((sum, r) => sum + r.elapsedMs, 0);
  return {
    km: (ROUTE_END_X / 1000) * finished.length,
    focusMin: Math.round(focusMs / 60000),
    sections: finished.length,
  };
}

// 기록 한 줄 제목: "CYCLE 1, -> 반포" / "휴식, 반포"
export function recordTitle(r: HistoryRecord): string {
  if (r.kind === 'focus') return `CYCLE ${r.cycle + 1} · ${r.toBanpo ? '→ 반포' : '← 여의나루'}`;
  return `휴식 · ${r.toBanpo ? '반포' : '여의나루'}`;
}