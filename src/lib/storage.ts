// 브라우저 저장소(localStorage) 읽기, 쓰기
// 사파리 개인정보 보호 모드, 저장 공간 꽉 참, 손상된 값 등으로 실패할 수 있어서 에러는 삼킨다
// (저장이 안 되면 그냥 "이번만 쓰고 끝"이 될 뿐, 앱이 멈추면 안 된다)

// 키 이름: 같은 github.io 주소의 다른 사이트와 겹치지 않게 앱 이름을 붙이고,
// 저장 모양이 바뀌면 v2로 올려서 예전 값을 잘못 읽지 않게 한다
const PREFIX = 'yeoui-to-banpo:v1:';

export const KEYS = {
  prefs: `${PREFIX}prefs`, // 설정, 취향
  history: `${PREFIX}history`, // 작업 기록
  todos: `${PREFIX}todos`, // 할 일
  session: `${PREFIX}session`, // 진행 중인 타이머
} as const;

// 저장된 값 (없거나 못 읽으면 undefined). 모양이 맞는지는 쓰는 쪽에서 확인한다
export function load(key: string): unknown {
  try {
    const text = localStorage.getItem(key);
    return text === null ? undefined : JSON.parse(text);
  } catch {
    return undefined;
  }
}

// null이면 지운다
export function save(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 무시 (다음 저장 때 다시 시도된다)
  }
}
