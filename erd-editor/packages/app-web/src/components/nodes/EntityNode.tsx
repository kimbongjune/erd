import { Handle, Position } from 'reactflow';
import styled from 'styled-components';

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

const StyledHandle = styled(Handle)`
  opacity: 0;
  width: 10px;
  height: 10px;
  pointer-events: none; /* Ensure handles don't block mouse events on the node */
`;

const EntityNode = ({ data, onMouseDown }) => {
  return (
    <NodeContainer color={data.color} onMouseDown={onMouseDown}>
      <StyledHandle type="target" position={Position.Left} id="left" />
      <StyledHandle type="target" position={Position.Right} id="right" />
      <Header>{data.label}</Header>
      <Columns>
        {data.columns?.map((col, i) => (
          <Column key={i}>
            <span>{col.pk && '🔑'}</span>
            <span>{col.fk && '🔗'}</span>
            <span>{col.name}</span>
            <span>{col.type}</span>
          </Column>
        ))}
      </Columns>
      <StyledHandle type="source" position={Position.Left} id="left" />
      <StyledHandle type="source" position={Position.Right} id="right" />
    </NodeContainer>
  );
};

export default EntityNode;
