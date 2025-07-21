import { Handle, Position } from 'reactflow';
import styled from 'styled-components';
import useStore from '../../store/useStore';

const NodeContainer = styled.div`
  padding: 10px;
  border: 1px solid #000;
  background-color: ${(props) => props.color || '#ccf'};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 50px;
  border: none;
  resize: none;
  background-color: transparent;
  font-size: 1em;
  font-family: inherit;
  &:focus {
    outline: none;
  }
`;

const DeleteButton = styled.button`
  background-color: #ff4d4d;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  margin-top: 5px;
  align-self: flex-end;

  &:hover {
    background-color: #cc0000;
  }
`;

const TextNode = ({ id, data }) => {
  const { updateNodeData, deleteNode } = useStore();

  const handleChange = (e) => {
    updateNodeData(id, { label: e.target.value });
  };

  const handleDelete = () => {
    deleteNode(id);
  };

  return (
    <NodeContainer color={data.color}>
      <Handle type="target" position={Position.Top} />
      <TextArea value={data.label} onChange={handleChange} />
      <DeleteButton onClick={handleDelete}>Delete</DeleteButton>
      <Handle type="source" position={Position.Bottom} />
    </NodeContainer>
  );
};

export default TextNode;
