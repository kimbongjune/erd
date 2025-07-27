import React, { useState } from 'react';
import styled from 'styled-components';
import { FaSearch, FaExpand, FaTh, FaProjectDiagram, FaEye, FaPlus, FaMinus, FaTable } from 'react-icons/fa';
import { MdGridOn } from 'react-icons/md';
import { useReactFlow } from 'reactflow';
import useStore from '../store/useStore';
import AlignPopup from './AlignPopup';
import ViewPopup from './ViewPopup';
import Tooltip from './Tooltip';

const ToolbarContainer = styled.div<{ $darkMode?: boolean }>`
  position: absolute;
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
  z-index: 0;
`;

const ZoomDisplay = styled.div<{ $darkMode?: boolean }>`
  font-size: 14px;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#666'};
  min-width: 40px;
  text-align: center;
  padding: 0 6px;
  font-weight: 500;
`;

const ToolbarButton = styled.button<{ $active?: boolean; $darkMode?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: ${props => props.$active ? (props.$darkMode ? 'rgba(96, 165, 250, 0.25)' : 'rgba(0, 122, 204, 0.15)') : 'transparent'};
  border-radius: 6px;
  cursor: pointer;
  color: ${props => props.$active ? (props.$darkMode ? '#60a5fa' : '#007acc') : (props.$darkMode ? '#cbd5e0' : '#666')};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$darkMode ? 'rgba(96, 165, 250, 0.15)' : 'rgba(0, 122, 204, 0.1)'};
    color: ${props => props.$darkMode ? '#60a5fa' : '#007acc'};
  }
  
  &:active {
    transform: scale(0.95);
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
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  
  // Store에서 상태 가져오기
  const searchActive = useStore((state) => state.searchActive);
  const relationsHighlight = useStore((state) => state.relationsHighlight);
  const showGrid = useStore((state) => state.showGrid);
  const showAlignPopup = useStore((state) => state.showAlignPopup);
  const showViewPopup = useStore((state) => state.showViewPopup);
  const theme = useStore((state) => state.theme);
  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);
  
  // Store 액션들
  const setSearchActive = useStore((state) => state.setSearchActive);
  const setRelationsHighlight = useStore((state) => state.setRelationsHighlight);
  const setShowGrid = useStore((state) => state.setShowGrid);
  const setShowAlignPopup = useStore((state) => state.setShowAlignPopup);
  const setShowViewPopup = useStore((state) => state.setShowViewPopup);
  const setHighlightedEdges = useStore((state) => state.setHighlightedEdges);
  const setHighlightedColumns = useStore((state) => state.setHighlightedColumns);

  const handleZoomToFit = () => {
    fitView({ padding: 0.1, duration: 500 });
  };

  const handleZoomIn = () => {
    zoomIn({ duration: 200 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 200 });
  };

  const handleSearch = () => {
    setSearchActive(!searchActive);
  };

  const handleAlign = () => {
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

  const isDarkMode = theme === 'dark';

  const handleAlignSelect = (type: 'left-right' | 'snowflake' | 'compact') => {
    setShowAlignPopup(false);
    // TODO: 실제 정렬 로직 구현
  };

  return (
    <>
      <ToolbarContainer $darkMode={isDarkMode}>
        <Tooltip text="줌 아웃">
          <ToolbarButton onClick={handleZoomOut} $darkMode={isDarkMode}>
            <FaMinus size={14} />
          </ToolbarButton>
        </Tooltip>
        
        <ZoomDisplay $darkMode={isDarkMode}>{Math.round(zoom * 100)}%</ZoomDisplay>
        
        <Tooltip text="줌 인">
          <ToolbarButton onClick={handleZoomIn} $darkMode={isDarkMode}>
            <FaPlus size={14} />
          </ToolbarButton>
        </Tooltip>
        
        <Divider $darkMode={isDarkMode} />
        
        <Tooltip text="검색">
          <ToolbarButton onClick={handleSearch} $active={searchActive} $darkMode={isDarkMode}>
            <FaSearch size={16} />
          </ToolbarButton>
        </Tooltip>
        
        <Tooltip text="한눈에보기">
          <ToolbarButton onClick={handleZoomToFit} $darkMode={isDarkMode}>
            <FaExpand size={16} />
          </ToolbarButton>
        </Tooltip>
        
        <Tooltip text="정렬">
          <ToolbarButton onClick={handleAlign} $active={showAlignPopup} $darkMode={isDarkMode}>
            <FaTh size={16} />
          </ToolbarButton>
        </Tooltip>
        
        <Tooltip text="관계선 하이라이트">
          <ToolbarButton onClick={handleRelations} $active={relationsHighlight} $darkMode={isDarkMode}>
            <FaProjectDiagram size={16} />
          </ToolbarButton>
        </Tooltip>
        
        <Tooltip text="그리드">
          <ToolbarButton onClick={handleGrid} $active={showGrid} $darkMode={isDarkMode}>
            <MdGridOn size={16} />
          </ToolbarButton>
        </Tooltip>
        
        <Divider $darkMode={isDarkMode} />
        
        <Tooltip text="보기 항목">
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
        </Tooltip>
      </ToolbarContainer>

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
