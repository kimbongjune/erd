// Google 프로필 이미지 캐시 유틸리티

// 이미지 URL 캐시 (전역)
export const imageCache = new Set<string>();

// 실패한 이미지 URL 캐시 (시간과 함께 저장)
export const failedImageCache = new Map<string, number>();

// 429 에러로 실패한 이미지 재시도 시간 (5분)
const RETRY_DELAY = 5 * 60 * 1000;

// 이미지 URL 정규화 함수
export const normalizeGoogleImageUrl = (originalURL: string, size: string = 's96-c'): string => {
  if (!originalURL) return originalURL;
  
  // base64 이미지인 경우 그대로 반환
  if (originalURL.startsWith('data:image/')) {
    return originalURL;
  }
  
  // Google 프로필 이미지가 아닌 경우 그대로 반환
  if (!originalURL.includes('googleusercontent.com')) {
    return originalURL;
  }
  
  // Google 프로필 이미지 URL에서 크기 부분 변경
  return originalURL.replace(/=s\d+(-c)?$/, `=${size}`);
};

// 이미지 URL이 실패한 적이 있는지 확인 (429 에러의 경우 시간 체크)
export const hasImageFailed = (url: string): boolean => {
  const failedTime = failedImageCache.get(url);
  if (!failedTime) return false;
  
  // 5분 후에는 다시 시도 허용
  if (Date.now() - failedTime > RETRY_DELAY) {
    failedImageCache.delete(url);
    return false;
  }
  
  return true;
};

// 이미지 실패 기록
export const recordImageFailure = (url: string): void => {
  failedImageCache.set(url, Date.now());
};

// 이미지 성공 기록
export const recordImageSuccess = (url: string): void => {
  imageCache.add(url);
  // 성공했으면 실패 기록에서 제거
  failedImageCache.delete(url);
};
