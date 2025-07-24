import styled from 'styled-components';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { FaKey } from 'react-icons/fa';
import useStore from '../../store/useStore';
import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Column {
  name: string;
  dataType?: string;
  type?: string;
  pk: boolean;
  fk: boolean;
  uq: boolean;
  nn?: boolean;
  ai?: boolean;
  comment: string;
  logicalName?: string;
  constraint?: string | null;
  defaultValue?: string | null;
  options?: string | null;
  nullable?: boolean;
}

const NodeContainer = styled.div<{ $isSelected: boolean }>`
  min-width: 240px;
  width: auto;
  min-height: 60px;
  height: fit-content;
  border: 3px solid ${props => props.$isSelected ? '#007acc' : '#ddd'};
  background-color: ${props => props.$isSelected ? '#f0f8ff' : '#fff'};
  border-radius: 8px;
  box-shadow: ${props => props.$isSelected ? '0 8px 25px rgba(0, 122, 204, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6)' : '0 2px 8px rgba(0, 0, 0, 0.1)'};
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: ${props => props.$isSelected ? 'scale(1.02) translateZ(0)' : 'scale(1) translateZ(0)'};
  will-change: transform, box-shadow;
  backface-visibility: hidden;
  
  &:hover {
    border-color: ${props => props.$isSelected ? '#005999' : '#60a5fa'};
    box-shadow: ${props => props.$isSelected 
      ? '0 12px 35px rgba(0, 122, 204, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.8)' 
      : '0 4px 15px rgba(96, 165, 250, 0.2)'};
    transform: ${props => props.$isSelected ? 'scale(1.03) translateZ(0)' : 'scale(1.01) translateZ(0)'};
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.$isSelected ? 'linear-gradient(90deg, #007acc, #4da6ff, #007acc)' : 'transparent'};
    background-size: 200% 100%;
    animation: ${props => props.$isSelected ? 'shimmer 2s infinite' : 'none'};
    will-change: background-position;
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

const Header = styled.div`
  padding: 8px 12px;
  background: linear-gradient(135deg, #007acc 0%, #005999 100%);
  color: white;
  font-weight: 600;
  font-size: 16px;
  border-radius: 5px 5px 0 0;
  border-bottom: 2px solid #e0e0e0;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
`;

const EntityName = styled.div`
  flex: 1;
  padding: 2px 4px;
  border-radius: 3px;
`;

const EntityLogicalName = styled.div`
  flex: 1;
  padding: 2px 4px;
  border-radius: 3px;
  opacity: 0.9;
  text-align: right;
`;

const EditInput = styled.input`
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 3px;
  padding: 2px 4px;
  font-size: inherit;
  font-weight: inherit;
  color: #333;
  outline: none;
  width: 100%;
  
  &:focus {
    background: white;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
  }
`;

const ColumnsContainer = styled.div`
  display: table;
  width: 100%;
  table-layout: auto;
  background: #fff;
`;

const Column = styled.div<{ $isPrimaryKey?: boolean; $isForeignKey?: boolean; $isUniqueKey?: boolean }>`
  display: table-row;
  position: relative;
  background: ${props => {
    if (props.$isPrimaryKey) return '#fff8e7';
    if (props.$isForeignKey) return '#e3f2fd';
    if (props.$isUniqueKey) return '#f3e5f5';
    return '#fff';
  }};
  
  &:hover {
    background: ${props => {
      if (props.$isPrimaryKey) return '#fff4d6';
      if (props.$isForeignKey) return '#d1e7dd';
      if (props.$isUniqueKey) return '#e1bee7';
      return '#f8f9fa';
    }} !important;
  }
  
  &:last-child > * {
    border-bottom: none;
  }
`;

const ColumnKeyAndName = styled.div`
  display: table-cell;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  vertical-align: middle;
  gap: 4px;
  background: transparent !important;
`;

const ColumnLogicalName = styled.div`
  display: table-cell;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  vertical-align: middle;
  background: transparent !important;
`;

const ColumnConstraints = styled.div`
  display: table-cell;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  vertical-align: middle;
  text-align: center;
  background: transparent !important;
`;

const ColumnDefaults = styled.div`
  display: table-cell;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  vertical-align: middle;
  text-align: center;
  background: transparent !important;
`;

const ColumnTypeArea = styled.div`
  display: table-cell;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  vertical-align: middle;
  text-align: right;
  background: transparent !important;
`;

const ColumnLeft = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const ColumnContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const ColumnType = styled.span`
  color: #666;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  white-space: nowrap;
`;

const ColumnName = styled.span<{ $isPrimaryKey?: boolean }>`
  font-weight: ${props => props.$isPrimaryKey ? 600 : 400};
  color: ${props => props.$isPrimaryKey ? '#d68910' : '#333'};
`;

const ColumnLogicalText = styled.span`
  color: #666;
  font-style: italic;
  font-size: 12px;
`;

const ColumnDetails = styled.span`
  font-size: 10px;
  color: #888;
  margin-right: 6px;
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 4px;
  border-radius: 3px;
`;

const IconWrapper = styled.span<{ $type?: 'pk' | 'fk' | 'uq' }>`
  font-size: 14px;
  display: flex;
  align-items: center;
  color: ${props => {
    if (props.$type === 'pk') return '#f1c40f';
    if (props.$type === 'fk') return '#2196f3';
    if (props.$type === 'uq') return '#f44336';
    return '#666';
  }};
`;

const InvisibleHandle = styled(Handle)`
  opacity: 0;
  pointer-events: none;
  width: 1px;
  height: 1px;
`;

const Tooltip = styled.div<{ $visible: boolean; $x: number; $y: number }>`
  position: fixed;
  left: ${props => props.$x + 8}px;
  top: ${props => props.$y}px;
  transform: translateY(-50%);
  background: rgba(45, 45, 45, 0.95);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  pointer-events: none;
  z-index: 99999;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: all 0.1s ease;
  min-width: 200px;
  max-width: 350px;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 8px solid rgba(45, 45, 45, 0.95);
  }
`;

const TooltipHeader = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
  color: #ffffff;
  font-size: 14px;
`;

const TooltipDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.3);
  margin: 8px 0;
`;

const TooltipDescription = styled.div`
  color: #e0e0e0;
  line-height: 1.4;
  font-size: 13px;
  white-space: normal;
`;

const ColumnTypeText = styled.span`
  color: #88c999;
  font-weight: 500;
`;

const EntityNode = memo(({ data, id, onMouseDown }: any) => {
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);
  const setBottomPanelOpen = useStore((state) => state.setBottomPanelOpen);
  const nodes = useStore((state) => state.nodes);
  const viewSettings = useStore((state) => state.viewSettings);
  const updateEdgeHandles = useStore((state) => state.updateEdgeHandles);
  
  // ReactFlow 좌표 변환 함수
  const { flowToScreenPosition, getViewport } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  
  // 드래그 상태 추적
  const [isDragging, setIsDragging] = useState(false);
  
  // 툴팁 상태 관리
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: 'entity' as 'entity' | 'column',
    title: '',
    dataType: '',
    comment: ''
  });

  // ReactFlow 드래그 이벤트와 연동 (단순화)
  useEffect(() => {
    const handleNodeDragStart = () => {
      setIsDragging(true);
      setTooltip({ visible: false, x: 0, y: 0, type: 'entity', title: '', dataType: '', comment: '' });
    };

    const handleNodeDragStop = () => {
      setIsDragging(false);
      // 드래그 완료 후 edges Handle 업데이트
      updateEdgeHandles();
      // ReactFlow 내부 Handle 업데이트
      updateNodeInternals(id);
    };

    window.addEventListener('nodeDragStart', handleNodeDragStart);
    window.addEventListener('nodeDragStop', handleNodeDragStop);

    return () => {
      window.removeEventListener('nodeDragStart', handleNodeDragStart);
      window.removeEventListener('nodeDragStop', handleNodeDragStop);
    };
  }, [updateEdgeHandles]);

  // 컴포넌트 마운트 시 기존 edges 업데이트
  useEffect(() => {
    updateEdgeHandles();
    updateNodeInternals(id);
  }, [data.columns, updateEdgeHandles, updateNodeInternals, id]);

  // 현재 노드가 선택되었는지 확인 (id 사용)
  const isSelected = useMemo(() => selectedNodeId === id, [selectedNodeId, id]);
  
  const handleMouseDown = useCallback((e: any) => {
    // 드래그 시작 - 툴팁 확실히 숨기기
    setIsDragging(true);
    setTooltip({ visible: false, x: 0, y: 0, type: 'entity', title: '', dataType: '', comment: '' });
    
    // 우클릭인 경우 아무것도 하지 않음
    if (e.button === 2) {
      return;
    }
    
    const connectionMode = useStore.getState().connectionMode;
    const isBottomPanelOpen = useStore.getState().isBottomPanelOpen;
    
    // 관계선 연결 모드이거나 하단 패널이 열려있을 때는 관계선 생성을 우선시
    if (connectionMode) {
      // 관계선 연결 모드일 때는 선택만 하고 패널 상태는 유지
      setSelectedNodeId(id);
    } else if (isBottomPanelOpen && selectedNodeId !== id) {
      // 다른 노드가 선택되어 있고 하단 패널이 열려있을 때는 선택만 변경
      setSelectedNodeId(id);
    } else {
      // 일반적인 경우: 노드 선택 및 하단 패널 열기
      setSelectedNodeId(id);
      setBottomPanelOpen(true);
    }
    
    // Only call onMouseDown for connection mode, let double click pass through
    if (onMouseDown) {
      onMouseDown(e);
    }
  }, [id, selectedNodeId, setSelectedNodeId, setBottomPanelOpen, onMouseDown]);

  // handleContextMenu 제거 - ReactFlow의 onNodeContextMenu가 처리하도록

  // 툴팁 핸들러 - 엔티티 오른쪽에 정확히 붙이기
  const handleMouseEnter = useCallback((e: React.MouseEvent, type: 'entity' | 'column', item?: Column) => {
    // 드래그 중이면 툴팁 표시하지 않음
    if (isDragging) {
      return;
    }
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // 엔티티 오른쪽 경계에서 바로 옆에 배치
    const tooltipX = rect.right;  // 엔티티 오른쪽 끝
    const tooltipY = rect.top + rect.height / 2;  // 엔티티 세로 중앙
    
    if (type === 'entity') {
      setTooltip({
        visible: true,
        type: 'entity',
        x: tooltipX,
        y: tooltipY,
        title: data.label,
        dataType: '',
        comment: data.comment || '테이블 설명 없음'
      });
    } else if (item) {
      setTooltip({
        visible: true,
        type: 'column',
        x: tooltipX,
        y: tooltipY,
        title: item.name,
        dataType: (item.dataType || item.type || ''),
        comment: item.comment || '컬럼 설명 없음'
      });
    }
  }, [isDragging, data.label, data.comment]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handleTooltipClick = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handleTooltipMouseDown = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <>
      <div className="entity-wrapper">
        <NodeContainer 
          $isSelected={isSelected} 
          onMouseDown={handleMouseDown}
        >
          {/* 보이지 않는 연결 핸들들 - 모든 핸들을 source와 target 둘 다 지원 */}
          <InvisibleHandle type="target" position={Position.Left} id="left" />
          <InvisibleHandle type="source" position={Position.Left} id="left" />
          <InvisibleHandle type="target" position={Position.Right} id="right" />
          <InvisibleHandle type="source" position={Position.Right} id="right" />
          
                    <Header 
            onMouseEnter={(e) => handleMouseEnter(e, 'entity')}
            onMouseLeave={handleMouseLeave}
            onClick={handleTooltipClick}
            onMouseDown={handleTooltipMouseDown}
          >
            {/* 엔티티 보기방식에 따른 조건부 렌더링 */}
            {viewSettings.entityView === 'physical' && (
              <EntityName>
                {data.physicalName || data.label || 'NewTable'}
              </EntityName>
            )}
            {viewSettings.entityView === 'logical' && (
              <EntityLogicalName>
                {data.logicalName || 'Table'}
              </EntityLogicalName>
            )}
            {viewSettings.entityView === 'both' && (
              <>
                <EntityName>
                  {data.physicalName || data.label || 'NewTable'}
                </EntityName>
                <EntityLogicalName>
                  {data.logicalName || 'Table'}
                </EntityLogicalName>
              </>
            )}
          </Header>
          
          <ColumnsContainer>
            {data.columns?.map((col: any, i: number) => {
              return (
                <Column 
                  key={i} 
                  $isPrimaryKey={col.pk} 
                  $isForeignKey={col.fk}
                  $isUniqueKey={col.uq}
                  onMouseEnter={(e) => handleMouseEnter(e, 'column', col)}
                  onMouseLeave={handleMouseLeave}
                  onClick={handleTooltipClick}
                  onMouseDown={handleTooltipMouseDown}
                >
                  {/* 첫 번째 컬럼: 키 + 물리명 */}
                  <ColumnKeyAndName>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {viewSettings.showKeys && col.pk && <IconWrapper $type="pk"><FaKey /></IconWrapper>}
                      {viewSettings.showKeys && col.fk && <IconWrapper $type="fk"><FaKey /></IconWrapper>}
                      {viewSettings.showKeys && col.uq && <IconWrapper $type="uq"><FaKey /></IconWrapper>}
                      {viewSettings.showPhysicalName && (
                        <ColumnName $isPrimaryKey={col.pk}>{col.name}</ColumnName>
                      )}
                    </div>
                  </ColumnKeyAndName>
                  
                  {/* 두 번째 컬럼: 논리명 */}
                  <ColumnLogicalName style={{ display: viewSettings.showLogicalName ? 'table-cell' : 'none' }}>
                    <ColumnLogicalText>
                      {col.logicalName || col.comment || col.name}
                    </ColumnLogicalText>
                  </ColumnLogicalName>
                  
                  {/* 세 번째 컬럼: 제약조건 */}
                  <ColumnConstraints style={{ display: viewSettings.showConstraints ? 'table-cell' : 'none' }}>
                    {col.constraint && col.constraint !== 'AUTO_INCREMENT' && (
                      <ColumnDetails>{col.constraint}</ColumnDetails>
                    )}
                    {(col.nn || col.nullable === false) && (
                      <ColumnDetails>NN</ColumnDetails>
                    )}
                    {col.ai && (
                      <ColumnDetails>AI</ColumnDetails>
                    )}
                  </ColumnConstraints>
                  
                  {/* 네 번째 컬럼: 기본값 */}
                  <ColumnDefaults style={{ display: viewSettings.showDefaults ? 'table-cell' : 'none' }}>
                    {col.defaultValue && (
                      <ColumnDetails>{col.defaultValue}</ColumnDetails>
                    )}
                  </ColumnDefaults>
                  
                  {/* 다섯 번째 컬럼: 데이터 타입 */}
                  <ColumnTypeArea style={{ display: viewSettings.showDataType ? 'table-cell' : 'none' }}>
                    <ColumnType>
                      {col.type}
                    </ColumnType>
                  </ColumnTypeArea>
                  
                  {/* PK 또는 FK 컬럼에 연결 핸들 표시 - source와 target 모두 지원 */}
                  {(col.pk || col.fk) && (
                    <>
                      {/* Right Handle - source와 target 둘 다 */}
                      <Handle
                        key={`${id}-${col.name}-right-source`}
                        type="source"
                        position={Position.Right}
                        id={`${col.name}-right`}
                        style={{
                          position: 'absolute',
                          right: -8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 12,
                          height: 12,
                          backgroundColor: col.pk ? '#f1c40f' : '#2196f3',
                          border: '3px solid white',
                          borderRadius: '50%',
                          zIndex: 100,
                          cursor: 'crosshair'
                        }}
                      />
                      <Handle
                        key={`${id}-${col.name}-right-target`}
                        type="target"
                        position={Position.Right}
                        id={`${col.name}-right`}
                        style={{
                          position: 'absolute',
                          right: -8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 12,
                          height: 12,
                          backgroundColor: col.pk ? '#f1c40f' : '#2196f3',
                          border: '3px solid white',
                          borderRadius: '50%',
                          zIndex: 100,
                          cursor: 'crosshair'
                        }}
                      />
                      
                      {/* Left Handle - source와 target 둘 다 */}
                      <Handle
                        key={`${id}-${col.name}-left-source`}
                        type="source"
                        position={Position.Left}
                        id={`${col.name}-left`}
                        style={{
                          position: 'absolute',
                          left: -8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 12,
                          height: 12,
                          backgroundColor: col.pk ? '#f1c40f' : '#2196f3',
                          border: '3px solid white',
                          borderRadius: '50%',
                          zIndex: 100,
                          cursor: 'crosshair'
                        }}
                      />
                      <Handle
                        key={`${id}-${col.name}-left-target`}
                        type="target"
                        position={Position.Left}
                        id={`${col.name}-left`}
                        style={{
                          position: 'absolute',
                          left: -8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 12,
                          height: 12,
                          backgroundColor: col.pk ? '#f1c40f' : '#2196f3',
                          border: '3px solid white',
                          borderRadius: '50%',
                          zIndex: 100,
                          cursor: 'crosshair'
                        }}
                      />
                    </>
                  )}
                </Column>
              );
            })}
          </ColumnsContainer>
        </NodeContainer>
      </div>
      
      {/* 툴팁을 Portal로 document.body에 렌더링 */}
      {tooltip.visible && createPortal(
        <Tooltip 
          $visible={tooltip.visible}
          $x={tooltip.x}
          $y={tooltip.y}
        >
          {tooltip.type === 'entity' ? (
            <>
              <TooltipHeader>Table: {tooltip.title}</TooltipHeader>
              <TooltipDivider />
              <TooltipDescription>{tooltip.comment}</TooltipDescription>
            </>
          ) : (
            <>
              <TooltipHeader>
                {tooltip.title} : <ColumnTypeText>{tooltip.dataType}</ColumnTypeText>
              </TooltipHeader>
              <TooltipDivider />
              <TooltipDescription>{tooltip.comment}</TooltipDescription>
            </>
          )}
        </Tooltip>,
        document.body
      )}
    </>
  );
});

EntityNode.displayName = 'EntityNode';

export default EntityNode;