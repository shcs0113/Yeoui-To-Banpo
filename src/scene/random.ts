// 시드 난수: 같은 seed면 항상 같은 수열이 나온다
// (Math.random을 쓰면 새로고침할 때마다 별, 건물, 나무 배치가 바뀐다)
export function makeRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}
