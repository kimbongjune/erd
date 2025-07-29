import React from 'react';
import styled from 'styled-components';

interface TooltipProps {
  visible: boolean;
  x: number;
  y: number;
  content: string;
  darkMode?: boolean;
  position?: 'top' | 'left';
}

const TooltipContainer = styled.div<{ $visible: boolean; $x: number; $y: number; $darkMode?: boolean }>`
  position: fixed;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  transform: translateX(-50%);
  background: ${props => props.$darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.9)'};
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  z-index: 99999;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: all 0.2s ease;
  max-width: 300px;
  white-space: pre-wrap;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  border: 1px solid ${props => props.$darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'};
  line-height: 1.4;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: ${props => props.$darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.9)'};
  }
`;

const LeftTooltipContainer = styled.div<{ $visible: boolean; $x: number; $y: number; $darkMode?: boolean }>`
  position: fixed;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  transform: translateX(-100%);
  background: ${props => props.$darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.9)'};
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  z-index: 99999;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: all 0.2s ease;
  max-width: 300px;
  white-space: pre-wrap;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  border: 1px solid ${props => props.$darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'};
  line-height: 1.4;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: -4px;
    transform: translateY(-50%);
    border: 4px solid transparent;
    border-left-color: ${props => props.$darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.9)'};
  }
`;

const Tooltip: React.FC<TooltipProps> = ({ visible, x, y, content, darkMode, position = 'top' }) => {
  if (position === 'left') {
    return (
      <LeftTooltipContainer $visible={visible} $x={x} $y={y} $darkMode={darkMode}>
        {content}
      </LeftTooltipContainer>
    );
  }
  
  return (
    <TooltipContainer $visible={visible} $x={x} $y={y} $darkMode={darkMode}>
      {content}
    </TooltipContainer>
  );
};

export default Tooltip;
