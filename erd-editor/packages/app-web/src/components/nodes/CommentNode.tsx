import { Handle, Position } from 'reactflow';
import styled from 'styled-components';

const NodeContainer = styled.div`
  padding: 10px;
  border: 1px solid #000;
  background-color: ${(props) => props.color || '#cfc'};
`;

const CommentNode = ({ data }) => {
  return (
    <NodeContainer color={data.color}>
      <Handle type="target" position={Position.Top} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </NodeContainer>
  );
};

export default CommentNode;
