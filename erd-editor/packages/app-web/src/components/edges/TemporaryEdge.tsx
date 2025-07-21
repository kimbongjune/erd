import React from 'react';
import { BaseEdge, getStraightPath } from 'reactflow';

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
  style = { strokeWidth: 2, stroke: '#007bff', strokeDasharray: '5 5' },
}) => {
  console.log("TemporaryEdge rendered!", { id, sourceX, sourceY, targetX, targetY });
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return <BaseEdge id={id} path={edgePath} style={style} />;
};

export default TemporaryEdge;
