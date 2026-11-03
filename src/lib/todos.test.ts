import { describe, it, expect } from 'vitest';
import type { Todo } from '../state/types';
import { addTodo, leftCount, removeTodo, sortTodos, toggleTodo } from './todos';

const todo = (id: string, done = false): Todo => ({ id, text: id, done });

describe('addTodo', () => {
  it('맨 뒤에 남은 일로 추가하고 앞뒤 공백을 지운다', () => {
    expect(addTodo([todo('a')], '  운동하기 ', 'b')).toEqual([
      todo('a'),
      { id: 'b', text: '운동하기', done: false },
    ]);
  });

  it('빈 글은 추가하지 않는다 (같은 배열 그대로)', () => {
    const list = [todo('a')];
    expect(addTodo(list, '   ', 'b')).toBe(list);
  });
});

describe('toggleTodo, removeTodo', () => {
  it('고른 것만 체크가 바뀌고 원래 배열은 그대로', () => {
    const list = [todo('a'), todo('b')];
    expect(toggleTodo(list, 'b')).toEqual([todo('a'), todo('b', true)]);
    expect(list[1].done).toBe(false);
  });

  it('고른 것만 지운다', () => {
    expect(removeTodo([todo('a'), todo('b')], 'a')).toEqual([todo('b')]);
  });
});

describe('sortTodos, leftCount', () => {
  it('남은 일 먼저(순서 유지), 끝낸 일은 아래로', () => {
    const list = [todo('a', true), todo('b'), todo('c', true), todo('d')];
    expect(sortTodos(list).map((t) => t.id)).toEqual(['b', 'd', 'a', 'c']);
    expect(leftCount(list)).toBe(2);
  });
});
