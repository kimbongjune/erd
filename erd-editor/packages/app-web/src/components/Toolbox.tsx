import styled from 'styled-components';
import useStore from '../store/useStore';
import { 
  FiMousePointer, 
  FiMessageSquare,
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

const ToolboxContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 20px 10px;
`;

const ToolButton = styled.button<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border: 2px solid ${props => props.$isActive ? '#007acc' : '#e2e8f0'};
  background-color: ${props => props.$isActive ? '#e8f2ff' : '#ffffff'};
  border-radius: 8px;
  cursor: pointer;
  color: ${props => props.$isActive ? '#007acc' : '#64748b'};
  font-size: 20px;
  transition: all 0.2s ease-in-out;
  position: relative;

  &:hover {
    border-color: #007acc;
    background-color: #f0f8ff;
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
    pointer-events: none;
    transition: opacity 0.2s ease-in-out;
    z-index: 1000;
  }

  &:hover::after {
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

  const handleToolClick = (tool: string) => {
    if (tool === 'select') {
      setSelectMode(true);
      setConnectionMode(null);
      setCreateMode(null);
    } else if (tool === 'entity' || tool === 'comment') {
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
    <ToolboxContainer>
      <ToolButton
        $isActive={selectMode}
        onClick={() => handleToolClick('select')}
        title="선택 도구"
      >
        <FiMousePointer />
      </ToolButton>

      <ToolButton
        $isActive={createMode === 'entity'}
        onClick={() => handleToolClick('entity')}
        title="엔터티 생성"
      >
        <FaTable />
      </ToolButton>

      <ToolButton
        $isActive={createMode === 'comment'}
        onClick={() => handleToolClick('comment')}
        title="코멘트 생성"
      >
        <FiMessageSquare />
      </ToolButton>

      <ToolButton
        $isActive={connectionMode === 'oneToOneIdentifying'}
        onClick={() => handleToolClick('oneToOneIdentifying')}
        title="1:1 식별 관계"
      >
        <OneToOneIdentifyingIcon />
      </ToolButton>

      <ToolButton
        $isActive={connectionMode === 'oneToOneNonIdentifying'}
        onClick={() => handleToolClick('oneToOneNonIdentifying')}
        title="1:1 비식별 관계"
      >
        <OneToOneNonIdentifyingIcon />
      </ToolButton>

      <ToolButton
        $isActive={connectionMode === 'oneToManyIdentifying'}
        onClick={() => handleToolClick('oneToManyIdentifying')}
        title="1:N 식별 관계"
      >
        <OneToManyIdentifyingIcon />
      </ToolButton>

      <ToolButton
        $isActive={connectionMode === 'oneToManyNonIdentifying'}
        onClick={() => handleToolClick('oneToManyNonIdentifying')}
        title="1:N 비식별 관계"
      >
        <OneToManyNonIdentifyingIcon />
      </ToolButton>
    </ToolboxContainer>
  );
};

export default Toolbox;
