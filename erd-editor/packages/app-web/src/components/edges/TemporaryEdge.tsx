import React from 'react';
import { BaseEdge, getSmoothStepPath } from 'reactflow';

interface TemporaryEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  style?: React.CSSProperties;
}

const TemporaryEdge: React.FC<TemporaryEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = { strokeWidth: 2, stroke: '#007bff', strokeDasharray: '5, 5', animated: true },
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return <BaseEdge id={id} path={edgePath} style={style} />;
};

export default TemporaryEdge;
