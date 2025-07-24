import styled from 'styled-components';
import useStore from '../store/useStore';
import { toast } from 'react-toastify';
import { useState } from 'react';

const PanelContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 10px;
`;

const TableHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #007acc 0%, #005999 100%);
  color: white;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
`;

const EditableTableName = styled.input`
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  outline: none;
  min-width: 150px;
  
  &:focus {
    background: white;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
  }
`;

const TableSeparator = styled.span`
  font-size: 16px;
  opacity: 0.8;
`;

const EditableLogicalName = styled.input`
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  outline: none;
  min-width: 120px;
  
  &:focus {
    background: white;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
  }
`;

const BottomPanel = () => {
  const nodes = useStore((state) => state.nodes);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  if (!selectedNode) {
    return null;
  }

    const handleColumnChange = (index: number, field: string, value: any) => {
    if (!selectedNode || !selectedNode.data.columns) {
      return;
    }
    
    const newColumns = [...selectedNode.data.columns];
    
    // PK가 체크되면 UQ는 강제로 해제
    if (field === 'pk' && value === true) {
      newColumns[index] = { ...newColumns[index], pk: true, uq: false };
      toast.success('Primary Key 설정! Unique Key가 자동 해제됨');
    }
    // UQ가 체크되면 PK는 강제로 해제  
    else if (field === 'uq' && value === true) {
      newColumns[index] = { ...newColumns[index], uq: true, pk: false };
      toast.success('Unique Key 설정! Primary Key가 자동 해제됨');
    }
    // PK 해제
    else if (field === 'pk' && value === false) {
      newColumns[index] = { ...newColumns[index], pk: false };
    }
    // UQ 해제
    else if (field === 'uq' && value === false) {
      newColumns[index] = { ...newColumns[index], uq: false };
    }
    // 다른 필드들
    else {
      newColumns[index] = { ...newColumns[index], [field]: value };
    }
    
    updateNodeData(selectedNode.id, { ...selectedNode.data, columns: newColumns });
  };

  const addColumn = () => {
    const newColumns = [...selectedNode.data.columns, { 
      name: 'new_column', 
      type: 'VARCHAR(255)', 
      pk: false, 
      fk: false, 
      uq: false, 
      comment: '' 
    }];
    updateNodeData(selectedNode.id, { ...selectedNode.data, columns: newColumns });
  };

  const removeColumn = (index: number) => {
    const newColumns = [...selectedNode.data.columns];
    newColumns.splice(index, 1);
    updateNodeData(selectedNode.id, { ...selectedNode.data, columns: newColumns });
  };

  const handleEntityChange = (field: string, value: string) => {
    updateNodeData(selectedNode.id, { ...selectedNode.data, [field]: value });
  };

  return (
    <PanelContainer>
      <h2>{selectedNode.data.label}</h2>
      
      {/* 테이블 정보 입력 영역 */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        border: '1px solid #ddd', 
        borderRadius: '6px',
        backgroundColor: '#f9f9f9'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>테이블 정보</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>테이블명:</label>
            <input 
              type="text" 
              value={selectedNode.data.label || ''} 
              onChange={(e) => handleEntityChange('label', e.target.value)}
              style={{ width: '100%', padding: '6px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>테이블 커멘트:</label>
            <input 
              type="text" 
              value={selectedNode.data.comment || ''} 
              onChange={(e) => handleEntityChange('comment', e.target.value)}
              style={{ width: '100%', padding: '6px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="테이블 설명을 입력하세요"
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3>Columns</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Comment</th>
              <th>PK</th>
              <th>UQ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {selectedNode.data.columns?.map((col: any, i: number) => (
              <tr key={i}>
                <td><input type="text" value={col.name || ''} onChange={(e) => handleColumnChange(i, 'name', e.target.value)} /></td>
                <td><input type="text" value={col.type || ''} onChange={(e) => handleColumnChange(i, 'type', e.target.value)} /></td>
                <td><input type="text" value={col.comment || ''} onChange={(e) => handleColumnChange(i, 'comment', e.target.value)} placeholder="컬럼 설명" /></td>
                <td><input type="checkbox" checked={col.pk || false} onChange={(e) => handleColumnChange(i, 'pk', e.target.checked)} /></td>
                <td>
                  <input type="checkbox" checked={col.uq || false} onChange={(e) => handleColumnChange(i, 'uq', e.target.checked)} />
                  {col.fk ? ' FK' : ''}
                </td>
                <td><button onClick={() => removeColumn(i)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addColumn}>Add Column</button>
      </div>
      
      {/* ===== 하단 테이블 커멘트 입력 영역 ===== */}
      <div style={{ 
        marginTop: '40px', 
        padding: '25px', 
        border: '3px solid #ff6b6b', 
        borderRadius: '12px',
        backgroundColor: '#fff5f5'
      }}>
        <h2 style={{ 
          margin: '0 0 25px 0', 
          color: '#ff6b6b', 
          borderBottom: '3px solid #ff6b6b', 
          paddingBottom: '15px',
          textAlign: 'center',
          fontSize: '20px'
        }}>🎯 테이블 커멘트 입력 영역 🎯</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '25px', alignItems: 'start' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: 'bold', 
              fontSize: '16px',
              color: '#ff6b6b'
            }}>📝 테이블명:</label>
            <input 
              type="text" 
              value={selectedNode.data.label || ''} 
              onChange={(e) => {
                handleEntityChange('label', e.target.value);
              }}
              style={{ 
                width: '100%', 
                padding: '15px', 
                border: '3px solid #ff6b6b', 
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#fff'
              }}
              placeholder="테이블명을 입력하세요"
            />
          </div>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontWeight: 'bold', 
              fontSize: '16px',
              color: '#ff6b6b'
            }}>💬 테이블 커멘트:</label>
            <textarea 
              value={selectedNode.data.comment || ''} 
              onChange={(e) => {
                handleEntityChange('comment', e.target.value);
                toast.success('테이블 커멘트가 수정되었습니다!');
              }}
              style={{ 
                width: '100%', 
                height: '120px',
                padding: '15px', 
                border: '3px solid #ff6b6b', 
                borderRadius: '8px',
                fontSize: '16px',
                resize: 'vertical',
                fontFamily: 'inherit',
                backgroundColor: '#fff'
              }}
              placeholder="이곳에 테이블에 대한 상세한 설명을 입력하세요..."
            />
          </div>
        </div>
      </div>
    </PanelContainer>
  );
};

export default BottomPanel;
