import styled from 'styled-components';
import { Handle, Position } from 'reactflow';
import { FaKey } from 'react-icons/fa';
import useStore from '../../store/useStore';

const NodeContainer = styled.div<{ $isSelected: boolean }>`
  min-width: 200px;
  width: auto;
  min-height: 100px;
  height: auto;
  border: 3px solid ${props => props.$isSelected ? '#007acc' : '#ddd'};
  background-color: ${props => props.$isSelected ? '#f0f8ff' : '#fff'};
  border-radius: 8px;
  box-shadow: ${props => props.$isSelected ? '0 8px 25px rgba(0, 122, 204, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6)' : '0 2px 8px rgba(0, 0, 0, 0.1)'};
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: ${props => props.$isSelected ? 'scale(1.02)' : 'scale(1)'};
  
  &:hover {
    border-color: ${props => props.$isSelected ? '#005999' : '#60a5fa'};
    box-shadow: ${props => props.$isSelected 
      ? '0 12px 35px rgba(0, 122, 204, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.8)' 
      : '0 4px 15px rgba(96, 165, 250, 0.2)'};
    transform: ${props => props.$isSelected ? 'scale(1.03)' : 'scale(1.01)'};
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.$isSelected ? 'linear-gradient(90deg, #007acc, #4da6ff, #007acc)' : 'transparent'};
    background-size: 200% 100%;
    animation: ${props => props.$isSelected ? 'shimmer 2s infinite' : 'none'};
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

const Header = styled.div`
  background: linear-gradient(135deg, #4472c4 0%, #3056a0 100%);
  color: white;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
`;

const ColumnsContainer = styled.div`
  padding: 0;
  background: #fff;
`;

const Column = styled.div<{ $isPrimaryKey?: boolean; $isForeignKey?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  background: ${props => {
    if (props.$isPrimaryKey) return '#fff8e7';
    if (props.$isForeignKey) return '#e3f2fd';
    return '#fff';
  }};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${props => {
      if (props.$isPrimaryKey) return '#fff4d6';
      if (props.$isForeignKey) return '#d1e7dd';
      return '#f8f9fa';
    }};
  }
`;

const ColumnLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
`;

const ColumnName = styled.span<{ $isPrimaryKey?: boolean }>`
  font-weight: ${props => props.$isPrimaryKey ? 600 : 400};
  color: ${props => props.$isPrimaryKey ? '#d68910' : '#333'};
`;

const ColumnType = styled.span`
  color: #666;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
`;

const IconWrapper = styled.span<{ $type?: 'pk' | 'fk' | 'uk' }>`
  font-size: 14px;
  display: flex;
  align-items: center;
  color: ${props => {
    if (props.$type === 'pk') return '#f1c40f';
    if (props.$type === 'fk') return '#2196f3';
    if (props.$type === 'uk') return '#f44336';
    return '#666';
  }};
`;

const InvisibleHandle = styled(Handle)`
  opacity: 0;
  pointer-events: none;
  width: 1px;
  height: 1px;
`;

const EntityNode = ({ data, id, onMouseDown }: any) => {
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);
  const setBottomPanelOpen = useStore((state) => state.setBottomPanelOpen);
  
  // 현재 노드가 선택되었는지 확인 (id 사용)
  const isSelected = selectedNodeId === id;
  
  const handleMouseDown = (e: any) => {
    const connectionMode = useStore.getState().connectionMode;
    const isBottomPanelOpen = useStore.getState().isBottomPanelOpen;
    
    // 관계선 연결 모드이거나 하단 패널이 열려있을 때는 관계선 생성을 우선시
    if (connectionMode) {
      // 관계선 연결 모드일 때는 선택만 하고 패널 상태는 유지
      setSelectedNodeId(id);
    } else if (isBottomPanelOpen && selectedNodeId !== id) {
      // 다른 노드가 선택되어 있고 하단 패널이 열려있을 때는 선택만 변경
      setSelectedNodeId(id);
    } else {
      // 일반적인 경우: 노드 선택 및 하단 패널 열기
      setSelectedNodeId(id);
      setBottomPanelOpen(true);
    }
    
    // Only call onMouseDown for connection mode, let double click pass through
    if (onMouseDown) {
      onMouseDown(e);
    }
  };

  return (
    <NodeContainer $isSelected={isSelected} onMouseDown={handleMouseDown}>
      {/* 보이지 않는 연결 핸들들 - 모든 핸들을 source와 target 둘 다 지원 */}
      <InvisibleHandle type="target" position={Position.Left} id="left" />
      <InvisibleHandle type="source" position={Position.Left} id="left" />
      <InvisibleHandle type="target" position={Position.Right} id="right" />
      <InvisibleHandle type="source" position={Position.Right} id="right" />
      <InvisibleHandle type="target" position={Position.Top} id="top" />
      <InvisibleHandle type="source" position={Position.Top} id="top" />
      <InvisibleHandle type="target" position={Position.Bottom} id="bottom" />
      <InvisibleHandle type="source" position={Position.Bottom} id="bottom" />
      
      <Header>
        {data.label}
      </Header>
      
      <ColumnsContainer>
        {data.columns?.map((col: any, i: number) => (
          <Column key={i} $isPrimaryKey={col.pk} $isForeignKey={col.fk}>
            <ColumnLeft>
              {col.pk && col.fk ? (
                <IconWrapper $type="pk"><FaKey /></IconWrapper>
              ) : col.pk ? (
                <IconWrapper $type="pk"><FaKey /></IconWrapper>
              ) : col.fk ? (
                <IconWrapper $type="fk"><FaKey /></IconWrapper>
              ) : col.uk ? (
                <IconWrapper $type="uk"><FaKey /></IconWrapper>
              ) : null}
              <ColumnName $isPrimaryKey={col.pk}>{col.name}</ColumnName>
            </ColumnLeft>
            <ColumnType>{col.type} {col.nullable === false ? 'NN' : ''}</ColumnType>
          </Column>
        ))}
      </ColumnsContainer>
    </NodeContainer>
  );
};

export default EntityNode;