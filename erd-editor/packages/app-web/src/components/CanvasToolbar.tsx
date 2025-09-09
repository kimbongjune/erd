import React, { useState } from 'react';
import styled from 'styled-components';
import { FaSearch, FaExpand, FaTh, FaProjectDiagram, FaEye, FaPlus, FaMinus, FaTable, FaCopy, FaPaste, FaHistory } from 'react-icons/fa';
import { MdGridOn } from 'react-icons/md';
import { useReactFlow } from 'reactflow';
import useStore from '../store/useStore';
import AlignPopup from './AlignPopup';
import ViewPopup from './ViewPopup';

const ToolbarContainer = styled.div<{ $darkMode?: boolean }>`
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background: ${props => props.$darkMode ? 'rgba(45, 55, 72, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  border: 1px solid ${props => props.$darkMode ? '#404040' : '#e0e0e0'};
  border-radius: 12px;
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
  padding: 12px;
  gap: 6px;
  z-index: 100;
`;

const TooltipContainer = styled.div<{ $visible: boolean; $darkMode?: boolean }>`
  position: fixed;
  background: ${props => props.$darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.9)'};
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  z-index: 999999;
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: none;
  border: 1px solid ${props => props.$darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  transition: opacity 0.2s ease;
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: ${props => props.$darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.9)'};
  }
`;

const ZoomDisplay = styled.div<{ $darkMode?: boolean }>`
  font-size: 14px;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#666'};
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 6px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$darkMode ? 'rgba(96, 165, 250, 0.15)' : 'rgba(0, 122, 204, 0.1)'};
    color: ${props => props.$darkMode ? '#60a5fa' : '#007acc'};
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ToolbarButton = styled.button<{ $active?: boolean; $darkMode?: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: ${props => 
    props.$disabled ? 'transparent' :
    props.$active ? (props.$darkMode ? 'rgba(96, 165, 250, 0.25)' : 'rgba(0, 122, 204, 0.15)') : 'transparent'};
  border-radius: 6px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  color: ${props => 
    props.$disabled ? (props.$darkMode ? '#4a5568' : '#ccc') :
    props.$active ? (props.$darkMode ? '#60a5fa' : '#007acc') : (props.$darkMode ? '#cbd5e0' : '#666')};
  opacity: ${props => props.$disabled ? 0.5 : 1};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => 
      props.$disabled ? 'transparent' :
      props.$darkMode ? 'rgba(96, 165, 250, 0.15)' : 'rgba(0, 122, 204, 0.1)'};
    color: ${props => 
      props.$disabled ? (props.$darkMode ? '#4a5568' : '#ccc') :
      props.$darkMode ? '#60a5fa' : '#007acc'};
  }
  
  &:active {
    transform: ${props => props.$disabled ? 'none' : 'scale(0.95)'};
  }
`;

const Divider = styled.div<{ $darkMode?: boolean }>`
  width: 1px;
  height: 24px;
  background: ${props => props.$darkMode ? '#404040' : '#e0e0e0'};
  margin: 0 6px;
`;

const ShowSection = styled.div<{ $active?: boolean; $darkMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$active ? 'rgba(0, 122, 204, 0.15)' : 'transparent'};
  
  &:hover {
    background: rgba(0, 122, 204, 0.1);
  }
`;

const ShowLabel = styled.span<{ $active?: boolean; $darkMode?: boolean }>`
  font-size: 11px;
  color: ${props => props.$active ? (props.$darkMode ? '#60a5fa' : '#007acc') : (props.$darkMode ? '#cbd5e0' : '#666')};
  font-weight: ${props => props.$active ? '600' : '500'};
`;

const ShowIcon = styled.div<{ $active?: boolean; $darkMode?: boolean }>`
  width: 16px;
  height: 16px;
  color: ${props => props.$active ? (props.$darkMode ? '#60a5fa' : '#007acc') : (props.$darkMode ? '#cbd5e0' : '#666')};
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface CanvasToolbarProps {
  zoom: number;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ zoom }) => {
  const { fitView, zoomIn, zoomOut, setViewport, getViewport } = useReactFlow();
  
  // Store에서 상태 가져오기
  const searchActive = useStore((state) => state.searchActive);
  const isSearchPanelOpen = useStore((state) => state.isSearchPanelOpen);
  const relationsHighlight = useStore((state) => state.relationsHighlight);
  const showGrid = useStore((state) => state.showGrid);
  const showAlignPopup = useStore((state) => state.showAlignPopup);
  const showViewPopup = useStore((state) => state.showViewPopup);
  const showHistoryPanel = useStore((state) => state.showHistoryPanel);
  const theme = useStore((state) => state.theme);
  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);
  const isReadOnlyMode = useStore((state) => state.isReadOnlyMode);
  
  // 복사-붙여넣기 관련
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const copiedNode = useStore((state) => state.copiedNode);
  const copyNode = useStore((state) => state.copyNode);
  const pasteNode = useStore((state) => state.pasteNode);
  
  // Store 액션들
  const setSearchActive = useStore((state) => state.setSearchActive);
  const toggleSearchPanel = useStore((state) => state.toggleSearchPanel);
  const setRelationsHighlight = useStore((state) => state.setRelationsHighlight);
  const setShowGrid = useStore((state) => state.setShowGrid);
  const setShowAlignPopup = useStore((state) => state.setShowAlignPopup);
  const setShowViewPopup = useStore((state) => state.setShowViewPopup);
  const toggleHistoryPanel = useStore((state) => state.toggleHistoryPanel);
  const setHighlightedEdges = useStore((state) => state.setHighlightedEdges);
  const setHighlightedColumns = useStore((state) => state.setHighlightedColumns);
  const arrangeLeftRight = useStore((state) => state.arrangeLeftRight);
  const arrangeSnowflake = useStore((state) => state.arrangeSnowflake);
  const arrangeCompact = useStore((state) => state.arrangeCompact);
  const updateViewport = useStore((state) => state.updateViewport);

  // 툴팁 상태
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const [tooltipTimer, setTooltipTimer] = useState<number | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    
    // 기존 타이머가 있으면 클리어
    if (tooltipTimer) {
      clearTimeout(tooltipTimer);
    }
    
    // 300ms 딜레이 후 툴팁 표시
    const timer = window.setTimeout(() => {
      setTooltip({
        visible: true,
        x: rect.left + (rect.width / 2) - 2.5, // 왼쪽으로 2px 조정
        y: rect.top - 35, // 더 위로 올림
        text
      });
    }, 300);
    
    setTooltipTimer(timer);
  };

  const handleMouseLeave = () => {
    // 타이머 클리어
    if (tooltipTimer) {
      window.clearTimeout(tooltipTimer);
      setTooltipTimer(null);
    }
    setTooltip({ visible: false, x: -9999, y: -9999, text: '' });
  };

  const handleZoomToFit = () => {
    fitView({ padding: 0.1, duration: 500 });
    
    // fitView 완료 후 viewport 저장
    setTimeout(() => {
      const currentViewport = getViewport();
      updateViewport(currentViewport);
    }, 600); // fitView duration(500ms)보다 약간 길게 설정
  };

  const handleZoomIn = () => {
    zoomIn({ duration: 200 });
    
    // zoomIn 완료 후 viewport 저장
    setTimeout(() => {
      const currentViewport = getViewport();
      updateViewport(currentViewport);
    }, 300);
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 200 });
    
    // zoomOut 완료 후 viewport 저장
    setTimeout(() => {
      const currentViewport = getViewport();
      updateViewport(currentViewport);
    }, 300);
  };

  const handleZoomReset = () => {
    const currentViewport = getViewport();
    const newViewport = {
      x: currentViewport.x,
      y: currentViewport.y,
      zoom: 1
    };
    setViewport(newViewport, { duration: 300 });
    
    // zoomReset 완료 후 viewport 저장
    setTimeout(() => {
      updateViewport(newViewport);
    }, 400);
  };

  const handleSearch = () => {
    toggleSearchPanel();
  };

  const handleAlign = () => {
    if (isReadOnlyMode) return;
    setShowAlignPopup(!showAlignPopup);
  };

  const handleRelations = () => {
    const newHighlightState = !relationsHighlight;
    setRelationsHighlight(newHighlightState);
    
    // 관계선 하이라이트가 활성화되면 모든 관계선을 하이라이트, 비활성화되면 해제
    if (newHighlightState) {
      const allEdgeIds = edges.map(edge => edge.id);
      setHighlightedEdges(allEdgeIds);
      
      // 모든 관계에 관련된 컬럼들도 하이라이트
      const highlightedColumns = new Map<string, string[]>();
      
      edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
          // 부모 엔티티의 PK 컬럼들 하이라이트
          const sourcePkColumns = sourceNode.data.columns?.filter((col: any) => col.pk) || [];
          if (sourcePkColumns.length > 0) {
            highlightedColumns.set(sourceNode.id, sourcePkColumns.map((col: any) => col.name));
          }
          
          // 자식 엔티티의 FK 컬럼들 하이라이트
          const sourceLabel = sourceNode.data.label.toLowerCase();
          const targetFkColumns = targetNode.data.columns?.filter((col: any) => 
            col.fk && col.name.startsWith(`${sourceLabel}_`)
          ) || [];
          if (targetFkColumns.length > 0) {
            const existingColumns = highlightedColumns.get(targetNode.id) || [];
            highlightedColumns.set(targetNode.id, [...existingColumns, ...targetFkColumns.map((col: any) => col.name)]);
          }
        }
      });
      
      setHighlightedColumns(highlightedColumns);
    } else {
      setHighlightedEdges([]);
      setHighlightedColumns(new Map());
    }
  };

  const handleGrid = () => {
    setShowGrid(!showGrid);
  };

  const handleShow = () => {
    setShowViewPopup(!showViewPopup);
  };

  const handleHistory = () => {
    toggleHistoryPanel();
  };

  const handleCopy = () => {
    if (isReadOnlyMode) return;
    if (selectedNodeId) {
      copyNode(selectedNodeId);
    }
  };

  const handlePaste = () => {
    if (isReadOnlyMode) return;
    pasteNode(); // Ctrl+V와 동일하게 원본 노드 오른쪽 아래에 붙여넣기
  };

  const isDarkMode = theme === 'dark';

  const handleAlignSelect = (type: 'left-right' | 'snowflake' | 'compact') => {
    setShowAlignPopup(false);
    
    switch (type) {
      case 'left-right':
        arrangeLeftRight();
        break;
      case 'snowflake':
        arrangeSnowflake();
        break;
      case 'compact':
        arrangeCompact();
        break;
    }
  };

  return (
    <>
      <ToolbarContainer $darkMode={isDarkMode}>
        <div onMouseEnter={(e) => handleMouseEnter(e, '줌 아웃')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton onClick={handleZoomOut} $darkMode={isDarkMode}>
            <FaMinus size={14} />
          </ToolbarButton>
        </div>
        
        <div onMouseEnter={(e) => handleMouseEnter(e, '100%로 리셋')} onMouseLeave={handleMouseLeave}>
          <ZoomDisplay $darkMode={isDarkMode} onClick={handleZoomReset}>
            {Math.round(zoom * 100)}%
          </ZoomDisplay>
        </div>
        
        <div onMouseEnter={(e) => handleMouseEnter(e, '줌 인')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton onClick={handleZoomIn} $darkMode={isDarkMode}>
            <FaPlus size={14} />
          </ToolbarButton>
        </div>
        
        <Divider $darkMode={isDarkMode} />
        
        <div onMouseEnter={(e) => handleMouseEnter(e, isReadOnlyMode ? '읽기 전용 모드에서는 복사할 수 없습니다' : '복사')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton 
            onClick={handleCopy} 
            $darkMode={isDarkMode} 
            $active={!!selectedNodeId && !isReadOnlyMode}
            $disabled={isReadOnlyMode}
          >
            <FaCopy size={16} />
          </ToolbarButton>
        </div>
        
        <div onMouseEnter={(e) => handleMouseEnter(e, isReadOnlyMode ? '읽기 전용 모드에서는 붙여넣기할 수 없습니다' : '붙여넣기')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton 
            onClick={handlePaste} 
            $darkMode={isDarkMode} 
            $active={!!copiedNode && !isReadOnlyMode}
            $disabled={isReadOnlyMode}
          >
            <FaPaste size={16} />
          </ToolbarButton>
        </div>
        
        <Divider $darkMode={isDarkMode} />
        
        <div onMouseEnter={(e) => handleMouseEnter(e, '검색')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton onClick={handleSearch} $active={isSearchPanelOpen} $darkMode={isDarkMode}>
            <FaSearch size={16} />
          </ToolbarButton>
        </div>
        
        <div onMouseEnter={(e) => handleMouseEnter(e, '한눈에보기')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton onClick={handleZoomToFit} $darkMode={isDarkMode}>
            <FaExpand size={16} />
          </ToolbarButton>
        </div>
        
        <div onMouseEnter={(e) => handleMouseEnter(e, isReadOnlyMode ? '읽기 전용 모드에서는 정렬할 수 없습니다' : '정렬')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton 
            onClick={handleAlign} 
            $active={showAlignPopup && !isReadOnlyMode} 
            $darkMode={isDarkMode}
            $disabled={isReadOnlyMode}
          >
            <FaTh size={16} />
          </ToolbarButton>
        </div>
        
        <div onMouseEnter={(e) => handleMouseEnter(e, '관계선 하이라이트')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton onClick={handleRelations} $active={relationsHighlight} $darkMode={isDarkMode}>
            <FaProjectDiagram size={16} />
          </ToolbarButton>
        </div>
        
        <div onMouseEnter={(e) => handleMouseEnter(e, '그리드')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton onClick={handleGrid} $active={showGrid} $darkMode={isDarkMode}>
            <MdGridOn size={16} />
          </ToolbarButton>
        </div>
        
        <div onMouseEnter={(e) => handleMouseEnter(e, '히스토리')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton onClick={handleHistory} $active={showHistoryPanel} $darkMode={isDarkMode}>
            <FaHistory size={16} />
          </ToolbarButton>
        </div>
        
        <Divider $darkMode={isDarkMode} />
        
        <div onMouseEnter={(e) => handleMouseEnter(e, '보기 항목')} onMouseLeave={handleMouseLeave}>
          <ShowSection 
            onClick={handleShow}
            $active={showViewPopup}
            $darkMode={isDarkMode}
          >
            <ShowLabel $active={showViewPopup} $darkMode={isDarkMode}>Show:</ShowLabel>
            <ShowIcon $active={showViewPopup} $darkMode={isDarkMode}>
              <FaTable size={12} />
            </ShowIcon>
          </ShowSection>
        </div>
      </ToolbarContainer>

      {/* 툴팁 */}
      <TooltipContainer
        $visible={tooltip.visible}
        $darkMode={isDarkMode}
        style={{
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translateX(-50%)'
        }}
      >
        {tooltip.text}
      </TooltipContainer>

      {/* 정렬 팝업 */}
      <AlignPopup
        visible={showAlignPopup}
        onClose={() => setShowAlignPopup(false)}
        onSelect={handleAlignSelect}
      />

      {/* 보기 팝업 */}
      <ViewPopup
        visible={showViewPopup}
        onClose={() => setShowViewPopup(false)}
      />
    </>
  );
};

export default CanvasToolbar;
