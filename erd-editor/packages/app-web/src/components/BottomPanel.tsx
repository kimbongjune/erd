import styled from 'styled-components';
import useStore from '../store/useStore';

const PanelContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 10px;
`;

const BottomPanel = () => {
  const { nodes, selectedNodeId, updateNodeData } = useStore();
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  if (!selectedNode) {
    return null;
  }

  const handleColumnChange = (index, field, value) => {
    const newColumns = [...selectedNode.data.columns];
    newColumns[index][field] = value;
    updateNodeData(selectedNode.id, { ...selectedNode.data, columns: newColumns });
  };

  const addColumn = () => {
    const newColumns = [...selectedNode.data.columns, { name: 'new_column', type: 'VARCHAR', pk: false }];
    updateNodeData(selectedNode.id, { ...selectedNode.data, columns: newColumns });
  };

  const removeColumn = (index) => {
    const newColumns = [...selectedNode.data.columns];
    newColumns.splice(index, 1);
    updateNodeData(selectedNode.id, { ...selectedNode.data, columns: newColumns });
  };

  return (
    <PanelContainer>
      <h2>{selectedNode.data.label}</h2>
      <div>
        <h3>Columns</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>PK</th>
              <th>FK</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {selectedNode.data.columns?.map((col, i) => (
              <tr key={i}>
                <td><input type="text" value={col.name} onChange={(e) => handleColumnChange(i, 'name', e.target.value)} /></td>
                <td><input type="text" value={col.type} onChange={(e) => handleColumnChange(i, 'type', e.target.value)} /></td>
                <td><input type="checkbox" checked={col.pk} onChange={(e) => handleColumnChange(i, 'pk', e.target.checked)} /></td>
                <td>{col.fk ? 'FK' : ''}</td>
                <td><button onClick={() => removeColumn(i)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addColumn}>Add Column</button>
      </div>
    </PanelContainer>
  );
};

export default BottomPanel;
