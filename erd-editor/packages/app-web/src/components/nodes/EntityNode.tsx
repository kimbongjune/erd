import { Handle, Position } from 'reactflow';
import styled from 'styled-components';
import useStore from '../../store/useStore';

const NodeContainer = styled.div`
  border: 1px solid #000;
  background-color: ${(props) => props.color || '#fff'};
  border-radius: 5px;
`;

const Header = styled.div`
  background-color: #f0f0f0;
  padding: 5px;
  font-weight: bold;
  border-bottom: 1px solid #000;
`;

const Columns = styled.div`
  padding: 5px;
`;

const Column = styled.div`
  display: flex;
  gap: 5px;
`;

const StyledHandle = styled(Handle)<{ $isVisible: boolean }>`
  opacity: ${props => props.$isVisible ? 0.5 : 0};
  width: 10px;
  height: 10px;
  pointer-events: ${props => props.$isVisible ? 'all' : 'none'};
`;

const EntityNode = ({ data, onMouseDown }: any) => {
  const connectionMode = useStore((state) => state.connectionMode);
  const selectedEdgeId = useStore((state) => state.selectedEdgeId);
  
  // Handle 절대 표시하지 않음
  const shouldShowHandles = false;
  
  const handleMouseDown = (e: any) => {
    // Only call onMouseDown for connection mode, let double click pass through
    if (onMouseDown) {
      onMouseDown(e);
    }
  };

  return (
    <NodeContainer color={data.color} onMouseDown={handleMouseDown}>
      <StyledHandle type="target" position={Position.Left} id="left" $isVisible={shouldShowHandles} />
      <StyledHandle type="target" position={Position.Right} id="right" $isVisible={shouldShowHandles} />
      <Header>{data.label}</Header>
      <Columns>
        {data.columns?.map((col: any, i: number) => (
          <Column key={i}>
            <span>{col.pk && '🔑'}</span>
            <span>{col.fk && '🔗'}</span>
            <span>{col.name}</span>
            <span>{col.type}</span>
          </Column>
        ))}
      </Columns>
      <StyledHandle type="source" position={Position.Left} id="left" $isVisible={shouldShowHandles} />
      <StyledHandle type="source" position={Position.Right} id="right" $isVisible={shouldShowHandles} />
    </NodeContainer>
  );
};

export default EntityNode;
