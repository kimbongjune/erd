import React, { useState } from 'react';
import styled from 'styled-components';
import {
  FiMousePointer,
  FiSquare,
  FiCircle,
  FiArrowRight,
  FiTriangle,
  FiImage,
  FiMessageSquare,
  FiBox,
  FiMinus,
  FiPlus
} from 'react-icons/fi';

const ToolboxContainer = styled.div<{ $darkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 20px 10px;
  background-color: ${props => props.$darkMode ? '#2d3748' : 'transparent'};
`;

const ToolButton = styled.button<{ $isActive?: boolean; $darkMode?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border: 2px solid ${props => props.$isActive ? '#007acc' : (props.$darkMode ? '#404040' : '#e2e8f0')};
  background-color: ${props => props.$isActive ? (props.$darkMode ? '#1a365d' : '#e8f2ff') : (props.$darkMode ? '#374151' : '#ffffff')};
  border-radius: 8px;
  cursor: pointer;
  color: ${props => props.$isActive ? '#007acc' : (props.$darkMode ? '#e2e8f0' : '#64748b')};
  font-size: 20px;
  transition: all 0.2s ease-in-out;
  position: relative;
  z-index: 100;

  &:hover {
    border-color: #007acc;
    background-color: ${props => props.$darkMode ? '#4a5568' : '#f0f8ff'};
    color: #007acc;
  }

  &::after {
    content: attr(title);
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 8px;
    background: #374151;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    pointer-events: none;
    z-index: 1000;
  }

  &:hover::after {
    opacity: 1;
    visibility: visible;
  }
`;

interface ClassToolboxProps {
  darkMode: boolean;
}

const ClassToolbox: React.FC<ClassToolboxProps> = ({ darkMode }) => {
  const [activeTool, setActiveTool] = useState<string>('select');

  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId);
    // 툴 선택 로직 (나중에 구현)
    console.log(`툴 선택: ${toolId}`);
  };

  return (
    <ToolboxContainer $darkMode={darkMode}>
      <ToolButton
        $isActive={activeTool === 'select'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('select')}
        title="선택"
      >
        <FiMousePointer />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'class'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('class')}
        title="클래스"
      >
        <FiSquare />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'interface'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('interface')}
        title="인터페이스"
      >
        <FiCircle />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'association'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('association')}
        title="연관"
      >
        <FiMinus />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'directedAssociation'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('directedAssociation')}
        title="방향성 연관"
      >
        <FiArrowRight />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'aggregation'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('aggregation')}
        title="집합"
      >
        <FiBox />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'composition'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('composition')}
        title="합성"
      >
        <FiBox />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'dependency'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('dependency')}
        title="의존"
      >
        <FiArrowRight />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'generalization'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('generalization')}
        title="일반화"
      >
        <FiTriangle />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'interfaceRealization'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('interfaceRealization')}
        title="인터페이스 실현"
      >
        <FiTriangle />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'image'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('image')}
        title="이미지"
      >
        <FiImage />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'comment'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('comment')}
        title="커멘트"
      >
        <FiMessageSquare />
      </ToolButton>
    </ToolboxContainer>
  );
};

export default ClassToolbox;
