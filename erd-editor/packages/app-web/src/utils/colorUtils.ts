// 색상 관련 유틸리티 함수들

/**
 * 주어진 색상에서 호버 효과 색상을 계산합니다.
 * 원본 색상보다 약간 어둡게 만듭니다.
 */
export function getHoverColor(baseColor: string): string {
  return adjustColorBrightness(baseColor, -0.1);
}

/**
 * 주어진 색상에서 활성화 효과 색상을 계산합니다.
 * 원본 색상보다 더 어둡게 만듭니다.
 */
export function getActiveColor(baseColor: string): string {
  return adjustColorBrightness(baseColor, -0.2);
}

/**
 * 주어진 색상에서 번짐 효과(glow) 색상을 계산합니다.
 * 원본 색상과 비슷하지만 약간 더 밝게 만듭니다.
 */
export function getGlowColor(baseColor: string): string {
  return adjustColorBrightness(baseColor, 0.1);
}

/**
 * 색상의 밝기를 조정합니다.
 * @param color - 조정할 색상 (hex 형태)
 * @param amount - 조정할 양 (-1.0 ~ 1.0, 음수는 어둡게, 양수는 밝게)
 */
export function adjustColorBrightness(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const newR = Math.max(0, Math.min(255, Math.round(r + (255 - r) * amount)));
  const newG = Math.max(0, Math.min(255, Math.round(g + (255 - g) * amount)));
  const newB = Math.max(0, Math.min(255, Math.round(b + (255 - b) * amount)));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * 색상을 RGBA 형태로 변환합니다.
 * @param color - 변환할 색상 (hex 형태)
 * @param alpha - 투명도 (0.0 ~ 1.0)
 */
export function hexToRgba(color: string, alpha: number = 1.0): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 주어진 색상에서 그림자 효과 색상을 계산합니다.
 */
export function getShadowColor(baseColor: string): string {
  return hexToRgba(getActiveColor(baseColor), 0.3);
}
