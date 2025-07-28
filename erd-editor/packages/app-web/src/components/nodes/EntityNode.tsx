import styled from 'styled-components';
import { Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { FaKey, FaPalette } from 'react-icons/fa';
import useStore from '../../store/useStore';
import React, { useState, useEffect, memo, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createHandleId } from '../../utils/handleUtils';
import ColorPalette from '../ColorPalette';
import { getHoverColor, getActiveColor, getShadowColor } from '../../utils/colorUtils';

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

const NodeContainer = styled.div<{ $isSelected: boolean; $darkMode?: boolean; $color?: string; $isHidden?: boolean }>`
  position: relative;
  min-width: 280px;
  max-width: 500px;
  width: auto;
  min-height: 60px;
  height: fit-content;
  opacity: ${props => props.$isHidden ? 0.3 : 1};
  filter: ${props => props.$isHidden ? 'grayscale(0.5)' : 'none'};
  border: 3px solid ${props => {
    if (props.$isSelected && props.$color) {
      return getActiveColor(props.$color);
    }
    return props.$isSelected ? '#007acc' : (props.$darkMode ? '#404040' : '#ddd');
  }};
  background-color: ${props => props.$isSelected ? (props.$darkMode ? '#1a2332' : '#f0f8ff') : (props.$darkMode ? '#2d3748' : '#fff')};
  border-radius: 8px;
  box-shadow: ${props => {
    if (props.$isSelected && props.$color) {
      return `0 8px 25px ${getShadowColor(props.$color)}, inset 0 1px 0 rgba(255, 255, 255, 0.6)`;
    }
    return props.$isSelected ? '0 8px 25px rgba(0, 122, 204, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6)' : (props.$darkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)');
  }};
  overflow: visible;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    border-color: ${props => {
      if (props.$color) {
        return props.$isSelected ? getActiveColor(props.$color) : getHoverColor(props.$color);
      }
      return props.$isSelected ? '#005999' : '#60a5fa';
    }};
    box-shadow: ${props => {
      if (props.$color) {
        return props.$isSelected 
          ? `0 6px 15px ${getShadowColor(props.$color)}, inset 0 1px 0 rgba(255, 255, 255, 0.6)`
          : `0 2px 8px ${getShadowColor(props.$color)}`;
      }
      return props.$isSelected 
        ? '0 6px 15px rgba(0, 122, 204, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)' 
        : (props.$darkMode ? '0 2px 8px rgba(96, 165, 250, 0.2)' : '0 2px 8px rgba(96, 165, 250, 0.15)');
    }};
  }
`;

const Header = styled.div<{ $darkMode?: boolean; $color?: string }>`
  padding: 8px 12px;
  background: ${props => props.$color ? `linear-gradient(135deg, ${props.$color} 0%, ${getActiveColor(props.$color)} 100%)` : 'linear-gradient(135deg, #007acc 0%, #005999 100%)'};
  color: white;
  font-weight: 600;
  font-size: 16px;
  border-radius: 5px 5px 0 0;
  border-bottom: 2px solid ${props => props.$darkMode ? '#404040' : '#e0e0e0'};
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`;

const EntityLogicalName = styled.div`
  flex: 1;
  padding: 2px 4px;
  border-radius: 3px;
  opacity: 0.9;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`;

const PaletteIcon = styled.div<{ $isVisible: boolean }>`
  display: ${props => props.$isVisible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
  
  svg {
    width: 12px;
    height: 12px;
    color: white;
  }
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

const ColumnsContainer = styled.div<{ $darkMode?: boolean }>`
  display: table;
  width: 100%;
  table-layout: auto;
  background: ${props => props.$darkMode ? '#2d3748' : '#fff'};
  border-radius: 0 0 5px 5px;
  overflow: hidden;
`;

const Column = styled.div<{ $isPrimaryKey?: boolean; $isForeignKey?: boolean; $isUniqueKey?: boolean; $darkMode?: boolean; $isHighlighted?: boolean }>`
  display: table-row;
  position: relative;
  background: ${props => {
    if (props.$isHighlighted) {
      // 하이라이트된 경우의 배경색 - 녹색 계열로 PK 색상과 구분
      return props.$darkMode ? '#0f4c43' : '#d1fae5';
    }
    
    if (props.$darkMode) {
      if (props.$isPrimaryKey) return '#3d2914';
      if (props.$isForeignKey) return '#1e2832';
      if (props.$isUniqueKey) return '#2d1b33';
      return '#2d3748';
    } else {
      if (props.$isPrimaryKey) return '#fff8e7';
      if (props.$isForeignKey) return '#e3f2fd';
      if (props.$isUniqueKey) return '#f3e5f5';
      return '#fff';
    }
  }};
  
  ${props => props.$isHighlighted && `
    border-left: 3px solid ${props.$darkMode ? '#10b981' : '#059669'};
    box-shadow: ${props.$darkMode ? '0 0 8px rgba(16, 185, 129, 0.4)' : '0 0 8px rgba(5, 150, 105, 0.4)'};
  `}
  
  &:hover {
    background: ${props => {
      if (props.$isHighlighted) {
        return props.$darkMode ? '#0d5748' : '#a7f3d0';
      }
      
      if (props.$darkMode) {
        if (props.$isPrimaryKey) return '#4a3319';
        if (props.$isForeignKey) return '#243240';
        if (props.$isUniqueKey) return '#362040';
        return '#374151';
      } else {
        if (props.$isPrimaryKey) return '#fff4d6';
        if (props.$isForeignKey) return '#d1e7dd';
        if (props.$isUniqueKey) return '#e1bee7';
        return '#f8f9fa';
      }
    }} !important;
  }
  
  &:last-child > * {
    border-bottom: none;
  }
`;

const ColumnKeyAndName = styled.div<{ $darkMode?: boolean }>`
  display: table-cell;
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.$darkMode ? '#404040' : '#f0f0f0'};
  font-size: 13px;
  vertical-align: middle;
  gap: 4px;
  background: transparent !important;
  color: ${props => props.$darkMode ? '#e2e8f0' : 'inherit'};
`;

const ColumnLogicalName = styled.div<{ $darkMode?: boolean }>`
  display: table-cell;
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.$darkMode ? '#404040' : '#f0f0f0'};
  font-size: 13px;
  vertical-align: middle;
  background: transparent !important;
  color: ${props => props.$darkMode ? '#cbd5e0' : '#666'};
  font-weight: 500;
`;

const ColumnConstraints = styled.div<{ $darkMode?: boolean }>`
  display: table-cell;
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.$darkMode ? '#404040' : '#f0f0f0'};
  font-size: 13px;
  vertical-align: middle;
  text-align: center;
  background: transparent !important;
  color: ${props => props.$darkMode ? '#a0aec0' : '#555'};
  font-weight: 500;
`;

const ColumnDefaults = styled.div<{ $darkMode?: boolean }>`
  display: table-cell;
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.$darkMode ? '#404040' : '#f0f0f0'};
  font-size: 13px;
  vertical-align: middle;
  text-align: center;
  background: transparent !important;
  color: ${props => props.$darkMode ? '#9ca3af' : '#555'};
  font-weight: 500;;
  background: transparent !important;
  color: ${props => props.$darkMode ? '#e2e8f0' : 'inherit'};
`;

const ColumnTypeArea = styled.div<{ $darkMode?: boolean }>`
  display: table-cell;
  padding: 8px 12px;
  border-bottom: 1px solid ${props => props.$darkMode ? '#404040' : '#f0f0f0'};
  font-size: 13px;
  vertical-align: middle;
  text-align: right;
  background: transparent !important;
  color: ${props => props.$darkMode ? '#e2e8f0' : 'inherit'};
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

const ColumnType = styled.span<{ $darkMode?: boolean }>`
  color: ${props => props.$darkMode ? '#a0aec0' : '#666'};
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  white-space: nowrap;
`;

const ColumnName = styled.span<{ $isPrimaryKey?: boolean; $darkMode?: boolean }>`
  font-weight: ${props => props.$isPrimaryKey ? 600 : 400};
  color: ${props => {
    if (props.$isPrimaryKey) return '#d68910';
    return props.$darkMode ? '#e2e8f0' : '#333';
  }};
`;

const ColumnLogicalText = styled.span<{ $darkMode?: boolean }>`
  color: ${props => props.$darkMode ? '#a0aec0' : '#666'};
  font-style: italic;
  font-size: 12px;
`;

const ColumnDetails = styled.span<{ $darkMode?: boolean }>`
  font-size: 10px;
  color: ${props => props.$darkMode ? '#a0aec0' : '#888'};
  margin-right: 6px;
  background: ${props => props.$darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
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
  const setHoveredEntityId = useStore((state) => state.setHoveredEntityId);
  const highlightedEntities = useStore((state) => state.highlightedEntities);
  const highlightedColumns = useStore((state) => state.highlightedColumns);
  const clearAllHighlights = useStore((state) => state.clearAllHighlights);
  const updateAllHighlights = useStore((state) => state.updateAllHighlights);
  const clearRelationsHighlight = useStore((state) => state.clearRelationsHighlight);
  const nodes = useStore((state) => state.nodes);
  const viewSettings = useStore((state) => state.viewSettings);
  const updateEdgeHandles = useStore((state) => state.updateEdgeHandles);
  const connectionMode = useStore((state) => state.connectionMode);
  const theme = useStore((state) => state.theme);
  const hiddenEntities = useStore((state) => state.hiddenEntities);
  
  // 색상 팔레트 관련
  const showColorPalette = useStore((state) => state.showColorPalette);
  const paletteTarget = useStore((state) => state.paletteTarget);
  const showPalette = useStore((state) => state.showPalette);
  const hidePalette = useStore((state) => state.hidePalette);
  const setNodeColor = useStore((state) => state.setNodeColor);
  const getNodeColor = useStore((state) => state.getNodeColor);
  
  const nodeColor = getNodeColor(id);
  const isHidden = hiddenEntities.has(id);
  
  // ReactFlow 좌표 변환 함수
  const { flowToScreenPosition, getViewport } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  
  // 헤더 참조를 위한 ref
  const headerRef = useRef<HTMLDivElement>(null);
  
  // 드래그 상태 추적
  const [isDragging, setIsDragging] = useState(false);
  
  // 로컬 미리보기 색상 상태
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  
  // 실제 사용할 색상 (미리보기 우선)
  const actualNodeColor = previewColor || nodeColor;
  
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

  // 컴포넌트 마운트 시 기존 edges 업데이트 및 하이라이트 동기화
  useEffect(() => {
    updateEdgeHandles();
    updateNodeInternals(id);
    
    // 컬럼 이름 변경으로 인한 하이라이트 업데이트도 필요할 수 있음
    setTimeout(() => {
      const { selectedNodeId, updateEntityHighlights } = useStore.getState();
      if (selectedNodeId === id) {
        updateEntityHighlights(id);
      }
    }, 50);
  }, [data.columns, updateEdgeHandles, updateNodeInternals, id]);

  // 현재 노드가 선택되었는지 확인 (id 사용)
  const isSelected = useMemo(() => selectedNodeId === id, [selectedNodeId, id]);
  const isDarkMode = theme === 'dark';
  
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
    
    // 엔티티 클릭 시 관계선 하이라이트 해제
    clearRelationsHighlight();
    
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
    
    // 클릭 시 즉시 하이라이트 효과 적용
    setHoveredEntityId(id);
    
    // Only call onMouseDown for connection mode, let double click pass through
    if (onMouseDown) {
      onMouseDown(e);
    }
  }, [id, selectedNodeId, setSelectedNodeId, setBottomPanelOpen, onMouseDown]);

  // 엔티티 호버 이벤트 핸들러
  const handleEntityMouseEnter = useCallback(() => {
    if (!isDragging) {
      setHoveredEntityId(id);
    }
  }, [id, isDragging, setHoveredEntityId]);

  const handleEntityMouseLeave = useCallback(() => {
    if (!isDragging) {
      setHoveredEntityId(null);
    }
  }, [isDragging, setHoveredEntityId]);

  // 팔레트 핸들러
  const handlePaletteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    showPalette(
      { type: 'node', id }, 
      { x: 0, y: 0 } // 상대 위치로 배치할 것이므로 의미없음
    );
  }, [id, showPalette]);

  const handleColorSelect = useCallback((color: string) => {
    setNodeColor(id, color);
    setPreviewColor(null); // 미리보기 초기화
  }, [id, setNodeColor]);

  const handlePreviewColor = useCallback((color: string) => {
    setPreviewColor(color);
  }, []);

  const handleClearPreview = useCallback(() => {
    setPreviewColor(null);
  }, []);

  // 선택 상태가 변경될 때 하이라이트 업데이트
  useEffect(() => {
    // 선택이 해제되면 호버 상태도 해제 (다른 엔티티가 선택된 경우 제외)
    if (selectedNodeId !== id && selectedNodeId !== null) {
      // 다른 엔티티가 선택됨 - 호버 상태 해제
      if (setHoveredEntityId) {
        setHoveredEntityId(null);
      }
    }
  }, [selectedNodeId, id, setHoveredEntityId]);

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
          $darkMode={isDarkMode}
          $color={actualNodeColor}
          $isHidden={isHidden}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleEntityMouseEnter}
          onMouseLeave={handleEntityMouseLeave}
        >
          {/* 색상 팔레트 - 엔티티 내부에 상대 위치로 배치 */}
          {showColorPalette && paletteTarget?.type === 'node' && paletteTarget.id === id && (
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              right: -248, 
              zIndex: 10000 
            }}>
              <ColorPalette
                onColorSelect={handleColorSelect}
                onClose={hidePalette}
                position={{ x: 0, y: 0 }}
                darkMode={isDarkMode}
                onPreview={handlePreviewColor}
                onClearPreview={handleClearPreview}
              />
            </div>
          )}
          {/* 보이지 않는 연결 핸들들 - 모든 핸들을 source와 target 둘 다 지원 */}
          <InvisibleHandle type="target" position={Position.Left} id="left" />
          <InvisibleHandle type="source" position={Position.Left} id="left" />
          <InvisibleHandle type="target" position={Position.Right} id="right" />
          <InvisibleHandle type="source" position={Position.Right} id="right" />
          
                    <Header 
            ref={headerRef}
            $darkMode={isDarkMode}
            $color={actualNodeColor}
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
            
            {/* 팔레트 아이콘 - 선택된 상태일 때만 표시 */}
            <PaletteIcon $isVisible={isSelected} onClick={handlePaletteClick}>
              <FaPalette />
            </PaletteIcon>
          </Header>
          
          <ColumnsContainer $darkMode={isDarkMode}>
            {data.columns?.map((col: any, i: number) => {
              const isColumnHighlighted = highlightedColumns.get(id)?.includes(col.name) || false;
              
              return (
                <Column 
                  key={i} 
                  $isPrimaryKey={col.pk} 
                  $isForeignKey={col.fk}
                  $isUniqueKey={col.uq}
                  $darkMode={isDarkMode}
                  $isHighlighted={isColumnHighlighted}
                  onMouseEnter={(e) => handleMouseEnter(e, 'column', col)}
                  onMouseLeave={handleMouseLeave}
                  onClick={handleTooltipClick}
                  onMouseDown={handleTooltipMouseDown}
                >
                  {/* 첫 번째 컬럼: 키 + 물리명 */}
                  <ColumnKeyAndName $darkMode={isDarkMode}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {viewSettings.showKeys && col.pk && <IconWrapper $type="pk"><FaKey /></IconWrapper>}
                      {viewSettings.showKeys && col.fk && <IconWrapper $type="fk"><FaKey /></IconWrapper>}
                      {viewSettings.showKeys && col.uq && <IconWrapper $type="uq"><FaKey /></IconWrapper>}
                      {viewSettings.showPhysicalName && (
                        <ColumnName $isPrimaryKey={col.pk} $darkMode={isDarkMode}>{col.name}</ColumnName>
                      )}
                    </div>
                  </ColumnKeyAndName>
                  
                  {/* 두 번째 컬럼: 논리명 */}
                  <ColumnLogicalName $darkMode={isDarkMode} style={{ display: viewSettings.showLogicalName ? 'table-cell' : 'none' }}>
                    <ColumnLogicalText $darkMode={isDarkMode}>
                      {col.logicalName || col.comment || col.name}
                    </ColumnLogicalText>
                  </ColumnLogicalName>
                  
                  {/* 세 번째 컬럼: 제약조건 */}
                  <ColumnConstraints $darkMode={isDarkMode} style={{ display: viewSettings.showConstraints ? 'table-cell' : 'none' }}>
                    {(col.uq || col.constraint === 'UNIQUE') && (
                      <ColumnDetails $darkMode={isDarkMode}>UQ</ColumnDetails>
                    )}
                    {col.constraint === 'AUTO_INCREMENT' && (
                      <ColumnDetails $darkMode={isDarkMode}>AI</ColumnDetails>
                    )}
                    {(col.nn || col.nullable === false) && (
                      <ColumnDetails $darkMode={isDarkMode}>NN</ColumnDetails>
                    )}
                    {col.ai && (
                      <ColumnDetails $darkMode={isDarkMode}>AI</ColumnDetails>
                    )}
                  </ColumnConstraints>
                  
                  {/* 네 번째 컬럼: 기본값 */}
                  <ColumnDefaults $darkMode={isDarkMode} style={{ display: viewSettings.showDefaults ? 'table-cell' : 'none' }}>
                    {col.defaultValue && (
                      <ColumnDetails $darkMode={isDarkMode}>{col.defaultValue}</ColumnDetails>
                    )}
                  </ColumnDefaults>
                  
                  {/* 다섯 번째 컬럼: 데이터 타입 */}
                  <ColumnTypeArea $darkMode={isDarkMode} style={{ display: viewSettings.showDataType ? 'table-cell' : 'none' }}>
                    <ColumnType $darkMode={isDarkMode}>
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
                        id={createHandleId(col.name, 'right')}
                        style={{
                          position: 'absolute',
                          right: -8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 1,
                          height: 1,
                          backgroundColor: 'transparent',
                          border: 'none',
                          opacity: 0,
                          pointerEvents: 'none'
                        }}
                      />
                      <Handle
                        key={`${id}-${col.name}-right-target`}
                        type="target"
                        position={Position.Right}
                        id={createHandleId(col.name, 'right')}
                        style={{
                          position: 'absolute',
                          right: -8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 1,
                          height: 1,
                          backgroundColor: 'transparent',
                          border: 'none',
                          opacity: 0,
                          pointerEvents: 'none'
                        }}
                      />
                      
                      {/* Left Handle - source와 target 둘 다 */}
                      <Handle
                        key={`${id}-${col.name}-left-source`}
                        type="source"
                        position={Position.Left}
                        id={createHandleId(col.name, 'left')}
                        style={{
                          position: 'absolute',
                          left: -8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 1,
                          height: 1,
                          backgroundColor: 'transparent',
                          border: 'none',
                          opacity: 0,
                          pointerEvents: 'none'
                        }}
                      />
                      <Handle
                        key={`${id}-${col.name}-left-target`}
                        type="target"
                        position={Position.Left}
                        id={createHandleId(col.name, 'left')}
                        style={{
                          position: 'absolute',
                          left: -8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 1,
                          height: 1,
                          backgroundColor: 'transparent',
                          border: 'none',
                          opacity: 0,
                          pointerEvents: 'none'
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