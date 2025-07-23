import React from 'react';
import styled from 'styled-components';
import { FaSearch, FaExpand, FaTh, FaProjectDiagram, FaEye } from 'react-icons/fa';
import { MdGridOn } from 'react-icons/md';
import { useReactFlow } from 'reactflow';

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

const ToolbarButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
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

const ShowSection = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
`;

const ShowLabel = styled.span`
  font-size: 11px;
  color: #666;
  font-weight: 500;
`;

const ShowIcon = styled.div`
  width: 16px;
  height: 16px;
  background: #4a90e2;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:after {
    content: "E";
    color: white;
    font-size: 10px;
    font-weight: bold;
  }
`;

interface CanvasToolbarProps {
  zoom: number;
  onSearch?: () => void;
  onZoomToFit?: () => void;
  onAlign?: () => void;
  onToggleRelations?: () => void;
  onToggleGrid?: () => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  zoom,
  onSearch,
  onZoomToFit,
  onAlign,
  onToggleRelations,
  onToggleGrid
}) => {
  const { fitView } = useReactFlow();

  const handleZoomToFit = () => {
    fitView({ padding: 0.1, duration: 500 });
    onZoomToFit?.();
  };

  return (
    <ToolbarContainer>
      <ZoomDisplay>{Math.round(zoom * 100)}%</ZoomDisplay>
      
      <Divider />
      
      <ToolbarButton onClick={onSearch} title="검색">
        <FaSearch size={16} />
      </ToolbarButton>
      
      <ToolbarButton onClick={handleZoomToFit} title="Zoom to Fit">
        <FaExpand size={16} />
      </ToolbarButton>
      
      <ToolbarButton onClick={onAlign} title="정렬">
        <FaTh size={16} />
      </ToolbarButton>
      
      <ToolbarButton onClick={onToggleRelations} title="엔티티 관계선">
        <FaProjectDiagram size={16} />
      </ToolbarButton>
      
      <ToolbarButton onClick={onToggleGrid} title="격자">
        <MdGridOn size={16} />
      </ToolbarButton>
      
      <Divider />
      
      <ShowSection>
        <ShowLabel>Show:</ShowLabel>
        <ShowIcon />
      </ShowSection>
    </ToolbarContainer>
  );
};

export default CanvasToolbar;
