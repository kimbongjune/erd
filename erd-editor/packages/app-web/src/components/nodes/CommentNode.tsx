import { Handle, Position } from 'reactflow';
import styled from 'styled-components';
import { useState, useCallback, useRef, useEffect } from 'react';
import { FaPalette } from 'react-icons/fa';
import useStore from '../../store/useStore';
import ColorPalette from '../ColorPalette';
import { getHoverColor, getActiveColor, getShadowColor } from '../../utils/colorUtils';

const NodeContainer = styled.div<{ selected?: boolean; $color?: string }>`
  position: relative;
  background: ${props => props.$color ? props.$color : '#fff9c4'};
  border: 2px solid ${props => {
    if (props.$color && props.selected) {
      return getActiveColor(props.$color);
    }
    if (props.$color) {
      return getHoverColor(props.$color);
    }
    return props.selected ? '#facc15' : '#fbbf24';
  }};
  border-radius: 8px;
  padding: 12px;
  width: fit-content;
  min-width: 100px;
  max-width: 400px;
  min-height: 40px;
  box-shadow: ${props => {
    if (props.$color && props.selected) {
      return `0 4px 12px ${getShadowColor(props.$color)}, 0 0 0 2px ${getShadowColor(props.$color)}`;
    }
    if (props.$color) {
      return `0 2px 8px ${getShadowColor(props.$color)}`;
    }
    return props.selected 
      ? '0 4px 12px rgba(251, 191, 36, 0.3), 0 0 0 2px rgba(251, 191, 36, 0.2)' 
      : '0 2px 8px rgba(0, 0, 0, 0.1)';
  }};
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  cursor: pointer;
  
  &:hover {
    box-shadow: ${props => {
      if (props.$color) {
        return `0 3px 10px ${getShadowColor(props.$color)}`;
      }
      return '0 3px 10px rgba(251, 191, 36, 0.15)';
    }};
    border-color: ${props => {
      if (props.$color) {
        return props.selected ? getActiveColor(props.$color) : getHoverColor(props.$color);
      }
      return '#facc15';
    }};
  }
`;

const Header = styled.div<{ $color?: string }>`
  position: absolute;
  top: -12px;
  right: -12px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: ${props => props.$color ? `linear-gradient(135deg, ${props.$color} 0%, ${getActiveColor(props.$color)} 100%)` : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'};
  border-radius: 6px;
  padding: 4px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const PaletteIcon = styled.div<{ $isVisible: boolean }>`
  display: ${props => props.$isVisible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
  
  svg {
    width: 10px;
    height: 10px;
    color: white;
  }
`;

const EditInput = styled.textarea`
  width: 100%;
  border: none;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 8px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  color: #374151;
  resize: none;
  min-height: 20px;
  height: auto;
  overflow: hidden;
  
  &:focus {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }
`;

const CommentText = styled.div`
  font-size: 14px;
  color: #374151;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.4;
`;

const CommentNode = ({ data, selected, id }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const nodes = useStore((state) => state.nodes);
  const setNodes = useStore((state) => state.setNodes);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);
  const getCommentColor = useStore((state) => state.getCommentColor);
  const setCommentColor = useStore((state) => state.setCommentColor);
  const showColorPalette = useStore((state) => state.showColorPalette);
  const paletteTarget = useStore((state) => state.paletteTarget);
  const showPalette = useStore((state) => state.showPalette);
  const hidePalette = useStore((state) => state.hidePalette);
  const theme = useStore((state) => state.theme);
  
  // ReactFlow의 selected 상태와 useStore의 selectedNodeId 모두 확인
  const isSelected = selected || selectedNodeId === id;
  const isDarkMode = theme === 'dark';
  
  // 색상 관련
  const commentColor = getCommentColor(id);
  const actualColor = previewColor || commentColor;

  // 텍스트 영역 높이 자동 조정
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight();
    }
  }, [isEditing, editValue, adjustTextareaHeight]);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    e.preventDefault();
    
    // 편집 중이 아닐 때만 선택 상태 변경 (하단 패널은 열지 않음)
    if (!isEditing) {
      setSelectedNodeId(id);
      // setBottomPanelOpen(true); // 코멘트는 하단 패널 열지 않음
    }
  }, [id, setSelectedNodeId, isEditing]);

  const handleDoubleClick = useCallback((e: any) => {
    e.stopPropagation();
    e.preventDefault();
    
    // "New Comment"인 경우 빈 문자열로 시작
    if (data.label === 'New Comment') {
      setEditValue('');
    } else {
      setEditValue(data.label);
    }
    
    setIsEditing(true);
  }, [data.label]);

  const handleInputChange = useCallback((e: any) => {
    setEditValue(e.target.value);
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  const handleInputKeyPress = useCallback((e: any) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleInputBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(data.label);
      setIsEditing(false);
    }
  }, [data.label]);

  const handleInputBlur = useCallback(() => {
    // 빈 값이면 원래 라벨 유지, 아니면 새 값으로 업데이트
    const finalValue = editValue.trim() === '' ? data.label : editValue;
    
    const updatedNodes = nodes.map((node) =>
      node.id === id ? { ...node, data: { ...node.data, label: finalValue } } : node
    );
    setNodes(updatedNodes);
    setIsEditing(false);
  }, [editValue, data.label, nodes, id, setNodes]);

  const handleTextAreaWheel = useCallback((e: any) => {
    // textarea 내부에서 휠 이벤트가 위로 전파되지 않도록 차단
    e.stopPropagation();
  }, []);

  const handleNodeWheel = useCallback((e: any) => {
    // 모든 휠 이벤트를 차단
    e.stopPropagation();
  }, []);

  // 팔레트 관련 핸들러들
  const handlePaletteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    showPalette(
      { type: 'comment', id }, 
      { x: 0, y: 0 }
    );
  }, [id, showPalette]);

  const handleColorSelect = useCallback((color: string) => {
    setCommentColor(id, color);
    setPreviewColor(null);
  }, [id, setCommentColor]);

  const handlePreviewColor = useCallback((color: string) => {
    setPreviewColor(color);
  }, []);

  const handleClearPreview = useCallback(() => {
    setPreviewColor(null);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <NodeContainer 
        selected={isSelected} 
        $color={actualColor}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onWheel={handleNodeWheel}
      >
        {/* 색상 팔레트 - 커멘트 내부에 상대 위치로 배치 */}
        {showColorPalette && paletteTarget?.type === 'comment' && paletteTarget.id === id && (
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

        {/* 헤더 (선택된 상태일 때만 표시) */}
        {isSelected && (
          <Header $color={actualColor}>
            <PaletteIcon 
              $isVisible={isSelected}
              onClick={handlePaletteClick}
            >
              <FaPalette />
            </PaletteIcon>
          </Header>
        )}

        {/* 커멘트는 관계에 참여하지 않으므로 Handle 제거 */}
        
        {isEditing ? (
          <EditInput
            ref={textareaRef}
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyPress}
            onBlur={handleInputBlur}
            onWheel={handleTextAreaWheel}
            onWheelCapture={handleTextAreaWheel}
            autoFocus
          />
        ) : (
          <CommentText>
            {data.label}
          </CommentText>
        )}
      </NodeContainer>
    </div>
  );
};

export default CommentNode;
