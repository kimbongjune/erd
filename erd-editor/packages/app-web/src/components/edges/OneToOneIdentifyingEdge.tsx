import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from 'reactflow';

interface OneToOneIdentifyingEdgeProps {
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

const OneToOneIdentifyingEdge: React.FC<OneToOneIdentifyingEdgeProps> = ({
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
  const markerStart = data?.markerStart ? `url(#${data.markerStart.id})` : 'url(#marker-parent)';
  const markerEnd = data?.markerEnd ? `url(#${data.markerEnd.id})` : 'url(#marker-one)';
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
      <BaseEdge id={id} path={edgePath} style={style} markerStart={markerStart} markerEnd={markerEnd} />
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
          1:1 Identifying
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default OneToOneIdentifyingEdge;
