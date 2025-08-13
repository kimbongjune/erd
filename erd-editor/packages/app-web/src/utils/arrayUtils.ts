/**
 * 배열에서 undefined, null 요소를 안전하게 제거하는 유틸리티 함수들
 */

/**
 * 배열에서 falsy 요소들을 제거합니다 (undefined, null, false, 0, '', NaN)
 */
export const removeFalsyElements = <T>(array: (T | undefined | null)[]): T[] => {
  return array.filter((item): item is T => Boolean(item));
};

/**
 * 배열에서 undefined 요소만 제거합니다
 */
export const removeUndefinedElements = <T>(array: (T | undefined)[]): T[] => {
  return array.filter((item): item is T => item !== undefined);
};

/**
 * 배열에서 null 요소만 제거합니다
 */
export const removeNullElements = <T>(array: (T | null)[]): T[] => {
  return array.filter((item): item is T => item !== null);
};

/**
 * 컬럼 배열을 안전하게 처리합니다 (undefined 요소 제거)
 */
export const safeColumnsArray = <T extends { id?: string | number }>(columns: (T | undefined)[]): T[] => {
  return removeUndefinedElements(columns);
};

/**
 * 배열의 모든 요소가 유효한지 확인합니다
 */
export const isValidArray = <T>(array: (T | undefined | null)[]): array is T[] => {
  return array.every(item => item !== undefined && item !== null);
};

/**
 * 배열을 안전하게 map 처리합니다 (undefined 요소 제거 후 map)
 */
export const safeMap = <T, R>(
  array: (T | undefined)[],
  mapper: (item: T, index: number) => R
): R[] => {
  return removeUndefinedElements(array).map(mapper);
};

/**
 * 배열을 안전하게 filter 처리합니다 (undefined 요소 제거 후 filter)
 */
export const safeFilter = <T>(
  array: (T | undefined)[],
  predicate: (item: T, index: number) => boolean
): T[] => {
  return removeUndefinedElements(array).filter(predicate);
};
