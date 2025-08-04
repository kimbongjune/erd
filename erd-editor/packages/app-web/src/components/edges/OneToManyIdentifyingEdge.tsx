import React, { useMemo, useState, useCallback, useRef } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from 'reactflow';
import styled from 'styled-components';
import { FaPalette } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import useStore from '../../store/useStore';
import ColorPalette from '../ColorPalette';

const PaletteButton = styled.div<{ $isVisible: boolean; $color?: string }>`
  display: ${props => props.$isVisible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: ${props => props.$color || '#4a90e2'};
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  
  &:hover {
    transform: scale(1.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }
  
  svg {
    width: 10px;
    height: 10px;
    color: white;
  }
`;

interface OneToManyIdentifyingEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  style?: React.CSSProperties;
  
  data?: any;
}

const OneToManyIdentifyingEdge: React.FC<OneToManyIdentifyingEdgeProps> = React.memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}) => {
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  
  const theme = useStore((state) => state.theme);
  const selectedEdgeId = useStore((state) => state.selectedEdgeId);
  const setSelectedEdgeId = useStore((state) => state.setSelectedEdgeId);
  const hoveredEdgeId = useStore((state) => state.hoveredEdgeId);
  const setHoveredEdgeId = useStore((state) => state.setHoveredEdgeId);
  const highlightedEdges = useStore((state) => state.highlightedEdges);
  const getEdgeColor = useStore((state) => state.getEdgeColor);
  const setEdgeColor = useStore((state) => state.setEdgeColor);
  const showColorPalette = useStore((state) => state.showColorPalette);
  const paletteTarget = useStore((state) => state.paletteTarget);
  const showPalette = useStore((state) => state.showPalette);
  const hidePalette = useStore((state) => state.hidePalette);
  const saveHistoryState = useStore((state) => state.saveHistoryState);
  
  const isDarkMode = theme === 'dark';
  const isSelected = selectedEdgeId === id;
  const isHovered = hoveredEdgeId === id;
  const isHighlighted = highlightedEdges.includes(id);
  const isActive = isSelected || isHovered || isHighlighted;
  
  // 색상 가져오기
  const edgeColor = getEdgeColor(id);
  const actualColor = previewColor || edgeColor;
  
  // 통합된 색상 계산 - 활성화 상태에서는 실제 색상, 비활성화에서는 기본값 체크
  const displayColor = isActive 
    ? actualColor 
    : (edgeColor === '#4a90e2' ? (isDarkMode ? '#e2e8f0' : '#666666') : actualColor);
  
  const strokeColor = displayColor;
  const markerColor = displayColor;
  
  // 팔레트 핸들러들
  const handlePaletteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    showPalette(
      { type: 'edge', id }, 
      { x: 0, y: 0 }
    );
  }, [id, showPalette]);

  const handleColorSelect = useCallback((color: string) => {
    const oldColor = getEdgeColor(id);
    if (color !== oldColor) {
      console.log('🎨 관계선 색상 변경 히스토리 저장:', color);
      saveHistoryState('CHANGE_NODE_COLOR', {
        edgeId: id,
        nodeType: 'edge',
        oldColor,
        newColor: color
      });
    }
    setEdgeColor(id, color);
    setPreviewColor(null);
    setSelectedEdgeId(null); // 색상 선택 후 선택 해제
    setHoveredEdgeId(null); // 호버 상태도 해제
  }, [id, setEdgeColor, setSelectedEdgeId, setHoveredEdgeId, getEdgeColor, saveHistoryState]);

  const handlePreviewColor = useCallback((color: string) => {
    setPreviewColor(color);
  }, []);

  const handleClearPreview = useCallback(() => {
    setPreviewColor(null);
  }, []);
  
  const defaultStyle = useMemo(() => ({
    strokeWidth: isActive ? 2.5 : 1.5,
    stroke: strokeColor,
    cursor: 'pointer',
    ...style
  }), [isActive, strokeColor, style]);
  
  const markerStart = data?.markerStart ? `url(#${data.markerStart.id})` : 
    `url(#marker-parent-${id})`;
  const markerEnd = data?.markerEnd ? `url(#${data.markerEnd.id})` : 
    `url(#marker-crow-many-${id})`;
  
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 5,
  });

  // 애니메이션을 위한 계산
  const animationData = useMemo(() => {
    if (!isActive) return null;
    
    // 선의 길이 계산 - SmoothStepPath는 L자 형태이므로 Manhattan distance + 보정계수 사용
    const pathLength = (Math.abs(targetX - sourceX) + Math.abs(targetY - sourceY)) * 1.15;
    
    // 거리에 비례한 애니메이션 속도 계산
    const baseSpeed = 80; // 픽셀/초
    const baseDuration = pathLength / baseSpeed;
    const animationDuration = Math.max(3, Math.min(8, baseDuration)); // 최소 3초, 최대 8초
    
    // 원들 사이의 고정 픽셀 간격 - 항상 동일한 시각적 간격 유지
    const circleSpacing = 45; // 45픽셀 간격
    
    // 픽셀 간격 기반으로 원의 개수 계산 - 거리가 가까우면 적게, 멀면 많게
    const circleCount = Math.max(2, Math.min(15, Math.floor(pathLength / circleSpacing)));
    
    return {
      pathLength,
      circleCount,
      animationDuration,
      circleSpacing,
    };
  }, [isActive, sourceX, sourceY, targetX, targetY]); // 좌표 의존성 추가로 드래그 시 실시간 업데이트

  return (
    <>
      {/* 이 엣지 전용 마커 정의 */}
      <defs>
        <marker
          id={`marker-parent-${id}`}
          markerWidth="12"
          markerHeight="12"
          viewBox="-6 -6 12 12"
          refX="-8"
          refY="0"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M-2,-6 L-2,6" stroke={markerColor} strokeWidth="1.5" fill="none" />
        </marker>
        <marker
          id={`marker-crow-many-${id}`}
          markerWidth="10"
          markerHeight="10"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M 0 5 L 10 0 M 0 5 L 10 5 M 0 5 L 10 10" stroke={markerColor} strokeWidth="1.5" fill="none" />
        </marker>
      </defs>
      
      {/* 그림자 효과를 위한 별도 경로 - 활성화 시에만 렌더링 */}
      {isActive && (
        <BaseEdge 
          id={`${id}-shadow`}
          path={edgePath} 
          style={{
            strokeWidth: isActive ? 4.5 : 3.5,
            stroke: 'rgba(59, 130, 246, 0.3)',
            strokeOpacity: 0.6,
          }} 
          markerStart={undefined}
          markerEnd={undefined}
          interactionWidth={0}
        />
      )}
      
      {/* 메인 경로 */}
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={defaultStyle} 
        markerStart={markerStart} 
        markerEnd={markerEnd}
        interactionWidth={20}
      />
      
      {/* 애니메이션 원들 - 활성화 시에만 렌더링 */}
      {isActive && animationData && (
        <g>
          {/* 애니메이션을 위한 숨겨진 path */}
          <path
            id={`${id}-animation-path`}
            d={edgePath}
            fill="none"
            stroke="none"
            style={{ opacity: 0 }}
          />
          
          {/* 애니메이션 원들 */}
          {Array.from({ length: animationData.circleCount }).map((_, index) => {
            // 전체 애니메이션 시간을 원의 개수로 균등 분배하여 일정한 간격 유지
            const delay = -(index * (animationData.animationDuration / animationData.circleCount));
            
            return (
              <circle
                key={index}
                r="4"
                fill={actualColor}
                fillOpacity="0.8"
              >
                <animateMotion
                  dur={`${animationData.animationDuration}s`}
                  repeatCount="indefinite"
                  begin={`${delay}s`}
                  path={edgePath}
                />
              </circle>
            );
          })}
        </g>
      )}
      
      {/* 팔레트 버튼 */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%)`,
            left: labelX,
            top: labelY,
            pointerEvents: 'all',
          }}
        >
          <PaletteButton
            $isVisible={isSelected}
            $color={actualColor}
            onClick={handlePaletteClick}
          >
            <FaPalette />
          </PaletteButton>
        </div>
        
        {/* 팔레트 */}
        {showColorPalette && paletteTarget?.type === 'edge' && paletteTarget?.id === id && (
          <div style={{
            position: 'absolute',
            left: labelX + 30,
            top: labelY - 150,
            zIndex: 10000,
            pointerEvents: 'all',
          }}>
            <ColorPalette
              position={{ x: labelX + 30, y: labelY - 150 }}
              onColorSelect={handleColorSelect}
              onClose={hidePalette}
              onPreview={handlePreviewColor}
              onClearPreview={handleClearPreview}
              darkMode={isDarkMode}
            />
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
});

export default OneToManyIdentifyingEdge;
