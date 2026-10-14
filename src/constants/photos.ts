// 답사 사진 (이스터에그): 다리 이름 -> 사진 목록 (public/photos/ 안의 파일 이름, 확장자 빼고)
export const PHOTOS: Readonly<Record<string, readonly string[]>> = {
  마포대교: ['mapo-1', 'mapo-2', 'mapo-3', 'mapo-4', 'mapo-5'],
  원효대교: ['wonhyo-1'],
  한강철교: ['railway-1', 'railway-2', 'railway-3', 'railway-4', 'railway-5'],
  한강대교: ['hangang-1'],
  동작대교: ['dongjak-1', 'dongjak-2'],
  반포대교: ['banpo-1', 'banpo-2', 'banpo-3', 'banpo-4'],
};
