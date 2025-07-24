import React, { useState } from 'react';
import styled from 'styled-components';
import { FaSearch, FaExpand, FaTh, FaProjectDiagram, FaEye, FaPlus, FaMinus, FaTable } from 'react-icons/fa';
import { MdGridOn } from 'react-icons/md';
import { useReactFlow } from 'reactflow';
import useStore from '../store/useStore';
import AlignPopup from './AlignPopup';
import ViewPopup from './ViewPopup';
import Tooltip from './Tooltip';

const ToolbarContainer = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
  padding: 12px;
  gap: 6px;
  z-index: 0;
  backdrop-filter: blur(10px);
`;

const ZoomDisplay = styled.div`
  font-size: 14px;
  color: #666;
  min-width: 40px;
  text-align: center;
  padding: 0 6px;
  font-weight: 500;
`;

const ToolbarButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: ${props => props.$active ? 'rgba(0, 122, 204, 0.15)' : 'transparent'};
  border-radius: 6px;
  cursor: pointer;
  color: ${props => props.$active ? '#007acc' : '#666'};
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 122, 204, 0.1);
    color: #007acc;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: #e0e0e0;
  margin: 0 6px;
`;

const ShowSection = styled.div<{ $active?: boolean }>`
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

const ShowLabel = styled.span<{ $active?: boolean }>`
  font-size: 11px;
  color: ${props => props.$active ? '#007acc' : '#666'};
  font-weight: 500;
`;

const ShowIcon = styled.div<{ $active?: boolean }>`
  width: 16px;
  height: 16px;
  color: ${props => props.$active ? '#007acc' : '#666'};
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
  
  // Store 액션들
  const setSearchActive = useStore((state) => state.setSearchActive);
  const setRelationsHighlight = useStore((state) => state.setRelationsHighlight);
  const setShowGrid = useStore((state) => state.setShowGrid);
  const setShowAlignPopup = useStore((state) => state.setShowAlignPopup);
  const setShowViewPopup = useStore((state) => state.setShowViewPopup);

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
    setRelationsHighlight(!relationsHighlight);
  };

  const handleGrid = () => {
    setShowGrid(!showGrid);
  };

  const handleShow = () => {
    setShowViewPopup(!showViewPopup);
  };

  const handleAlignSelect = (type: 'left-right' | 'snowflake' | 'compact') => {
    console.log('정렬 방식 선택:', type);
    setShowAlignPopup(false);
    // TODO: 실제 정렬 로직 구현
  };

  return (
    <>
      <ToolbarContainer>
        <Tooltip text="줌 아웃">
          <ToolbarButton onClick={handleZoomOut}>
            <FaMinus size={14} />
          </ToolbarButton>
        </Tooltip>
        
        <ZoomDisplay>{Math.round(zoom * 100)}%</ZoomDisplay>
        
        <Tooltip text="줌 인">
          <ToolbarButton onClick={handleZoomIn}>
            <FaPlus size={14} />
          </ToolbarButton>
        </Tooltip>
        
        <Divider />
        
        <Tooltip text="검색">
          <ToolbarButton onClick={handleSearch} $active={searchActive}>
            <FaSearch size={16} />
          </ToolbarButton>
        </Tooltip>
        
        <Tooltip text="한눈에보기">
          <ToolbarButton onClick={handleZoomToFit}>
            <FaExpand size={16} />
          </ToolbarButton>
        </Tooltip>
        
        <Tooltip text="정렬">
          <ToolbarButton onClick={handleAlign} $active={showAlignPopup}>
            <FaTh size={16} />
          </ToolbarButton>
        </Tooltip>
        
        <Tooltip text="관계선 하이라이트">
          <ToolbarButton onClick={handleRelations} $active={relationsHighlight}>
            <FaProjectDiagram size={16} />
          </ToolbarButton>
        </Tooltip>
        
        <Tooltip text="그리드">
          <ToolbarButton onClick={handleGrid} $active={showGrid}>
            <MdGridOn size={16} />
          </ToolbarButton>
        </Tooltip>
        
        <Divider />
        
        <Tooltip text="보기 항목">
          <ShowSection 
            onClick={handleShow}
            $active={showViewPopup}
          >
            <ShowLabel $active={showViewPopup}>Show:</ShowLabel>
            <ShowIcon $active={showViewPopup}>
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
