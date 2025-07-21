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

const EntityNode = ({ data }) => {
  return (
    <NodeContainer color={data.color}>
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <Handle type="target" position={Position.Right} />
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
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </NodeContainer>
  );
};

export default EntityNode;
