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
    </>
  );
});

export default OneToManyIdentifyingEdge;
