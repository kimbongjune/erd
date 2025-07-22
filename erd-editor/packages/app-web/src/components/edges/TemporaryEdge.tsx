import React from 'react';
import { BaseEdge, getSmoothStepPath, EdgeProps, Position } from 'reactflow';

interface TemporaryEdgeProps extends EdgeProps {
  data?: {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
  };
}

const TemporaryEdge: React.FC<TemporaryEdgeProps> = ({
  id,
  data,
  style = { strokeWidth: 3, stroke: '#ff0000', strokeDasharray: '10, 5' }, // Make it more visible
}) => {
  if (!data) {
    return null;
  }

  const { sourceX, sourceY, targetX, targetY } = data;

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: Position.Right,
    targetX,
    targetY,
    targetPosition: Position.Left,
  });

  return (
    <g>
      <BaseEdge id={id} path={edgePath} style={style} />
      {/* Add a circle at the target position to show where the connection will be made */}
      <circle
        cx={targetX}
        cy={targetY}
        r={8}
        fill="#ff0000"
        stroke="#ff0000"
        strokeWidth={2}
      />
      {/* Add a circle at the source position too */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={6}
        fill="#00ff00"
        stroke="#00ff00"
        strokeWidth={2}
      />
    </g>
  );
};

export default TemporaryEdge;
