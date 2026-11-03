import { createContext, useContext } from 'react';
import type { Todo } from './types';

// 화면이 할 일 목록을 쓰는 창구
export interface TodoApi {
  todos: Todo[]; // 보여 줄 순서 (남은 일 먼저, 끝낸 일은 아래)
  left: number; // 남은 일 개수
  add: (text: string) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
}

export const TodoContext = createContext<TodoApi | null>(null);

export function useTodos(): TodoApi {
  const api = useContext(TodoContext);
  if (!api) throw new Error('useTodos는 TodoProvider 안에서만 쓸 수 있어요');
  return api;
}
