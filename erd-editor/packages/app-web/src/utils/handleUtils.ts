/**
 * Handle ID를 안전하게 sanitize하는 함수
 * ReactFlow에서 Handle ID는 영문자, 숫자, 언더스코어만 허용됨
 */
export const sanitizeHandleId = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
};

/**
 * 컬럼 이름을 기반으로 Handle ID를 생성하는 함수
 */
export const createHandleId = (columnName: string, position: 'left' | 'right'): string => {
  const sanitizedName = sanitizeHandleId(columnName);
  return `${sanitizedName}-${position}`;
};
