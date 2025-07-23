import React from 'react';
import styled from 'styled-components';

const TooltipContainer = styled.div<{ $visible: boolean; $x: number; $y: number }>`
  position: fixed;
  top: ${props => props.$y}px;
  left: ${props => props.$x}px;
  transform: translate(2px, -50%);
  background: #1a1a1a;
  color: white;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 12px;
  z-index: 10000;
  pointer-events: none;
  min-width: 180px;
  max-width: 300px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  border: 1px solid #333;
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.15s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: -6px;
    transform: translateY(-50%);
    border: 6px solid transparent;
    border-right-color: #1a1a1a;
  }
`;

const TooltipTitle = styled.div`
  font-weight: bold;
  margin-bottom: 6px;
  font-size: 12px;
`;

const TooltipDivider = styled.div`
  border-top: 1px solid #444;
  margin: 6px 0;
`;

const TooltipComment = styled.div`
  font-weight: normal;
  line-height: 1.3;
  font-size: 11px;
`;

const DataType = styled.span`
  color: #ffa500;
  font-weight: normal;
`;

interface TooltipProps {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  dataType?: string;
  comment: string;
}

const Tooltip: React.FC<TooltipProps> = ({ visible, x, y, title, dataType, comment }) => {
  return (
    <TooltipContainer $visible={visible} $x={x} $y={y}>
      <TooltipTitle>
        {dataType ? (
          <>
            {title}: <DataType>{dataType}</DataType>
          </>
        ) : (
          `테이블: ${title}`
        )}
      </TooltipTitle>
      <TooltipDivider />
      <TooltipComment>{comment}</TooltipComment>
    </TooltipContainer>
  );
};

export default Tooltip;
