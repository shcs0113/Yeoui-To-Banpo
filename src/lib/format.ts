// 밀리초 -> "mm:ss" (남은 시간 표시라서 초는 올림: 0.2초 남았으면 00:01)
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
