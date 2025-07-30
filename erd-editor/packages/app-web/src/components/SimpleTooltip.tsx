import React, { useState } from 'react';
import styled from 'styled-components';

interface SimpleTooltipProps {
  text: string;
  children: React.ReactNode;
  darkMode?: boolean;
}

const TooltipContainer = styled.div<{ $visible: boolean; $darkMode?: boolean }>`
  position: fixed;
  background: ${props => props.$darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.9)'};
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  z-index: 999999;
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: none;
  border: 1px solid ${props => props.$darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
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
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 20
    });
    setVisible(true);
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  return (
    <>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
      </div>
      <TooltipContainer
        $visible={visible}
        $darkMode={darkMode}
        style={{
          left: position.x,
          top: position.y,
          transform: 'translateX(-50%)'
        }}
      >
        {text}
      </TooltipContainer>
    </>
  );
};

export default SimpleTooltip; 