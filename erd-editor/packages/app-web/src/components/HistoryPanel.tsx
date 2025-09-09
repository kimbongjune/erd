import React from 'react';
import styled from 'styled-components';
import { FaTimes, FaUndo, FaRedo, FaListOl } from 'react-icons/fa';
import useStore from '../store/useStore';

const PanelContainer = styled.div<{ $darkMode: boolean }>`
  position: fixed;
  top: 60px;
  right: 20px;
  width: 320px;
  max-height: calc(100vh - 80px);
  background: ${props => props.$darkMode ? '#2d3748' : '#ffffff'};
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PanelHeader = styled.div<{ $darkMode: boolean }>`
  padding: 16px;
  border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  background: ${props => props.$darkMode ? '#4a5568' : '#f7fafc'};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3<{ $darkMode: boolean }>`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
`;

const CloseButton = styled.button<{ $darkMode: boolean }>`
  background: none;
  border: none;
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: ${props => props.$darkMode ? '#718096' : '#e2e8f0'};
  }
`;

const HistoryList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
`;

const HistoryItem = styled.div<{ $darkMode: boolean; $isCurrent: boolean }>`
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$isCurrent ? (props.$darkMode ? 'rgba(96, 165, 250, 0.15)' : 'rgba(0, 122, 204, 0.1)') : 'transparent'};
  
  &:hover {
    background: ${props => props.$darkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(0, 122, 204, 0.05)'};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemDescription = styled.div<{ $darkMode: boolean; $isCurrent: boolean }>`
  font-size: 14px;
  font-weight: ${props => props.$isCurrent ? '600' : '400'};
  color: ${props => props.$isCurrent ? (props.$darkMode ? '#60a5fa' : '#007acc') : (props.$darkMode ? '#e2e8f0' : '#2d3748')};
  margin-bottom: 4px;
`;

const ItemTimestamp = styled.div<{ $darkMode: boolean }>`
  font-size: 12px;
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionButtons = styled.div<{ $darkMode: boolean }>`
  padding: 16px;
  border-top: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  background: ${props => props.$darkMode ? '#4a5568' : '#f7fafc'};
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ $darkMode: boolean; $disabled?: boolean }>`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${props => props.$darkMode ? '#718096' : '#cbd5e0'};
  border-radius: 6px;
  background: ${props => props.$disabled ? 'transparent' : (props.$darkMode ? '#2d3748' : '#ffffff')};
  color: ${props => props.$disabled ? (props.$darkMode ? '#4a5568' : '#a0aec0') : (props.$darkMode ? '#e2e8f0' : '#2d3748')};
  font-size: 13px;
  font-weight: 500;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.5 : 1};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  &:hover {
    background: ${props => props.$disabled ? 'transparent' : (props.$darkMode ? '#4a5568' : '#f7fafc')};
    border-color: ${props => props.$disabled ? (props.$darkMode ? '#718096' : '#cbd5e0') : (props.$darkMode ? '#60a5fa' : '#007acc')};
  }
`;

const EmptyState = styled.div<{ $darkMode: boolean }>`
  padding: 40px 20px;
  text-align: center;
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
  font-size: 14px;
`;

interface HistoryPanelProps {
  visible: boolean;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ visible, onClose }) => {
  const theme = useStore((state) => state.theme);
  const historyManager = useStore((state) => state.historyManager);
  const canUndo = useStore((state) => state.canUndo);
  const canRedo = useStore((state) => state.canRedo);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const getHistoryList = useStore((state) => state.getHistoryList);
  const historyUpdateTrigger = useStore((state) => state.historyUpdateTrigger); // 트리거 추가

  const isDarkMode = theme === 'dark';

  // 트리거가 변경될 때마다 히스토리 목록과 현재 인덱스를 다시 계산
  const historyList = getHistoryList();
  const currentIndex = historyManager.getCurrentIndex();

  const handleHistoryItemClick = (index: number) => {
    const targetIndex = historyManager.getCurrentIndex();
    
    if (index < targetIndex) {
      // 현재보다 이전 상태로 가려면 undo
      const steps = targetIndex - index;
      for (let i = 0; i < steps; i++) {
        undo();
      }
    } else if (index > targetIndex) {
      // 현재보다 이후 상태로 가려면 redo
      const steps = index - targetIndex;
      for (let i = 0; i < steps; i++) {
        redo();
      }
    }
  };

  if (!visible) return null;

  return (
    <PanelContainer $darkMode={isDarkMode}>
      <PanelHeader $darkMode={isDarkMode}>
        <Title $darkMode={isDarkMode}>히스토리</Title>
        <CloseButton $darkMode={isDarkMode} onClick={onClose}>
          <FaTimes size={14} />
        </CloseButton>
      </PanelHeader>

      {historyList.length === 0 ? (
        <EmptyState $darkMode={isDarkMode}>
          아직 히스토리가 없습니다.
        </EmptyState>
      ) : (
        <HistoryList>
          {historyList.map((historyEntry, index) => (
            <HistoryItem
              key={historyEntry.id}
              $darkMode={isDarkMode}
              $isCurrent={index === currentIndex}
              onClick={() => handleHistoryItemClick(index)}
            >
              <ItemDescription $darkMode={isDarkMode} $isCurrent={index === currentIndex}>
                {historyEntry.description}
              </ItemDescription>
              <ItemTimestamp $darkMode={isDarkMode}>
                <FaListOl size={10} />
                #{index + 1}
              </ItemTimestamp>
            </HistoryItem>
          ))}
        </HistoryList>
      )}

      <ActionButtons $darkMode={isDarkMode}>
        <ActionButton 
          $darkMode={isDarkMode} 
          $disabled={!canUndo}
          onClick={undo}
        >
          <FaUndo size={12} />
          실행 취소
        </ActionButton>
        <ActionButton 
          $darkMode={isDarkMode} 
          $disabled={!canRedo}
          onClick={redo}
        >
          <FaRedo size={12} />
          다시 실행
        </ActionButton>
      </ActionButtons>
    </PanelContainer>
  );
};

export default HistoryPanel;
