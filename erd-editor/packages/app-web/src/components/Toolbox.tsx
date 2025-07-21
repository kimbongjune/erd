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

  const handleConnectionModeClick = (mode: string) => {
    if (connectionMode === mode) {
      setConnectionMode(null); // Toggle off if the same button is clicked
    } else {
      setConnectionMode(mode);
    }
  };

  return (
    <ToolboxContainer>
      <ToolButton onClick={() => addNode('entity')} $isActive={false}>Entity</ToolButton>
      <ToolButton
        onClick={() => handleConnectionModeClick('one-to-one-identifying')}
        $isActive={connectionMode === 'one-to-one-identifying'}
      >
        1:1 Identifying
      </ToolButton>
      <ToolButton
        onClick={() => handleConnectionModeClick('one-to-one-non-identifying')}
        $isActive={connectionMode === 'one-to-one-non-identifying'}
      >
        1:1 Non-Identifying
      </ToolButton>
      <ToolButton
        onClick={() => handleConnectionModeClick('one-to-many-identifying')}
        $isActive={connectionMode === 'one-to-many-identifying'}
      >
        1:N Identifying
      </ToolButton>
      <ToolButton
        onClick={() => handleConnectionModeClick('one-to-many-non-identifying')}
        $isActive={connectionMode === 'one-to-many-non-identifying'}
      >
        1:N Non-Identifying
      </ToolButton>
      <ToolButton onClick={() => addNode('comment')} $isActive={false}>Comment</ToolButton>
      <ToolButton onClick={() => addNode('text')} $isActive={false}>Text</ToolButton>
    </ToolboxContainer>
  );
};

export default Toolbox;
