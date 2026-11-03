import type { Todo } from '../state/types';

// 할 일 목록 계산 (순수 함수: 원래 배열은 건드리지 않고 새 배열을 돌려준다)

// 맨 뒤에 추가. 앞뒤 공백만 있는 글은 추가하지 않는다
export function addTodo(list: Todo[], text: string, id: string): Todo[] {
  const trimmed = text.trim();
  if (!trimmed) return list;
  return [...list, { id, text: trimmed, done: false }];
}

// 체크 <-> 해제
export function toggleTodo(list: Todo[], id: string): Todo[] {
  return list.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}

export function removeTodo(list: Todo[], id: string): Todo[] {
  return list.filter((t) => t.id !== id);
}

// 보여 줄 순서: 남은 일 먼저(추가한 순서대로), 끝낸 일은 아래로
export function sortTodos(list: Todo[]): Todo[] {
  return [...list.filter((t) => !t.done), ...list.filter((t) => t.done)];
}

// 남은 일 개수
export const leftCount = (list: Todo[]) => list.filter((t) => !t.done).length;
