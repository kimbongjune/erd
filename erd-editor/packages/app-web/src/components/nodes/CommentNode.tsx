import { Handle, Position } from 'reactflow';
import styled from 'styled-components';
import { useState, useCallback } from 'react';
import useStore from '../../store/useStore';

const NodeContainer = styled.div<{ selected?: boolean }>`
  background: #fff9c4;
  border: 2px solid ${props => props.selected ? '#facc15' : '#fbbf24'};
  border-radius: 8px;
  padding: 12px;
  min-width: 200px;
  min-height: 80px;
  box-shadow: ${props => props.selected 
    ? '0 4px 12px rgba(251, 191, 36, 0.3)' 
    : '0 2px 8px rgba(0, 0, 0, 0.1)'};
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    box-shadow: 0 4px 15px rgba(251, 191, 36, 0.2);
    border-color: #facc15;
  }
  
  /* 이 노드에서는 휠 이벤트 완전 차단 */
  * {
    overscroll-behavior: contain;
  }
  
  /* 추가 휠 차단 */
  overflow: hidden;
  overscroll-behavior-y: none;
  scroll-behavior: auto;
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
  min-height: 60px;
  overflow-y: auto;
  
  &:focus {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.3);
  }
  
  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.5);
  }
`;

const CommentText = styled.div`
  color: #374151;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 400;
  word-wrap: break-word;
  min-height: 20px;
  white-space: pre-wrap;
  
  &:empty::after {
    content: '메모를 더블클릭하여 편집하세요';
    color: #94a3b8;
    font-style: italic;
  }
`;

const CommentNode = ({ data, id, selected }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label || '');
  const setNodes = useStore((state) => state.setNodes);
  const nodes = useStore((state) => state.nodes);

  const handleDoubleClick = useCallback((e: any) => {
    e.stopPropagation(); // 이벤트 전파 중단으로 하단 메뉴바 안 뜨게 함
    setIsEditing(true);
    setEditValue(data.label || '');
  }, [data.label]);

  const handleInputChange = useCallback((e: any) => {
    setEditValue(e.target.value);
  }, []);

  const handleInputKeyPress = useCallback((e: any) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      // Ctrl+Enter로 줄바꿈 추가
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = editValue.substring(0, start) + '\n' + editValue.substring(end);
      setEditValue(newValue);
      
      // 커서 위치를 새 줄로 이동
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    } else if (e.key === 'Enter' && !e.ctrlKey) {
      // Enter로 편집 완료
      const updatedNodes = nodes.map(node => 
        node.id === id 
          ? { ...node, data: { ...node.data, label: editValue } }
          : node
      );
      setNodes(updatedNodes);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(data.label || '');
    }
  }, [editValue, nodes, id, setNodes, data.label]);

  const handleInputBlur = useCallback(() => {
    // 노드 업데이트
    const updatedNodes = nodes.map(node => 
      node.id === id 
        ? { ...node, data: { ...node.data, label: editValue } }
        : node
    );
    setNodes(updatedNodes);
    setIsEditing(false);
  }, [editValue, nodes, id, setNodes]);

  const handleWheel = useCallback((e: any) => {
    // 모든 휠 이벤트를 완전히 차단
    e.stopPropagation();
    e.preventDefault();
    e.stopImmediatePropagation();
    
    // 편집 모드일 때만 수동으로 textarea 스크롤 처리
    if (isEditing) {
      const textarea = e.currentTarget.querySelector('textarea') || e.target;
      if (textarea && textarea.scrollHeight > textarea.clientHeight) {
        const scrollAmount = e.deltaY > 0 ? 30 : -30;
        textarea.scrollTop = Math.max(0, Math.min(textarea.scrollHeight - textarea.clientHeight, textarea.scrollTop + scrollAmount));
      }
    }
    
    // 이벤트를 완전히 중단
    return false;
  }, [isEditing]);

  return (
    <NodeContainer 
      selected={selected} 
      onDoubleClick={handleDoubleClick} 
      onWheel={handleWheel}
      onWheelCapture={handleWheel}
    >
      {isEditing ? (
        <EditInput
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyPress}
          onBlur={handleInputBlur}
          onWheel={handleWheel}
          onWheelCapture={handleWheel}
          autoFocus
        />
      ) : (
        <CommentText onWheel={handleWheel} onWheelCapture={handleWheel}>
          {data.label}
        </CommentText>
      )}
    </NodeContainer>
  );
};

export default CommentNode;
