import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from 'reactflow';

interface OneToManyNonIdentifyingEdgeProps {
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

const OneToManyNonIdentifyingEdge: React.FC<OneToManyNonIdentifyingEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = { strokeWidth: 1.5, stroke: 'black', strokeDasharray: '5, 5' }, // Add dashed style for non-identifying
  data,
}) => {
  const markerStart = data?.markerStart ? `url(#${data.markerStart.id})` : 'url(#marker-parent)';
  const markerEnd = data?.markerEnd ? `url(#${data.markerEnd.id})` : 'url(#marker-crow-many)';

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeStyle = {
    ...style,
    strokeDasharray: '5, 5', // 점선 스타일
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={edgeStyle} markerStart={markerStart} markerEnd={markerEnd} />
    </>
  );
};

export default OneToManyNonIdentifyingEdge;
