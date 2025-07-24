import React from 'react';
import styled from 'styled-components';
import { useReactFlow } from 'reactflow';
import useStore from '../store/useStore';

const GuidesContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
`;

const GuideLine = styled.div<{ 
  $type: 'vertical' | 'horizontal'; 
  $position: number; 
  $color: string;
}>`
  position: absolute;
  background-color: ${props => props.$color};
  opacity: 0.8;
  
  ${props => props.$type === 'vertical' ? `
    left: ${props.$position}px;
    top: 0;
    bottom: 0;
    width: 1px;
    border-left: 2px dashed ${props.$color};
    background: none;
  ` : `
    top: ${props.$position}px;
    left: 0;
    right: 0;
    height: 1px;
    border-top: 2px dashed ${props.$color};
    background: none;
  `}
  
  animation: snapGuideFadeIn 0.1s ease-out;
  
  @keyframes snapGuideFadeIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 0.8;
      transform: scale(1);
    }
  }
`;

const SnapGuides: React.FC = () => {
  const snapGuides = useStore((state) => state.snapGuides);
  const isDragging = useStore((state) => state.isDragging);
  const { flowToScreenPosition } = useReactFlow();

  if (!isDragging || snapGuides.length === 0) {
    return null;
  }

  return (
    <GuidesContainer>
      {snapGuides.map((guide, index) => {
        // flow 좌표를 screen 좌표로 변환
        let screenPosition;
        if (guide.type === 'vertical') {
          screenPosition = flowToScreenPosition({ x: guide.position, y: 0 }).x;
        } else {
          screenPosition = flowToScreenPosition({ x: 0, y: guide.position }).y;
        }
        
        return (
          <GuideLine
            key={`${guide.type}-${guide.position}-${index}`}
            $type={guide.type}
            $position={screenPosition}
            $color={guide.color}
          />
        );
      })}
    </GuidesContainer>
  );
};

export default SnapGuides;
