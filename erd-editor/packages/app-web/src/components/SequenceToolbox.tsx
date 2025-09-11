import React, { useState } from 'react';
import styled from 'styled-components';
import {
  FiMousePointer,
  FiUser,
  FiSquare,
  FiArrowRight,
  FiArrowLeft,
  FiRotateCcw,
  FiFileText,
  FiImage,
  FiMessageSquare,
  FiBox,
  FiZap,
  FiRefreshCw,
  FiPlus,
  FiMinus
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

interface SequenceToolboxProps {
  darkMode: boolean;
}

const SequenceToolbox: React.FC<SequenceToolboxProps> = ({ darkMode }) => {
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
        $isActive={activeTool === 'lifeline'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('lifeline')}
        title="생명선"
      >
        <FiSquare />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'syncMessage'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('syncMessage')}
        title="메시지"
      >
        <FiArrowRight />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'selfMessage'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('selfMessage')}
        title="셀프 메시지"
      >
        <FiRefreshCw />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'asyncMessage'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('asyncMessage')}
        title="비동기 메시지"
      >
        <FiZap />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'returnMessage'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('returnMessage')}
        title="리턴 메시지"
      >
        <FiArrowLeft />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'createMessage'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('createMessage')}
        title="생성 메시지"
      >
        <FiPlus />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'deleteMessage'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('deleteMessage')}
        title="삭제 메시지"
      >
        <FiMinus />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'boundary'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('boundary')}
        title="바운더리"
      >
        <FiSquare />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'comment'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('comment')}
        title="코멘트"
      >
        <FiMessageSquare />
      </ToolButton>

      <ToolButton
        $isActive={activeTool === 'image'}
        $darkMode={darkMode}
        onClick={() => handleToolClick('image')}
        title="이미지"
      >
        <FiImage />
      </ToolButton>
    </ToolboxContainer>
  );
};

export default SequenceToolbox;
