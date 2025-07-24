import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import Header from './Header';
import Toolbox from './Toolbox';
import Canvas from './Canvas';
import Properties from './Properties';
import useStore from '../store/useStore';
import { toast } from 'react-toastify';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

const TopContainer = styled.div`
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: 80px 1fr 250px;
  grid-template-rows: 50px 1fr;
  grid-template-areas:
    'header header header'
    'toolbox canvas properties';
`;

const ToolboxContainer = styled.aside`
  grid-area: toolbox;
  background-color: #f8f9fa;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
`;

const CanvasContainer = styled.main`
  grid-area: canvas;
  background-color: #ffffff;
  position: relative;
`;

const PropertiesContainer = styled.aside`
  grid-area: properties;
  background-color: #f8f9fa;
  border-left: 1px solid #ddd;
  overflow-y: auto;
`;
const BottomPanelContainer = styled.div<{ $height: number }>`
  background-color: #ffffff;
  height: ${props => props.$height}px;
  border-top: 1px solid #d0d0d0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
`;

const ResizeHandle = styled.div`
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
  height: 8px;
  background-color: #d0d0d0;
  cursor: ns-resize;
  z-index: 1001;
  border: 1px solid #b0b0b0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #007acc;
    border-color: #005a9e;
  }
  
  &:before {
    content: '⋯';
    color: #666;
    font-size: 14px;
    font-weight: bold;
  }
  
  &:hover:before {
    color: white;
  }
`;

const BottomPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #d0d0d0;
  font-size: 12px;
  font-weight: normal;
  color: #333;
  min-height: 32px;
  flex-shrink: 0;
`;

const TableTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
`;

const TableIcon = styled.div`
  width: 16px;
  height: 16px;
  background-color: #4a90e2;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:after {
    content: "T";
    color: white;
    font-size: 10px;
    font-weight: bold;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  
  &:hover {
    background-color: #e0e0e0;
    color: #333;
  }
`;

const TableContainer = styled.div`
  flex: 1;
  overflow: auto;
  background-color: #ffffff;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
`;

const TableHeader = styled.thead`
  background-color: #f8f8f8;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const HeaderRow = styled.tr`
  border-bottom: 1px solid #d0d0d0;
`;

const HeaderCell = styled.th`
  padding: 6px 8px;
  text-align: left;
  font-weight: normal;
  color: #666;
  border-right: 1px solid #e0e0e0;
  font-size: 11px;
  white-space: nowrap;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr<{ $selected?: boolean }>`
  border-bottom: 1px solid #f0f0f0;
  background-color: ${props => props.$selected ? '#e6f3ff' : 'transparent'};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.$selected ? '#e6f3ff' : '#f8f8ff'};
  }
`;

const TableCell = styled.td`
  padding: 4px 8px;
  border-right: 1px solid #e0e0e0;
  font-size: 11px;
  position: relative;
  cursor: pointer;
`;

const EditableCell = styled.input`
  width: 100%;
  border: 1px solid transparent;
  background: transparent;
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 2px;
  pointer-events: none;
  cursor: default;
  
  &.editing {
    pointer-events: auto;
    cursor: text;
    border-color: #ccc;
    background-color: #fafafa;
    
    &:focus {
      background-color: white;
      border: 1px solid #007acc;
      outline: none;
      box-shadow: 0 0 2px rgba(0,122,204,0.3);
    }
  }
`;

const CheckboxCell = styled(TableCell)`
  text-align: center;
  width: 30px;
`;

const Checkbox = styled.input`
  width: 12px;
  height: 12px;
`;

const AddColumnRow = styled.tr`
  background-color: #f8f8f8;
`;

const AddColumnCell = styled.td`
  padding: 8px;
  text-align: center;
  border-right: 1px solid #e0e0e0;
  cursor: pointer;
  color: #007acc;
  font-size: 11px;
  
  &:hover {
    background-color: #e6f3ff;
  }
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 2px;
  
  &:hover {
    background-color: #f5c6cb;
  }
`;

const BottomSection = styled.div`
  padding: 12px 16px 16px 16px;
  background-color: #f8f8f8;
  border-top: 1px solid #d0d0d0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  font-size: 11px;
  flex-shrink: 0;
  margin-bottom: 8px;
`;

const BottomField = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BottomLabel = styled.label`
  color: #666;
  min-width: 100px;
`;

const BottomInput = styled.input`
  flex: 1;
  padding: 4px 6px;
  border: 1px solid #d0d0d0;
  font-size: 11px;
  height: 22px;
  border-radius: 2px;
  
  &:hover {
    border-color: #999;
  }
  
  &:focus {
    border-color: #007acc;
    outline: none;
    box-shadow: 0 0 2px rgba(0,122,204,0.3);
  }
`;

const TableNameInput = styled.input`
  background: transparent;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  padding: 4px 8px;
  border-radius: 3px;
  width: 120px;
  max-width: 120px;
  
  &:hover {
    border-color: #ccc;
    background-color: #fafafa;
  }
  
  &:focus {
    border-color: #007acc;
    outline: none;
    box-shadow: 0 0 2px rgba(0,122,204,0.3);
    background-color: white;
  }
`;

const LogicalNameInput = styled.input`
  background: transparent;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 400;
  color: #666;
  padding: 4px 8px;
  border-radius: 3px;
  width: 100px;
  max-width: 100px;
  
  &:hover {
    border-color: #ccc;
    background-color: #fafafa;
  }
  
  &:focus {
    border-color: #007acc;
    outline: none;
    box-shadow: 0 0 2px rgba(0,122,204,0.3);
    background-color: white;
  }
`;

const TableNameDisplay = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #666;
  padding: 4px 8px;
  border-radius: 3px;
  min-width: 120px;
  cursor: pointer;
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const LogicalNameDisplay = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #666;
  padding: 4px 8px;
  border-radius: 3px;
  min-width: 100px;
  cursor: pointer;
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const Layout = () => {
  const { 
    isBottomPanelOpen, 
    setBottomPanelOpen, 
    selectedNodeId, 
    nodes,
    setNodes,
    updateNodeData
  } = useStore();
  const [bottomPanelHeight, setBottomPanelHeight] = useState(250);
  const [isDragging, setIsDragging] = useState(false);
  const [tableName, setTableName] = useState('');
  const [tableLogicalName, setTableLogicalName] = useState('');
  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const [isEditingLogicalName, setIsEditingLogicalName] = useState(false);
  const [columns, setColumns] = useState<any[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<any>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  // 선택된 엔티티의 데이터를 가져오기
  React.useEffect(() => {
    if (selectedNodeId && isBottomPanelOpen) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode && selectedNode.type === 'entity') {
        setTableName(selectedNode.data.physicalName || selectedNode.data.label || 'table1');
        setTableLogicalName(selectedNode.data.logicalName || 'Table');
        const nodeColumns = selectedNode.data.columns || [];
        // 컬럼이 없으면 빈 배열로 시작
        // id가 없는 컬럼에 고유 id 부여하고 dataType과 type 동기화
        const columnsWithIds = nodeColumns.map((col: any, index: number) => ({
          ...col,
          id: col.id || `col-${selectedNodeId}-${index}-${Date.now()}`,
          dataType: col.dataType || col.type || 'VARCHAR', // dataType이 없으면 type으로 설정
          type: col.type || col.dataType || 'VARCHAR', // type이 없으면 dataType으로 설정
          ai: col.ai || (col.constraint === 'AUTO_INCREMENT') // constraint가 AUTO_INCREMENT면 ai를 true로 설정
        }));
        setColumns(columnsWithIds);
        setSelectedColumn(columnsWithIds[0] || null);
      }
    }
  }, [selectedNodeId, isBottomPanelOpen]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragRef.current = {
      startY: e.clientY,
      startHeight: bottomPanelHeight
    };
    
    // 전역 스타일 적용
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';
  }, [bottomPanelHeight]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    const deltaY = dragRef.current.startY - e.clientY;
    const newHeight = Math.max(150, Math.min(600, dragRef.current.startHeight + deltaY));
    setBottomPanelHeight(newHeight);
  }, [isDragging]);

  const handleMouseUp = useCallback((e?: MouseEvent) => {
    setIsDragging(false);
    dragRef.current = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const addColumn = () => {
    const newColumn = {
      id: Date.now().toString(),
      name: 'new_column',
      dataType: 'VARCHAR(45)',
      type: 'VARCHAR(45)', // EntityNode에서 사용
      pk: false,
      nn: false,
      uq: false,
      ai: false,
      defaultValue: ''
    };
    const newColumns = [...columns, newColumn];
    setColumns(newColumns);
    updateNodeColumns(newColumns);
  };

  const deleteColumn = (columnId: string) => {
    const newColumns = columns.filter(col => col.id !== columnId);
    setColumns(newColumns);
    updateNodeColumns(newColumns);
    if (selectedColumn?.id === columnId) {
      setSelectedColumn(newColumns[0] || null);
    }
  };

  const updateNodeColumns = (newColumns: any[]) => {
    if (selectedNodeId) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode) {
        updateNodeData(selectedNodeId, {
          ...selectedNode.data,
          columns: newColumns,
          label: tableName
        });
      }
    }
  };

  const updateColumnField = (columnId: string, field: string, value: any) => {
    const newColumns = columns.map(col => {
      if (col.id === columnId) {
        let updatedCol = { ...col, [field]: value };
        
        // PK-UQ 상호 제약 로직
        if (field === 'pk' && value === true && col.uq === true) {
          updatedCol.uq = false; // PK 체크하면 UQ 해제
          toast.info('UQ가 해제되었습니다 (PK와 중복 불가)');
        } else if (field === 'uq' && value === true && col.pk === true) {
          updatedCol.pk = false; // UQ 체크하면 PK 해제
          toast.info('PK가 해제되었습니다 (UQ와 중복 불가)');
        }
        
        // dataType이 변경되면 type도 함께 업데이트 (EntityNode에서 사용)
        if (field === 'dataType') {
          updatedCol.type = value;
        }
        
        // AI 체크박스 변경 시 constraint도 함께 업데이트
        if (field === 'ai') {
          if (value === true) {
            updatedCol.constraint = 'AUTO_INCREMENT';
          } else {
            // AI 해제 시 constraint에서 AUTO_INCREMENT 제거
            if (updatedCol.constraint === 'AUTO_INCREMENT') {
              updatedCol.constraint = null;
            }
          }
        }
        
        return updatedCol;
      }
      return col;
    });
    setColumns(newColumns);
    
    // 선택된 컬럼도 업데이트
    if (selectedColumn?.id === columnId) {
      const updatedSelectedColumn = { ...selectedColumn, [field]: value };
      
      // PK-UQ 상호 제약을 선택된 컬럼에도 적용
      if (field === 'pk' && value === true) {
        updatedSelectedColumn.uq = false;
      } else if (field === 'uq' && value === true) {
        updatedSelectedColumn.pk = false;
      }
      
      if (field === 'dataType') {
        updatedSelectedColumn.type = value;
      }
      
      // AI 체크박스 변경 시 constraint도 함께 업데이트 (선택된 컬럼)
      if (field === 'ai') {
        if (value === true) {
          updatedSelectedColumn.constraint = 'AUTO_INCREMENT';
        } else {
          // AI 해제 시 constraint에서 AUTO_INCREMENT 제거
          if (updatedSelectedColumn.constraint === 'AUTO_INCREMENT') {
            updatedSelectedColumn.constraint = null;
          }
        }
      }
      
      setSelectedColumn(updatedSelectedColumn);
    }
    
    // 엔티티 노드의 데이터 업데이트
    if (selectedNodeId) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode && selectedNode.type === 'entity') {
        updateNodeData(selectedNodeId, {
          ...selectedNode.data,
          columns: newColumns,
          label: tableName
        });
      }
    }
  };

  const updateTableName = (newName: string) => {
    setTableName(newName);
    if (selectedNodeId) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode) {
        updateNodeData(selectedNodeId, {
          ...selectedNode.data,
          label: newName,
          physicalName: newName
        });
      }
    }
  };

  const updateTableLogicalName = (newName: string) => {
    setTableLogicalName(newName);
    if (selectedNodeId) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode) {
        updateNodeData(selectedNodeId, {
          ...selectedNode.data,
          logicalName: newName
        });
      }
    }
  };

  const handleTableNameDoubleClick = () => {
    setIsEditingTableName(true);
  };

  const handleLogicalNameDoubleClick = () => {
    setIsEditingLogicalName(true);
  };

  const handleTableNameBlur = () => {
    setIsEditingTableName(false);
  };

  const handleLogicalNameBlur = () => {
    setIsEditingLogicalName(false);
  };

  const handleTableNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditingTableName(false);
    }
    if (e.key === 'Escape') {
      setIsEditingTableName(false);
    }
  };

  const handleLogicalNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditingLogicalName(false);
    }
    if (e.key === 'Escape') {
      setIsEditingLogicalName(false);
    }
  };

  const handleCellDoubleClick = (columnId: string, field: string) => {
    setEditingCell(`${columnId}-${field}`);
    // 다음 프레임에서 포커스와 커서 위치 설정
    setTimeout(() => {
      const input = document.querySelector(`input[data-editing="${columnId}-${field}"]`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length); // 커서를 끝으로
      }
    }, 0);
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleRowClick = (column: any, e: React.MouseEvent) => {
    // 더블클릭이나 input 클릭이 아닌 경우에만 행 선택
    if ((e.target as HTMLElement).tagName !== 'INPUT') {
      setSelectedColumn(column);
    }
  };

  return (
    <Container>
      <TopContainer>
        <Header />
        <ToolboxContainer>
          <Toolbox />
        </ToolboxContainer>
        <CanvasContainer>
          <Canvas />
        </CanvasContainer>
        <PropertiesContainer>
          <Properties />
        </PropertiesContainer>
      </TopContainer>
      {isBottomPanelOpen && (
        <BottomPanelContainer $height={bottomPanelHeight}>
          <ResizeHandle onMouseDown={handleMouseDown} />
          <BottomPanelHeader>
            <TableTitle>
              <TableIcon />
              <span style={{ fontSize: '10px', color: '#666', marginRight: '4px' }}>물리명:</span>
              {isEditingTableName ? (
                <TableNameInput 
                  value={tableName} 
                  onChange={(e) => updateTableName(e.target.value)}
                  onBlur={handleTableNameBlur}
                  onKeyDown={handleTableNameKeyPress}
                  autoFocus
                  placeholder="물리명"
                />
              ) : (
                <TableNameDisplay onDoubleClick={handleTableNameDoubleClick}>
                  {tableName || '물리명'}
                </TableNameDisplay>
              )}
              <span style={{ margin: '0 8px', color: '#ccc' }}>/</span>
              <span style={{ fontSize: '10px', color: '#666', marginRight: '4px' }}>논리명:</span>
              {isEditingLogicalName ? (
                <LogicalNameInput
                  value={tableLogicalName}
                  onChange={(e) => updateTableLogicalName(e.target.value)}
                  onBlur={handleLogicalNameBlur}
                  onKeyDown={handleLogicalNameKeyPress}
                  autoFocus
                  placeholder="논리명"
                />
              ) : (
                <LogicalNameDisplay onDoubleClick={handleLogicalNameDoubleClick}>
                  {tableLogicalName || '논리명'}
                </LogicalNameDisplay>
              )}
            </TableTitle>
            <CloseButton onClick={() => setBottomPanelOpen(false)}>
              ×
            </CloseButton>
          </BottomPanelHeader>
          <TableContainer>
            <Table>
              <TableHeader>
                <HeaderRow>
                  <HeaderCell key="column-name">Column Name (물리명)</HeaderCell>
                  <HeaderCell key="logical-name">Logical Name (논리명)</HeaderCell>
                  <HeaderCell key="datatype">Datatype</HeaderCell>
                  <HeaderCell key="pk">PK</HeaderCell>
                  <HeaderCell key="nn">NN</HeaderCell>
                  <HeaderCell key="uq">UQ</HeaderCell>
                  <HeaderCell key="ai">AI</HeaderCell>
                  <HeaderCell key="default">Default/Expression</HeaderCell>
                  <HeaderCell key="delete">Delete</HeaderCell>
                </HeaderRow>
              </TableHeader>
              <TableBody>
                {columns.map((column) => (
                  <TableRow 
                    key={`row-${column.id}`} 
                    $selected={selectedColumn?.id === column.id}
                    onClick={(e) => handleRowClick(column, e)}
                  >
                    <TableCell key={`${column.id}-name`} onDoubleClick={() => handleCellDoubleClick(column.id, 'name')}>
                      <EditableCell 
                        className={editingCell === `${column.id}-name` ? 'editing' : ''}
                        data-editing={editingCell === `${column.id}-name` ? `${column.id}-name` : ''}
                        value={column.name || ''}
                        onChange={(e) => updateColumnField(column.id, 'name', e.target.value)}
                        onBlur={handleCellBlur}
                        readOnly={editingCell !== `${column.id}-name`}
                      />
                    </TableCell>
                    <TableCell key={`${column.id}-logical`} onDoubleClick={() => handleCellDoubleClick(column.id, 'logicalName')}>
                      <EditableCell 
                        className={editingCell === `${column.id}-logicalName` ? 'editing' : ''}
                        data-editing={editingCell === `${column.id}-logicalName` ? `${column.id}-logicalName` : ''}
                        value={column.logicalName || ''}
                        onChange={(e) => updateColumnField(column.id, 'logicalName', e.target.value)}
                        onBlur={handleCellBlur}
                        readOnly={editingCell !== `${column.id}-logicalName`}
                      />
                    </TableCell>
                    <TableCell key={`${column.id}-datatype`} onDoubleClick={() => handleCellDoubleClick(column.id, 'dataType')}>
                      <EditableCell 
                        className={editingCell === `${column.id}-dataType` ? 'editing' : ''}
                        data-editing={editingCell === `${column.id}-dataType` ? `${column.id}-dataType` : ''}
                        value={column.dataType || ''}
                        onChange={(e) => updateColumnField(column.id, 'dataType', e.target.value)}
                        onBlur={handleCellBlur}
                        readOnly={editingCell !== `${column.id}-dataType`}
                      />
                    </TableCell>
                    <CheckboxCell key={`${column.id}-pk`}>
                      <Checkbox 
                        type="checkbox" 
                        checked={column.pk || false} 
                        onChange={(e) => updateColumnField(column.id, 'pk', e.target.checked)}
                      />
                    </CheckboxCell>
                    <CheckboxCell key={`${column.id}-nn`}>
                      <Checkbox 
                        type="checkbox" 
                        checked={column.nn || false} 
                        onChange={(e) => updateColumnField(column.id, 'nn', e.target.checked)}
                      />
                    </CheckboxCell>
                    <CheckboxCell key={`${column.id}-uq`}>
                      <Checkbox 
                        type="checkbox" 
                        checked={column.uq || false} 
                        onChange={(e) => updateColumnField(column.id, 'uq', e.target.checked)}
                      />
                    </CheckboxCell>
                    <CheckboxCell key={`${column.id}-ai`}>
                      <Checkbox 
                        type="checkbox" 
                        checked={column.ai || false} 
                        onChange={(e) => updateColumnField(column.id, 'ai', e.target.checked)}
                      />
                    </CheckboxCell>
                    <TableCell key={`${column.id}-default`} onDoubleClick={() => handleCellDoubleClick(column.id, 'defaultValue')}>
                      <EditableCell 
                        className={editingCell === `${column.id}-defaultValue` ? 'editing' : ''}
                        data-editing={editingCell === `${column.id}-defaultValue` ? `${column.id}-defaultValue` : ''}
                        value={column.defaultValue || ''}
                        onChange={(e) => updateColumnField(column.id, 'defaultValue', e.target.value)}
                        onBlur={handleCellBlur}
                        readOnly={editingCell !== `${column.id}-defaultValue`}
                        placeholder="Default value"
                      />
                    </TableCell>
                    <TableCell key={`${column.id}-delete`}>
                      <DeleteButton onClick={() => deleteColumn(column.id)}>
                        Delete
                      </DeleteButton>
                    </TableCell>
                  </TableRow>
                ))}
                <AddColumnRow key="add-column">
                  <AddColumnCell colSpan={10} onClick={addColumn}>
                    + Add Column
                  </AddColumnCell>
                </AddColumnRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* 테이블 커멘트 입력 영역 */}
          <div style={{ 
            padding: '15px', 
            borderTop: '1px solid #ddd',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                Table Comment:
              </label>
              <textarea
                value={nodes.find(n => n.id === selectedNodeId)?.data?.comment || ''}
                onChange={(e) => {
                  if (selectedNodeId) {
                    const selectedNode = nodes.find(n => n.id === selectedNodeId);
                    if (selectedNode) {
                      updateNodeData(selectedNodeId, { 
                        ...selectedNode.data, 
                        comment: e.target.value 
                      });
                    }
                  }
                }}
                style={{ 
                  width: '100%', 
                  height: '60px',
                  padding: '8px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
                placeholder="테이블에 대한 설명을 입력하세요..."
              />
            </div>
          </div>
          
          <BottomSection>
            <BottomField>
              <BottomLabel>Column Name:</BottomLabel>
              <BottomInput 
                type="text" 
                value={selectedColumn?.name || ''} 
                onChange={(e) => selectedColumn && updateColumnField(selectedColumn.id, 'name', e.target.value)}
              />
            </BottomField>
            <BottomField>
              <BottomLabel>Data Type:</BottomLabel>
              <BottomInput 
                type="text" 
                value={selectedColumn?.dataType || ''} 
                onChange={(e) => selectedColumn && updateColumnField(selectedColumn.id, 'dataType', e.target.value)}
              />
            </BottomField>
            <BottomField>
              <BottomLabel>Default:</BottomLabel>
              <BottomInput 
                type="text" 
                value={selectedColumn?.defaultValue || ''} 
                onChange={(e) => selectedColumn && updateColumnField(selectedColumn.id, 'defaultValue', e.target.value)}
                placeholder="Default value"
              />
            </BottomField>
            <BottomField>
              <BottomLabel>Comments:</BottomLabel>
              <BottomInput 
                type="text" 
                value={selectedColumn?.comment || ''} 
                onChange={(e) => selectedColumn && updateColumnField(selectedColumn.id, 'comment', e.target.value)}
              />
            </BottomField>
          </BottomSection>
        </BottomPanelContainer>
      )}
    </Container>
  );
};

export default Layout;
