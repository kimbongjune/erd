import React, { useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  darkMode?: boolean;
}

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
`;

const ModalContainer = styled.div<{ $darkMode?: boolean }>`
  background: ${props => props.$darkMode ? '#2d3748' : '#ffffff'};
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

const ModalHeader = styled.div<{ $darkMode?: boolean; $type?: string }>`
  padding: 20px 24px 16px;
  border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  display: flex;
  align-items: center;
  gap: 12px;
  
  .icon {
    color: ${props => {
      if (props.$type === 'danger') return '#e53e3e';
      if (props.$type === 'warning') return '#d69e2e';
      return '#3182ce';
    }};
    font-size: 20px;
  }
`;

const ModalTitle = styled.h3<{ $darkMode?: boolean }>`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#1a202c'};
`;

const ModalBody = styled.div<{ $darkMode?: boolean }>`
  padding: 20px 24px;
  color: ${props => props.$darkMode ? '#cbd5e0' : '#4a5568'};
  line-height: 1.6;
  font-size: 14px;
`;

const ModalFooter = styled.div<{ $darkMode?: boolean }>`
  padding: 16px 24px 20px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
`;

const Button = styled.button<{ 
  $variant: 'primary' | 'secondary'; 
  $darkMode?: boolean;
  $type?: string;
}>`
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
  justify-content: center;
  
  ${props => {
    if (props.$variant === 'primary') {
      if (props.$type === 'danger') {
        return `
          background: #e53e3e;
          color: white;
          &:hover {
            background: #c53030;
          }
          &:active {
            background: #9b2c2c;
          }
        `;
      }
      return `
        background: #3182ce;
        color: white;
        &:hover {
          background: #2c5aa0;
        }
        &:active {
          background: #2a4365;
        }
      `;
    } else {
      return `
        background: transparent;
        color: ${props.$darkMode ? '#cbd5e0' : '#4a5568'};
        border: 1px solid ${props.$darkMode ? '#4a5568' : '#e2e8f0'};
        &:hover {
          background: ${props.$darkMode ? '#4a5568' : '#f7fafc'};
        }
        &:active {
          background: ${props.$darkMode ? '#2d3748' : '#edf2f7'};
        }
      `;
    }
  }}
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${props => props.$darkMode ? 'rgba(49, 130, 206, 0.3)' : 'rgba(49, 130, 206, 0.2)'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  type = 'warning',
  onConfirm,
  onCancel,
  darkMode = false
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  }, [isOpen, onConfirm, onCancel]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }, [onCancel]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <FaExclamationTriangle className="icon" />;
      case 'warning':
        return <FaExclamationTriangle className="icon" />;
      default:
        return <FaExclamationTriangle className="icon" />;
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContainer $darkMode={darkMode} ref={modalRef}>
        <ModalHeader $darkMode={darkMode} $type={type}>
          {getIcon()}
          <ModalTitle $darkMode={darkMode}>{title}</ModalTitle>
        </ModalHeader>
        
        <ModalBody $darkMode={darkMode}>
          {message}
        </ModalBody>
        
        <ModalFooter $darkMode={darkMode}>
          <Button
            $variant="secondary"
            $darkMode={darkMode}
            onClick={onCancel}
          >
            <FaTimes />
            {cancelText}
          </Button>
          <Button
            ref={confirmButtonRef}
            $variant="primary"
            $darkMode={darkMode}
            $type={type}
            onClick={onConfirm}
          >
            <FaCheck />
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ConfirmModal; 