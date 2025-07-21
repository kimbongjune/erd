import styled from 'styled-components';
import useStore from '../store/useStore';

const ToolboxContainer = styled.div`
  padding: 10px;
`;

const ToolButton = styled.button<{ $isActive: boolean }>`
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 5px;
  background-color: ${(props) => (props.$isActive ? '#cceeff' : '#f0f0f0')};
  border: 1px solid #ccc;
  cursor: pointer;
  color: #333;
  font-weight: bold;

  &:hover {
    background-color: #ddd;
  }
`;

const Toolbox = () => {
  const addNode = useStore((state) => state.addNode);
  const setConnectionMode = useStore((state) => state.setConnectionMode);
  const connectionMode = useStore((state) => state.connectionMode);

  return (
    <ToolboxContainer>
      <ToolButton onClick={() => addNode('entity')}>Entity</ToolButton>
      <ToolButton
        onClick={() => setConnectionMode('one-to-one-identifying')}
        $isActive={connectionMode === 'one-to-one-identifying'}
      >
        1:1 Identifying
      </ToolButton>
      <ToolButton
        onClick={() => setConnectionMode('one-to-one-non-identifying')}
        $isActive={connectionMode === 'one-to-one-non-identifying'}
      >
        1:1 Non-Identifying
      </ToolButton>
      <ToolButton
        onClick={() => setConnectionMode('one-to-many-identifying')}
        $isActive={connectionMode === 'one-to-many-identifying'}
      >
        1:N Identifying
      </ToolButton>
      <ToolButton
        onClick={() => setConnectionMode('one-to-many-non-identifying')}
        $isActive={connectionMode === 'one-to-many-non-identifying'}
      >
        1:N Non-Identifying
      </ToolButton>
      <ToolButton onClick={() => addNode('comment')}>Comment</ToolButton>
      <ToolButton onClick={() => addNode('text')}>Text</ToolButton>
    </ToolboxContainer>
  );
};

export default Toolbox;
