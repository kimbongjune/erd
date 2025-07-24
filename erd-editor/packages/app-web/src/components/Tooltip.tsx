import React, { useState } from 'react';
import styled from 'styled-components';

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipText = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 110%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  z-index: 1001;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: opacity 0.2s ease, visibility 0.2s ease;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.8);
  }
`;

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children, delay = 500 }) => {
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setVisible(false);
  };

  return (
    <TooltipContainer onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      <TooltipText $visible={visible}>{text}</TooltipText>
    </TooltipContainer>
  );
};

export default Tooltip;
