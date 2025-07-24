import React from 'react';
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

const OneToManyIdentifyingEdge: React.FC<OneToManyIdentifyingEdgeProps> = ({
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
  const isDarkMode = theme === 'dark';
  
  const defaultStyle = {
    strokeWidth: 1.5,
    stroke: isDarkMode ? '#e2e8f0' : '#333333',
    ...style
  };
  
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

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={defaultStyle} markerStart={markerStart} markerEnd={markerEnd} />
    </>
  );
};

export default OneToManyIdentifyingEdge;
