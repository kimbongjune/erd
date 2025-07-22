import styled from 'styled-components';
import useStore from '../store/useStore';
import { 
  FiMousePointer, 
  FiGrid, 
  FiMessageSquare,
  FiDatabase,
} from 'react-icons/fi';
import { 
  MdOutlineHorizontalRule,
  MdOutlineArrowForward,
} from 'react-icons/md';
import { 
  BsDashLg,
  BsArrowRight,
} from 'react-icons/bs';

const ToolboxContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 20px 10px;
`;

const ToolButton = styled.button<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background-color: ${(props) => (props.$isActive ? '#007acc' : '#fff')};
  border: 2px solid ${(props) => (props.$isActive ? '#007acc' : '#ddd')};
  border-radius: 8px;
  cursor: pointer;
  color: ${(props) => (props.$isActive ? '#fff' : '#333')};
  font-size: 18px;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: ${(props) => (props.$isActive ? '#005999' : '#f0f0f0')};
    border-color: #007acc;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  /* 툴팁 스타일 */
  &:hover::after {
    content: attr(title);
    position: absolute;
    left: 60px;
    top: 50%;
    transform: translateY(-50%);
    background: #333;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  /* 툴팁 화살표 */
  &:hover::before {
    content: '';
    position: absolute;
    left: 55px;
    top: 50%;
    transform: translateY(-50%);
    border: 6px solid transparent;
    border-right-color: #333;
    z-index: 1001;
  }
`;

const Toolbox = () => {
  const setConnectionMode = useStore((state) => state.setConnectionMode);
  const setCreateMode = useStore((state) => state.setCreateMode);
  const setSelectMode = useStore((state) => state.setSelectMode);
  const connectionMode = useStore((state) => state.connectionMode);
  const createMode = useStore((state) => state.createMode);
  const selectMode = useStore((state) => state.selectMode);

  const handleSelectClick = () => {
    setSelectMode(true);
    setConnectionMode(null);
    setCreateMode(null);
  };

  const handleEntityClick = () => {
    setCreateMode('entity');
    setConnectionMode(null);
    setSelectMode(false);
  };

  const handleCommentClick = () => {
    setCreateMode('comment');
    setConnectionMode(null);
    setSelectMode(false);
  };

  const handleOneToOneIdentifyingClick = () => {
    setConnectionMode('oneToOneIdentifying');
    setCreateMode(null);
    setSelectMode(false);
  };

  const handleOneToManyIdentifyingClick = () => {
    setConnectionMode('oneToManyIdentifying');
    setCreateMode(null);
    setSelectMode(false);
  };

  const handleOneToOneNonIdentifyingClick = () => {
    setConnectionMode('oneToOneNonIdentifying');
    setCreateMode(null);
    setSelectMode(false);
  };

  const handleOneToManyNonIdentifyingClick = () => {
    setConnectionMode('oneToManyNonIdentifying');
    setCreateMode(null);
    setSelectMode(false);
  };

  return (
    <ToolboxContainer>
      {/* 선택 모드 */}
      <ToolButton 
        onClick={handleSelectClick} 
        $isActive={selectMode && !connectionMode && !createMode}
        title="선택 및 이동"
      >
        <FiMousePointer />
      </ToolButton>
      
      {/* 엔티티 생성 */}
      <ToolButton 
        onClick={handleEntityClick} 
        $isActive={createMode === 'entity'}
        title="엔티티 추가"
      >
        <FiDatabase />
      </ToolButton>
      
      {/* 코멘트 생성 */}
      <ToolButton 
        onClick={handleCommentClick} 
        $isActive={createMode === 'comment'}
        title="메모 추가"
      >
        <FiMessageSquare />
      </ToolButton>
      
      {/* 1:1 식별 관계 */}
      <ToolButton 
        onClick={handleOneToOneIdentifyingClick} 
        $isActive={connectionMode === 'oneToOneIdentifying'}
        title="1:1 식별 관계"
      >
        <MdOutlineHorizontalRule />
      </ToolButton>
      
      {/* 1:N 식별 관계 */}
      <ToolButton 
        onClick={handleOneToManyIdentifyingClick} 
        $isActive={connectionMode === 'oneToManyIdentifying'}
        title="1:N 식별 관계"
      >
        <MdOutlineArrowForward />
      </ToolButton>
      
      {/* 1:1 비식별 관계 */}
      <ToolButton 
        onClick={handleOneToOneNonIdentifyingClick} 
        $isActive={connectionMode === 'oneToOneNonIdentifying'}
        title="1:1 비식별 관계"
      >
        <BsDashLg />
      </ToolButton>
      
      {/* 1:N 비식별 관계 */}
      <ToolButton 
        onClick={handleOneToManyNonIdentifyingClick} 
        $isActive={connectionMode === 'oneToManyNonIdentifying'}
        title="1:N 비식별 관계"
      >
        <BsArrowRight />
      </ToolButton>
    </ToolboxContainer>
  );
};

export default Toolbox;
