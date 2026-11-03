import { Check, ListChecks, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { cx } from '../lib/cx';
import { TRIM } from '../lib/trim';
import { useTodos } from '../state/TodoContext';
import { Modal } from './ui/Modal';

interface Props {
  onClose: () => void;
}

// 할 일 창: 남은 개수, 목록(체크, 삭제), 맨 아래 추가 칸. 설정 창과 같은 투명 유리
export function TodoModal({ onClose }: Props) {
  const { todos, left, toggle, remove } = useTodos();

  return (
    <Modal title="할 일" icon={<ListChecks size={20} strokeWidth={1.8} />} onClose={onClose} clear>
      <div className="border-t border-white/14 pt-3">
        <p className={cx(TRIM, 'mb-1 text-[12.5px] text-white/60 tabular-nums')}>
          남은 일 {left} / {todos.length}
        </p>

        {/* 많아지면 목록만 스크롤 (추가 칸은 늘 아래에 보이게) */}
        <ul className="max-h-[min(46vh,340px)] divide-y divide-white/10 overflow-y-auto">
          {todos.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
              <button
                type="button"
                role="checkbox"
                aria-checked={t.done}
                aria-label={t.text}
                onClick={() => toggle(t.id)}
                className={cx(
                  'grid size-5 shrink-0 cursor-pointer place-items-center rounded-full border-[1.5px] transition-colors',
                  t.done ? 'border-white bg-white text-ink' : 'border-white/70 hover:bg-white/15',
                )}
              >
                {t.done && <Check size={13} strokeWidth={3} />}
              </button>
              <span
                className={cx(
                  TRIM,
                  '-mx-2 min-w-0 flex-1 overflow-x-clip px-2 text-ellipsis whitespace-nowrap',
                  t.done && 'text-white/45 line-through',
                )}
              >
                {t.text}
              </span>
              <button
                type="button"
                aria-label={`${t.text} 삭제`}
                onClick={() => remove(t.id)}
                className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-white/45 hover:bg-white/10 hover:text-white"
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 border-t border-white/10 pt-3">
          <AddForm />
        </div>
      </div>
    </Modal>
  );
}

// 할 일 추가 칸: Enter나 + 버튼으로 추가하고 칸을 비운다
function AddForm() {
  const { add } = useTodos();
  const [text, setText] = useState('');

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        add(text);
        setText('');
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="할 일 추가"
        aria-label="할 일 추가"
        maxLength={80}
        className="h-9 min-w-0 flex-1 rounded-full border-[1.5px] border-white/35 bg-white/[.06] px-4 text-sm text-white placeholder:text-white/50 focus:border-white/80 focus:outline-none"
      />
      <button
        type="submit"
        aria-label="추가"
        className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-white text-ink shadow-[0_1px_6px_rgba(0,0,0,.3)] [text-shadow:none]"
      >
        <Plus size={18} strokeWidth={2.2} />
      </button>
    </form>
  );
}
