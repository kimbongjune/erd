import styled from 'styled-components';
import useStore from '../store/useStore';
import { 
  FiMousePointer, 
  FiMessageSquare,
  FiImage,
} from 'react-icons/fi';
import { FaTable } from "react-icons/fa";

import { 
  BsDashLg,
  BsArrowRight,
  BsDot,
} from 'react-icons/bs';
import { 
  TbTriangle,
} from 'react-icons/tb';

// Custom SVG icons for relationships
const OneToOneIdentifyingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="3"/>
  </svg>
);

const OneToOneNonIdentifyingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2"/>
  </svg>
);

const OneToManyIdentifyingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <line x1="2" y1="10" x2="11" y2="10" stroke="currentColor" strokeWidth="3"/>
    {/* 더 길고 명확한 삼발이 Crow's foot */}
    <line x1="11" y1="10" x2="17" y2="5" stroke="currentColor" strokeWidth="2"/>
    <line x1="11" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2"/>
    <line x1="11" y1="10" x2="17" y2="15" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const OneToManyNonIdentifyingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <line x1="2" y1="10" x2="11" y2="10" stroke="currentColor" strokeWidth="2" strokeDasharray="3,2"/>
    {/* 더 길고 명확한 삼발이 Crow's foot */}
    <line x1="11" y1="10" x2="17" y2="5" stroke="currentColor" strokeWidth="2"/>
    <line x1="11" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2"/>
    <line x1="11" y1="10" x2="17" y2="15" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
    pointer-events: none;
    transition: opacity 0.2s ease-in-out;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  &:hover::after {
    opacity: 1;
  }

  /* disabled 상태에서도 툴팁이 보이도록 */
  &:disabled:hover::after {
    opacity: 1;
  }
`;

const Toolbox = () => {
  const connectionMode = useStore((state) => state.connectionMode);
  const createMode = useStore((state) => state.createMode);
  const selectMode = useStore((state) => state.selectMode);
  const setConnectionMode = useStore((state) => state.setConnectionMode);
  const setCreateMode = useStore((state) => state.setCreateMode);
  const setSelectMode = useStore((state) => state.setSelectMode);
  const theme = useStore((state) => state.theme);
  const isReadOnlyMode = useStore((state) => state.isReadOnlyMode);

  const isDarkMode = theme === 'dark';

  const handleToolClick = (tool: string) => {
    // 읽기 전용 모드에서는 선택 모드만 허용
    if (isReadOnlyMode && tool !== 'select') {
      return;
    }
    
    if (tool === 'select') {
      setSelectMode(true);
      setConnectionMode(null);
      setCreateMode(null);
    } else if (tool === 'entity' || tool === 'comment' || tool === 'image') {
      setCreateMode(tool);
      setConnectionMode(null);
      setSelectMode(false);
    } else {
      setConnectionMode(tool);
      setCreateMode(null);
      setSelectMode(false);
    }
  };

  return (
    <ToolboxContainer $darkMode={isDarkMode}>
      <ToolButton
        $isActive={selectMode}
        $darkMode={isDarkMode}
        onClick={() => handleToolClick('select')}
        title="선택 도구"
      >
        <FiMousePointer />
      </ToolButton>

      <ToolButton
        $isActive={createMode === 'entity'}
        $darkMode={isDarkMode}
        onClick={() => handleToolClick('entity')}
        title={isReadOnlyMode ? "읽기 전용 모드에서는 엔터티를 생성할 수 없습니다" : "엔터티 생성"}
        disabled={isReadOnlyMode}
        style={{ 
          opacity: isReadOnlyMode ? 0.5 : 1,
          cursor: isReadOnlyMode ? 'not-allowed' : 'pointer'
        }}
      >
        <FaTable />
      </ToolButton>

      <ToolButton
        $isActive={createMode === 'comment'}
        $darkMode={isDarkMode}
        onClick={() => handleToolClick('comment')}
        title={isReadOnlyMode ? "읽기 전용 모드에서는 코멘트를 생성할 수 없습니다" : "코멘트 생성"}
        disabled={isReadOnlyMode}
        style={{ 
          opacity: isReadOnlyMode ? 0.5 : 1,
          cursor: isReadOnlyMode ? 'not-allowed' : 'pointer'
        }}
      >
        <FiMessageSquare />
      </ToolButton>

      <ToolButton
        $isActive={createMode === 'image'}
        $darkMode={isDarkMode}
        onClick={() => handleToolClick('image')}
        title={isReadOnlyMode ? "읽기 전용 모드에서는 이미지를 생성할 수 없습니다" : "이미지 생성"}
        disabled={isReadOnlyMode}
        style={{ 
          opacity: isReadOnlyMode ? 0.5 : 1,
          cursor: isReadOnlyMode ? 'not-allowed' : 'pointer'
        }}
      >
        <FiImage />
      </ToolButton>

      <ToolButton
        $isActive={connectionMode === 'oneToOneIdentifying'}
        $darkMode={isDarkMode}
        onClick={() => handleToolClick('oneToOneIdentifying')}
        title={isReadOnlyMode ? "읽기 전용 모드에서는 관계를 생성할 수 없습니다" : "1:1 식별 관계"}
        disabled={isReadOnlyMode}
        style={{ 
          opacity: isReadOnlyMode ? 0.5 : 1,
          cursor: isReadOnlyMode ? 'not-allowed' : 'pointer'
        }}
      >
        <OneToOneIdentifyingIcon />
      </ToolButton>

      <ToolButton
        $isActive={connectionMode === 'oneToOneNonIdentifying'}
        $darkMode={isDarkMode}
        onClick={() => handleToolClick('oneToOneNonIdentifying')}
        title={isReadOnlyMode ? "읽기 전용 모드에서는 관계를 생성할 수 없습니다" : "1:1 비식별 관계"}
        disabled={isReadOnlyMode}
        style={{ 
          opacity: isReadOnlyMode ? 0.5 : 1,
          cursor: isReadOnlyMode ? 'not-allowed' : 'pointer'
        }}
      >
        <OneToOneNonIdentifyingIcon />
      </ToolButton>

      <ToolButton
        $isActive={connectionMode === 'oneToManyIdentifying'}
        $darkMode={isDarkMode}
        onClick={() => handleToolClick('oneToManyIdentifying')}
        title={isReadOnlyMode ? "읽기 전용 모드에서는 관계를 생성할 수 없습니다" : "1:N 식별 관계"}
        disabled={isReadOnlyMode}
        style={{ 
          opacity: isReadOnlyMode ? 0.5 : 1,
          cursor: isReadOnlyMode ? 'not-allowed' : 'pointer'
        }}
      >
        <OneToManyIdentifyingIcon />
      </ToolButton>

      <ToolButton
        $isActive={connectionMode === 'oneToManyNonIdentifying'}
        $darkMode={isDarkMode}
        onClick={() => handleToolClick('oneToManyNonIdentifying')}
        title={isReadOnlyMode ? "읽기 전용 모드에서는 관계를 생성할 수 없습니다" : "1:N 비식별 관계"}
        disabled={isReadOnlyMode}
        style={{ 
          opacity: isReadOnlyMode ? 0.5 : 1,
          cursor: isReadOnlyMode ? 'not-allowed' : 'pointer'
        }}
      >
        <OneToManyNonIdentifyingIcon />
      </ToolButton>
    </ToolboxContainer>
  );
};

export default Toolbox;
