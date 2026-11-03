import { Check, ListChecks, Plus } from 'lucide-react';
import { cx } from '../lib/cx';
import { TRIM } from '../lib/trim';
import { useTodos } from '../state/TodoContext';

interface Props {
  onOpen: () => void; // 누르면 가운데 할 일 창
}

const MAX = 5; // 평소엔 위에서부터 이만큼만 (남은 일 먼저, 끝낸 일은 그 아래)

// 자리: 왼쪽 하늘. 배경 없이 글자만 (계절 버튼 줄처럼 그림자로 읽히게)
const PLACE =
  'absolute top-[132px] left-4 z-30 [text-shadow:0_1px_6px_rgba(0,0,0,.6)] max-[900px]:top-[150px] max-[900px]:left-1 [&_svg]:drop-shadow-[0_1px_4px_rgba(0,0,0,.6)]';

// 주행 중 왼쪽 하늘의 할 일: 남은 일 아래에 끝낸 일 (가운데 창과 같은 순서)
// 동그라미를 누르면 바로 체크/해제, 그 밖의 아무 데나 누르면 가운데 창
// 할 일이 하나도 없으면 작은 "+ 할 일" 한 줄만
export function TodoPeek({ onOpen }: Props) {
  const { todos, left, toggle } = useTodos();

  if (todos.length === 0) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cx(
          PLACE,
          'flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold hover:bg-white/[.06]',
        )}
      >
        <Plus size={16} strokeWidth={2.2} />
        <span className={TRIM}>할 일</span>
      </button>
    );
  }

  const shown = todos.slice(0, MAX); // todos는 이미 남은 일 먼저, 끝낸 일은 아래 순서
  return (
    <div className={cx(PLACE, 'w-[280px] p-4 max-[900px]:w-[min(280px,calc(100vw-72px))]')}>
      {/* 카드 전체를 덮는 "열기" 버튼. 글자는 그 위에 얹되 눌림은 통과시키고(pointer-events-none),
          동그라미만 따로 눌리게 한다 (버튼 안에 버튼을 넣을 수 없어서 겹쳐 둔다) */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`할 일 ${left}개 열기`}
        className="absolute inset-0 cursor-pointer rounded-2xl hover:bg-white/[.06]"
      />

      <div className="pointer-events-none relative">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold">
          <ListChecks size={16} strokeWidth={1.8} />
          <span className={TRIM}>할 일 {left}</span>
        </div>
        {shown.map((t) => (
          <div key={t.id} className="flex items-center gap-3 py-1.5 text-sm">
            {/* 누르는 곳은 동그라미(16px)보다 넓게 28px (-m-1.5 p-1.5로 자리는 그대로) */}
            <button
              type="button"
              role="checkbox"
              aria-checked={t.done}
              aria-label={t.text}
              onClick={() => toggle(t.id)}
              className="pointer-events-auto -m-1.5 shrink-0 cursor-pointer p-1.5"
            >
              <span
                className={cx(
                  'grid size-4 place-items-center rounded-full border-[1.5px] shadow-[0_1px_4px_rgba(0,0,0,.4)] transition-colors',
                  t.done ? 'border-white bg-white text-ink' : 'border-white/80',
                )}
              >
                {t.done && <Check size={11} strokeWidth={3.2} />}
              </span>
            </button>
            <span
              className={cx(
                TRIM,
                '-mx-2 min-w-0 flex-1 overflow-x-clip px-2 text-ellipsis whitespace-nowrap',
                t.done && 'line-through opacity-60',
              )}
            >
              {t.text}
            </span>
          </div>
        ))}
        {todos.length > MAX && (
          <span className={cx(TRIM, 'block py-1.5 pl-7 text-[12.5px] text-white/70')}>
            외 {todos.length - MAX}개
          </span>
        )}
      </div>
    </div>
  );
}
