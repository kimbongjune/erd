import { Handle, Position } from 'reactflow';
import styled from 'styled-components';
import { useState, useCallback, useRef, useEffect } from 'react';
import useStore from '../../store/useStore';

const NodeContainer = styled.div<{ selected?: boolean }>`
  background: #fff9c4;
  border: 2px solid ${props => props.selected ? '#facc15' : '#fbbf24'};
  border-radius: 8px;
  padding: 12px;
  width: fit-content;
  min-width: 100px;
  max-width: 400px;
  min-height: 40px;
  box-shadow: ${props => props.selected 
    ? '0 6px 20px rgba(251, 191, 36, 0.5), 0 0 0 3px rgba(251, 191, 36, 0.3)' 
    : '0 2px 8px rgba(0, 0, 0, 0.1)'};
  transition: all 0.2s ease;
  cursor: pointer;
  transform: ${props => props.selected ? 'scale(1.02)' : 'scale(1)'};
  
  &:hover {
    box-shadow: 0 4px 15px rgba(251, 191, 36, 0.2);
    border-color: #facc15;
    transform: scale(1.01);
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const nodes = useStore((state) => state.nodes);
  const setNodes = useStore((state) => state.setNodes);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);
  
  // ReactFlow의 selected 상태와 useStore의 selectedNodeId 모두 확인
  const isSelected = selected || selectedNodeId === id;

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

  return (
    <NodeContainer 
      selected={isSelected} 
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onWheel={handleNodeWheel}
    >
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
  );
};

export default CommentNode;
