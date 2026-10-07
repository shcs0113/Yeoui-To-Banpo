import { ROUTE, ROUTE_END_X } from '../constants/course';

export interface RouteProgress {
  percent: number; // 바 위 내 위치 0~100 (여의나루 = 0, 반포 = 100)
  legKm: number; // 이번 구간에서 달린 거리
  next: { name: string; km: number } | null; // 다음 지점까지 (도착했으면 null)
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// 카메라 위치, 방향 -> 경로 바에 보여줄 값
export function routeProgress(cameraX: number, toBanpo: boolean): RouteProgress {
  const x = clamp(cameraX, 0, ROUTE_END_X);
  const legKm = (toBanpo ? x : ROUTE_END_X - x) / 1000;
  // 가는 방향으로 아직 지나지 않은 첫 지점 (1m 여유: 정확히 그 위에 있으면 지난 걸로)
  const ahead = toBanpo
    ? ROUTE.find((p) => p.x > x + 1)
    : [...ROUTE].reverse().find((p) => p.x < x - 1);
  return {
    percent: (x / ROUTE_END_X) * 100,
    legKm,
    next: ahead ? { name: ahead.name, km: Math.abs(ahead.x - x) / 1000 } : null,
  };
}
