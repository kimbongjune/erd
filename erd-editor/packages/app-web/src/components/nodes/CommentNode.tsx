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
  const nodes = useStore((state) => state.nodes);
  const setNodes = useStore((state) => state.setNodes);

  const handleDoubleClick = useCallback((e: any) => {
    e.stopPropagation();
    e.preventDefault();
    setIsEditing(true);
  }, []);

  const handleInputChange = useCallback((e: any) => {
    setEditValue(e.target.value);
  }, []);

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
    const updatedNodes = nodes.map((node) =>
      node.id === id ? { ...node, data: { ...node.data, label: editValue } } : node
    );
    setNodes(updatedNodes);
    setIsEditing(false);
  }, [editValue, nodes, id, setNodes]);

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
      selected={selected} 
      onDoubleClick={handleDoubleClick}
      onWheel={handleNodeWheel}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: 'transparent', border: 'none' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        style={{ background: 'transparent', border: 'none' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ background: 'transparent', border: 'none' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: 'transparent', border: 'none' }}
      />
      
      {isEditing ? (
        <EditInput
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
