import React from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { FaTrash } from 'react-icons/fa';

const MenuContainer = styled.div<{ $x: number; $y: number; $visible: boolean }>`
  position: fixed;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 999999;
  min-width: 150px;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: all 0.1s ease;
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};
  display: ${props => props.$visible ? 'block' : 'none'};
`;

const MenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  
  &:hover {
    background: #f3f4f6;
  }
  
  &:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 8px 8px;
  }
  
  &:only-child {
    border-radius: 8px;
  }
  
  .icon {
    color: #ef4444;
  }
`;

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  onDelete: () => void;
  onClose: () => void;
  type: 'node' | 'edge';
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
  visible, 
  x, 
  y, 
  onDelete, 
  onClose,
  type 
}) => {
  const handleDelete = () => {
    onDelete();
    onClose();
  };

  React.useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (visible) {
        // 메뉴 자체를 클릭한 경우가 아니라면 닫기
        const target = e.target as HTMLElement;
        const menuElement = document.querySelector('[data-context-menu]');
        if (menuElement && !menuElement.contains(target)) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }
    };

    const handleContextMenuOutside = (e: Event) => {
      if (visible) {
        e.preventDefault();
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (visible && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    if (visible) {
      // 즉시 이벤트 리스너 등록 (capture phase에서 처리)
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('contextmenu', handleContextMenuOutside, true);
      document.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('mousedown', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('contextmenu', handleContextMenuOutside, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [visible, onClose]);

  return createPortal(
    <MenuContainer $x={x} $y={y} $visible={visible} data-context-menu>
      <MenuItem onClick={handleDelete}>
        <FaTrash className="icon" />
        삭제
      </MenuItem>
    </MenuContainer>,
    document.body
  );
};

export default ContextMenu;
