import { Handle, Position } from 'reactflow';
import styled from 'styled-components';
import { useState, useCallback, useRef, useEffect } from 'react';
import { FaPalette } from 'react-icons/fa';
import useStore from '../../store/useStore';
import ColorPalette from '../ColorPalette';
import { getHoverColor, getActiveColor, getShadowColor } from '../../utils/colorUtils';

const NodeContainer = styled.div<{ selected?: boolean; $color?: string; $isEditing?: boolean }>`
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
  cursor: ${props => props.$isEditing ? 'text' : 'pointer'};
  pointer-events: ${props => props.$isEditing ? 'none !important' : 'auto'};
  user-select: ${props => props.$isEditing ? 'none' : 'auto'};
  
  &:hover {
    box-shadow: ${props => {
      if (props.$isEditing) return; // 편집 모드에서는 hover 효과 제거
      if (props.$color) {
        return `0 3px 10px ${getShadowColor(props.$color)}`;
      }
      return '0 3px 10px rgba(251, 191, 36, 0.15)';
    }};
    border-color: ${props => {
      if (props.$isEditing) return; // 편집 모드에서는 hover 효과 제거
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

const PaletteIcon = styled.div<{ $isVisible: boolean; $headerColor?: string }>`
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
    color: ${props => {
      if (!props.$headerColor) return 'white';
      
      // 헤더 색상의 밝기를 계산하여 대비되는 색상 선택
      const hex = props.$headerColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      // 밝은 배경에는 어두운 색, 어두운 배경에는 밝은 색
      return brightness > 128 ? '#000000' : '#ffffff';
    }};
  }
`;

const CommentTextContainer = styled.div<{ $isEditing: boolean; $color?: string }>`
  width: 100%;
  font-size: 14px;
  font-family: inherit;
  color: ${props => {
    if (props.$color) {
      const hex = props.$color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? '#000000' : '#ffffff';
    }
    return '#374151';
  }};
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.4;
  min-height: 20px;
  padding: ${props => props.$isEditing ? '8px' : '0'};
  border: none;
  outline: none;
  background: ${props => props.$isEditing ? 'rgba(255, 255, 255, 0.8)' : 'transparent'};
  border-radius: ${props => props.$isEditing ? '4px' : '0'};
  cursor: ${props => props.$isEditing ? 'text' : 'pointer'};
  pointer-events: ${props => props.$isEditing ? 'auto !important' : 'none'};
  user-select: ${props => props.$isEditing ? 'text' : 'none'};
  z-index: ${props => props.$isEditing ? '9999' : 'auto'};
  position: relative;
  transition: background-color 0.2s ease, padding 0.2s ease;
  
  &:focus {
    background: ${props => props.$isEditing ? 'rgba(255, 255, 255, 1)' : 'transparent'};
    box-shadow: ${props => props.$isEditing ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none'};
  }
  
  &:empty:before {
    content: ${props => props.$isEditing ? '"텍스트를 입력하세요..."' : '""'};
    color: #9ca3af;
    font-style: italic;
  }
`;

const CommentNode = ({ data, selected, id }: any) => {
  const [editValue, setEditValue] = useState(data.label);
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
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
  const editingCommentId = useStore((state) => state.editingCommentId);
  const setEditingCommentId = useStore((state) => state.setEditingCommentId);
  const saveHistoryState = useStore((state) => state.saveHistoryState);
  
  // 편집 상태는 useStore에서 관리
  const isEditing = editingCommentId === id;
  
  // ReactFlow의 selected 상태와 useStore의 selectedNodeId 모두 확인
  const isSelected = selected || selectedNodeId === id;
  const isDarkMode = theme === 'dark';
  
  // 편집 모드 진입시 초기 설정만 수행
  useEffect(() => {
    if (isEditing && contentRef.current) {
      // 편집 모드로 진입할 때만 초기 설정
      const htmlContent = data.label.replace(/\n/g, '<br>');
      contentRef.current.innerHTML = htmlContent;
      
      // 포커스 설정
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus();
          
          // "New Comment"가 아닌 경우에만 텍스트 전체 선택
          if (data.label !== 'New Comment') {
            const range = document.createRange();
            range.selectNodeContents(contentRef.current);
            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }
      }, 0);
    }
  }, [isEditing]); // editValue 의존성 제거

  // 색상 관련
  const commentColor = getCommentColor(id);
  const actualColor = previewColor || commentColor;

  const handleClick = useCallback((e: any) => {
    // 편집 중일 때는 이벤트 처리하지 않음 (CSS pointer-events로 차단됨)
    if (isEditing) {
      return;
    }
    
    e.stopPropagation();
    e.preventDefault();
    
    setSelectedNodeId(id);
  }, [id, setSelectedNodeId, isEditing]);

  const handleMouseDown = useCallback((e: any) => {
    // 편집 중일 때는 노드 드래그 방지
    if (isEditing) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
  }, [isEditing]);

  // 이벤트 캡처링 단계에서 완전 차단
  const handleCaptureClick = useCallback((e: any) => {
    if (isEditing) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, [isEditing]);

  const handleCaptureMouseDown = useCallback((e: any) => {
    if (isEditing) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, [isEditing]);

  const handleCaptureContextMenu = useCallback((e: any) => {
    if (isEditing) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, [isEditing]);

  const handleCaptureDragStart = useCallback((e: any) => {
    if (isEditing) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, [isEditing]);

  // contentEditable 내부 이벤트 핸들러들
  const handleContentClick = useCallback((e: any) => {
    if (isEditing) {
      e.stopPropagation(); // 상위로 전파 방지
    }
  }, [isEditing]);

  const handleContentMouseDown = useCallback((e: any) => {
    if (isEditing) {
      e.stopPropagation(); // 상위로 전파 방지
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback((e: any) => {
    e.stopPropagation();
    e.preventDefault();
    
    setEditingCommentId(id);
    setEditValue(data.label);
  }, [data.label, id, setEditingCommentId]);

  const handleInputChange = useCallback((e: any) => {
    // 최소한의 처리만 수행 - 커서 위치 방해하지 않음
    const target = e.target;
    if (target) {
      const textContent = target.textContent || '';
      setEditValue(textContent);
    }
  }, []);

  const handleKeyDown = useCallback((e: any) => {
    // 백스페이스 키 이벤트가 상위로 전파되어 노드 삭제되는 것 방지
    if (e.key === 'Backspace') {
      e.stopPropagation();
    }
    
    // Enter 키 처리 - 두 줄 바뀜 방지
    if (e.key === 'Enter' && !e.ctrlKey) {
      e.preventDefault();
      
      // 현재 커서 위치에 <br> 삽입
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const br = document.createElement('br');
        range.insertNode(br);
        
        // 커서를 <br> 다음으로 이동
        range.setStartAfter(br);
        range.setEndAfter(br);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      // editValue 업데이트
      if (contentRef.current) {
        const textContent = contentRef.current.textContent || '';
        setEditValue(textContent);
      }
      return;
    }
    
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleInputBlur();
    }
    
    if (e.key === 'Escape') {
      e.preventDefault();
      if (contentRef.current) {
        // 원래 텍스트로 복원
        const htmlContent = data.label.replace(/\n/g, '<br>');
        contentRef.current.innerHTML = htmlContent;
      }
      setEditValue(data.label);
      setEditingCommentId(null);
    }
  }, [data.label, setEditingCommentId]);

  const handleInputBlur = useCallback(() => {
    // onBlur에서 최종 처리
    let finalContent = '';
    
    if (contentRef.current) {
      // innerHTML에서 <br> 태그를 \n으로 변환
      const htmlContent = contentRef.current.innerHTML;
      finalContent = htmlContent
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div>/gi, '\n')
        .replace(/<\/div>/gi, '')
        .replace(/<[^>]*>/g, '') // 나머지 HTML 태그 제거
        .trim();
    }
    
    // 빈 값인 경우 원래 라벨 유지
    if (finalContent === '') {
      finalContent = data.label;
    }
    
    // 텍스트가 실제로 변경된 경우에만 히스토리 저장
    if (finalContent !== data.label) {
      console.log('💬 커멘트 텍스트 변경 히스토리 저장:', finalContent);
      saveHistoryState('CHANGE_COMMENT_TEXT', {
        commentId: id,
        oldText: data.label,
        newText: finalContent
      });
    }
    
    const updatedNodes = nodes.map((node) =>
      node.id === id ? { ...node, data: { ...node.data, label: finalContent } } : node
    );
    setNodes(updatedNodes);
    setEditingCommentId(null);
  }, [data.label, nodes, id, setNodes, setEditingCommentId, saveHistoryState]);

  const handleTextAreaWheel = useCallback((e: any) => {
    // 컨텐츠 내부에서 휠 이벤트가 위로 전파되지 않도록 차단
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
    const oldColor = getCommentColor(id);
    if (color !== oldColor) {
      console.log('🎨 커멘트 색상 변경 히스토리 저장:', color);
      saveHistoryState('CHANGE_NODE_COLOR', {
        nodeId: id,
        nodeType: 'comment',
        oldColor,
        newColor: color
      });
    }
    setCommentColor(id, color);
    setPreviewColor(null);
  }, [id, setCommentColor, getCommentColor, saveHistoryState]);

  const handlePreviewColor = useCallback((color: string) => {
    setPreviewColor(color);
  }, []);

  const handleClearPreview = useCallback(() => {
    setPreviewColor(null);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {isEditing ? (
        // 편집 모드일 때는 완전히 분리된 구조
        <div style={{ position: 'relative', zIndex: 10000 }}>
          <NodeContainer 
            selected={isSelected} 
            $color={actualColor}
            $isEditing={isEditing}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {/* 색상 팔레트 - 편집 모드에서는 비활성화 */}
            
            {/* 헤더도 편집 모드에서는 비활성화 */}
            
            {/* 편집용 contentEditable - 완전히 독립적 */}
            <CommentTextContainer
              ref={contentRef}
              $isEditing={isEditing}
              $color={actualColor}
              contentEditable={true}
              suppressContentEditableWarning={true}
              onInput={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleInputBlur}
              onWheel={handleTextAreaWheel}
              onWheelCapture={handleTextAreaWheel}
              onContextMenu={(e) => {
                // 편집 모드에서는 기본 브라우저 콘텍스트 메뉴 허용
                e.stopPropagation();
              }}
              style={{ 
                pointerEvents: 'auto',
                userSelect: 'text',
                position: 'relative',
                zIndex: 10001
              }}
              onFocus={(e) => {
                if (data.label === 'New Comment') {
                  e.target.innerHTML = '';
                  setEditValue('');
                }
              }}
            />
          </NodeContainer>
        </div>
      ) : (
        // 비편집 모드일 때는 기존 구조
        <NodeContainer 
          selected={isSelected} 
          $color={actualColor}
          $isEditing={isEditing}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onWheel={handleNodeWheel}
          onClickCapture={handleCaptureClick}
          onMouseDownCapture={handleCaptureMouseDown}
          onContextMenuCapture={handleCaptureContextMenu}
          onDragStartCapture={handleCaptureDragStart}
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
                $headerColor={actualColor}
                onClick={handlePaletteClick}
              >
                <FaPalette />
              </PaletteIcon>
            </Header>
          )}

          {/* 커멘트는 관계에 참여하지 않으므로 Handle 제거 */}
          
          <CommentTextContainer
            $isEditing={isEditing}
            $color={actualColor}
            dangerouslySetInnerHTML={{ __html: data.label.replace(/\n/g, '<br>') }}
          />
        </NodeContainer>
      )}
    </div>
  );
};

export default CommentNode;
