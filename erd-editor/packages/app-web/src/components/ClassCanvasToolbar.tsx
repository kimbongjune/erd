import React, { useState } from 'react';
import styled from 'styled-components';
import { FaSearch, FaExpand, FaTh, FaEye, FaPlus, FaMinus, FaTable, FaCopy, FaPaste, FaHistory } from 'react-icons/fa';
import { MdGridOn } from 'react-icons/md';
import { useReactFlow } from 'reactflow';

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

interface ClassCanvasToolbarProps {
  zoom: number;
  darkMode: boolean;
  onSearch?: () => void;
  onZoomToFit?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onGrid?: () => void;
  onHistory?: () => void;
  searchActive?: boolean;
  showGrid?: boolean;
  showHistoryPanel?: boolean;
  selectedNodeId?: string;
  copiedNode?: any;
  isReadOnlyMode?: boolean;
}

const ClassCanvasToolbar: React.FC<ClassCanvasToolbarProps> = ({
  zoom,
  darkMode,
  onSearch,
  onZoomToFit,
  onCopy,
  onPaste,
  onGrid,
  onHistory,
  searchActive = false,
  showGrid = false,
  showHistoryPanel = false,
  selectedNodeId,
  copiedNode,
  isReadOnlyMode = false
}) => {
  const { fitView, zoomIn, zoomOut, setViewport, getViewport } = useReactFlow();

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
    if (onZoomToFit) {
      onZoomToFit();
    } else {
      fitView({ padding: 0.1, duration: 500 });
    }
  };

  const handleZoomIn = () => {
    zoomIn({ duration: 200 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 200 });
  };

  const handleZoomReset = () => {
    const currentViewport = getViewport();
    const newViewport = {
      x: currentViewport.x,
      y: currentViewport.y,
      zoom: 1
    };
    setViewport(newViewport, { duration: 300 });
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch();
    }
  };

  const handleGrid = () => {
    if (onGrid) {
      onGrid();
    }
  };

  const handleHistory = () => {
    if (onHistory) {
      onHistory();
    }
  };

  const handleCopy = () => {
    if (onCopy && !isReadOnlyMode) {
      onCopy();
    }
  };

  const handlePaste = () => {
    if (onPaste && !isReadOnlyMode) {
      onPaste();
    }
  };

  return (
    <>
      <ToolbarContainer $darkMode={darkMode}>
        <div onMouseEnter={(e) => handleMouseEnter(e, '줌 아웃')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton onClick={handleZoomOut} $darkMode={darkMode}>
            <FaMinus size={14} />
          </ToolbarButton>
        </div>

        <div onMouseEnter={(e) => handleMouseEnter(e, '100%로 리셋')} onMouseLeave={handleMouseLeave}>
          <ZoomDisplay $darkMode={darkMode} onClick={handleZoomReset}>
            {Math.round(zoom * 100)}%
          </ZoomDisplay>
        </div>

        <div onMouseEnter={(e) => handleMouseEnter(e, '줌 인')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton onClick={handleZoomIn} $darkMode={darkMode}>
            <FaPlus size={14} />
          </ToolbarButton>
        </div>

        <Divider $darkMode={darkMode} />

        <div onMouseEnter={(e) => handleMouseEnter(e, isReadOnlyMode ? '읽기 전용 모드에서는 복사할 수 없습니다' : '복사')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton
            onClick={handleCopy}
            $darkMode={darkMode}
            $active={!!selectedNodeId && !isReadOnlyMode}
            $disabled={isReadOnlyMode}
          >
            <FaCopy size={16} />
          </ToolbarButton>
        </div>

        <div onMouseEnter={(e) => handleMouseEnter(e, isReadOnlyMode ? '읽기 전용 모드에서는 붙여넣기할 수 없습니다' : '붙여넣기')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton
            onClick={handlePaste}
            $darkMode={darkMode}
            $active={!!copiedNode && !isReadOnlyMode}
            $disabled={isReadOnlyMode}
          >
            <FaPaste size={16} />
          </ToolbarButton>
        </div>

        <Divider $darkMode={darkMode} />

        <div onMouseEnter={(e) => handleMouseEnter(e, '검색')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton onClick={handleSearch} $active={searchActive} $darkMode={darkMode}>
            <FaSearch size={16} />
          </ToolbarButton>
        </div>

        <div onMouseEnter={(e) => handleMouseEnter(e, '한눈에보기')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton onClick={handleZoomToFit} $darkMode={darkMode}>
            <FaExpand size={16} />
          </ToolbarButton>
        </div>

        <div onMouseEnter={(e) => handleMouseEnter(e, '그리드')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton onClick={handleGrid} $active={showGrid} $darkMode={darkMode}>
            <MdGridOn size={16} />
          </ToolbarButton>
        </div>

        <div onMouseEnter={(e) => handleMouseEnter(e, '히스토리')} onMouseLeave={handleMouseLeave}>
          <ToolbarButton onClick={handleHistory} $active={showHistoryPanel} $darkMode={darkMode}>
            <FaHistory size={16} />
          </ToolbarButton>
        </div>
      </ToolbarContainer>

      {/* 툴팁 */}
      <TooltipContainer
        $visible={tooltip.visible}
        $darkMode={darkMode}
        style={{
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translateX(-50%)'
        }}
      >
        {tooltip.text}
      </TooltipContainer>
    </>
  );
};

export default ClassCanvasToolbar;
