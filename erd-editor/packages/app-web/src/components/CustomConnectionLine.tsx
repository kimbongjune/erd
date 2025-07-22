import React from 'react';
import { ConnectionLineComponentProps, getSmoothStepPath } from 'reactflow';

const CustomConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="#007bff"
        strokeWidth={2}
        strokeDasharray="8,4"
        d={edgePath}
        opacity={0.7}
        markerEnd="url(#temp-arrow)"
      />
      <circle
        cx={toX}
        cy={toY}
        fill="#007bff"
        r={4}
        stroke="#ffffff"
        strokeWidth={2}
        opacity={0.7}
      />
      <defs>
        <marker
          id="temp-arrow"
          markerWidth="8"
          markerHeight="8"
          viewBox="0 0 8 8"
          refX="6"
          refY="4"
          markerUnits="strokeWidth"
          orient="auto"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#007bff" opacity="0.7" />
        </marker>
      </defs>
    </g>
  );
};

export default CustomConnectionLine;
