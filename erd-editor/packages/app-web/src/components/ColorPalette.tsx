import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import useStore from '../store/useStore';

interface ColorPaletteProps {
  onColorSelect: (color: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
  darkMode?: boolean;
  onPreview?: (color: string) => void;
  onClearPreview?: () => void;
}

// 더 다채로운 색상 팔레트 - 6x6 그리드
const colors = [
  // 빨간색 계열
  '#FF6B6B', '#FF5252', '#F44336', '#E53935', '#C62828', '#B71C1C',
  // 분홍색 계열  
  '#E91E63', '#EC407A', '#F06292', '#F48FB1', '#F8BBD9', '#FCE4EC',
  // 보라색 계열
  '#9C27B0', '#AB47BC', '#BA68C8', '#CE93D8', '#E1BEE7', '#F3E5F5',
  // 파란색 계열
  '#2196F3', '#42A5F5', '#64B5F6', '#90CAF9', '#BBDEFB', '#E3F2FD',
  // 청록색 계열
  '#00BCD4', '#26C6DA', '#4DD0E1', '#80DEEA', '#B2EBF2', '#E0F2F1',
  // 녹색 계열
  '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#E8F5E8',
  // 황록색 계열
  '#8BC34A', '#9CCC65', '#AED581', '#C5E1A5', '#DCEDC8', '#F1F8E9',
  // 노란색 계열
  '#FFEB3B', '#FFEE58', '#FFF176', '#FFF59D', '#FFF9C4', '#FFFDE7',
  // 주황색 계열
  '#FF9800', '#FFB74D', '#FFCC02', '#FFE082', '#FFECB3', '#FFF8E1',
  // 갈색 계열
  '#795548', '#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8', '#EFEBE9',
  // 회색 계열
  '#607D8B', '#78909C', '#90A4AE', '#B0BEC5', '#CFD8DC', '#ECEFF1',
  // 특별한 색상들
  '#FF4081', '#7C4DFF', '#448AFF', '#18FFFF', '#69F0AE', '#EEFF41'
];

const PaletteContainer = styled.div<{ $position: { x: number; y: number }; $darkMode?: boolean }>`
  position: relative;
  top: 0;
  left: 0;
  background: ${props => props.$darkMode ? '#2d3748' : '#ffffff'};
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 99999;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  min-width: 200px;
  max-width: 240px;
  
  /* 드래그 및 모든 이벤트 차단 */
  user-select: none;
  pointer-events: auto;
  -webkit-user-drag: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const ColorItem = styled.div<{ $color: string; $darkMode?: boolean }>`
  width: 28px;
  height: 28px;
  background-color: ${props => props.$color};
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    border-color: ${props => props.$darkMode ? '#cbd5e0' : '#4a5568'};
    transform: scale(1.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 9998;
  pointer-events: none;
`;

const ColorPalette: React.FC<ColorPaletteProps> = ({ 
  onColorSelect, 
  onClose, 
  position, 
  darkMode = false,
  onPreview,
  onClearPreview
}) => {
  const paletteRef = useRef<HTMLDivElement>(null);

  const handleColorClick = (color: string) => {
    if (onClearPreview) onClearPreview();
    onColorSelect(color);
    onClose();
  };

  const handleColorHover = (color: string) => {
    console.log('Color hover:', color);
    if (onPreview) {
      onPreview(color);
    }
  };

  const handleColorLeave = () => {
    console.log('Color leave, clearing preview');
    if (onClearPreview) {
      onClearPreview();
    }
  };

  // 팔레트 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        if (onClearPreview) onClearPreview();
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, onClearPreview]);

  // 컴포넌트 언마운트 시 미리보기 제거
  useEffect(() => {
    return () => {
      if (onClearPreview) onClearPreview();
    };
  }, [onClearPreview]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.nativeEvent as any).stopImmediatePropagation?.();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.nativeEvent as any).stopImmediatePropagation?.();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.nativeEvent as any).stopImmediatePropagation?.();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.nativeEvent as any).stopImmediatePropagation?.();
    return false;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.nativeEvent as any).stopImmediatePropagation?.();
    return false;
  };

  return (
    <PaletteContainer 
      ref={paletteRef}
      $position={position} 
      $darkMode={darkMode}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      draggable={false}
      onMouseLeave={handleColorLeave}
    >
      {colors.map((color, index) => (
        <ColorItem
          key={index}
          $color={color}
          $darkMode={darkMode}
          onClick={() => handleColorClick(color)}
          onMouseEnter={() => handleColorHover(color)}
          onMouseDown={handleMouseDown}
          onDragStart={handleDragStart}
          draggable={false}
        />
      ))}
    </PaletteContainer>
  );
};

export default ColorPalette;
