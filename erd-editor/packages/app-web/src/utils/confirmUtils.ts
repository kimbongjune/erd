import { createRoot } from 'react-dom/client';
import ConfirmModal from '../components/ConfirmModal';
import React from 'react';

interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  darkMode?: boolean;
}

// 전역 모달 컨테이너 생성
let modalContainer: HTMLDivElement | null = null;
let modalRoot: any = null;

const createModalContainer = () => {
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'custom-confirm-modal-container';
    document.body.appendChild(modalContainer);
    modalRoot = createRoot(modalContainer);
  }
  return modalRoot;
};

const cleanupModalContainer = () => {
  if (modalContainer && modalRoot) {
    modalRoot.unmount();
    document.body.removeChild(modalContainer);
    modalContainer = null;
    modalRoot = null;
  }
};

// 커스텀 confirm 함수
export const customConfirm = (message: string, options: ConfirmOptions = {}): Promise<boolean> => {
  return new Promise((resolve) => {
    const {
      title = '확인',
      confirmText = '확인',
      cancelText = '취소',
      type = 'warning',
      darkMode = false
    } = options;

    const modalRoot = createModalContainer();

    const handleConfirm = () => {
      modalRoot.render(null);
      setTimeout(() => {
        cleanupModalContainer();
      }, 300);
      resolve(true);
    };

    const handleCancel = () => {
      modalRoot.render(null);
      setTimeout(() => {
        cleanupModalContainer();
      }, 300);
      resolve(false);
    };

    modalRoot.render(
      React.createElement(ConfirmModal, {
        isOpen: true,
        title: title,
        message: message,
        confirmText: confirmText,
        cancelText: cancelText,
        type: type,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
        darkMode: darkMode
      })
    );
  });
};

// 특정 상황에 맞는 confirm 함수들
export const confirmDelete = (itemName: string, darkMode: boolean = false): Promise<boolean> => {
  return customConfirm(
    `정말로 "${itemName}"을(를) 삭제하시겠습니까?`,
    {
      title: '삭제 확인',
      confirmText: '삭제',
      cancelText: '취소',
      type: 'danger',
      darkMode
    }
  );
};

export const confirmDataLoss = (darkMode: boolean = false): Promise<boolean> => {
  return customConfirm(
    '저장되지 않은 변경사항이 있습니다. 정말로 나가시겠습니까?',
    {
      title: '변경사항 손실',
      confirmText: '나가기',
      cancelText: '취소',
      type: 'warning',
      darkMode
    }
  );
};

export const confirmOverwrite = (darkMode: boolean = false): Promise<boolean> => {
  return customConfirm(
    '기존 데이터가 있습니다. 덮어쓰시겠습니까?',
    {
      title: '덮어쓰기 확인',
      confirmText: '덮어쓰기',
      cancelText: '취소',
      type: 'warning',
      darkMode
    }
  );
}; 