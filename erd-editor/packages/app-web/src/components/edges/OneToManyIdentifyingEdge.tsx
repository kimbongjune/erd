import React, { useMemo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from 'reactflow';
import useStore from '../../store/useStore';

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
  const theme = useStore((state) => state.theme);
  const selectedEdgeId = useStore((state) => state.selectedEdgeId);
  const hoveredEdgeId = useStore((state) => state.hoveredEdgeId);
  
  const isDarkMode = theme === 'dark';
  const isSelected = selectedEdgeId === id;
  const isHovered = hoveredEdgeId === id;
  const isActive = isSelected || isHovered;
  
  const defaultStyle = useMemo(() => ({
    strokeWidth: isActive ? 2.5 : 1.5,
    stroke: isActive ? '#3b82f6' : (isDarkMode ? '#e2e8f0' : '#333333'),
    cursor: 'pointer',
    ...style
  }), [isActive, isDarkMode, style]);
  
  const markerStart = data?.markerStart ? `url(#${data.markerStart.id})` : 
    `url(#${isActive ? 'marker-parent-active' : 'marker-parent'})`;
  const markerEnd = data?.markerEnd ? `url(#${data.markerEnd.id})` : 
    `url(#${isActive ? 'marker-crow-many-active' : 'marker-crow-many'})`;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
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
                fill="#3b82f6"
                fillOpacity="0.8"
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.6))',
                }}
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
    </>
  );
});

export default OneToManyIdentifyingEdge;
