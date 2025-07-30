import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

interface SimpleTooltipProps {
  text: string;
  children: React.ReactNode;
  darkMode?: boolean;
}

const TooltipContainer = styled.div<{ $visible: boolean; $x: number; $y: number; $darkMode?: boolean }>`
  position: fixed;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  transform: translateX(-50%);
  background: ${props => props.$darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.9)'};
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  pointer-events: none;
  z-index: 99999;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: opacity 0.15s ease;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid ${props => props.$darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'};
  
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

const SimpleTooltip: React.FC<SimpleTooltipProps> = ({ text, children, darkMode }) => {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip({ visible: false, x: 0, y: 0 });
  }, []);

  return (
    <>
      <div 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>
      <TooltipContainer 
        $visible={tooltip.visible} 
        $x={tooltip.x} 
        $y={tooltip.y} 
        $darkMode={darkMode}
      >
        {text}
      </TooltipContainer>
    </>
  );
};

export default SimpleTooltip; 