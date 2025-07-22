import styled from 'styled-components';
import { Handle, Position } from 'reactflow';
import useStore from '../../store/useStore';

const NodeContainer = styled.div<{ $isSelected: boolean }>`
  min-width: 200px;
  width: auto;
  min-height: 100px;
  height: auto;
  border: 2px solid ${props => props.$isSelected ? '#007acc' : '#ddd'};
  background-color: #fff;
  border-radius: 8px;
  box-shadow: ${props => props.$isSelected ? '0 4px 12px rgba(0, 122, 204, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)'};
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
  background: ${props => props.$isPrimaryKey ? '#fff8e7' : '#fff'};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f8f9fa;
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
  color: ${props => {
    if (props.$type === 'pk') return '#d68910';
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
  
  // 현재 노드가 선택되었는지 확인 (id 사용)
  const isSelected = selectedNodeId === id;
  
  const handleMouseDown = (e: any) => {
    // Only call onMouseDown for connection mode, let double click pass through
    if (onMouseDown) {
      onMouseDown(e);
    }
  };

  return (
    <NodeContainer $isSelected={isSelected} onMouseDown={handleMouseDown}>
      {/* 보이지 않는 연결 핸들들 */}
      <InvisibleHandle type="target" position={Position.Left} id="left" />
      <InvisibleHandle type="source" position={Position.Right} id="right" />
      <InvisibleHandle type="target" position={Position.Top} id="top" />
      <InvisibleHandle type="source" position={Position.Bottom} id="bottom" />
      
      <Header>
        {data.label}
      </Header>
      
      <ColumnsContainer>
        {data.columns?.map((col: any, i: number) => (
          <Column key={i} $isPrimaryKey={col.pk} $isForeignKey={col.fk}>
            <ColumnLeft>
              {col.pk && col.fk ? (
                <IconWrapper $type="pk">🔑</IconWrapper>
              ) : col.pk ? (
                <IconWrapper $type="pk">🔑</IconWrapper>
              ) : col.fk ? (
                <IconWrapper $type="fk">🔑</IconWrapper>
              ) : col.uk ? (
                <IconWrapper $type="uk">🔑</IconWrapper>
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