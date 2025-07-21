import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from 'reactflow';

interface OneToOneNonIdentifyingEdgeProps {
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

const OneToOneNonIdentifyingEdge: React.FC<OneToOneNonIdentifyingEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = { strokeWidth: 1.5, stroke: 'black' },
  data,
}) => {
  const markerStart = 'url(#marker-one)';
  const markerEnd = undefined;

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
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fff',
            padding: 5,
            borderRadius: 5,
            fontSize: 12,
            fontWeight: 700,
          }}
          className="nodrag nopan"
        >
          1:1 Non-Identifying
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default OneToOneNonIdentifyingEdge;
