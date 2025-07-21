import styled from 'styled-components';
import useStore from '../store/useStore';

const PropertiesContainer = styled.aside`
  grid-area: properties;
  background-color: #e0e0e0;
  padding: 10px;
`;

const Properties = () => {
  const { nodes, selectedNodeId, updateNodeData } = useStore();
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  if (!selectedNode) {
    return <PropertiesContainer>Select a node to edit its properties.</PropertiesContainer>;
  }

  const handleColorChange = (e) => {
    updateNodeData(selectedNode.id, { ...selectedNode.data, color: e.target.value });
  };

  return (
    <PropertiesContainer>
      <h3>Properties</h3>
      <div>
        <label>Background Color:</label>
        <input type="color" value={selectedNode.data.color || '#ffffff'} onChange={handleColorChange} />
      </div>
    </PropertiesContainer>
  );
};

export default Properties;
