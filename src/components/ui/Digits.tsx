// 숫자마다 폭이 같은 칸에 넣는다: 21:08 -> 21:11로 바뀌어도 각 자리 위치가 그대로
// 1ch = 그 글꼴의 '0' 너비. 글꼴이 고정폭 숫자(tabular-nums)를 지원하지 않아도 칸 폭은 CSS가 정한다
export function Digits({ value }: { value: string }) {
  return (
    <>
      {/* 화면 낭독기는 한 덩어리로 읽고, 칸으로 나눈 쪽은 숨긴다 */}
      <span className="sr-only">{value}</span>
      <span aria-hidden>
        {value.split('').map((ch, i) =>
          /\d/.test(ch) ? (
            <span key={i} className="inline-block w-[1ch] text-center">
              {ch}
            </span>
          ) : (
            ch
          ),
        )}
      </span>
    </>
  );
}