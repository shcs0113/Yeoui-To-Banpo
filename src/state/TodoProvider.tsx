import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { parseTodos } from '../lib/persist';
import { KEYS, load, save } from '../lib/storage';
import { addTodo, leftCount, removeTodo, sortTodos, toggleTodo } from '../lib/todos';
import { type TodoApi, TodoContext } from './TodoContext';
import type { Todo } from './types';

// 겹치지 않는 id (crypto.randomUUID는 http 주소(휴대폰으로 개발 서버 접속 등)에선 없어서 직접 만든다)
let seq = 0;
const newId = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

// 앱 전체에 할 일 목록을 하나 두고, 첫 화면과 주행 화면이 같이 쓴다
export function TodoProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Todo[]>(() => parseTodos(load(KEYS.todos))); // 저장해 둔 목록으로 시작
  useEffect(() => save(KEYS.todos, list), [list]);

  const api = useMemo<TodoApi>(
    () => ({
      todos: sortTodos(list),
      left: leftCount(list),
      add: (text) => setList((l) => addTodo(l, text, newId())),
      toggle: (id) => setList((l) => toggleTodo(l, id)),
      remove: (id) => setList((l) => removeTodo(l, id)),
    }),
    [list],
  );

  return <TodoContext value={api}>{children}</TodoContext>;
}
