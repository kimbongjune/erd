import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import ClassHeader from './ClassHeader';
import ClassToolbox from './ClassToolbox';
import ClassCanvas from './ClassCanvas';
import useStore, { propagateColumnAddition, propagateColumnDeletion, propagateDataTypeChange, propagateRelationshipTypeChange } from '../store/useStore';
import { toast } from 'react-toastify';
import { MYSQL_DATATYPES, validateEnglishOnly, validateDataType, validatePhysicalName, validateDataTypeForSQL } from '../utils/mysqlTypes';
import { HISTORY_ACTIONS } from '../utils/historyManager';
import { createHandleId } from '../utils/handleUtils';
import Tooltip from './Tooltip';

const Container = styled.div<{ $darkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: ${props => props.$darkMode ? '#1E1E1E' : '#FFFFFF'};
`;

const TopContainer = styled.div<{ $darkMode?: boolean }>`
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: 80px 1fr;
  grid-template-rows: 50px 1fr;
  grid-template-areas:
    'header header'
    'toolbox canvas';
  background-color: ${props => props.$darkMode ? '#1E1E1E' : '#FFFFFF'};
`;

const ToolboxContainer = styled.aside<{ $darkMode?: boolean }>`
  grid-area: toolbox;
  background-color: ${props => props.$darkMode ? '#2d3748' : '#f8f9fa'};
  border-right: 1px solid ${props => props.$darkMode ? '#404040' : '#ddd'};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
`;

const CanvasContainer = styled.main<{ $darkMode?: boolean }>`
  grid-area: canvas;
  background-color: ${props => props.$darkMode ? '#1E1E1E' : '#ffffff'};
  position: relative;
`;

const LoadingOverlay = styled.div<{ $darkMode?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.$darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
`;

const LoadingContainer = styled.div<{ $darkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px;
  border-radius: 12px;
  background-color: ${props => props.$darkMode ? 'rgba(42, 42, 42, 0.95)' : 'rgba(255, 255, 255, 0.9)'};
  box-shadow: ${props => props.$darkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)'};
  border: ${props => props.$darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)'};
`;

const Spinner = styled.div<{ $darkMode?: boolean }>`
  width: 48px;
  height: 48px;
  border: 4px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  border-top: 4px solid ${props => props.$darkMode ? '#63b3ed' : '#3182ce'};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div<{ $darkMode?: boolean }>`
  color: ${props => props.$darkMode ? '#e2e8f0' : '#2d3748'};
  font-size: 16px;
  font-weight: 500;
  text-align: center;
`;

const ProgressBar = styled.div<{ $darkMode?: boolean }>`
  position: relative;
  width: 240px;
  height: 6px;
  background-color: ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number; $darkMode?: boolean }>`
  height: 100%;
  background: ${props => props.$darkMode 
    ? 'linear-gradient(90deg, #63b3ed 0%, #90cdf4 100%)' 
    : 'linear-gradient(90deg, #3182ce 0%, #4299e1 100%)'};
  border-radius: 3px;
  width: ${props => props.$progress}%;
  transition: width 0.3s ease-in-out;
`;

const ProgressPercentage = styled.div<{ $darkMode?: boolean }>`
  position: absolute;
  top: -20px;
  right: 0;
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#2d3748'};
`;

const BottomPanelContainer = styled.div<{ $height: number; $darkMode?: boolean }>`
  background-color: ${props => props.$darkMode ? '#1E1E1E' : '#f5f5f5'};
  height: ${props => props.$height}px;
  border-top: 1px solid ${props => props.$darkMode ? '#404040' : '#d0d0d0'};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  z-index: 1000;
`;

const ResizeHandle = styled.div<{ $darkMode?: boolean }>`
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
  height: 8px;
  background-color: ${props => props.$darkMode ? '#404040' : '#d0d0d0'};
  cursor: ns-resize;
  z-index: 1001;
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#b0b0b0'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #007acc;
    border-color: #005a9e;
  }
  
  &:before {
    content: '⋯';
    color: ${props => props.$darkMode ? '#e2e8f0' : '#666'};
    font-size: 14px;
    font-weight: bold;
  }
  
  &:hover:before {
    color: white;
  }
`;

const BottomPanelHeader = styled.div<{ $darkMode?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: ${props => props.$darkMode ? '#2d3748' : '#f5f5f5'};
  font-size: 12px;
  font-weight: normal;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#333'};
  min-height: 32px;
  flex-shrink: 0;
`;

const TableTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
`;

const TableIcon = styled.div`
  width: 16px;
  height: 16px;
  background-color: #4a90e2;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:after {
    content: "T";
    color: white;
    font-size: 10px;
    font-weight: bold;
  }
`;

const CloseButton = styled.button<{ $darkMode?: boolean }>`
  background: none;
  border: none;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${props => props.$darkMode ? '#cbd5e0' : '#666'};
  font-size: 14px;
  
  &:hover {
    background-color: ${props => props.$darkMode ? '#4a5568' : '#e0e0e0'};
    color: ${props => props.$darkMode ? '#e2e8f0' : '#333'};
  }
`;

// 탭 관련 스타일 컴포넌트들
const TabBar = styled.div<{ $darkMode?: boolean }>`
  display: flex;
  border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e0e0e0'};
  background-color: ${props => props.$darkMode ? '#2d3748' : '#f8f9fa'};
`;

const Tab = styled.button<{ $darkMode?: boolean; $active?: boolean }>`
  background: ${props => props.$active 
    ? (props.$darkMode ? '#4a5568' : '#f0f0f0') 
    : 'transparent'
  };
  border: none;
  color: ${props => props.$active 
    ? (props.$darkMode ? '#60a5fa' : '#2563eb') 
    : (props.$darkMode ? '#9ca3af' : '#6b7280')
  };
  padding: 8px 16px;
  font-size: 12px;
  font-weight: ${props => props.$active ? '500' : '400'};
  cursor: pointer;
  outline: none;
  border-radius: 4px 4px 0 0;
  margin-bottom: ${props => props.$active ? '-1px' : '0'};
  position: relative;
  z-index: ${props => props.$active ? '2' : '1'};
  
  /* 호버, 포커스, 액티브 등 모든 상태 효과 제거 */
  &:hover,
  &:focus,
  &:active {
    background: ${props => props.$active 
      ? (props.$darkMode ? '#4a5568' : '#f0f0f0') 
      : 'transparent'
    };
    color: ${props => props.$active 
      ? (props.$darkMode ? '#60a5fa' : '#2563eb') 
      : (props.$darkMode ? '#9ca3af' : '#6b7280')
    };
    outline: none;
  }
`;

const TabContent = styled.div<{ $darkMode?: boolean }>`
  flex: 1;
  overflow: hidden;
  background-color: ${props => props.$darkMode ? '#1E1E1E' : '#ffffff'};
`;

const EmptyTabContent = styled.div<{ $darkMode?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$darkMode ? '#9ca3af' : '#6b7280'};
  font-size: 14px;
  background-color: ${props => props.$darkMode ? '#374151' : '#ffffff'};
`;

const TableContainer = styled.div<{ $darkMode?: boolean }>`
  flex: 1;
  overflow: hidden;
  background-color: ${props => props.$darkMode ? '#1E1E1E' : '#f5f5f5'};
  position: relative;
  display: flex;
  flex-direction: column;
`;

const TableScrollContainer = styled.div<{ $darkMode?: boolean }>`
  width: 100%;
  height: 100%;
  overflow-x: auto;
  overflow-y: auto;
  margin-top: 0;
  transform: translateZ(0); // Hardware acceleration to prevent layout shifts
  
  /* 커스텀 스크롤바 스타일 */
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.$darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    border-radius: 3px;
    transition: background 0.2s ease;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.$darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'};
  }
  
  &::-webkit-scrollbar-corner {
    background: transparent;
  }
  
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: ${props => props.$darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'} transparent;
`;

const Table = styled.table<{ $darkMode?: boolean }>`
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  color: ${props => props.$darkMode ? '#e2e8f0' : 'inherit'};
`;

const TableHeader = styled.thead<{ $darkMode?: boolean }>`
  background-color: ${props => props.$darkMode ? '#2d3748' : '#f8f8f8'};
  position: sticky;
  top: -1px;
  z-index: 10;
`;

const HeaderRow = styled.tr<{ $darkMode?: boolean }>`
`;

const HeaderCell = styled.th<{ $darkMode?: boolean }>`
  padding: 6px 8px;
  text-align: left;
  font-weight: normal;
  color: ${props => props.$darkMode ? '#cbd5e0' : '#666'};
  border-right: 1px solid ${props => props.$darkMode ? '#404040' : '#e0e0e0'};
  font-size: 11px;
  white-space: nowrap;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr<{ $selected?: boolean; $darkMode?: boolean }>`
  border-bottom: 1px solid ${props => props.$darkMode ? '#404040' : '#f0f0f0'};
  background-color: ${props => props.$selected ? (props.$darkMode ? '#1a365d' : '#e6f3ff') : 'transparent'};
  cursor: pointer;
  position: relative;
  z-index: 1;
  
  &:hover {
    background-color: ${props => props.$selected ? (props.$darkMode ? '#1a365d' : '#e6f3ff') : (props.$darkMode ? '#2d3748' : '#f8f8ff')};
  }
`;

const TableCell = styled.td<{ $darkMode?: boolean }>`
  padding: 4px 8px;
  border-right: 1px solid ${props => props.$darkMode ? '#404040' : '#e0e0e0'};
  font-size: 11px;
  position: relative;
  cursor: pointer;
  color: ${props => props.$darkMode ? '#e2e8f0' : 'inherit'};
  width: 120px; /* 고정 폭 설정 */
  max-width: 120px;
  overflow: hidden;
`;

const EditableCell = styled.input<{ $darkMode?: boolean }>`
  width: 100%;
  border: 1px solid transparent;
  background: transparent;
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 2px;
  pointer-events: none;
  cursor: default;
  color: ${props => props.$darkMode ? '#e2e8f0' : 'inherit'};
  
  &::placeholder {
    color: ${props => props.$darkMode ? '#9ca3af' : '#999'};
  }
  
  &.editing {
    pointer-events: auto;
    cursor: text;
    border-color: ${props => props.$darkMode ? '#4a5568' : '#ccc'};
    background-color: ${props => props.$darkMode ? '#2d3748' : '#fafafa'};
    
    &:focus {
      background-color: ${props => props.$darkMode ? '#374151' : 'white'};
      border: 1px solid #007acc;
      outline: none;
      box-shadow: 0 0 2px rgba(0,122,204,0.3);
    }
    
    &::placeholder {
      color: ${props => props.$darkMode ? '#6b7280' : '#aaa'};
    }
  }
`;

// 데이터타입 입력을 위한 combobox 컴포넌트
const DataTypeInputContainer = styled.div<{ $isOpen?: boolean }>`
  position: relative;
  width: 100%;
  overflow: visible; /* 드롭다운이 보이도록 */
  z-index: ${props => props.$isOpen ? 99999998 : 10};
`;

const DataTypeInput = styled.input<{ $darkMode?: boolean; $showDropdown?: boolean }>`
  width: 100%;
  max-width: 100%;
  border: 1px solid transparent;
  background: transparent;
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 2px;
  pointer-events: none;
  cursor: default;
  color: ${props => props.$darkMode ? '#e2e8f0' : 'inherit'};
  box-sizing: border-box;
  
  &::placeholder {
    color: ${props => props.$darkMode ? '#9ca3af' : '#999'};
  }
  
  &.editing {
    pointer-events: auto;
    cursor: text;
    border-color: ${props => props.$darkMode ? '#4a5568' : '#ccc'};
    background-color: ${props => props.$darkMode ? '#2d3748' : '#fafafa'};
    padding-right: 20px; /* 드롭다운 아이콘 공간 */
    
    &:focus {
      background-color: ${props => props.$darkMode ? '#374151' : 'white'};
      border: 1px solid #007acc;
      outline: none;
      box-shadow: 0 0 2px rgba(0,122,204,0.3);
    }
    
    &::placeholder {
      color: ${props => props.$darkMode ? '#6b7280' : '#aaa'};
    }
  }
`;

const DropdownButton = styled.button<{ $darkMode?: boolean; $visible?: boolean }>`
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: none;
  background: none;
  cursor: pointer;
  display: ${props => props.$visible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  color: ${props => props.$darkMode ? '#9ca3af' : '#666'};
  font-size: 10px;
  border-radius: 2px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 122, 204, 0.1)'};
    color: ${props => props.$darkMode ? '#60a5fa' : '#007acc'};
    transform: translateY(-50%) scale(1.1);
  }
`;

const DropdownList = styled.div<{ $darkMode?: boolean; $show?: boolean }>`
  position: fixed;
  width: 120px;
  max-height: 150px;
  overflow-y: auto;
  overflow-x: hidden;
  background: ${props => props.$darkMode ? '#374151' : 'white'};
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#ccc'};
  border-radius: 4px;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.4);
  z-index: 99999999;
  display: block;
  
  /* 커스텀 스크롤바 스타일 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.$darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    border-radius: 3px;
    transition: background 0.2s ease;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.$darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'};
  }
  
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: ${props => props.$darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'} transparent;
  opacity: 1;
  visibility: visible;
  
  /* 커스텀 스크롤바 */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.$darkMode ? '#2d3748' : '#f1f1f1'};
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.$darkMode ? '#4a5568' : '#c1c1c1'};
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.$darkMode ? '#5a6578' : '#a1a1a1'};
  }
`;

// 자동완성 드롭다운 스타일
const AutocompleteDropdown = styled.div<{ $darkMode?: boolean; $show?: boolean }>`
  position: fixed;
  width: 120px;
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
  background: ${props => props.$darkMode ? '#374151' : 'white'};
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#ccc'};
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 2147483647;
  display: ${props => props.$show ? 'block' : 'none'};
  
  /* 커스텀 스크롤바 */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.$darkMode ? '#2d3748' : '#f1f1f1'};
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.$darkMode ? '#4a5568' : '#c1c1c1'};
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.$darkMode ? '#5a6578' : '#a1a1a1'};
  }
`;

const AutocompleteItem = styled.div<{ $darkMode?: boolean; $selected?: boolean }>`
  padding: 8px 12px;
  font-size: 11px;
  cursor: pointer;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#333'};
  border-bottom: 1px solid ${props => props.$darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  transition: all 0.2s ease;
  background: ${props => props.$selected ? (props.$darkMode ? '#4a5568' : '#e6f3ff') : 'transparent'};
  
  &:hover {
    background: ${props => props.$darkMode ? '#4a5568' : '#e6f3ff'};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

// Portal로 렌더링되는 드롭다운 컴포넌트
const PortalDropdown: React.FC<{
  isOpen: boolean;
  position: { top: number; left: number } | null;
  onClose: () => void;
  onSelect: (type: string) => void;
  darkMode: boolean;
  dropdownType?: string;
  setTooltip: React.Dispatch<React.SetStateAction<{ visible: boolean; x: number; y: number; content: string; position: 'top' | 'left' | undefined }>>;
}> = ({ isOpen, position, onClose, onSelect, darkMode, dropdownType, setTooltip }) => {
  if (!isOpen || !position) return null;

  const onDeleteOptions = [
    { value: 'CASCADE', label: 'CASCADE', tooltip: '부모 레코드 삭제 시 자식 레코드도 함께 삭제' },
    { value: 'SET NULL', label: 'SET NULL', tooltip: '부모 레코드 삭제 시 자식 레코드의 FK를 NULL로 설정' },
    { value: 'NO ACTION', label: 'NO ACTION', tooltip: '부모 레코드 삭제 시 아무 동작 안함' },
    { value: 'RESTRICT', label: 'RESTRICT', tooltip: '부모 레코드가 참조되면 삭제 차단' }
  ];

  const onUpdateOptions = [
    { value: 'CASCADE', label: 'CASCADE', tooltip: '부모 레코드 수정 시 자식 레코드도 함께 수정' },
    { value: 'SET NULL', label: 'SET NULL', tooltip: '부모 레코드 수정 시 자식 레코드의 FK를 NULL로 설정' },
    { value: 'NO ACTION', label: 'NO ACTION', tooltip: '부모 레코드 수정 시 아무 동작 안함' },
    { value: 'RESTRICT', label: 'RESTRICT', tooltip: '부모 레코드가 참조되면 수정 차단' }
  ];

  const options = dropdownType === 'onDelete' ? onDeleteOptions : onUpdateOptions;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: dropdownType ? '140px' : '120px',
        maxHeight: '150px',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: darkMode ? '#374151' : 'white',
        border: `1px solid ${darkMode ? '#4a5568' : '#ccc'}`,
        borderRadius: '4px',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.15)',
        zIndex: 2147483647, // 최대 z-index 값
      }}
      data-dropdown={dropdownType ? "fk-options" : "true"}
    >
      {dropdownType && options ? (
        options.map((option) => (
          <div
            key={option.value}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              color: darkMode ? '#e2e8f0' : '#333',
              borderBottom: `1px solid ${darkMode ? '#4a5568' : '#eee'}`,
              transition: 'background-color 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({
                visible: true,
                x: rect.left - 10,
                y: rect.top,
                content: option.tooltip,
                position: 'left'
              });
            }}
            onMouseLeave={() => setTooltip({ visible: false, x: -9999, y: -9999, content: '', position: 'left' })}
            onClick={() => {
              onSelect(option.value);
              setTooltip({ visible: false, x: -9999, y: -9999, content: '', position: 'left' });
              onClose();
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = darkMode ? '#4a5568' : '#f5f5f5';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {option.label}
          </div>
        ))
      ) : (
        MYSQL_DATATYPES.map(type => (
          <div
            key={type}
            style={{
              padding: '8px 16px',
              fontSize: '11px',
              cursor: 'pointer',
              color: darkMode ? '#e2e8f0' : '#333',
              borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              transition: 'all 0.2s ease',
            }}
            onMouseDown={(e) => {
              e.preventDefault(); // blur 방지
            }}
            onClick={() => {
              onSelect(type);
              onClose();
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLElement;
              target.style.background = `linear-gradient(135deg, ${darkMode ? '#4a90e2' : '#007acc'} 0%, ${darkMode ? '#357abd' : '#0056a3'} 100%)`;
              target.style.color = '#ffffff';
              target.style.transform = 'translateX(2px)';
              target.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLElement;
              target.style.background = 'transparent';
              target.style.color = darkMode ? '#e2e8f0' : '#333';
              target.style.transform = 'translateX(0)';
              target.style.boxShadow = 'none';
            }}
          >
            {type}
          </div>
        ))
      )}
      {/* 커스텀 스크롤바 스타일 */}
      <style>{`
        [data-dropdown]::-webkit-scrollbar {
          width: 4px;
        }
        [data-dropdown]::-webkit-scrollbar-track {
          background: ${darkMode ? '#2d3748' : '#f1f1f1'};
          border-radius: 2px;
        }
        [data-dropdown]::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#4a5568' : '#c1c1c1'};
          border-radius: 2px;
        }
        [data-dropdown]::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#5a6578' : '#a1a1a1'};
        }
      `}</style>
    </div>,
    document.body
  );
};

const DropdownItem = styled.div<{ $darkMode?: boolean }>`
  padding: 8px 16px;
  font-size: 11px;
  cursor: pointer;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#333'};
  border-bottom: 1px solid ${props => props.$darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  transition: all 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: linear-gradient(135deg, 
      ${props => props.$darkMode ? '#4a90e2' : '#007acc'} 0%, 
      ${props => props.$darkMode ? '#357abd' : '#0056a3'} 100%);
    color: #ffffff;
    transform: translateX(2px);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
  }
`;



const CheckboxCell = styled(TableCell)`
  text-align: center;
  width: 30px;
`;

const Checkbox = styled.input`
  width: 12px;
  height: 12px;
`;

const AddColumnRow = styled.tr<{ $darkMode?: boolean }>`
  background-color: ${props => props.$darkMode ? '#2d3748' : '#f8f8f8'};
`;

const AddColumnCell = styled.td<{ $darkMode?: boolean }>`
  padding: 8px;
  text-align: center;
  border-right: 1px solid ${props => props.$darkMode ? '#404040' : '#e0e0e0'};
  cursor: pointer;
  color: ${props => props.$darkMode ? '#60a5fa' : '#007acc'};
  font-size: 11px;
  font-weight: 600;
  
  &:hover {
    background-color: ${props => props.$darkMode ? '#1a365d' : '#e6f3ff'};
    color: ${props => props.$darkMode ? '#93c5fd' : '#005a9e'};
  }
`;

const DeleteButton = styled.button<{ $darkMode?: boolean }>`
  background: none;
  border: none;
  color: ${props => props.$darkMode ? '#f87171' : '#dc3545'};
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 2px;
  
  &:hover {
    background-color: ${props => props.$darkMode ? '#7f1d1d' : '#f5c6cb'};
    color: ${props => props.$darkMode ? '#fca5a5' : '#721c24'};
  }
`;



const TableNameInput = styled.input<{ $darkMode?: boolean }>`
  background: transparent;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#333'};
  padding: 4px 8px;
  border-radius: 3px;
  width: 120px;
  max-width: 120px;
  
  &:hover {
    border-color: ${props => props.$darkMode ? '#4a5568' : '#ccc'};
    background-color: ${props => props.$darkMode ? '#2d3748' : '#fafafa'};
  }
  
  &:focus {
    border-color: #007acc;
    outline: none;
    box-shadow: 0 0 2px rgba(0,122,204,0.3);
    background-color: ${props => props.$darkMode ? '#374151' : 'white'};
  }
`;

const LogicalNameInput = styled.input<{ $darkMode?: boolean }>`
  background: transparent;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 400;
  color: ${props => props.$darkMode ? '#cbd5e0' : '#666'};
  padding: 4px 8px;
  border-radius: 3px;
  width: 100px;
  max-width: 100px;
  
  &:hover {
    border-color: ${props => props.$darkMode ? '#4a5568' : '#ccc'};
    background-color: ${props => props.$darkMode ? '#2d3748' : '#fafafa'};
  }
  
  &:focus {
    border-color: #007acc;
    outline: none;
    box-shadow: 0 0 2px rgba(0,122,204,0.3);
    background-color: ${props => props.$darkMode ? '#374151' : 'white'};
  }
`;

const TableNameDisplay = styled.div<{ $darkMode?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#666'};
  padding: 4px 8px;
  border-radius: 3px;
  min-width: 120px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.$darkMode ? '#2d3748' : '#f0f0f0'};
  }
`;

const LogicalNameDisplay = styled.div<{ $darkMode?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#666'};
  padding: 4px 8px;
  border-radius: 3px;
  min-width: 100px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.$darkMode ? '#2d3748' : '#f0f0f0'};
  }
`;

const TableCommentTextarea = styled.textarea<{ $darkMode?: boolean }>`
  width: 100%;
  height: 60px;
  padding: 8px;
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#ccc'};
  border-radius: 4px;
  fontSize: 12px;
  resize: none;
  font-family: inherit;
  background-color: ${props => props.$darkMode ? '#374151' : 'white'};
  color: ${props => props.$darkMode ? '#e2e8f0' : 'inherit'};
  
  &::placeholder {
    color: ${props => props.$darkMode ? '#9ca3af' : '#999'};
  }
  
  &:focus {
    border-color: #007acc;
    outline: none;
    box-shadow: 0 0 2px rgba(0,122,204,0.3);
  }
`;

interface ClassLayoutProps {
  erdId?: string;
}

const ClassLayout: React.FC<ClassLayoutProps> = ({ erdId }) => {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [dropdownType, setDropdownType] = useState<string | null>(null);
  const [dropdownColumnId, setDropdownColumnId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
    position: 'top' | 'left' | undefined;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
    position: 'top'
  });
  const [hoveredHeaderId, setHoveredHeaderId] = useState<string | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tableNameInputRef = useRef<HTMLInputElement | null>(null);
  const [initialRender, setInitialRender] = useState(true);

  const { 
    isBottomPanelOpen, 
    setBottomPanelOpen, 
    selectedNodeId,
    setSelectedNodeId, 
    nodes,
    setNodes,
    updateNodeData,
    updateEdgeHandles,
    theme,
    isLoading,
    loadingMessage,
    loadingProgress,
    bottomPanelRefreshKey
  } = useStore();
  const [bottomPanelHeight, setBottomPanelHeight] = useState(250);
  const [isDragging, setIsDragging] = useState(false);
  const [tableName, setTableName] = useState('');
  const [tableLogicalName, setTableLogicalName] = useState('');
  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const [isEditingLogicalName, setIsEditingLogicalName] = useState(false);
  
  // Test.tsx와 완전히 똑같은 controlled 상태들
  const [tableControlledValue, setTableControlledValue] = useState('');
  const [tableDisplayValue, setTableDisplayValue] = useState('');
  const [columnControlledValues, setColumnControlledValues] = useState<{[key: string]: string}>({});
  const [columnDisplayValues, setColumnDisplayValues] = useState<{[key: string]: string}>({});
  
  const [columns, setColumns] = useState<any[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<any>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  
  // 하단 패널에서 현재 표시 중인 노드 ID (undo/redo 시에도 유지)
  const [currentPanelNodeId, setCurrentPanelNodeId] = useState<string | null>(null);
  
  // 하단 패널 탭 상태
  const [activeTab, setActiveTab] = useState<'columns' | 'indexes' | 'foreignKeys'>('columns');
  
  // 자동완성 관련 상태
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  
  // Test.tsx의 validation 로직 (기존 코드는 그대로 유지하고 추가만)
  
  // Test.tsx 허용된 문자만 필터링하는 함수 - 토씨 하나 틀리지 않고 동일
  const filterValue = useCallback((value: string): string => {
    if (!value) return '';
    
    // 허용된 문자: 영어, 숫자, 언더바
    // 단, 숫자로 시작할 수 없음
    let filtered = value.replace(/[^a-zA-Z0-9_]/g, '');
    
    // 숫자로 시작하는 경우 제거
    if (filtered && /^[0-9]/.test(filtered)) {
      filtered = filtered.replace(/^[0-9]+/, '');
    }
    
    return filtered;
  }, []);

  // Test.tsx 허용된 문자인지 확인하는 함수 - 토씨 하나 틀리지 않고 동일
  const isValidChar = useCallback((char: string): boolean => {
    return /[a-zA-Z0-9_]/.test(char);
  }, []);
  
  // 허용된 문자만 필터링하는 함수 (테이블명용)
  const filterTableValue = useCallback((value: string): string => {
    if (!value) return '';
    
    // 허용된 문자: 영어, 숫자, 언더바
    // 단, 숫자로 시작할 수 없음
    let filtered = value.replace(/[^a-zA-Z0-9_]/g, '');
    
    // 숫자로 시작하는 경우 제거
    if (filtered && /^[0-9]/.test(filtered)) {
      filtered = filtered.replace(/^[0-9]+/, '');
    }
    
    return filtered;
  }, []);

  // 허용된 문자인지 확인하는 함수 (테이블명용)
  const isValidTableChar = useCallback((char: string): boolean => {
    return /[a-zA-Z0-9_]/.test(char);
  }, []);

  // 컬럼명용 필터링 함수
  const filterColumnValue = useCallback((value: string): string => {
    if (!value) return '';
    
    let filtered = value.replace(/[^a-zA-Z0-9_]/g, '');
    
    if (filtered && /^[0-9]/.test(filtered)) {
      filtered = filtered.replace(/^[0-9]+/, '');
    }
    
    return filtered;
  }, []);

  // 데이터타입용 필터링 함수
  const filterDataTypeValue = useCallback((value: string): string => {
    if (!value) return '';
    
    let filtered = value.replace(/[^a-zA-Z0-9_()]/g, '').toUpperCase();
    
    if (filtered && /^[0-9()]/.test(filtered)) {
      filtered = filtered.replace(/^[0-9()]+/, '');
    }
    
    return filtered;
  }, []);

  // 키 입력 차단 (한국어 키 차단) - Test.tsx와 동일
  const createKeyDownHandler = useCallback((isDataType: boolean = false) => {
    return (e: React.KeyboardEvent<HTMLInputElement>) => {
      // 특수 키들은 허용 (백스페이스, 삭제, 화살표 등)
      const allowedKeys = [
        'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End', 'Tab', 'Enter', 'Escape', 'Ctrl', 'Alt', 'Shift'
      ];
      
      // Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X 허용
      if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return;
      }
      
      // Enter 키 처리
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        
        // 편집 종료 및 포커스 해제
        setEditingCell(null);
        setIsEditingTableName(false);
        setIsEditingLogicalName(false);
        
        // 입력창에서 포커스 제거
        (e.target as HTMLInputElement).blur();
        return;
      }
      
      // 특수 키는 허용
      if (allowedKeys.includes(e.key)) {
        return;
      }
      
      // 입력되는 문자가 유효하지 않으면 차단 (한국어 등)
      if (e.key.length === 1) {
        const validCharRegex = isDataType ? /[a-zA-Z0-9_()]/ : /[a-zA-Z0-9_]/;
        if (!validCharRegex.test(e.key)) {
          e.preventDefault();
          return;
        }
        
        // 숫자로 시작하는 것을 방지 (첫 글자가 숫자인 경우)
        if (/[0-9()]/.test(e.key)) {
          const cursorPos = e.currentTarget.selectionStart || 0;
          const currentValue = e.currentTarget.value;
          
          // 커서가 맨 앞에 있고, 현재 값이 비어있거나 숫자를 입력하려는 경우
          if (cursorPos === 0 && (currentValue === '' || /^[0-9()]/.test(currentValue))) {
            e.preventDefault();
            return;
          }
        }
      }
    };
  }, []);

  // Test.tsx의 모든 핸들러를 토씨 하나 틀리지 않고 동일하게 복사

  // Test.tsx 키 입력 완전 차단 (한국어, 허용되지 않은 문자 모두 차단) - 토씨 하나 틀리지 않고 동일
  const testHandleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Ctrl+Y 허용 (macOS Cmd 키도 포함)
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z', 'y'].includes(e.key.toLowerCase())) {
      return;
    }
    
    const target = e.target as HTMLInputElement;
    
    // Test.tsx와 완전히 똑같이 - controlled 값 가져오기
    let controlledValue: string;
    if (target.getAttribute('data-editing')?.includes('-name')) {
      const columnId = target.getAttribute('data-editing')?.replace('-name', '') || '';
      controlledValue = columnControlledValues[`${columnId}-name`] || '';
    } else if (target.getAttribute('data-editing')?.includes('-dataType')) {
      const columnId = target.getAttribute('data-editing')?.replace('-dataType', '') || '';
      controlledValue = columnControlledValues[`${columnId}-dataType`] || '';
    } else if (isEditingTableName) {
      controlledValue = tableControlledValue;
    } else {
      controlledValue = target.value;
    }
    
    // Backspace 처리 - Test.tsx와 완전히 똑같이
    if (e.key === 'Backspace') {
      e.preventDefault();
      const cursorStart = target.selectionStart || 0;
      const cursorEnd = target.selectionEnd || 0;
      const currentValue = controlledValue;
      
      let newValue: string;
      let newCursorPos: number;
      
      if (cursorStart !== cursorEnd) {
        // 선택된 텍스트 삭제
        newValue = currentValue.slice(0, cursorStart) + currentValue.slice(cursorEnd);
        newCursorPos = cursorStart;
      } else if (cursorStart > 0) {
        // 커서 앞 한 글자 삭제
        newValue = currentValue.slice(0, cursorStart - 1) + currentValue.slice(cursorStart);
        newCursorPos = cursorStart - 1;
      } else {
        return; // 삭제할 게 없음
      }
      
      // Test.tsx와 똑같이 상태 업데이트
      if (target.getAttribute('data-editing')?.includes('-name')) {
        const columnId = target.getAttribute('data-editing')?.replace('-name', '') || '';
        setColumnControlledValues(prev => ({ ...prev, [`${columnId}-name`]: newValue }));
        setColumnDisplayValues(prev => ({ ...prev, [`${columnId}-name`]: newValue }));
        updateColumnField(columnId, 'name', newValue);
      } else if (target.getAttribute('data-editing')?.includes('-dataType')) {
        const columnId = target.getAttribute('data-editing')?.replace('-dataType', '') || '';
        setColumnControlledValues(prev => ({ ...prev, [`${columnId}-dataType`]: newValue }));
        setColumnDisplayValues(prev => ({ ...prev, [`${columnId}-dataType`]: newValue }));
        
        // 데이터 타입 변경 시 debouncing 적용 - 즉시 UI 업데이트, 지연된 히스토리 저장
        updateColumnField(columnId, 'dataType', newValue, true); // skipHistory = true
        
        // debounced 히스토리 저장
        if (historyTimeouts[`dataType-${columnId}`]) {
          clearTimeout(historyTimeouts[`dataType-${columnId}`]);
        }
        
        const timeoutId = setTimeout(() => {
          updateColumnField(columnId, 'dataType', newValue, false); // skipHistory = false
          setHistoryTimeouts(prev => {
            const updated = { ...prev };
            delete updated[`dataType-${columnId}`];
            return updated;
          });
        }, 500);
        
        setHistoryTimeouts(prev => ({
          ...prev,
          [`dataType-${columnId}`]: timeoutId
        }));
        
        // 자동완성 트리거 (원래 기능 복구 - Backspace)
        const column = columns.find(col => col.id === columnId);
        if (!column?.fk) {
          setAutocompleteColumnId(columnId);
          filterDataTypes(newValue);
          
          if (newValue.length > 0) {
            const rect = target.getBoundingClientRect();
            setDropdownPosition({
              top: rect.bottom + 2,
              left: rect.left
            });
          }
        }
      } else if (isEditingTableName) {
        setTableControlledValue(newValue);
        setTableDisplayValue(newValue);
        setTableName(newValue);
      }
      
      // 커서 위치 조정
      setTimeout(() => {
        if (target) {
          target.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
      return;
    }
    
    // Delete 처리 - Test.tsx와 완전히 똑같이
    if (e.key === 'Delete') {
      e.preventDefault();
      const cursorStart = target.selectionStart || 0;
      const cursorEnd = target.selectionEnd || 0;
      const currentValue = controlledValue;
      
      let newValue: string;
      let newCursorPos: number;
      
      if (cursorStart !== cursorEnd) {
        // 선택된 텍스트 삭제
        newValue = currentValue.slice(0, cursorStart) + currentValue.slice(cursorEnd);
        newCursorPos = cursorStart;
      } else if (cursorStart < currentValue.length) {
        // 커서 뒤 한 글자 삭제
        newValue = currentValue.slice(0, cursorStart) + currentValue.slice(cursorStart + 1);
        newCursorPos = cursorStart;
      } else {
        return; // 삭제할 게 없음
      }
      
      // Test.tsx와 똑같이 상태 업데이트
      if (target.getAttribute('data-editing')?.includes('-name')) {
        const columnId = target.getAttribute('data-editing')?.replace('-name', '') || '';
        setColumnControlledValues(prev => ({ ...prev, [`${columnId}-name`]: newValue }));
        setColumnDisplayValues(prev => ({ ...prev, [`${columnId}-name`]: newValue }));
        updateColumnField(columnId, 'name', newValue);
      } else if (target.getAttribute('data-editing')?.includes('-dataType')) {
        const columnId = target.getAttribute('data-editing')?.replace('-dataType', '') || '';
        setColumnControlledValues(prev => ({ ...prev, [`${columnId}-dataType`]: newValue }));
        setColumnDisplayValues(prev => ({ ...prev, [`${columnId}-dataType`]: newValue }));
        
        // 데이터 타입 변경 시 debouncing 적용 - 즉시 UI 업데이트, 지연된 히스토리 저장  
        updateColumnField(columnId, 'dataType', newValue, true); // skipHistory = true
        
        // debounced 히스토리 저장
        if (historyTimeouts[`dataType-${columnId}`]) {
          clearTimeout(historyTimeouts[`dataType-${columnId}`]);
        }
        
        const timeoutId = setTimeout(() => {
          updateColumnField(columnId, 'dataType', newValue, false); // skipHistory = false
          setHistoryTimeouts(prev => {
            const updated = { ...prev };
            delete updated[`dataType-${columnId}`];
            return updated;
          });
        }, 500);
        
        setHistoryTimeouts(prev => ({
          ...prev,
          [`dataType-${columnId}`]: timeoutId
        }));
        
        // 자동완성 트리거 (원래 기능 복구 - Delete)
        const column = columns.find(col => col.id === columnId);
        if (!column?.fk) {
          setAutocompleteColumnId(columnId);
          filterDataTypes(newValue);
          
          if (newValue.length > 0) {
            const rect = target.getBoundingClientRect();
            setDropdownPosition({
              top: rect.bottom + 2,
              left: rect.left
            });
          }
        }
      } else if (isEditingTableName) {
        setTableControlledValue(newValue);
        setTableDisplayValue(newValue);
        setTableName(newValue);
      }
      
      // 커서 위치 유지
      setTimeout(() => {
        if (target) {
          target.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
      return;
    }
    
    // 이동 키들은 허용
    const navigationKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab', 'Escape'];
    if (navigationKeys.includes(e.key)) {
      return;
    }
    
    // Enter 키 별도 처리 - 편집 종료 및 포커스 해제
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      
      // 편집 상태 종료
      if (target.getAttribute('data-editing')?.includes('-name')) {
        const columnId = target.getAttribute('data-editing')?.replace('-name', '') || '';
        setColumnControlledValues(prev => {
          const newState = { ...prev };
          delete newState[`${columnId}-name`];
          return newState;
        });
        setColumnDisplayValues(prev => {
          const newState = { ...prev };
          delete newState[`${columnId}-name`];
          return newState;
        });
      } else if (target.getAttribute('data-editing')?.includes('-dataType')) {
        const columnId = target.getAttribute('data-editing')?.replace('-dataType', '') || '';
        setColumnControlledValues(prev => {
          const newState = { ...prev };
          delete newState[`${columnId}-dataType`];
          return newState;
        });
        setColumnDisplayValues(prev => {
          const newState = { ...prev };
          delete newState[`${columnId}-dataType`];
          return newState;
        });
      } else if (isEditingTableName) {
        setTableControlledValue('');
        setTableDisplayValue('');
        setIsEditingTableName(false);
      }
      
      setEditingCell(null);
      setIsEditingLogicalName(false);
      
      // 자동완성 닫기
      setShowAutocomplete(false);
      setAutocompleteColumnId(null);
      setSelectedAutocompleteIndex(-1);
      
      // 포커스 해제
      target.blur();
      return;
    }
    
    // 모든 문자 입력 차단 (허용된 문자도 일단 차단 - 직접 처리)
    e.preventDefault();
    e.stopPropagation();
    
    // 허용된 문자인 경우에만 직접 추가 - Test.tsx와 똑같이
    if (e.key.length === 1) {
      const isDataTypeField = target.getAttribute('data-editing')?.includes('-dataType');
      const validChar = isDataTypeField ? /[a-zA-Z0-9_()]/.test(e.key) : isValidChar(e.key);
      
      if (validChar) {
        const cursorPos = target.selectionStart || 0;
        const currentValue = controlledValue;
        
        // 숫자나 괄호로 시작하는 것 방지
        if (isDataTypeField && /[0-9()]/.test(e.key) && cursorPos === 0) {
          return; // 차단
        } else if (!isDataTypeField && /[0-9]/.test(e.key) && cursorPos === 0) {
          return; // 차단
        }
        
        // 허용된 문자 직접 추가 (선택 영역 고려)
        const cursorStart = target.selectionStart || 0;
        const cursorEnd = target.selectionEnd || 0;
        const newValue = currentValue.slice(0, cursorStart) + e.key + currentValue.slice(cursorEnd);
        
        // Test.tsx와 똑같이 상태 업데이트
        if (target.getAttribute('data-editing')?.includes('-name')) {
          const columnId = target.getAttribute('data-editing')?.replace('-name', '') || '';
          setColumnControlledValues(prev => ({ ...prev, [`${columnId}-name`]: newValue }));
          setColumnDisplayValues(prev => ({ ...prev, [`${columnId}-name`]: newValue }));
          updateColumnField(columnId, 'name', newValue);
        } else if (target.getAttribute('data-editing')?.includes('-dataType')) {
          const columnId = target.getAttribute('data-editing')?.replace('-dataType', '') || '';
          const upperValue = newValue.toUpperCase();
          setColumnControlledValues(prev => ({ ...prev, [`${columnId}-dataType`]: upperValue }));
          setColumnDisplayValues(prev => ({ ...prev, [`${columnId}-dataType`]: upperValue }));
          
          // 데이터 타입 변경 시 debouncing 적용 - 즉시 UI 업데이트, 지연된 히스토리 저장
          updateColumnField(columnId, 'dataType', upperValue, true); // skipHistory = true
          
          // debounced 히스토리 저장
          if (historyTimeouts[`dataType-${columnId}`]) {
            clearTimeout(historyTimeouts[`dataType-${columnId}`]);
          }
          
          const timeoutId = setTimeout(() => {
            updateColumnField(columnId, 'dataType', upperValue, false); // skipHistory = false
            setHistoryTimeouts(prev => {
              const updated = { ...prev };
              delete updated[`dataType-${columnId}`];
              return updated;
            });
          }, 500);
          
          setHistoryTimeouts(prev => ({
            ...prev,
            [`dataType-${columnId}`]: timeoutId
          }));
          
          // 자동완성 트리거 (원래 기능 복구)
          const column = columns.find(col => col.id === columnId);
          if (!column?.fk) {
            setAutocompleteColumnId(columnId);
            filterDataTypes(upperValue);
            
            // 자동완성 위치 계산
            if (upperValue.length > 0) {
              const rect = target.getBoundingClientRect();
              setDropdownPosition({
                top: rect.bottom + 2,
                left: rect.left
              });
            }
          }
        } else if (isEditingTableName) {
          setTableControlledValue(newValue);
          setTableDisplayValue(newValue);
          setTableName(newValue);
        }
        
        // 커서 위치 조정
        setTimeout(() => {
          if (target) {
            target.setSelectionRange(cursorStart + 1, cursorStart + 1);
          }
        }, 0);
      }
    }
  }, [isValidChar, tableControlledValue, columnControlledValues, isEditingTableName]);

  // Test.tsx 모든 조합 이벤트 완전 차단
  const testHandleCompositionStart = useCallback((e: React.CompositionEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const testHandleCompositionUpdate = useCallback((e: React.CompositionEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const testHandleCompositionEnd = useCallback((e: React.CompositionEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Test.tsx 모든 beforeinput 차단
  const testHandleBeforeInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Test.tsx 모든 input 이벤트 차단  
  const testHandleInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 강제로 제어된 값으로 복원
    // Layout.tsx에서는 DOM 값 유지 (상태 기반이 아니므로)
  }, []);

  // Test.tsx 붙여넣기 처리
  const testHandlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const target = e.target as HTMLInputElement;
    
    const currentValue = target.value;
    const cursorPos = target.selectionStart || 0;
    
    // 현재 커서 위치에 붙여넣기
    const newValue = currentValue.slice(0, cursorPos) + pastedText + currentValue.slice(cursorPos);
    
    // 데이터타입 필드는 filterDataTypeValue 사용, 나머지는 filterValue 사용
    const isDataTypeField = target.getAttribute('data-editing')?.includes('-dataType');
    const filtered = isDataTypeField ? filterDataTypeValue(newValue) : filterValue(newValue);
    
    // DOM에 직접 설정
    target.value = filtered;
    
    // 커서 위치를 붙여넣은 텍스트 끝으로 이동
    const pastedFiltered = isDataTypeField ? filterDataTypeValue(pastedText) : filterValue(pastedText);
    const newCursorPos = cursorPos + pastedFiltered.length;
    target.setSelectionRange(newCursorPos, newCursorPos);
  }, [filterValue, filterDataTypeValue]);

  // Test.tsx와 동일한 주기적 검증 로직 (DOM만 조작, 상태는 건드리지 않음)
  useEffect(() => {
    const interval = setInterval(() => {
      // 테이블명 검증 (DOM만 수정, 상태는 onChange에서 처리)
      if (tableNameInputRef.current && isEditingTableName) {
        const currentValue = tableNameInputRef.current.value;
        const filtered = filterTableValue(currentValue);
        
        if (filtered !== currentValue) {
          const cursorPos = tableNameInputRef.current.selectionStart || 0;
          const removedCount = currentValue.length - filtered.length;
          
          tableNameInputRef.current.value = filtered;
          
          const newCursorPos = Math.max(0, cursorPos - removedCount);
          tableNameInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          
          // 상태도 업데이트 (히스토리 방해하지 않도록 조건부)
          if (tableName !== filtered) {
            setTableName(filtered);
          }
        }
      }
      
      // 컬럼 필드 검증 (DOM만 수정)
      if (editingCell) {
        const input = document.querySelector(`input[data-editing="${editingCell}"]`) as HTMLInputElement;
        
        if (input) {
          const currentValue = input.value;
          let filtered: string;
          
          if (editingCell.endsWith('-name')) {
            filtered = filterColumnValue(currentValue);
          } else if (editingCell.endsWith('-dataType')) {
            filtered = filterDataTypeValue(currentValue);
          } else {
            return;
          }
          
          if (filtered !== currentValue) {
            const cursorPos = input.selectionStart || 0;
            const removedCount = currentValue.length - filtered.length;
            
            input.value = filtered;
            
            const newCursorPos = Math.max(0, cursorPos - removedCount);
            input.setSelectionRange(newCursorPos, newCursorPos);
          }
        }
      }
    }, 10);
    
    return () => clearInterval(interval);
  }, [editingCell, isEditingTableName, filterTableValue, filterColumnValue, filterDataTypeValue]);

  // 컬럼 입력 검증을 위한 공통 함수들 (제거됨 - testHandleKeyDown으로 통합)
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteColumnId, setAutocompleteColumnId] = useState<string | null>(null);
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState<number>(-1);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  // 초기 렌더링 지연으로 깜빡임 방지
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setInitialRender(false);
    }, 100); // 100ms 지연
    
    return () => clearTimeout(timer);
  }, []);

  // 드롭다운 외부 클릭 감지
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // FK 드롭다운이 열려있을 때
      if (dropdownOpen === 'fk-options') {
        const isDropdownClick = target.closest('[data-dropdown="fk-options"]');
        const isDropdownButtonClick = target.closest('[data-dropdown-button="fk-options"]');
        
        // 드롭다운 영역이나 버튼을 클릭하지 않았으면 드롭다운 닫기
        if (!isDropdownClick && !isDropdownButtonClick) {
          
          setDropdownOpen(null);
          setDropdownPosition(null);
          setDropdownType(null);
          setDropdownColumnId(null);
          setTooltip({ visible: false, x: -9999, y: -9999, content: '', position: 'top' });
        }
      }
      
      // 기존 데이터타입 드롭다운 처리
      if (dropdownOpen && dropdownOpen !== 'fk-options') {
        if (!target.closest('[data-dropdown]') && !target.closest('[data-dropdown-button]') && !target.closest('[data-editing]') && !target.closest('[data-autocomplete-item]')) {
          setDropdownOpen(null);
          setDropdownPosition(null);
          // editing 상태도 해제하여 border 제거
          setEditingCell(null);
        }
      }
      
      // 자동완성 드롭다운 처리 - 더 강력한 감지
      if (showAutocomplete) {
        const isAutocompleteItem = target.closest('[data-autocomplete-item]');
        const isEditingInput = target.closest('[data-editing]');
        const isDataTypeInput = target.tagName === 'INPUT' && target.getAttribute('data-editing')?.includes('-dataType');
        
        if (!isAutocompleteItem && !isEditingInput && !isDataTypeInput) {
          
          setShowAutocomplete(false);
          setAutocompleteColumnId(null);
          setSelectedAutocompleteIndex(-1);
        }
      }
    };

    const handleDragStart = (event: DragEvent) => {
      // 드래그 시작 시 자동완성 드롭다운 닫기
      if (showAutocomplete) {
        
        setShowAutocomplete(false);
        setAutocompleteColumnId(null);
        setSelectedAutocompleteIndex(-1);
      }
    };

    const handleScroll = () => {
      // 스크롤 시 자동완성 드롭다운 닫기
      if (showAutocomplete) {
        
        setShowAutocomplete(false);
        setAutocompleteColumnId(null);
        setSelectedAutocompleteIndex(-1);
      }
    };

    const handleResize = () => {
      // 윈도우 리사이즈 시 자동완성 드롭다운 닫기
      if (showAutocomplete) {
        
        setShowAutocomplete(false);
        setAutocompleteColumnId(null);
        setSelectedAutocompleteIndex(-1);
      }
    };

    if (dropdownOpen || showAutocomplete) {
      // mousedown과 click 둘 다 등록하여 확실하게 감지
      document.addEventListener('mousedown', handleClickOutside, true); // capture phase
      document.addEventListener('click', handleClickOutside, true); // capture phase
      document.addEventListener('dragstart', handleDragStart);
      document.addEventListener('scroll', handleScroll, true); // capture phase로 모든 스크롤 이벤트 감지
      window.addEventListener('resize', handleResize);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
        document.removeEventListener('click', handleClickOutside, true);
        document.removeEventListener('dragstart', handleDragStart);
        document.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [dropdownOpen, showAutocomplete]);

  // 하단 패널이 열릴 때 현재 노드 ID 설정
  React.useEffect(() => {
    if (isBottomPanelOpen && selectedNodeId) {
      setCurrentPanelNodeId(selectedNodeId);
    } else if (!isBottomPanelOpen) {
      setCurrentPanelNodeId(null);
    }
  }, [isBottomPanelOpen, selectedNodeId]);

  // undo/redo 후 selectedNodeId 복원 (하단 패널이 열려있을 때)
  // bottomPanelRefreshKey 변경 시 UI 상태 초기화 (undo/redo 시)
  React.useEffect(() => {
    // FK 제약조건 드롭다운 닫기
    setDropdownOpen(null);
    setDropdownPosition(null);
    setDropdownType(null);
    setDropdownColumnId(null);
    
    // 편집 상태 초기화
    setEditingCell(null);
    setIsEditingTableName(false);
    setIsEditingLogicalName(false);
    
    // 자동완성 닫기
    setShowAutocomplete(false);
    setAutocompleteColumnId(null);
    setSelectedAutocompleteIndex(-1);
    
    if (isBottomPanelOpen && currentPanelNodeId && !selectedNodeId) {
      
      setSelectedNodeId(currentPanelNodeId);
    }
  }, [bottomPanelRefreshKey, isBottomPanelOpen, currentPanelNodeId, selectedNodeId, setSelectedNodeId]);

  // 선택된 엔티티의 데이터를 가져오기
  React.useEffect(() => {
    // 하단 패널이 열려있고 표시할 노드 ID가 있을 때 데이터 새로고침
    const targetNodeId = currentPanelNodeId;
    if (isBottomPanelOpen && targetNodeId) {
      
      const selectedNode = nodes.find(node => node.id === targetNodeId);
      if (selectedNode && selectedNode.type === 'entity') {
        setTableName(selectedNode.data.physicalName || selectedNode.data.label || '');
        setTableLogicalName(selectedNode.data.logicalName || '');
        const nodeColumns = selectedNode.data.columns || [];
        // 컬럼이 없으면 빈 배열로 시작
        // id가 없는 컬럼에 고유 id 부여하고 dataType과 type 동기화
        const columnsWithIds = nodeColumns.filter((col: any) => col).map((col: any, index: number) => {
          // ID가 없거나 유효하지 않은 경우 새로 생성
          const hasValidId = col.id && typeof col.id === 'string' && col.id.trim() !== '';
          return {
            ...col,
            id: hasValidId ? col.id : `col-${selectedNodeId}-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            dataType: col.dataType || col.type || '', // dataType이 없으면 type으로 설정
            type: col.type || col.dataType || 'VARCHAR', // type이 없으면 dataType으로 설정
            ai: col.ai || (col.constraint === 'AUTO_INCREMENT') // constraint가 AUTO_INCREMENT면 ai를 true로 설정
          };
        });
        
        // 현재 columns 상태와 비교해서 실제로 다를 때만 업데이트
        const currentColumnsStr = JSON.stringify(columns);
        const newColumnsStr = JSON.stringify(columnsWithIds);
        
        if (currentColumnsStr !== newColumnsStr) {
          setColumns(columnsWithIds);
          setSelectedColumn(columnsWithIds[0] || null);
        }
      }
    }
  }, [currentPanelNodeId, isBottomPanelOpen, nodes, bottomPanelRefreshKey]);

  // columns 변경 시 selectedColumn 동기화
  React.useEffect(() => {
    if (selectedColumn && columns.length > 0) {
      const updatedSelectedColumn = columns.find(col => col && col.id === selectedColumn.id);
      if (updatedSelectedColumn && JSON.stringify(updatedSelectedColumn) !== JSON.stringify(selectedColumn)) {
        setSelectedColumn(updatedSelectedColumn);
      }
    }
  }, [columns]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragRef.current = {
      startY: e.clientY,
      startHeight: bottomPanelHeight
    };
    
    // 리사이저 드래그 시작 시 자동완성 드롭다운 닫기
    setShowAutocomplete(false);
    setAutocompleteColumnId(null);
    setSelectedAutocompleteIndex(-1);
    
    // 전역 스타일 적용
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';
  }, [bottomPanelHeight]);

  // 자동완성 필터링 함수
  const filterDataTypes = useCallback((input: string) => {
    if (!input || input.length === 0) {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      setSelectedAutocompleteIndex(-1);
      return;
    }

    const filtered = MYSQL_DATATYPES.filter(dataType =>
      dataType.toUpperCase().startsWith(input.toUpperCase())
    ).slice(0, 8); // 최대 8개만 표시

    setAutocompleteSuggestions(filtered);
    setShowAutocomplete(filtered.length > 0);
    setSelectedAutocompleteIndex(-1); // 새로운 필터링 시 선택 초기화
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    const deltaY = dragRef.current.startY - e.clientY;
    const newHeight = Math.max(150, Math.min(600, dragRef.current.startHeight + deltaY));
    setBottomPanelHeight(newHeight);
    
    // 자동완성 드롭다운이 열려있으면 위치 업데이트
    if (showAutocomplete && autocompleteColumnId) {
      const input = document.querySelector(`[data-editing="${autocompleteColumnId}-dataType"]`) as HTMLElement;
      if (input) {
        const rect = input.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 2,
          left: rect.left
        });
      }
    }
  }, [isDragging, showAutocomplete, autocompleteColumnId]);

  // editingCell이 변경될 때 해당 필드에 포커스 주기
  useEffect(() => {
    if (editingCell) {
      // 짧은 딜레이 후 포커스 (DOM 업데이트 대기)
      setTimeout(() => {
        const input = document.querySelector(`[data-editing="${editingCell}"]`) as HTMLInputElement;
        if (input) {
          input.focus();
          // 텍스트 선택
          input.select();
        }
      }, 50);
    }
  }, [editingCell]);

  // 드롭다운 위치 계산 함수
  const calculateDropdownPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const dropdownHeight = 150; // max-height
    const dropdownWidth = 120; // fixed width
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    let top = rect.top - dropdownHeight - 5; // 위쪽에 표시
    if (top < 0) {
      top = rect.bottom + 5; // 공간이 없으면 아래쪽에 표시
    }
    
    let left = rect.left;
    // 오른쪽 경계를 넘지 않도록 조정
    if (left + dropdownWidth > windowWidth) {
      left = windowWidth - dropdownWidth - 10;
    }
    // 왼쪽 경계를 넘지 않도록 조정
    if (left < 10) {
      left = 10;
    }
    
    setDropdownPosition({ top, left });
  };

  const handleMouseUp = useCallback((e?: MouseEvent) => {
    setIsDragging(false);
    dragRef.current = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const addColumn = () => {
    // 고유한 컬럼명 생성
    let newColumnName = 'new_column';
    let counter = 1;
    while (columns.some(col => col.name === newColumnName)) {
      newColumnName = `new_column_${counter}`;
      counter++;
    }
    
    const targetNodeId = currentPanelNodeId || selectedNodeId;
    const newColumn = {
      id: `col-${targetNodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newColumnName,
      dataType: 'VARCHAR(45)',
      type: 'VARCHAR(45)', // EntityNode에서 사용
      pk: false,
      nn: false,
      uq: false,
      ai: false,
      defaultValue: ''
    };
    const newColumns = [...columns, newColumn];
    setColumns(newColumns);
    updateNodeColumns(newColumns);
    
    // 컬럼 추가 후 히스토리 저장
    
    useStore.getState().saveHistoryState('ADD_COLUMN', {
      columnName: newColumn.name,
      columnData: newColumn,
      entityId: targetNodeId,
      entityName: nodes.find(n => n.id === targetNodeId)?.data?.label
    });
  };

  const deleteColumn = (columnId: string) => {
    const columnToDelete = columns.find(col => col.id === columnId);
    
    if (columnToDelete) {
      
      
      const targetNodeId = currentPanelNodeId || selectedNodeId;
      const currentEntity = useStore.getState().nodes.find(n => n.id === targetNodeId);
      if (currentEntity?.type === 'entity') {
        const allEdges = useStore.getState().edges;
        const allNodes = useStore.getState().nodes;
        
        // 1. FK 컬럼인지 직접 확인 (fk 속성과 parentEntityId 사용)
        if (columnToDelete.fk && columnToDelete.parentEntityId) {
          // 복합키 관계인지 확인 (같은 부모를 참조하는 FK가 2개 이상인지)
          const sameParentFks = columns.filter(col => 
            col.fk && col.parentEntityId === columnToDelete.parentEntityId
          );
          
          const uniqueParentColumnIds = new Set(
            sameParentFks.map(fk => fk.parentColumnId).filter(Boolean)
          );
          
          const isCompositeKeyRelation = uniqueParentColumnIds.size > 1;
          
          
          
          if (isCompositeKeyRelation) {
            // 복합키 관계: 같은 부모를 참조하는 모든 FK 삭제
            
            
            const newColumns = columns.filter(col => 
              !(col.fk && col.parentEntityId === columnToDelete.parentEntityId)
            );
            
            
            
            setColumns(newColumns);
            
            // 노드 데이터 직접 업데이트
            if (targetNodeId) {
              const selectedNode = nodes.find(node => node.id === targetNodeId);
              if (selectedNode) {
                updateNodeData(targetNodeId, {
                  ...selectedNode.data,
                  columns: newColumns
                });
              }
            }
            
            if (selectedColumn?.id === columnId) {
              setSelectedColumn(newColumns[0] || null);
            }
            
            // 모든 관계선 삭제
            const parentEntity = allNodes.find(node => node.id === columnToDelete.parentEntityId);
            if (parentEntity) {
              const allRelatedEdges = useStore.getState().edges.filter(edge => 
                edge.source === parentEntity.id && edge.target === targetNodeId
              );
              allRelatedEdges.forEach(edge => {
                useStore.getState().deleteEdge(edge.id, true);
              });
              toast.success(`복합키 관계가 해제되었습니다. (${parentEntity.data.label} ↔ ${currentEntity.data.label})`);
            }
            
            // Handle 업데이트
            setTimeout(() => {
              updateEdgeHandles();
            }, 200);
            
            // 복합키 관계에서 FK+PK 컬럼들의 손자로 전파 (문제 1 해결)
            const deletedFkPkColumns = sameParentFks.filter(fk => fk.pk);
            if (deletedFkPkColumns.length > 0) {
              
              
              deletedFkPkColumns.forEach((deletedFkPk) => {
                const currentState = useStore.getState();
                const propagationResult = propagateColumnDeletion(
                  targetNodeId!,
                  deletedFkPk,
                  currentState.nodes,
                  currentState.edges,
                  []
                );
                
                
                
                // 전파 결과 적용
                useStore.getState().setNodes(propagationResult.updatedNodes);
                useStore.getState().setEdges(propagationResult.updatedEdges);
                
                if (propagationResult.toastMessages.length > 0) {
                  propagationResult.toastMessages.forEach((msg, index) => {
                    setTimeout(() => toast.info(msg), 400 + (index * 100));
                  });
                }
              });
            }
            
            // 복합키 FK 삭제 히스토리 저장
            setTimeout(() => {
              
              useStore.getState().saveHistoryState('DELETE_COLUMN', {
                columnName: columnToDelete.name,
                columnData: columnToDelete,
                entityId: targetNodeId,
                entityName: currentEntity.data.label
              });
            }, 250);
            
            return; // 여기서 종료
          }
          
          // 단일키 관계: 기존 개별 FK 삭제 로직
          // 2. 부모 엔티티 찾기 (parentEntityId 사용)
          const parentEntity = allNodes.find(node => 
            node.id === columnToDelete.parentEntityId
          );
          
          if (parentEntity) {
            // 3. 부모 엔티티와의 관계선들 찾기 (여러 개 있을 수 있음)
            const relationEdges = allEdges.filter(edge => 
              edge.source === parentEntity.id && edge.target === selectedNodeId
            );
            
            if (relationEdges.length > 0) {
              // 4. 개별 FK 삭제: 해당 FK만 삭제하고 다른 FK는 유지
              
              
              const newColumns = columns.filter(col => col.id !== columnId);
              
              // 삭제 후에도 같은 부모를 참조하는 다른 FK가 남아있는지 확인
              const remainingFKs = newColumns.filter(col => 
                col.fk && col.parentEntityId === parentEntity.id
              );
              
              
              
              setColumns(newColumns);
              
              // 노드 데이터 직접 업데이트
              if (targetNodeId) {
                const selectedNode = nodes.find(node => node.id === targetNodeId);
                if (selectedNode) {
                  updateNodeData(targetNodeId, {
                    ...selectedNode.data,
                    columns: newColumns
                  });
                }
              }
              
              if (selectedColumn?.id === columnId) {
                setSelectedColumn(newColumns[0] || null);
              }
              
              // 관계선 처리 - 항상 유지 원칙
              
              
              if (remainingFKs.length === 0) {
                
                toast.info(`FK 컬럼이 모두 삭제되었지만 관계는 유지됩니다. (${parentEntity.data.label} ↔ ${currentEntity.data.label})`);
              } else {
                
                toast.info(`FK 컬럼 ${columnToDelete.name}이 삭제되었습니다. 관계는 유지됩니다.`);
              }
              
              // 관계선 삭제 로직 제거 - 항상 유지
              // 디버깅: 현재 관계선 상태 확인
              const allRelatedEdges = useStore.getState().edges.filter(edge => 
                edge.source === parentEntity.id && edge.target === targetNodeId
              );
              
              allRelatedEdges.forEach((edge, index) => {
                
              });
              
              // Handle 업데이트
              setTimeout(() => {
                updateEdgeHandles();
              }, 200);
              
              // FK+PK 컬럼 삭제 시 손자로 전파 (문제 1 해결)
              if (columnToDelete.pk && columnToDelete.fk) {
                
                const currentState = useStore.getState();
                const propagationResult = propagateColumnDeletion(
                  targetNodeId!,
                  columnToDelete,
                  currentState.nodes,
                  currentState.edges,
                  []
                );
                
                
                
                // 전파 결과 적용
                useStore.getState().setNodes(propagationResult.updatedNodes);
                useStore.getState().setEdges(propagationResult.updatedEdges);
                
                if (propagationResult.toastMessages.length > 0) {
                  propagationResult.toastMessages.forEach((msg, index) => {
                    setTimeout(() => toast.info(msg), 300 + (index * 100));
                  });
                }
              }
              
              // FK 삭제 히스토리 저장
              setTimeout(() => {
                
                useStore.getState().saveHistoryState('DELETE_COLUMN', {
                  columnName: columnToDelete.name,
                  columnData: columnToDelete,
                  entityId: targetNodeId,
                  entityName: currentEntity.data.label
                });
              }, 250);
              
              return; // 여기서 종료
            }
          }
        }
        
        // 7. PK 컬럼을 삭제한 경우 - 복합키/단일키 구분 처리
        if (columnToDelete.pk) {
          
          
          // 복합키 관계인지 확인 (컬럼 삭제 전에 미리 판단)
          const allNodes = useStore.getState().nodes;
          const allEdges = useStore.getState().edges;
          const currentNodeId = targetNodeId || selectedNodeId || '';
          const childEdges = allEdges.filter(edge => edge.source === currentNodeId);
          
          let isCompositeKeyRelation = false;
          
          // 모든 자식 엔티티에서 복합키 관계 확인
          childEdges.forEach(edge => {
            const childNode = allNodes.find(n => n.id === edge.target);
            if (childNode && childNode.type === 'entity') {
              
              
              // 해당 부모 엔티티를 참조하는 모든 FK 찾기
              const allRelatedFks = childNode.data.columns?.filter((col: any) => 
                col.fk && col.parentEntityId === currentNodeId
              ) || [];
              
              
              
              // 간단한 판단: FK가 2개 이상이면 복합키 관계로 간주
              if (allRelatedFks.length > 1) {
                isCompositeKeyRelation = true;
                
              }
            }
          });
          
          
          
          // 이제 해당 컬럼 삭제
          const newColumns = columns.filter(col => col.id !== columnId);
          setColumns(newColumns);
          updateNodeColumns(newColumns);
          
          if (selectedColumn?.id === columnId) {
            setSelectedColumn(newColumns[0] || null);
          }
          
          if (isCompositeKeyRelation) {
            // 복합키 관계: 선택적 FK 삭제 (해당 PK를 참조하는 FK만 삭제) - 재귀적 전파
            
            
            // 재귀적 복합키 삭제 함수
            const propagateCompositeKeyDeletion = (
              deletedColumn: any,
              currentEntityId: string, 
              nodes: any[],
              edges: any[],
              processedEntities: Set<string>
            ): { updatedNodes: any[], updatedEdges: any[] } => {
              
              if (processedEntities.has(currentEntityId)) {
                return { updatedNodes: nodes, updatedEdges: edges };
              }
              
              processedEntities.add(currentEntityId);
              
              
              let finalNodes = [...nodes];
              let finalEdges = [...edges];
              
              // 현재 엔티티에서 해당 컬럼 삭제 (루트 엔티티인 경우)
              if (currentEntityId === targetNodeId) {
                finalNodes = finalNodes.map(node => {
                  if (node.id === currentEntityId) {
                    const updatedColumns = node.data.columns?.filter((col: any) => col.id !== deletedColumn.id) || [];
                    return { ...node, data: { ...node.data, columns: updatedColumns } };
                  }
                  return node;
                });
              }
              
              // 현재 엔티티의 직접 자식들 찾기
              const childEdges = finalEdges.filter(edge => edge.source === currentEntityId);
              
              for (const edge of childEdges) {
                const childNode = finalNodes.find(n => n.id === edge.target);
                if (childNode && childNode.type === 'entity') {
                  const childColumns = childNode.data.columns || [];
                  
                  // 해당 특정 PK를 참조하는 FK만 찾기
                  const targetFkColumns = childColumns.filter((col: any) => 
                    col.fk && 
                    col.parentEntityId === currentEntityId && 
                    (col.parentColumnId === deletedColumn.id || col.parentColumnId === deletedColumn.name)
                  );
                  
                  
                  
                  if (targetFkColumns.length > 0) {
                    // 해당 FK들만 삭제
                    const updatedChildColumns = childColumns.filter((col: any) => 
                      !targetFkColumns.some((fkCol: any) => fkCol.id === col.id)
                    );
                    
                    // 남은 FK들의 keyType 재계산
                    const remainingFkColumns = updatedChildColumns.filter((col: any) => 
                      col.fk && col.parentEntityId === currentEntityId
                    );
                    
                    
                    
                    // 남은 FK가 1개면 single, 2개 이상이면 composite
                    const newKeyType = remainingFkColumns.length > 1 ? 'composite' : 'single';
                    
                    // 남은 FK들의 keyType 업데이트
                    const finalChildColumns = updatedChildColumns.map((col: any) => {
                      if (remainingFkColumns.some((fkCol: any) => fkCol.id === col.id)) {
                        return { 
                          ...col, 
                          keyType: newKeyType
                        };
                      }
                      return col;
                    });
                    
                    // 자식 노드 업데이트
                    finalNodes = finalNodes.map(node => 
                      node.id === edge.target 
                        ? { ...node, data: { ...node.data, columns: finalChildColumns } }
                        : node
                    );
                    
                    // 모든 FK가 삭제된 경우에만 관계선 제거
                    if (remainingFkColumns.length === 0) {
                      finalEdges = finalEdges.filter(e => e.id !== edge.id);
                      
                    } else {
                      
                      
                      // 🎯 복합키 관계에서 관계선 연결점 업데이트
                      // 그룹별로 FK들을 분류하고 각 그룹의 첫 번째 FK에 연결
                      const groupFks = new Map();
                      remainingFkColumns.forEach((fk: any) => {
                        const groupId = fk.relationshipGroupId || 'default';
                        if (!groupFks.has(groupId)) {
                          groupFks.set(groupId, []);
                        }
                        groupFks.get(groupId).push(fk);
                      });
                      
                      
                      // 각 그룹별로 관계선 처리
                      groupFks.forEach((groupFkList, groupId) => {
                        // 그룹 내 FK들을 parentColumnId 순으로 정렬 (a→b 순서)
                        const sortedGroupFks = groupFkList.sort((a: any, b: any) => {
                          const aParentId = a.parentColumnId || '';
                          const bParentId = b.parentColumnId || '';
                          return aParentId.localeCompare(bParentId);
                        });
                        
                        const firstFk = sortedGroupFks[0]; // 정렬된 그룹의 첫 번째 FK
                        
                        
                        // 기존 관계선 중 해당 그룹의 관계선 찾기
                        const existingGroupEdge = finalEdges.find(e => 
                          e.source === currentEntityId && 
                          e.target === edge.target && 
                          e.data?.relationshipGroupId === groupId
                        );
                        
                        if (existingGroupEdge) {
                          // 기존 관계선의 연결점 업데이트
                          const updatedEdge = {
                            ...existingGroupEdge,
                            targetHandle: `${firstFk.name}-right`
                          };
                          finalEdges = finalEdges.map(e => e.id === existingGroupEdge.id ? updatedEdge : e);
                          
                        } else {
                          // 새로운 관계선 생성 (그룹별로)
                          const newEdge = {
                            id: `edge-${currentEntityId}-${edge.target}-${groupId}-${Date.now()}`,
                            source: currentEntityId,
                            target: edge.target,
                            type: edge.type,
                            targetHandle: `${firstFk.name}-right`,
                            data: {
                              relationshipGroupId: groupId,
                              isIdentifyingRelationship: firstFk.pk
                            }
                          };
                          finalEdges.push(newEdge);
                          
                        }
                      });
                    }
                    
                    // 🔥 중요: 손자로 재귀 호출 (삭제된 FK들 각각에 대해)
                    for (const deletedFk of targetFkColumns) {
                      
                      const recursiveResult = propagateCompositeKeyDeletion(
                        deletedFk, 
                        edge.target, 
                        finalNodes, 
                        finalEdges, 
                        processedEntities
                      );
                      finalNodes = recursiveResult.updatedNodes;
                      finalEdges = recursiveResult.updatedEdges;
                    }
                  }
                }
              }
              
              return { updatedNodes: finalNodes, updatedEdges: finalEdges };
            };
            
            // 재귀적 전파 시작
            const processedEntities = new Set<string>();
            const result = propagateCompositeKeyDeletion(
              columnToDelete,
              currentNodeId,
              allNodes,
              allEdges,
              processedEntities
            );
            
            // 결과 적용
            useStore.getState().setNodes(result.updatedNodes);
            useStore.getState().setEdges(result.updatedEdges);
            
          } else {
            // 단일키 관계: 기존 로직 사용 (전체 FK 삭제)
            
            
            const propagationResult = propagateColumnDeletion(
              currentNodeId,
              columnToDelete,
              allNodes,
              allEdges,
              []
            );
            
            // 결과 적용
            useStore.getState().setNodes(propagationResult.updatedNodes);
            useStore.getState().setEdges(propagationResult.updatedEdges);
            
            // 자기참조 FK가 처리된 경우 추가 컬럼 삭제 생략
            if (!propagationResult.selfReferencingHandled) {
              // 🔥 중요: 실제 PK 컬럼도 삭제해야 함
              const updatedColumns = columns.filter(col => col.id !== columnId);
              setColumns(updatedColumns);
              updateNodeData(currentNodeId, {
                columns: updatedColumns
              });
            }
            
            // 토스트 메시지 표시
            if (propagationResult.toastMessages.length > 0) {
              propagationResult.toastMessages.forEach((message, index) => {
                setTimeout(() => toast.info(message), 100 + (index * 150));
              });
            }
          }
          
          // Handle 업데이트
          setTimeout(() => {
            updateEdgeHandles();
          }, 200);
          
          // PK 컬럼 삭제 히스토리 저장
          setTimeout(() => {
            
            useStore.getState().saveHistoryState('DELETE_COLUMN', {
              columnName: columnToDelete.name,
              columnData: columnToDelete,
              entityId: targetNodeId,
              entityName: currentEntity.data.label
            });
          }, 300);
          
          return; // 여기서 종료
        }
        
        // 8. 일반 컬럼 삭제 (FK가 아닌 경우)
        const newColumns = columns.filter(col => col.id !== columnId);
        setColumns(newColumns);
        
        if (targetNodeId) {
          const selectedNode = nodes.find(node => node.id === targetNodeId);
          if (selectedNode) {
            updateNodeData(targetNodeId, {
              ...selectedNode.data,
              columns: newColumns
            });
          }
        }
        
        if (selectedColumn?.id === columnId) {
          setSelectedColumn(newColumns[0] || null);
        }
        
        // 일반 컬럼 삭제 히스토리 저장
        setTimeout(() => {
          
          useStore.getState().saveHistoryState('DELETE_COLUMN', {
            columnName: columnToDelete.name,
            columnData: columnToDelete,
            entityId: targetNodeId,
            entityName: currentEntity.data.label
          });
        }, 100);
      }
    }
  };

  const updateNodeColumns = (newColumns: any[]) => {
    const targetNodeId = currentPanelNodeId || selectedNodeId;
    if (targetNodeId) {
      const selectedNode = nodes.find(node => node.id === targetNodeId);
      if (selectedNode) {
        updateNodeData(targetNodeId, {
          ...selectedNode.data,
          columns: newColumns,
          label: tableName
        });
      }
    }
  };

  // 컬럼명 중복 검사 함수 (포커스 아웃 시에만 사용)
  const validateColumnName = (columnId: string, name: string) => {
    if (name && name.trim() !== '') {
      const existingColumn = columns.find(col => col.id !== columnId && col.name === name.trim());
      if (existingColumn) {
        toast.error(`컬럼명 "${name}"은(는) 이미 존재합니다.`);
        return false;
      }
    }
    return true;
  };

  // 히스토리 저장을 위한 debounce 타이머들
  const [historyTimeouts, setHistoryTimeouts] = useState<{[key: string]: any}>({});
  
  // 원본 값 저장 (히스토리 비교용)
  const [originalValues, setOriginalValues] = useState<{[key: string]: any}>({});
  
  // 엔티티명 편집 시 원본 값 저장
  const [originalEntityNames, setOriginalEntityNames] = useState<{physical: string, logical: string}>({physical: '', logical: ''});

  // 컴포넌트 언마운트 시 히스토리 타이머 정리
  useEffect(() => {
    return () => {
      Object.values(historyTimeouts).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, [historyTimeouts]);

  const updateColumnField = (columnId: string, field: string, value: any, skipHistory: boolean = false) => {
    
    
    // 🚨 자기참조 FK PK 체크 차단 (가장 먼저 실행)
    if (field === 'pk' && value === true) {
      const targetNodeId = currentPanelNodeId || selectedNodeId;
      const columnToUpdate = columns.find(col => col.id === columnId);
      
      if (columnToUpdate && columnToUpdate.fk && columnToUpdate.parentEntityId === targetNodeId) {
        
        toast.warning(`자기관계 FK 컬럼은 PK로 설정할 수 없습니다.`, {
          toastId: `self-ref-pk-block-${columnId}`,
          autoClose: 2000
        });
        return; // 즉시 종료
      }
    }
    
    // PK 해제 특별 처리 - 다른 로직보다 먼저 실행
    if (field === 'pk' && value === false) {
      
      const targetNodeId = currentPanelNodeId || selectedNodeId;
      const columnToUpdate = columns.find(col => col.id === columnId);
      
      if (columnToUpdate && targetNodeId) {
        // FK 컬럼에서 PK 해제 시 복합키 일관성 처리
        if (columnToUpdate.fk && columnToUpdate.parentEntityId) {
          
          
          // 같은 부모를 참조하는 모든 FK 찾기
          const sameFkColumns = columns.filter(col => 
            col.fk && col.parentEntityId === columnToUpdate.parentEntityId
          );
          
          // 🔥 정교한 복합키 판별: useStore.ts와 동일한 로직 적용
          const currentParentColumnId = columnToUpdate.parentColumnId;
          const otherFkColumns = sameFkColumns.filter(col => col.id !== columnToUpdate.id);
          const otherParentColumnIds = new Set(
            otherFkColumns.map(col => col.parentColumnId).filter(Boolean)
          );
          
          const isRealCompositeKeyRelation = 
            otherFkColumns.length > 0 && (
              (currentParentColumnId && !otherParentColumnIds.has(currentParentColumnId)) ||
              otherParentColumnIds.size > 1
            );
          
          if (isRealCompositeKeyRelation) {
            
            
            // 🎯 그룹별로만 PK 해제 (다른 그룹은 변경하지 않음)
            const targetGroupId = columnToUpdate.relationshipGroupId;
            
            if (targetGroupId) {
              
              
              // 같은 그룹의 FK들만 PK 해제
              let updatedColumns = columns.map(col => {
                if (col.fk && 
                    col.parentEntityId === columnToUpdate.parentEntityId && 
                    col.relationshipGroupId === targetGroupId) {
                  return { ...col, pk: false, nn: false };
                }
                return col;
              });
              
              // 🔄 복합키 PK 해제 시 자기참조 FK 삭제 처리 (같은 그룹의 FK에 대해서만)
              const selfReferencingFks = columns.filter(col => 
                col.fk && 
                col.parentEntityId === targetNodeId && 
                col.relationshipGroupId === targetGroupId &&
                sameFkColumns.some(fkCol => col.parentColumnId === fkCol.id || col.parentColumnId === fkCol.name)
              );
            
              
              // 자기참조 FK가 있다면 삭제
              if (selfReferencingFks.length > 0) {
                
                
                updatedColumns = updatedColumns.filter(col => 
                  !selfReferencingFks.some((fk: any) => fk.id === col.id)
                );
              }
              
              setColumns(updatedColumns);
              
              // 노드 데이터 업데이트
              const selectedNode = nodes.find(node => node.id === targetNodeId);
              if (selectedNode) {
                updateNodeData(targetNodeId, {
                  ...selectedNode.data,
                  columns: updatedColumns,
                  label: tableName
                });
                
                setTimeout(() => {
                  updateEdgeHandles();
                }, 200);
                
                // 히스토리 저장
                if (!skipHistory) {
                  
                  useStore.getState().saveHistoryState('CHANGE_COLUMN_PK' as any, {
                    columnName: columnToUpdate.name,
                    value: false,
                    affectedColumns: sameFkColumns.filter(fk => fk.relationshipGroupId === targetGroupId).map(fk => fk.name)
                  });
                }
                
                return; // 전체 함수 종료
              }
            } else {
              
              // 그룹 ID가 없는 경우 개별 컬럼만 처리하고 계속 진행
            }
          } else {
            
            // 단일키 다중참조의 경우 개별 컬럼만 처리하고 계속 진행
          }
        }
        
        // 일반 PK 해제 처리 (FK가 아니거나 단일 FK인 경우)
        const deletedColumn = { ...columnToUpdate, pk: true };
        const updatedColumn = { 
          ...columnToUpdate, 
          pk: false, 
          nn: false 
        };
        
        // 🔄 일반 PK 해제 시 자기참조 FK 삭제 처리 (UQ 로직과 동일)
        const selfReferencingFks = columns.filter(col => 
          col.fk && 
          col.parentEntityId === targetNodeId && 
          (col.parentColumnId === columnToUpdate.id || col.parentColumnId === columnToUpdate.name)
        );
        
        let updatedColumns = columns.map(col => 
          col.id === columnId ? updatedColumn : col
        );
        
        // 자기참조 FK가 있다면 삭제
        if (selfReferencingFks.length > 0) {
          
          
          updatedColumns = updatedColumns.filter(col => 
            !selfReferencingFks.some((fk: any) => fk.id === col.id)
          );
        }
        
        const selectedNode = nodes.find(node => node.id === targetNodeId);
        if (selectedNode) {
          
          
          updateNodeData(targetNodeId, {
            ...selectedNode.data,
            columns: updatedColumns,
            label: tableName
          }, deletedColumn);
          
          setTimeout(() => {
            updateEdgeHandles();
          }, 200);
          
          // 히스토리 저장
          if (!skipHistory) {
            
            useStore.getState().saveHistoryState(HISTORY_ACTIONS.CHANGE_COLUMN_PK, {
              columnName: columnToUpdate.name,
              value: false
            });
          }
          
          return; // 전체 함수 종료
        }
      }
    }
    
    // UQ 체크 특별 처리 - FK에서 UQ 체크 시 같은 부모 FK들의 PK 일괄 해제 + 자기관계 FK 삭제 처리
    if (field === 'uq' && value === true) {
      
      const targetNodeId = currentPanelNodeId || selectedNodeId;
      const columnToUpdate = columns.find(col => col.id === columnId);
      
      // 1. PK 컬럼에서 UQ 체크 시 자기관계 FK 삭제 처리
      if (columnToUpdate && columnToUpdate.pk && targetNodeId) {
        
        
        // 자기 자신을 참조하는 FK 컬럼들 찾기
        const selfReferencingFks = columns.filter(col => 
          col.fk && 
          col.parentEntityId === targetNodeId && 
          (col.parentColumnId === columnToUpdate.id || col.parentColumnId === columnToUpdate.name)
        );
        
        if (selfReferencingFks.length > 0) {
          
          
          // 자기관계 FK들 삭제
          const updatedColumns = columns.filter(col => 
            !selfReferencingFks.some(fk => fk.id === col.id)
          ).map(col => {
            if (col.id === columnId) {
              // 현재 PK 컬럼: UQ 체크, PK 해제
              return { ...col, uq: true, pk: false, nn: false };
            }
            return col;
          });
          
          
          setColumns(updatedColumns);
          
          // 노드 데이터 업데이트
          const selectedNode = nodes.find(node => node.id === targetNodeId);
          
          
          if (selectedNode) {
            // 히스토리 저장을 updateNodeData 호출 후에 처리 (변경 적용 후 상태 저장)
            
            
            try {
              useStore.getState().saveHistoryState(HISTORY_ACTIONS.CHANGE_COLUMN_UQ, {
                columnName: columnToUpdate.name,
                value: true,
                deletedSelfReferencingFks: selfReferencingFks.map(fk => fk.name),
                changeType: 'self_referencing_fk_deletion'
              });
              
            } catch (error) {
              console.error(`❌ 히스토리 저장 실패:`, error);
            }
            
            
            updateNodeData(targetNodeId, {
              ...selectedNode.data,
              columns: updatedColumns,
              label: tableName
            });
            
            
            // 히스토리 저장을 updateNodeData 호출 후에 처리 (변경 적용 후 상태 저장)
            
            
            try {
              useStore.getState().saveHistoryState(HISTORY_ACTIONS.CHANGE_COLUMN_UQ, {
                columnName: columnToUpdate.name,
                value: true,
                deletedSelfReferencingFks: selfReferencingFks.map(fk => fk.name),
                changeType: 'self_referencing_fk_deletion'
              });
              
            } catch (error) {
              console.error(`❌ 히스토리 저장 실패:`, error);
            }
            
            // 자기관계 엣지 삭제 (필요한 경우)
            const currentState = useStore.getState();
            const selfEdges = currentState.edges.filter((edge: any) => 
              edge.source === targetNodeId && edge.target === targetNodeId
            );
            
            
            
            if (selfEdges.length > 0 && updatedColumns.filter(col => 
              col.fk && col.parentEntityId === targetNodeId
            ).length === 0) {
              // 모든 자기관계 FK가 삭제되었으면 자기관계 엣지도 삭제
              selfEdges.forEach((edge: any) => {
                currentState.deleteEdge(edge.id, true);
              });
              
            }
            
            setTimeout(() => {
              currentState.updateEdgeHandles();
            }, 200);
            
            return; // 전체 함수 종료
          } else {
            console.error(`❌ selectedNode를 찾을 수 없음: targetNodeId=${targetNodeId}`);
          }
        }
      }
      
      // 2. FK 컬럼에서 UQ 체크 시 같은 부모 FK들의 PK 일괄 해제
      if (columnToUpdate && columnToUpdate.fk && columnToUpdate.parentEntityId && targetNodeId) {
        
        
        // 같은 부모를 참조하는 모든 FK 찾기
        const sameFkColumns = columns.filter(col => 
          col.fk && col.parentEntityId === columnToUpdate.parentEntityId
        );
        
        // 🔥 정교한 복합키 판별: useStore.ts와 동일한 로직 적용
        const currentParentColumnId = columnToUpdate.parentColumnId;
        const otherFkColumns = sameFkColumns.filter(col => col.id !== columnToUpdate.id);
        const otherParentColumnIds = new Set(
          otherFkColumns.map(col => col.parentColumnId).filter(Boolean)
        );
        
        const isRealCompositeKeyRelation = 
          otherFkColumns.length > 0 && (
            (currentParentColumnId && !otherParentColumnIds.has(currentParentColumnId)) ||
            otherParentColumnIds.size > 1
          );
        
        if (isRealCompositeKeyRelation) {
          
          
          // 🎯 그룹별로만 PK 해제 (다른 그룹은 변경하지 않음)
          const targetGroupId = columnToUpdate.relationshipGroupId;
          
          if (targetGroupId) {
            
            
            // 같은 그룹의 FK들만 PK 해제, UQ는 현재 컬럼에만 설정
            const updatedColumns = columns.map(col => {
              if (col.fk && 
                  col.parentEntityId === columnToUpdate.parentEntityId && 
                  col.relationshipGroupId === targetGroupId) {
                if (col.id === columnId) {
                  // 현재 컬럼: UQ 체크, PK/NN 해제
                  return { ...col, uq: true, pk: false, nn: false };
                } else {
                  // 같은 그룹의 다른 FK들: PK/NN만 해제, 기존 UQ는 유지
                  return { ...col, pk: false, nn: col.nn };
                }
              }
              return col;
            });
          
                        
              setColumns(updatedColumns);
              
              // 노드 데이터 업데이트
              const selectedNode = nodes.find(node => node.id === targetNodeId);
              if (selectedNode) {
                updateNodeData(targetNodeId, {
                  ...selectedNode.data,
                  columns: updatedColumns,
                  label: tableName
                });
                
                setTimeout(() => {
                  updateEdgeHandles();
                }, 200);
                
                // 히스토리 저장
                if (!skipHistory) {
                  
                  useStore.getState().saveHistoryState('CHANGE_COLUMN_UQ' as any, {
                    columnName: columnToUpdate.name,
                    value: true,
                    affectedColumns: sameFkColumns.filter(fk => fk.relationshipGroupId === targetGroupId).map(fk => fk.name)
                  });
                }
                
                return; // 전체 함수 종료
              }
            } else {
              
              // 그룹 ID가 없는 경우 개별 컬럼만 처리하고 계속 진행
            }
        } else {
          
          // 단일키 다중참조의 경우 개별 컬럼만 처리하고 계속 진행
        }
      }
    }
    
    // 한국어 필터링 제거 - onKeyPress에서 이미 차단됨
    const targetNodeId = currentPanelNodeId || selectedNodeId;

    const newColumns = columns.map(col => {
      if (col.id === columnId) {
        let updatedCol = { ...col };
        
        // FK onDelete, onUpdate 처리 - 복합키 동기화 포함
        if (field === 'onDelete' || field === 'onUpdate') {
          const originalValue = col[field];
          updatedCol[field] = value;
          
          // FK 제약조건의 경우 나중에 히스토리 저장하기 위해 정보 저장
          if (!skipHistory && originalValue !== value) {
            updatedCol._historyInfo = {
              actionType: 'CHANGE_COLUMN_FK_CONSTRAINT',
              metadata: {
                columnName: col.name,
                field: field,
                oldValue: originalValue || 'NONE',
                newValue: value
              }
            };
          }
          
          // 🎯 복합키 FK들의 onDelete, onUpdate 동기화 처리
          if (col.fk && col.relationshipGroupId && col.keyType === 'composite') {
            
            
            // 같은 relationshipGroupId를 가진 다른 FK 컬럼들 찾기
            const sameGroupFkColumns = columns.filter(otherCol => 
              otherCol.fk && 
              otherCol.relationshipGroupId === col.relationshipGroupId &&
              otherCol.id !== col.id // 현재 수정 중인 컬럼은 제외
            );
            
            if (sameGroupFkColumns.length > 0) {
              
              
              // 동기화할 컬럼 ID들 저장 (나중에 newColumns에서 처리)
              const syncColumnIds = sameGroupFkColumns.map(fkCol => fkCol.id);
              
              // 이 정보를 나중에 사용하기 위해 임시 저장
              updatedCol._syncInfo = {
                field: field,
                value: value,
                syncColumnIds: syncColumnIds
              };
              
              toast.info(`복합키 동기화: ${sameGroupFkColumns.length + 1}개 FK의 ${field === 'onDelete' ? 'ON DELETE' : 'ON UPDATE'}가 ${value}로 동기화되었습니다.`);
            }
          }
          
          // FK 제약조건 처리 완료 - 일반 필드 처리 건너뛰고 계속 진행
        } else if (field === 'comment') {
          // 컬럼 주석 처리
          const originalValue = col.comment;
          updatedCol.comment = value;
          
          // 히스토리 저장
          if (!skipHistory && originalValue !== value) {
            updatedCol._historyInfo = {
              actionType: 'CHANGE_COLUMN_COMMENT',
              metadata: {
                columnName: col.name,
                oldValue: originalValue || '',
                newValue: value
              }
            };
          }
        } else if (field === 'fkName') {
          // FK 이름 처리
          const originalValue = col.fkName;
          updatedCol.fkName = value;
          
          // 히스토리 저장
          if (!skipHistory && originalValue !== value) {
            updatedCol._historyInfo = {
              actionType: 'CHANGE_FK_NAME',
              metadata: {
                columnName: col.name,
                oldValue: originalValue || '',
                newValue: value
              }
            };
          }
        } else {
          // 일반 필드 처리 (FK 제약조건이 아닌 경우에만)
          updatedCol = { ...col, [field]: value };
        }
        
        // PK 설정 시 NN도 자동으로 체크
        if (field === 'pk' && value === true) {
          updatedCol.nn = true;
          updatedCol.uq = false; // PK 체크하면 UQ 해제
          
          // FK 컬럼에서 PK 체크 시 그룹별 처리
          if (updatedCol.fk && updatedCol.parentEntityId) {
            
            
            // 같은 부모를 참조하는 모든 FK 찾기
            const sameFkColumns = columns.filter(col => 
              col.fk && col.parentEntityId === updatedCol.parentEntityId
            );
            
            // 🔥 정교한 복합키 판별: useStore.ts와 동일한 로직 적용
            const currentParentColumnId = updatedCol.parentColumnId;
            const otherFkColumns = sameFkColumns.filter(col => col.id !== updatedCol.id);
            const otherParentColumnIds = new Set(
              otherFkColumns.map(col => col.parentColumnId).filter(Boolean)
            );
            
            const isRealCompositeKeyRelation = 
              otherFkColumns.length > 0 && (
                (currentParentColumnId && !otherParentColumnIds.has(currentParentColumnId)) ||
                otherParentColumnIds.size > 1
              );
            
            
            if (isRealCompositeKeyRelation) {
              
              
              // 🎯 그룹별로만 PK 체크 (다른 그룹은 변경하지 않음)
              const targetGroupId = updatedCol.relationshipGroupId;
              
              if (targetGroupId) {
                
                
                // 같은 그룹의 FK들만 PK 체크
                const updatedColumns = columns.map(col => {
                  if (col.fk && 
                      col.parentEntityId === updatedCol.parentEntityId && 
                      col.relationshipGroupId === targetGroupId) {
                    return { ...col, pk: true, nn: true, uq: false };
                  }
                  return col;
                });
                
                // 🚨 중요: 복합키 관계에서도 일반적인 컬럼 업데이트 로직을 계속 진행해야 함
                // return; 제거하고 일반적인 업데이트 로직으로 계속 진행
                
                
                // 히스토리 저장
                if (!skipHistory) {
                  
                  useStore.getState().saveHistoryState('CHANGE_COLUMN_PK' as any, {
                    columnName: updatedCol.name,
                    value: true,
                    affectedColumns: sameFkColumns.filter(fk => fk.relationshipGroupId === targetGroupId).map(fk => fk.name)
                  });
                }
              } else {
                
                // 그룹 ID가 없는 경우 개별 컬럼만 처리하고 계속 진행
              }
            } else {
              
              // 단일키 다중참조의 경우 개별 컬럼만 처리하고 계속 진행
            }
          }
          
          // 일반 PK 체크 처리 (FK가 아니거나 단일 FK인 경우)
          const currentEntity = useStore.getState().nodes.find(n => n.id === targetNodeId);
          if (currentEntity?.type === 'entity' && targetNodeId) {
            const allNodes = useStore.getState().nodes;
            const allEdges = useStore.getState().edges;
            const childEdges = allEdges.filter(edge => edge.source === targetNodeId);
            
            if (childEdges.length > 0) {
              // 재귀적으로 하위 계층까지 FK 전파
              const propagationResult = propagateColumnAddition(
                targetNodeId,
                updatedCol,
                allNodes,
                allEdges
              );
              
              // 결과로 받은 노드들로 업데이트
              useStore.getState().setNodes(propagationResult.updatedNodes);
              
              // FK 추가로 인한 연쇄 토스트 메시지 표시
              if (propagationResult.toastMessages && propagationResult.toastMessages.length > 0) {
                propagationResult.toastMessages.forEach((message, index) => {
                  setTimeout(() => toast.info(message), 200 + (index * 100));
                });
              }
              
              // FK 추가 후 즉시 Handle 강제 업데이트
              setTimeout(() => {
                updateEdgeHandles();
              }, 250);
            }
          }
        } else if (field === 'pk' && value === false) {
          // PK 해제 시 NN도 해제
          updatedCol.nn = false;
          
          // 삭제될 컬럼 정보를 updateNodeData에 전달
        } else if (field === 'pk' && value === false) {
          // PK 해제 시 NN도 해제
          updatedCol.nn = false;
          
          // 삭제될 컬럼 정보를 updateNodeData에 전달
          const deletedColumn = { ...col, pk: true }; // 원래 PK였던 상태로 전달
          
          // updateNodeData 호출 시 deletedColumn 정보 포함
          if (targetNodeId) {
            const selectedNode = nodes.find(node => node.id === targetNodeId);
            if (selectedNode) {
              const updatedColumns = columns.map(column => 
                column.id === col.id 
                  ? updatedCol 
                  : column
              );
              
              updateNodeData(targetNodeId, {
                ...selectedNode.data,
                columns: updatedColumns,
                label: tableName
              }, deletedColumn);
              
              setTimeout(() => {
                updateEdgeHandles();
              }, 200);
            }
          }
        } else if (field === 'uq' && value === true && col.pk === true) {
          updatedCol.pk = false; // UQ 체크하면 PK 해제
          updatedCol.nn = false; // PK 해제 시 NN도 해제 가능하게
          
          // 삭제될 컬럼 정보를 updateNodeData에 전달
          const deletedColumn = { ...col, pk: true }; // 원래 PK였던 상태로 전달
          
          // updateNodeData 호출 시 deletedColumn 정보 포함
          if (targetNodeId) {
            const selectedNode = nodes.find(node => node.id === targetNodeId);
            if (selectedNode) {
              const updatedColumns = columns.map(column => 
                column.id === col.id 
                  ? updatedCol 
                  : column
              );
              
              updateNodeData(targetNodeId, {
                ...selectedNode.data,
                columns: updatedColumns,
                label: tableName
              }, deletedColumn);
              
              setTimeout(() => {
                updateEdgeHandles();
              }, 200);
            }
          }
        }
        
        // AI 설정 시 체크 (PK이면서 INT 타입인지 확인)
        if (field === 'ai' && value === true) {
          const dataType = updatedCol.dataType?.toUpperCase().trim();
          const isIntType = /^(INT|INTEGER|BIGINT|SMALLINT|TINYINT)(\(\d+\))?$/.test(dataType || '');
          
          if (!updatedCol.pk || !isIntType) {
            toast.error('AI는 PK이면서 INT 타입인 컬럼에만 설정할 수 있습니다.');
            return col; // 변경하지 않음
          }
        }
        
        // dataType이 변경되면 type도 함께 업데이트 (EntityNode에서 사용)
        if (field === 'dataType') {
          updatedCol.type = value;
          
          // 데이터타입이 INT 계열이 아니면 AI 해제
          const dataType = value?.toUpperCase().trim();
          const isIntType = /^(INT|INTEGER|BIGINT|SMALLINT|TINYINT)(\(\d+\))?$/.test(dataType || '');
          
          if (updatedCol.ai && !isIntType) {
            updatedCol.ai = false;
            updatedCol.constraint = null;
            toast.info('데이터타입이 INT 계열이 아니므로 AI가 해제되었습니다.');
          }
          
          // PK 컬럼의 데이터타입 변경 시 모든 FK에 전파
          if (updatedCol.pk) {
            const currentEntity = useStore.getState().nodes.find(n => n.id === targetNodeId);
            if (currentEntity?.type === 'entity' && targetNodeId) {
              const allNodes = useStore.getState().nodes;
              const allEdges = useStore.getState().edges;
              
              // propagateDataTypeChange 호출
              const result = propagateDataTypeChange(targetNodeId, updatedCol, value, allNodes, allEdges);
              useStore.getState().setNodes(result.updatedNodes);
              
              setTimeout(() => {
                updateEdgeHandles();
              }, 150);
            }
          }
        }
        
        // UQ 체크박스 변경 시 constraint도 함께 업데이트
        if (field === 'uq') {
          if (value === true) {
            updatedCol.constraint = 'UNIQUE';
          } else {
            // UQ 해제 시 constraint에서 UNIQUE 제거
            if (updatedCol.constraint === 'UNIQUE') {
              updatedCol.constraint = null;
            }
          }
        }

        // AI 체크박스 변경 시 constraint도 함께 업데이트
        if (field === 'ai') {
          if (value === true) {
            updatedCol.constraint = 'AUTO_INCREMENT';
          } else {
            // AI 해제 시 constraint에서 AUTO_INCREMENT 제거
            if (updatedCol.constraint === 'AUTO_INCREMENT') {
              updatedCol.constraint = null;
            }
          }
        }
        
        return updatedCol;
      }
      return col;
    });
    
    // FK 컬럼의 PK 설정/해제 시 관계 타입 변경 처리
    if (field === 'pk') {
      const columnToUpdate = columns.find(col => col.id === columnId);
      if (columnToUpdate && columnToUpdate.fk && columnToUpdate.parentEntityId) {
        
        
        // 같은 부모를 참조하는 다른 FK 컬럼들 찾기
        const sameFkColumns = columns.filter(col => 
          col.fk && 
          col.parentEntityId === columnToUpdate.parentEntityId && 
          col.id !== columnId
        );
        
        
        
        // 🔥 복합키 관계 정확한 판별 개선:
        // 1. 다른 FK들이 존재해야 함 (sameFkColumns.length > 0)
        // 2. 현재 컬럼과 다른 FK들이 서로 다른 부모 PK를 참조해야 함
        // 3. 또는 다른 FK들끼리도 서로 다른 부모 PK를 참조해야 함
        const currentParentColumnId = columnToUpdate.parentColumnId;
        const otherParentColumnIds = new Set(
          sameFkColumns.map(col => col.parentColumnId).filter(Boolean)
        );
        
        const isRealCompositeKeyRelation = 
          sameFkColumns.length > 0 && (
            (currentParentColumnId && !otherParentColumnIds.has(currentParentColumnId)) ||
            otherParentColumnIds.size > 1
          );
        
        
        if (isRealCompositeKeyRelation) {
          
          
          // 🎯 그룹별로만 PK 변경 (다른 그룹은 변경하지 않음)
          const targetGroupId = columnToUpdate.relationshipGroupId;
          
          if (targetGroupId) {
            
            
            // 같은 그룹의 FK들만 PK 변경
            sameFkColumns.forEach((fkCol, index) => {
              if (!fkCol || !fkCol.id) {
                console.warn('⚠️ undefined fkCol detected, skipping:', fkCol);
                return;
              }
              
              // 같은 그룹의 FK만 처리
              if (fkCol.relationshipGroupId === targetGroupId) {
                const fkIndex = newColumns.findIndex(c => c && c.id === fkCol.id);
                if (fkIndex !== -1) {
                  newColumns[fkIndex] = { 
                    ...newColumns[fkIndex], 
                    pk: value, 
                    nn: value,
                    uq: value ? false : newColumns[fkIndex].uq // PK 설정 시 UQ 해제, PK 해제 시 UQ 유지
                  };
                  
                }
              } else {
                
              }
            });
          } else {
            
            // 그룹 ID가 없는 경우 개별 컬럼만 처리
          }
          
          // 복합키 관계에서는 모든 관계선의 타입을 변경
          const allEdges = useStore.getState().edges;
          const relatedEdges = allEdges.filter(edge => 
            edge.source === columnToUpdate.parentEntityId && edge.target === targetNodeId
          );
          
          relatedEdges.forEach(edge => {
            let newType = edge.type;
            if (value === true) {
              // PK 설정 시 비식별자 → 식별자
              if (edge.type === 'one-to-one-non-identifying') {
                newType = 'one-to-one-identifying';
              } else if (edge.type === 'one-to-many-non-identifying') {
                newType = 'one-to-many-identifying';
              }
            } else {
              // PK 해제 시 식별자 → 비식별자
              if (edge.type === 'one-to-one-identifying') {
                newType = 'one-to-one-non-identifying';
              } else if (edge.type === 'one-to-many-identifying') {
                newType = 'one-to-many-non-identifying';
              }
            }
            
            if (newType !== edge.type) {
              // setEdges를 사용해서 edge 타입 업데이트
              const currentEdges = useStore.getState().edges;
              const updatedEdges = currentEdges.map(e => 
                e.id === edge.id ? { ...e, type: newType } : e
              );
              useStore.getState().setEdges(updatedEdges);
            }
          });
          
        } else {
          
          
          // 🎯 단일키 다중참조: 오직 해당 FK만 개별적으로 처리
          // 다른 FK들에게는 전혀 영향을 주지 않음
          
          // 해당 FK와 연결된 관계선 찾기
          const allEdges = useStore.getState().edges;
          let specificEdge = allEdges.find(edge => 
            edge.source === columnToUpdate.parentEntityId && 
            edge.target === targetNodeId &&
            edge.targetHandle && 
            edge.targetHandle.includes(columnToUpdate.name)
          );
          
          // targetHandle로 찾지 못한 경우 일반적인 방법 사용
          if (!specificEdge) {
            const relatedEdges = allEdges.filter(edge => 
              edge.source === columnToUpdate.parentEntityId && edge.target === targetNodeId
            );
            
            if (relatedEdges.length === 1) {
              specificEdge = relatedEdges[0];
            } else if (relatedEdges.length > 1) {
              // 여러 관계선이 있는 경우 첫 번째 사용 (단일키 다중참조에서는 보통 하나)
              specificEdge = relatedEdges[0];
              
            }
          }
          
          if (specificEdge) {
            let newType = specificEdge.type;
            if (value === true) {
              // PK 설정 시 비식별자 → 식별자
              if (specificEdge.type === 'one-to-one-non-identifying') {
                newType = 'one-to-one-identifying';
              } else if (specificEdge.type === 'one-to-many-non-identifying') {
                newType = 'one-to-many-identifying';
              }
            } else {
              // PK 해제 시 식별자 → 비식별자
              if (specificEdge.type === 'one-to-one-identifying') {
                newType = 'one-to-one-non-identifying';
              } else if (specificEdge.type === 'one-to-many-identifying') {
                newType = 'one-to-many-non-identifying';
              }
            }
            
            if (newType !== specificEdge.type) {
              // setEdges를 사용해서 edge 타입 업데이트
              const currentEdges = useStore.getState().edges;
              const updatedEdges = currentEdges.map(edge => 
                edge.id === specificEdge.id ? { ...edge, type: newType } : edge
              );
              useStore.getState().setEdges(updatedEdges);
              
            }
          } else {
            
          }
        }
      }
    }
    
    setColumns(newColumns);
    
    // 선택된 컬럼도 즉시 업데이트 (newColumns 배열에서 직접 가져와서 동기화 확실히)
    if (selectedColumn?.id === columnId) {
      const updatedSelectedColumn = newColumns.find(col => col && col.id === columnId);
      if (updatedSelectedColumn) {
        setSelectedColumn({...updatedSelectedColumn}); // 새 객체로 업데이트하여 리렌더링 보장
      }
    }
    
    // 엔티티 노드의 데이터 업데이트
    if (selectedNodeId) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode && selectedNode.type === 'entity') {
        updateNodeData(selectedNodeId, {
          ...selectedNode.data,
          columns: newColumns,
          label: tableName
        });
        
        // PK 관련 변경사항이 있을 때 Handle 업데이트 - 더 긴 지연시간
        if (field === 'pk') {
          setTimeout(() => {
            updateEdgeHandles();
          }, 100);
        }
        
        // 컬럼 이름 변경 시 관계선과 하이라이트 강제 업데이트 - 더 긴 지연시간
        if (field === 'name') {
          setTimeout(() => {
            updateEdgeHandles();
          }, 100);
        }
      }
    }
    
    // 컬럼 체크박스 상태 변경 시 히스토리 저장
    if (['pk', 'nn', 'uq', 'ai'].includes(field)) {
      const columnToUpdate = columns.find(col => col.id === columnId);
      if (columnToUpdate) {
        let historyAction: string = '';
        switch (field) {
          case 'pk':
            historyAction = HISTORY_ACTIONS.CHANGE_COLUMN_PK;
            break;
          case 'nn':
            historyAction = HISTORY_ACTIONS.CHANGE_COLUMN_NN;
            break;
          case 'uq':
            historyAction = HISTORY_ACTIONS.CHANGE_COLUMN_UQ;
            break;
          case 'ai':
            historyAction = HISTORY_ACTIONS.CHANGE_COLUMN_AI;
            break;
        }
        
        if (historyAction) {
          
          useStore.getState().saveHistoryState(historyAction as any, {
            columnName: columnToUpdate.name,
            value: value
          });
        }
      }
    }
    
    // 컬럼 기타 필드 변경시 히스토리 저장 (debounce 처리)
    if (!skipHistory && ['name', 'logicalName', 'dataType', 'defaultValue', 'comment'].includes(field)) {
      const columnToUpdate = columns.find(col => col.id === columnId);
      if (columnToUpdate) {
        const timeoutKey = `${columnId}-${field}`;
        
        // 원본 값 저장 (최초 변경 시에만)
        const originalKey = `${columnId}-${field}-original`;
        if (!originalValues[originalKey]) {
          const currentValue = field === 'name' ? columnToUpdate.name :
                              field === 'logicalName' ? (columnToUpdate.logicalName || '') :
                              field === 'dataType' ? columnToUpdate.dataType :
                              field === 'defaultValue' ? (columnToUpdate.defaultValue || '') :
                              field === 'comment' ? (columnToUpdate.comment || '') : '';
          setOriginalValues(prev => ({
            ...prev,
            [originalKey]: currentValue
          }));
        }
        
        // 기존 타이머가 있으면 클리어
        if (historyTimeouts[timeoutKey]) {
          clearTimeout(historyTimeouts[timeoutKey]);
        }
        
        // 새 타이머 설정 (1초 후 히스토리 저장)
        const newTimeout = setTimeout(() => {
          const originalValue = originalValues[originalKey] || '';
          
          // 이름 필드는 물리명/논리명 구분하여 저장
          if (field === 'name') {
            useStore.getState().saveHistoryState(HISTORY_ACTIONS.CHANGE_COLUMN_PHYSICAL_NAME, {
              oldName: originalValue,
              newName: value,
              entityName: nodes.find(n => n.id === targetNodeId)?.data?.label
            });
          } else if (field === 'logicalName') {
            useStore.getState().saveHistoryState(HISTORY_ACTIONS.CHANGE_COLUMN_LOGICAL_NAME, {
              oldName: originalValue,
              newName: value,
              entityName: nodes.find(n => n.id === targetNodeId)?.data?.label
            });
          } else {
            useStore.getState().saveHistoryState(HISTORY_ACTIONS.MODIFY_COLUMN, {
              columnName: columnToUpdate.name,
              field: field,
              oldValue: originalValue,
              newValue: value,
              entityId: targetNodeId,
              entityName: nodes.find(n => n.id === targetNodeId)?.data?.label
            });
          }
          
          // 완료된 타이머와 원본 값 제거
          setHistoryTimeouts(prev => {
            const newTimeouts = { ...prev };
            delete newTimeouts[timeoutKey];
            return newTimeouts;
          });
          
          setOriginalValues(prev => {
            const newValues = { ...prev };
            delete newValues[originalKey];
            return newValues;
          });
        }, 1000);
        
        // 새 타이머 저장
        setHistoryTimeouts(prev => ({
          ...prev,
          [timeoutKey]: newTimeout
        }));
      }
    }
    
    // FK 제약조건 복합키 동기화 처리
    newColumns.forEach(col => {
      if (col._syncInfo) {
        const { field, value, syncColumnIds } = col._syncInfo;
        
        // 동기화할 다른 컬럼들 업데이트
        syncColumnIds.forEach((syncId: string) => {
          const syncIndex = newColumns.findIndex(c => c.id === syncId);
          if (syncIndex !== -1) {
            newColumns[syncIndex] = {
              ...newColumns[syncIndex],
              [field]: value
            };
          }
        });
        
        // 임시 동기화 정보 제거
        delete col._syncInfo;
      }
    });
    
    // FK 제약조건 히스토리 정보 처리
    let fkHistoryInfo: any = null;
    newColumns.forEach(col => {
      if (col._historyInfo) {
        fkHistoryInfo = col._historyInfo;
        delete col._historyInfo;
      }
    });
    
    // 일반적인 경우 updateNodeData 호출 (PK 해제, UQ 체크가 아닌 경우)
    if (targetNodeId) {
      const selectedNode = nodes.find(node => node.id === targetNodeId);
      if (selectedNode) {
        updateNodeData(targetNodeId, {
          ...selectedNode.data,
          columns: newColumns,
          label: tableName
        });
        
        // FK 제약조건 변경의 경우 노드 업데이트 후에 히스토리 저장
        if (fkHistoryInfo) {
          setTimeout(() => {
            useStore.getState().saveHistoryState(fkHistoryInfo.actionType as any, fkHistoryInfo.metadata);
          }, 100);
        }
      }
    }
  };

  const updateTableName = (newName: string) => {
    setTableName(newName);
    const targetNodeId = currentPanelNodeId || selectedNodeId;
    if (targetNodeId) {
      const selectedNode = nodes.find(node => node.id === targetNodeId);
      if (selectedNode) {
        updateNodeData(targetNodeId, {
          ...selectedNode.data,
          label: newName,
          physicalName: newName
        });
      }
    }
  };

  const updateTableLogicalName = (newName: string) => {
    setTableLogicalName(newName);
    const targetNodeId = currentPanelNodeId || selectedNodeId;
    if (targetNodeId) {
      const selectedNode = nodes.find(node => node.id === targetNodeId);
      if (selectedNode) {
        updateNodeData(targetNodeId, {
          ...selectedNode.data,
          logicalName: newName
        });
      }
    }
  };

  const handleTableNameDoubleClick = () => {
    setIsEditingTableName(true);
    
    // 원본 값 저장 (히스토리용)
    if (selectedNodeId) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode) {
        setOriginalEntityNames(prev => ({
          ...prev,
          physical: selectedNode.data?.physicalName || selectedNode.data?.label || ''
        }));
      }
    }
    
    // controlled 상태 초기화 - 현재 테이블 이름으로 설정
    const currentValue = tableName || '';
    setTableControlledValue(currentValue);
    setTableDisplayValue(currentValue);
  };

  const handleLogicalNameDoubleClick = () => {
    setIsEditingLogicalName(true);
    
    // 원본 값 저장 (히스토리용)
    if (selectedNodeId) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode) {
        setOriginalEntityNames(prev => ({
          ...prev,
          logical: selectedNode.data?.logicalName || ''
        }));
      }
    }
  };

  const handleTableNameBlur = () => {
    setIsEditingTableName(false);
    
    // controlled 상태 초기화
    setTableControlledValue('');
    setTableDisplayValue('');
    
    // 실제 노드 데이터 업데이트
    if (selectedNodeId && tableName !== undefined) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode) {
        updateNodeData(selectedNodeId, {
          ...selectedNode.data,
          label: tableName,
          physicalName: tableName
        });
      }
    }
    
    // 엔티티 물리명 변경 후 히스토리 저장
    if (selectedNodeId && tableName !== undefined) {
      useStore.getState().saveHistoryState(HISTORY_ACTIONS.CHANGE_ENTITY_PHYSICAL_NAME, {
        oldName: originalEntityNames.physical,
        newName: tableName
      });
    }
  };

  const handleLogicalNameBlur = () => {
    setIsEditingLogicalName(false);
    
    // 실제 노드 데이터 업데이트  
    if (selectedNodeId && tableLogicalName !== undefined) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode) {
        updateNodeData(selectedNodeId, {
          ...selectedNode.data,
          logicalName: tableLogicalName
        });
      }
    }
    
    // 엔티티 논리명 변경 후 히스토리 저장
    if (selectedNodeId && tableLogicalName !== undefined) {
      useStore.getState().saveHistoryState(HISTORY_ACTIONS.CHANGE_ENTITY_LOGICAL_NAME, {
        oldName: originalEntityNames.logical,
        newName: tableLogicalName
      });
    }
  };

  const handleLogicalNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // 엔터키 시에도 blur와 동일한 로직 실행
      handleLogicalNameBlur();
    }
    if (e.key === 'Escape') {
      setIsEditingLogicalName(false);
    }
  };

  const handleCellDoubleClick = (columnId: string, field: string) => {
    setEditingCell(`${columnId}-${field}`);
    
    // controlled 상태 초기화 - 현재 컬럼 값으로 설정
    const column = columns.find(col => col.id === columnId);
    if (column) {
      if (field === 'name') {
        const currentValue = column.name || '';
        setColumnControlledValues(prev => ({ ...prev, [`${columnId}-name`]: currentValue }));
        setColumnDisplayValues(prev => ({ ...prev, [`${columnId}-name`]: currentValue }));
      } else if (field === 'dataType') {
        const currentValue = column.dataType || '';
        setColumnControlledValues(prev => ({ ...prev, [`${columnId}-dataType`]: currentValue }));
        setColumnDisplayValues(prev => ({ ...prev, [`${columnId}-dataType`]: currentValue }));
      }
    }
    
    // 다음 프레임에서 포커스와 커서 위치 설정
    setTimeout(() => {
      const input = document.querySelector(`input[data-editing="${columnId}-${field}"]`) as HTMLInputElement;
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length); // 커서를 끝으로
      }
    }, 0);
  };

  const handleCellBlur = () => {
    // controlled 상태 초기화
    if (editingCell) {
      const [columnId, field] = editingCell.split('-');
      if (field === 'name' || field === 'dataType') {
        setColumnControlledValues(prev => {
          const newState = { ...prev };
          delete newState[editingCell];
          return newState;
        });
        setColumnDisplayValues(prev => {
          const newState = { ...prev };
          delete newState[editingCell];
          return newState;
        });
      }
    }
    setEditingCell(null);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    // 자동완성이 열려있고 현재 편집 중인 셀이 데이터타입 필드인 경우
    if (showAutocomplete && editingCell?.endsWith('-dataType') && autocompleteSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => 
          prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => 
          prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1
        );
        return;
      }
      if (e.key === 'Enter' && selectedAutocompleteIndex >= 0) {
        e.preventDefault();
        e.stopPropagation();
        const selectedDataType = autocompleteSuggestions[selectedAutocompleteIndex];
        const columnId = editingCell.replace('-dataType', '');
        updateColumnField(columnId, 'dataType', selectedDataType);
        setShowAutocomplete(false);
        setAutocompleteColumnId(null);
        setSelectedAutocompleteIndex(-1);
        setEditingCell(null);
        (e.target as HTMLInputElement).blur();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setShowAutocomplete(false);
        setAutocompleteColumnId(null);
        setSelectedAutocompleteIndex(-1);
        setEditingCell(null);
        (e.target as HTMLInputElement).blur();
        return;
      }
    }
    
    // Tab 키 네비게이션 처리
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      
      if (editingCell) {
        // 현재 편집 중인 셀 정보 파싱
        const [columnId, field] = editingCell.split('-');
        const currentEntity = nodes.find((entity: any) => entity.id === selectedNodeId);
        const currentColumnIndex = currentEntity?.data?.columns?.findIndex((col: any) => col.id === columnId) ?? -1;
        
        if (currentEntity && currentEntity.data?.columns && currentColumnIndex >= 0) {
          const fieldOrder = ['name', 'logicalName', 'dataType', 'defaultValue'];
          const currentFieldIndex = fieldOrder.indexOf(field);
          
          // 자동완성 닫기
          setShowAutocomplete(false);
          setAutocompleteColumnId(null);
          setSelectedAutocompleteIndex(-1);
          
          if (e.shiftKey) {
            // Shift+Tab: 이전 필드로 이동
            if (currentFieldIndex > 0) {
              // 같은 행의 이전 필드
              let prevField = fieldOrder[currentFieldIndex - 1];
              // FK 컬럼에서 데이터타입 필드는 스킵
              if (prevField === 'dataType' && currentEntity.data.columns[currentColumnIndex].fk) {
                prevField = fieldOrder[currentFieldIndex - 2]; // logicalName으로 스킵
              }
              if (prevField && fieldOrder.indexOf(prevField) >= 0) {
                setEditingCell(`${columnId}-${prevField}`);
              }
            } else if (currentColumnIndex > 0) {
              // 이전 행의 마지막 필드
              const prevColumn = currentEntity.data.columns[currentColumnIndex - 1];
              setEditingCell(`${prevColumn.id}-defaultValue`);
            }
          } else {
            // Tab: 다음 필드로 이동
            if (currentFieldIndex < fieldOrder.length - 1) {
              // 같은 행의 다음 필드
              let nextField = fieldOrder[currentFieldIndex + 1];
              // FK 컬럼에서 데이터타입 필드는 스킵
              if (nextField === 'dataType' && currentEntity.data.columns[currentColumnIndex].fk) {
                nextField = fieldOrder[currentFieldIndex + 2]; // defaultValue로 스킵
              }
              if (nextField) {
                setEditingCell(`${columnId}-${nextField}`);
              }
            } else if (currentColumnIndex < currentEntity.data.columns.length - 1) {
              // 다음 행의 첫 번째 필드
              const nextColumn = currentEntity.data.columns[currentColumnIndex + 1];
              setEditingCell(`${nextColumn.id}-name`);
            } else {
              // 마지막 필드이면 편집 종료
              setEditingCell(null);
              (e.target as HTMLInputElement).blur();
            }
          }
        }
      }
      return;
    }
    
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      e.stopPropagation();
      
      // Tab과 유사하지만 다음 행의 같은 필드로 이동
      if (editingCell) {
        const [columnId, field] = editingCell.split('-');
        const currentEntity = nodes.find((entity: any) => entity.id === selectedNodeId);
        const currentColumnIndex = currentEntity?.data?.columns?.findIndex((col: any) => col.id === columnId) ?? -1;
        
        if (currentEntity && currentEntity.data?.columns && currentColumnIndex >= 0) {
          // 자동완성 닫기
          setShowAutocomplete(false);
          setAutocompleteColumnId(null);
          setSelectedAutocompleteIndex(-1);
          
          if (currentColumnIndex < currentEntity.data.columns.length - 1) {
            // 다음 행의 같은 필드로 이동
            const nextColumn = currentEntity.data.columns[currentColumnIndex + 1];
            // FK 컬럼에서 데이터타입 필드는 스킵해서 name 필드로 이동
            let targetField = field;
            if (field === 'dataType' && nextColumn.fk) {
              targetField = 'name';
            }
            setEditingCell(`${nextColumn.id}-${targetField}`);
          } else {
            // 마지막 행이면 편집 종료
            setEditingCell(null);
            (e.target as HTMLInputElement).blur();
          }
        }
      } else {
        // 자동완성 닫기
        setShowAutocomplete(false);
        setAutocompleteColumnId(null);
        setSelectedAutocompleteIndex(-1);
        setEditingCell(null);
        (e.target as HTMLInputElement).blur();
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      // 자동완성 닫기
      setShowAutocomplete(false);
      setAutocompleteColumnId(null);
      setSelectedAutocompleteIndex(-1);
      setEditingCell(null);
      (e.target as HTMLInputElement).blur();
    }
  };

  // 컬럼 순서 변경 함수
  const moveColumn = (columnId: string, direction: 'up' | 'down') => {
    const currentIndex = columns.findIndex(col => col.id === columnId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= columns.length) return;

    const newColumns = [...columns];
    [newColumns[currentIndex], newColumns[newIndex]] = [newColumns[newIndex], newColumns[currentIndex]];
    
    setColumns(newColumns);

    // 엔티티 노드의 데이터 업데이트
    const targetNodeId = currentPanelNodeId || selectedNodeId;
    if (targetNodeId) {
      const selectedNode = nodes.find(node => node.id === targetNodeId);
      if (selectedNode && selectedNode.type === 'entity') {
        updateNodeData(targetNodeId, {
          ...selectedNode.data,
          columns: newColumns,
          label: tableName
        });
        
        // 컬럼 순서 변경 후 관계선 Handle 업데이트
        setTimeout(() => {
          updateEdgeHandles();
        }, 50);
        
        // 컬럼 순서 변경 히스토리 저장
        
        useStore.getState().saveHistoryState('REORDER_COLUMNS', {
          entityId: targetNodeId,
          entityName: selectedNode.data.label,
          columnId: columnId,
          direction: direction
        });
      }
    }
  };

  const handleRowClick = (column: any, e: React.MouseEvent) => {
    // 더블클릭이나 input 클릭이 아닌 경우에만 행 선택
    if ((e.target as HTMLElement).tagName !== 'INPUT') {
      setSelectedColumn(column);
    }
  };

  const isDarkMode = theme === 'dark';

  // 초기 렌더링 중이거나 로딩 중일 때 빈 화면 표시
  if (initialRender || isLoading) {
    return (
      <>
        {isLoading && (
          <LoadingOverlay $darkMode={isDarkMode}>
            <LoadingContainer $darkMode={isDarkMode}>
              <Spinner $darkMode={isDarkMode} />
              <LoadingText $darkMode={isDarkMode}>{loadingMessage}</LoadingText>
              <ProgressBar $darkMode={isDarkMode}>
                <ProgressFill $progress={loadingProgress} $darkMode={isDarkMode} />
                <ProgressPercentage $darkMode={isDarkMode}>{loadingProgress}%</ProgressPercentage>
              </ProgressBar>
            </LoadingContainer>
          </LoadingOverlay>
        )}
        {initialRender && !isLoading && (
          <Container $darkMode={isDarkMode} style={{ visibility: 'hidden' }}>
            {/* 초기 렌더링 중 빈 컨테이너 */}
          </Container>
        )}
      </>
    );
  }

  return (
    <>
      <Container $darkMode={isDarkMode}>
        <TopContainer $darkMode={isDarkMode}>
          <ClassHeader erdId={erdId} />
          <ToolboxContainer $darkMode={isDarkMode}>
            <ClassToolbox />
          </ToolboxContainer>
                  <CanvasContainer 
          $darkMode={isDarkMode}
          onClick={() => {
            if (dropdownOpen === 'fk-options') {
              
              setDropdownOpen(null);
              setDropdownPosition(null);
              setDropdownType(null);
              setDropdownColumnId(null);
              setTooltip({ visible: false, x: -9999, y: -9999, content: '', position: 'top' });
            }
            
            // 자동완성 드롭다운 닫기
            if (showAutocomplete) {
              setShowAutocomplete(false);
              setAutocompleteColumnId(null);
              setSelectedAutocompleteIndex(-1);
            }
          }}
        >
          {!isLoading && <ClassCanvas />}
        </CanvasContainer>
        </TopContainer>
      {isBottomPanelOpen && (
        <BottomPanelContainer $height={bottomPanelHeight} $darkMode={isDarkMode}>
          <ResizeHandle 
            onMouseDown={handleMouseDown} 
            $darkMode={isDarkMode}
            onClick={(e) => {
              // 리사이즈 핸들 클릭 시에도 자동완성 닫기
              if (showAutocomplete) {
                setShowAutocomplete(false);
                setAutocompleteColumnId(null);
                setSelectedAutocompleteIndex(-1);
              }
            }}
          />
          <BottomPanelHeader $darkMode={isDarkMode}>
            <TableTitle>
              <TableIcon />
              <span style={{ fontSize: '10px', color: isDarkMode ? '#cbd5e0' : '#666', marginRight: '4px' }}>물리명:</span>
              {isEditingTableName ? (
                <TableNameInput
                  $darkMode={isDarkMode}
                  value={isEditingTableName ? tableDisplayValue : (tableName || '')}
                  onChange={(e) => {
                    // Test.tsx와 똑같이 - controlled component에서는 onChange 무시
                  }}
                  onKeyDown={testHandleKeyDown}
                  onCompositionStart={testHandleCompositionStart}
                  onCompositionUpdate={testHandleCompositionUpdate}
                  onCompositionEnd={testHandleCompositionEnd}
                  onBeforeInput={testHandleBeforeInput}
                  onInput={testHandleInput}
                  onBlur={(e) => {
                    handleTableNameBlur();
                  }}
                  onPaste={testHandlePaste}
                  autoFocus
                  placeholder="물리명"
                  ref={tableNameInputRef}
                  readOnly={!isEditingTableName}
                />
              ) : (
                <TableNameDisplay $darkMode={isDarkMode} onDoubleClick={handleTableNameDoubleClick}>
                  {tableName || '물리명'}
                </TableNameDisplay>
              )}
              <span style={{ margin: '0 8px', color: '#ccc' }}>/</span>
              <span style={{ fontSize: '10px', color: isDarkMode ? '#cbd5e0' : '#666', marginRight: '4px' }}>논리명:</span>
              {isEditingLogicalName ? (
                <LogicalNameInput
                  $darkMode={isDarkMode}
                  value={tableLogicalName}
                  onChange={(e) => updateTableLogicalName(e.target.value)}
                  onBlur={handleLogicalNameBlur}
                  onKeyDown={handleLogicalNameKeyPress}
                  autoFocus
                  placeholder="논리명"
                />
              ) : (
                <LogicalNameDisplay $darkMode={isDarkMode} onDoubleClick={handleLogicalNameDoubleClick}>
                  {tableLogicalName || '논리명'}
                </LogicalNameDisplay>
              )}
            </TableTitle>
            <CloseButton $darkMode={isDarkMode} onClick={() => setBottomPanelOpen(false)}>
              ×
            </CloseButton>
          </BottomPanelHeader>
          
          {/* 탭에 따른 컨텐츠 표시 영역 */}
          {activeTab === 'columns' && (
          <TableContainer $darkMode={isDarkMode}>
            <TableScrollContainer $darkMode={isDarkMode}>
              <Table $darkMode={isDarkMode}>
              <TableHeader $darkMode={isDarkMode}>
                <HeaderRow $darkMode={isDarkMode}>
                  <HeaderCell $darkMode={isDarkMode} key="order" style={{ width: '60px' }}>순서</HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="column-name">물리명</HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="logical-name">논리명</HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="datatype">데이터타입</HeaderCell>
                  <HeaderCell 
                    $darkMode={isDarkMode} 
                    key="pk" 
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      if (hoveredHeaderId !== 'pk') {
                        setHoveredHeaderId('pk');
                        if (tooltipTimeoutRef.current) {
                          clearTimeout(tooltipTimeoutRef.current);
                        }
                        tooltipTimeoutRef.current = setTimeout(() => {
                          setTooltip({
                            visible: true,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 60,
                            content: 'Primary Key (기본키)\n테이블의 고유 식별자로 사용되는 컬럼입니다.',
                            position: 'top'
                          });
                        }, 500);
                      } else {
                        setTooltip({
                          visible: true,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 60,
                          content: 'Primary Key (기본키)\n테이블의 고유 식별자로 사용되는 컬럼입니다.',
                          position: 'top'
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredHeaderId(null);
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current);
                        tooltipTimeoutRef.current = null;
                      }
                      setTooltip({ visible: false, x: -9999, y: -9999, content: '', position: 'top' });
                    }}
                  >
                    PK
                  </HeaderCell>
                  <HeaderCell 
                    $darkMode={isDarkMode} 
                    key="nn" 
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                                              if (hoveredHeaderId !== 'nn') {
                          setHoveredHeaderId('nn');
                          if (tooltipTimeoutRef.current) {
                            clearTimeout(tooltipTimeoutRef.current);
                          }
                          tooltipTimeoutRef.current = setTimeout(() => {
                            setTooltip({
                              visible: true,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 60,
                              content: 'Not Null (널 허용 안함)\nNULL 값을 허용하지 않는 컬럼입니다.',
                              position: 'top'
                            });
                          }, 500);
                        } else {
                        setTooltip({
                          visible: true,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 60,
                          content: 'Not Null (널 허용 안함)\nNULL 값을 허용하지 않는 컬럼입니다.',
                          position: 'top'
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredHeaderId(null);
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current);
                        tooltipTimeoutRef.current = null;
                      }
                      setTooltip({ visible: false, x: -9999, y: -9999, content: '', position: 'top' });
                    }}
                  >
                    NN
                  </HeaderCell>
                  <HeaderCell 
                    $darkMode={isDarkMode} 
                    key="uq" 
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                                              if (hoveredHeaderId !== 'uq') {
                          setHoveredHeaderId('uq');
                          if (tooltipTimeoutRef.current) {
                            clearTimeout(tooltipTimeoutRef.current);
                          }
                          tooltipTimeoutRef.current = setTimeout(() => {
                            setTooltip({
                              visible: true,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 60,
                              content: 'Unique (고유키)\n중복된 값을 허용하지 않는 컬럼입니다.',
                              position: 'top'
                            });
                          }, 500);
                        } else {
                        setTooltip({
                          visible: true,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 60,
                          content: 'Unique (고유키)\n중복된 값을 허용하지 않는 컬럼입니다.',
                          position: 'top'
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredHeaderId(null);
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current);
                        tooltipTimeoutRef.current = null;
                      }
                      setTooltip({ visible: false, x: -9999, y: -9999, content: '', position: 'top' });
                    }}
                  >
                    UQ
                  </HeaderCell>
                  <HeaderCell 
                    $darkMode={isDarkMode} 
                    key="ai" 
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                                              if (hoveredHeaderId !== 'ai') {
                          setHoveredHeaderId('ai');
                          if (tooltipTimeoutRef.current) {
                            clearTimeout(tooltipTimeoutRef.current);
                          }
                          tooltipTimeoutRef.current = setTimeout(() => {
                            setTooltip({
                              visible: true,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 80,
                              content: 'Auto Increment (자동 증가)\n새 레코드 추가 시 자동으로 증가하는 컬럼입니다.\nPK, INT만 사용가능합니다.',
                              position: 'top'
                            });
                          }, 500);
                        } else {
                        setTooltip({
                          visible: true,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 80,
                          content: 'Auto Increment (자동 증가)\n새 레코드 추가 시 자동으로 증가하는 컬럼입니다.\nPK, INT만 사용가능합니다.',
                          position: 'top'
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredHeaderId(null);
                      if (tooltipTimeoutRef.current) {
                        clearTimeout(tooltipTimeoutRef.current);
                        tooltipTimeoutRef.current = null;
                      }
                      setTooltip({ visible: false, x: -9999, y: -9999, content: '', position: 'top' });
                    }}
                  >
                    AI
                  </HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="default">기본값</HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="comment">주석</HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="delete">삭제</HeaderCell>
                </HeaderRow>
              </TableHeader>
              <TableBody>
                {columns.filter(column => column).map((column, index) => (
                  <TableRow 
                    key={`row-${column.id}`} 
                    $selected={selectedColumn?.id === column.id}
                    $darkMode={isDarkMode}
                    onClick={(e) => handleRowClick(column, e)}
                  >
                    {/* 순서 변경 버튼 */}
                    <TableCell $darkMode={isDarkMode} style={{ width: '70px', textAlign: 'center', padding: '8px 4px' }}>
                      <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveColumn(column.id, 'up');
                          }}
                          disabled={index === 0}
                          style={{
                            background: index === 0 ? (isDarkMode ? '#1a202c' : '#e9ecef') : (isDarkMode ? '#4a5568' : '#fff'),
                            border: `1px solid ${isDarkMode ? '#2d3748' : '#dee2e6'}`,
                            color: index === 0 ? (isDarkMode ? '#4a5568' : '#6c757d') : (isDarkMode ? '#f7fafc' : '#495057'),
                            borderRadius: '3px',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '10px',
                            padding: '3px 5px',
                            fontWeight: 'normal',
                            minWidth: '20px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          title="위로 이동"
                        >
                          ▲
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveColumn(column.id, 'down');
                          }}
                          disabled={index === columns.length - 1}
                          style={{
                            background: index === columns.length - 1 ? (isDarkMode ? '#1a202c' : '#e9ecef') : (isDarkMode ? '#4a5568' : '#fff'),
                            border: `1px solid ${isDarkMode ? '#2d3748' : '#dee2e6'}`,
                            color: index === columns.length - 1 ? (isDarkMode ? '#4a5568' : '#6c757d') : (isDarkMode ? '#f7fafc' : '#495057'),
                            borderRadius: '3px',
                            cursor: index === columns.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '10px',
                            padding: '3px 5px',
                            fontWeight: 'normal',
                            minWidth: '20px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          title="아래로 이동"
                        >
                          ▼
                        </button>
                      </div>
                    </TableCell>
                    <TableCell $darkMode={isDarkMode} key={`${column.id}-name`} onDoubleClick={() => handleCellDoubleClick(column.id, 'name')}>
                      <EditableCell 
                        $darkMode={isDarkMode}
                        className={editingCell === `${column.id}-name` ? 'editing' : ''}
                        data-editing={editingCell === `${column.id}-name` ? `${column.id}-name` : ''}
                        value={editingCell === `${column.id}-name` ? 
                          (columnDisplayValues[`${column.id}-name`] !== undefined ? columnDisplayValues[`${column.id}-name`] : (column.name || '')) :
                          (column.name || '')
                        }
                        onChange={(e) => {
                          // Test.tsx와 똑같이 - controlled component에서는 onChange 무시
                        }}
                        onKeyDown={testHandleKeyDown}
                        onCompositionStart={testHandleCompositionStart}
                        onCompositionUpdate={testHandleCompositionUpdate}
                        onCompositionEnd={testHandleCompositionEnd}
                        onBeforeInput={testHandleBeforeInput}
                        onInput={testHandleInput}
                        onBlur={(e) => {
                          handleCellBlur();
                        }}
                        onPaste={testHandlePaste}
                        readOnly={editingCell !== `${column.id}-name`}
                      />
                    </TableCell>
                    <TableCell $darkMode={isDarkMode} key={`${column.id}-logical`} onDoubleClick={() => handleCellDoubleClick(column.id, 'logicalName')}>
                      <EditableCell 
                        $darkMode={isDarkMode}
                        className={editingCell === `${column.id}-logicalName` ? 'editing' : ''}
                        data-editing={editingCell === `${column.id}-logicalName` ? `${column.id}-logicalName` : ''}
                        value={column.logicalName === undefined ? '' : column.logicalName}
                        onChange={(e) => updateColumnField(column.id, 'logicalName', e.target.value)}
                        onBlur={() => {
                          handleCellBlur();
                        }}
                        onKeyDown={handleCellKeyDown}
                        readOnly={editingCell !== `${column.id}-logicalName`}
                      />
                    </TableCell>
                    <TableCell $darkMode={isDarkMode} key={`${column.id}-datatype`} onDoubleClick={() => !column.fk && handleCellDoubleClick(column.id, 'dataType')}>
                      <DataTypeInputContainer $isOpen={dropdownOpen === `${column.id}-datatype`}>
                        <DataTypeInput 
                          $darkMode={isDarkMode}
                          className={editingCell === `${column.id}-dataType` ? 'editing' : ''}
                          data-editing={editingCell === `${column.id}-dataType` ? `${column.id}-dataType` : ''}
                          value={editingCell === `${column.id}-dataType` ? 
                            (columnDisplayValues[`${column.id}-dataType`] !== undefined ? columnDisplayValues[`${column.id}-dataType`] : (column.dataType || '')) :
                            (column.dataType || '')
                          }
                          onChange={(e) => {
                            // Test.tsx와 똑같이 - controlled component에서는 onChange 무시
                          }}
                          onKeyDown={testHandleKeyDown}
                          onCompositionStart={testHandleCompositionStart}
                          onCompositionUpdate={testHandleCompositionUpdate}
                          onCompositionEnd={testHandleCompositionEnd}
                          onBeforeInput={testHandleBeforeInput}
                          onInput={testHandleInput}
                          onBlur={(e) => {
                            // 자동완성 관련 처리
                            const relatedTarget = e.relatedTarget as HTMLElement;
                            if (!relatedTarget || (!relatedTarget.closest('[data-autocomplete-item]') && !relatedTarget.closest('[data-dropdown]') && !relatedTarget.closest('[data-dropdown-button]'))) {
                              setShowAutocomplete(false);
                              setAutocompleteColumnId(null);
                              handleCellBlur();
                              setDropdownOpen(null);
                            }
                          }}
                          onPaste={testHandlePaste}
                          readOnly={editingCell !== `${column.id}-dataType` || column.fk}
                          placeholder={column.fk ? "FK 컬럼은 수정 불가" : "데이터타입 선택 또는 입력"}
                        />
                        <DropdownButton 
                          $darkMode={isDarkMode} 
                          $visible={editingCell === `${column.id}-dataType` && !column.fk}
                          data-dropdown-button="true"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (editingCell === `${column.id}-dataType` && !column.fk) {
                              if (dropdownOpen === `${column.id}-datatype`) {
                                setDropdownOpen(null);
                                setDropdownPosition(null);
                              } else {
                                calculateDropdownPosition(e.currentTarget);
                                setDropdownOpen(`${column.id}-datatype`);
                              }
                            }
                          }}
                        >
                          ▼
                        </DropdownButton>
                        {dropdownOpen === `${column.id}-datatype` && editingCell === `${column.id}-dataType` && !column.fk && dropdownPosition && (
                          <PortalDropdown
                            isOpen={true}
                            position={dropdownPosition}
                            onClose={() => {
                              setDropdownOpen(null);
                              setDropdownPosition(null);
                              setEditingCell(null);
                            }}
                            onSelect={(type) => {
                              updateColumnField(column.id, 'dataType', type);
                              setDropdownOpen(null);
                              setDropdownPosition(null);
                              setEditingCell(null);
                            }}
                            darkMode={isDarkMode}
                            setTooltip={setTooltip}
                          />
                        )}
                        {/* 자동완성 드롭다운 */}
                        {showAutocomplete && autocompleteColumnId === column.id && editingCell === `${column.id}-dataType` && !column.fk && dropdownPosition && createPortal(
                          <AutocompleteDropdown
                            $darkMode={isDarkMode}
                            $show={true}
                            style={{
                              top: dropdownPosition.top,
                              left: dropdownPosition.left,
                            }}
                          >
                            {autocompleteSuggestions.map((dataType, index) => (
                              <AutocompleteItem
                                key={dataType}
                                $darkMode={isDarkMode}
                                $selected={index === selectedAutocompleteIndex}
                                data-autocomplete-item="true"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // blur 방지
                                }}
                                onMouseEnter={() => {
                                  setSelectedAutocompleteIndex(index);
                                }}
                                onClick={() => {
                                  updateColumnField(column.id, 'dataType', dataType);
                                  setShowAutocomplete(false);
                                  setAutocompleteColumnId(null);
                                  setSelectedAutocompleteIndex(-1);
                                  setEditingCell(null);
                                }}
                              >
                                {dataType}
                              </AutocompleteItem>
                            ))}
                          </AutocompleteDropdown>,
                          document.body
                        )}
                      </DataTypeInputContainer>
                    </TableCell>
                    <CheckboxCell $darkMode={isDarkMode} key={`${column.id}-pk`}>
                      <Checkbox 
                        type="checkbox" 
                        checked={column.pk || false} 
                        onChange={(e) => {
                          updateColumnField(column.id, 'pk', e.target.checked);
                          // 포커스 제거하여 Ctrl+Z/Y 작동 가능하도록
                          setTimeout(() => e.target.blur(), 0);
                        }}
                      />
                    </CheckboxCell>
                    <CheckboxCell $darkMode={isDarkMode} key={`${column.id}-nn`}>
                      <Checkbox 
                        type="checkbox" 
                        checked={column.nn || column.pk || false} 
                        disabled={column.pk}
                        onChange={(e) => {
                          updateColumnField(column.id, 'nn', e.target.checked);
                          // 포커스 제거하여 Ctrl+Z/Y 작동 가능하도록
                          setTimeout(() => e.target.blur(), 0);
                        }}
                      />
                    </CheckboxCell>
                    <CheckboxCell $darkMode={isDarkMode} key={`${column.id}-uq`}>
                      <Checkbox 
                        type="checkbox" 
                        checked={column.uq || false} 
                        onChange={(e) => {
                          updateColumnField(column.id, 'uq', e.target.checked);
                          // 포커스 제거하여 Ctrl+Z/Y 작동 가능하도록
                          setTimeout(() => e.target.blur(), 0);
                        }}
                      />
                    </CheckboxCell>
                    <CheckboxCell $darkMode={isDarkMode} key={`${column.id}-ai`}>
                      <Checkbox 
                        type="checkbox" 
                        checked={column.ai || false} 
                        disabled={(() => {
                          const dataType = column.dataType?.toUpperCase().trim();
                          const isIntType = /^(INT|INTEGER|BIGINT|SMALLINT|TINYINT)(\(\d+\))?$/.test(dataType || '');
                          return !column.pk || !isIntType;
                        })()}
                        onChange={(e) => {
                          updateColumnField(column.id, 'ai', e.target.checked);
                          // 포커스 제거하여 Ctrl+Z/Y 작동 가능하도록
                          setTimeout(() => e.target.blur(), 0);
                        }}
                      />
                    </CheckboxCell>

                    <TableCell $darkMode={isDarkMode} key={`${column.id}-default`} onDoubleClick={() => handleCellDoubleClick(column.id, 'defaultValue')}>
                      <EditableCell 
                        $darkMode={isDarkMode}
                        className={editingCell === `${column.id}-defaultValue` ? 'editing' : ''}
                        data-editing={editingCell === `${column.id}-defaultValue` ? `${column.id}-defaultValue` : ''}
                        value={column.defaultValue || ''}
                        onChange={(e) => updateColumnField(column.id, 'defaultValue', e.target.value)}
                        onBlur={() => {
                          handleCellBlur();
                        }}
                        onKeyDown={handleCellKeyDown}
                        readOnly={editingCell !== `${column.id}-defaultValue`}
                        placeholder="null"
                      />
                    </TableCell>
                    <TableCell $darkMode={isDarkMode} key={`${column.id}-comment`} onDoubleClick={() => handleCellDoubleClick(column.id, 'comment')}>
                      <EditableCell 
                        $darkMode={isDarkMode}
                        className={editingCell === `${column.id}-comment` ? 'editing' : ''}
                        data-editing={editingCell === `${column.id}-comment` ? `${column.id}-comment` : ''}
                        value={column.comment || ''}
                        onChange={(e) => updateColumnField(column.id, 'comment', e.target.value)}
                        onBlur={() => {
                          handleCellBlur();
                        }}
                        onKeyDown={handleCellKeyDown}
                        readOnly={editingCell !== `${column.id}-comment`}
                        placeholder="컬럼에 대한 설명을 입력하세요"
                      />
                    </TableCell>
                    <TableCell $darkMode={isDarkMode} key={`${column.id}-delete`}>
                      <DeleteButton $darkMode={isDarkMode} onClick={() => deleteColumn(column.id)}>
                        Delete
                      </DeleteButton>
                    </TableCell>
                  </TableRow>
                ))}
                <AddColumnRow $darkMode={isDarkMode} key="add-column">
                  <AddColumnCell $darkMode={isDarkMode} colSpan={11} onClick={addColumn}>
                    + Add Column
                  </AddColumnCell>
                </AddColumnRow>
              </TableBody>
            </Table>
            </TableScrollContainer>
          </TableContainer>
          )}
          
          {/* Indexes 탭 컨텐츠 */}
          {activeTab === 'indexes' && (
            <EmptyTabContent $darkMode={isDarkMode}>
              인덱스 기능은 곧 추가될 예정입니다.
            </EmptyTabContent>
          )}
          
          {/* Foreign Keys 탭 컨텐츠 */}
          {activeTab === 'foreignKeys' && (
            <TableContainer $darkMode={isDarkMode}>
                <TableScrollContainer>
                  <Table $darkMode={isDarkMode}>
                    <TableHeader $darkMode={isDarkMode}>
                      <HeaderRow>
                        <HeaderCell $darkMode={isDarkMode} style={{ width: '200px' }}>Foreign Key Name</HeaderCell>
                        <HeaderCell $darkMode={isDarkMode} style={{ width: '300px' }}>Referenced Table.Column</HeaderCell>
                        <HeaderCell $darkMode={isDarkMode} style={{ width: '150px' }}>On Update</HeaderCell>
                        <HeaderCell $darkMode={isDarkMode} style={{ width: '150px' }}>On Delete</HeaderCell>
                      </HeaderRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        // 현재 엔티티의 FK 컬럼들 추출
                        const fkColumns = columns.filter(col => col.fk && col.parentEntityId);
                        
                        return fkColumns.map((fkColumn) => {
                          // 부모 엔티티 정보 가져오기
                          const parentEntity = nodes.find(node => node.id === fkColumn.parentEntityId);
                          const parentTableName = parentEntity?.data?.label || 'Unknown';
                          
                          // 부모 엔티티의 컬럼 정보 가져오기
                          const parentColumns = parentEntity?.data?.columns || [];
                          const parentColumn = parentColumns.find((col: any) => 
                            col.id === fkColumn.parentColumnId || col.name === fkColumn.parentColumnId
                          );
                          const parentColumnName = parentColumn?.name || fkColumn.parentColumnId || 'Unknown';
                          
                          // FK 이름 생성 (없으면 자동 생성)
                          const fkName = fkColumn.fkName || `fk_${tableName}_${fkColumn.name}`;
                          
                          return (
                            <TableRow 
                              key={`fk-${fkColumn.id}`}
                              $selected={false}
                              $darkMode={isDarkMode}
                            >
                              {/* FK 이름 */}
                              <TableCell $darkMode={isDarkMode}>
                                <EditableCell 
                                  $darkMode={isDarkMode}
                                  value={fkName}
                                  onChange={(e) => updateColumnField(fkColumn.id, 'fkName', e.target.value)}
                                  onBlur={() => {}}
                                  placeholder="FK 이름"
                                  style={{ fontSize: '12px' }}
                                />
                              </TableCell>
                              
                              {/* 참조 테이블.컬럼 */}
                              <TableCell $darkMode={isDarkMode}>
                                <span style={{ 
                                  fontSize: '12px',
                                  color: isDarkMode ? '#e2e8f0' : '#374151'
                                }}>
                                  {parentTableName}.{parentColumnName}
                                </span>
                              </TableCell>
                              
                              {/* On Update 드롭다운 */}
                              <TableCell $darkMode={isDarkMode}>
                                <div
                                  data-dropdown-button="fk-options"
                                  style={{
                                    width: '100%',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    border: `1px solid ${isDarkMode ? '#4a5568' : '#d0d0d0'}`,
                                    borderRadius: '3px',
                                    backgroundColor: isDarkMode ? '#374151' : 'white',
                                    color: isDarkMode ? '#e2e8f0' : 'inherit',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    
                                    // 이미 열린 드롭다운이면 닫기
                                    if (dropdownOpen === 'fk-options') {
                                      setDropdownOpen(null);
                                      setDropdownPosition(null);
                                      setDropdownType(null);
                                      setDropdownColumnId(null);
                                      return;
                                    }
                                    
                                    // 새로 열기
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setDropdownPosition({ top: rect.bottom + 2, left: rect.left });
                                    setDropdownType('onUpdate');
                                    setDropdownColumnId(fkColumn.id);
                                    setDropdownOpen('fk-options');
                                  }}
                                >
                                  <span>{fkColumn.onUpdate || 'NO ACTION'}</span>
                                  <span style={{ fontSize: '8px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>▼</span>
                                </div>
                              </TableCell>
                              
                              {/* On Delete 드롭다운 */}
                              <TableCell $darkMode={isDarkMode}>
                                <div
                                  data-dropdown-button="fk-options"
                                  style={{
                                    width: '100%',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    border: `1px solid ${isDarkMode ? '#4a5568' : '#d0d0d0'}`,
                                    borderRadius: '3px',
                                    backgroundColor: isDarkMode ? '#374151' : 'white',
                                    color: isDarkMode ? '#e2e8f0' : 'inherit',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    
                                    // 이미 열린 드롭다운이면 닫기
                                    if (dropdownOpen === 'fk-options') {
                                      setDropdownOpen(null);
                                      setDropdownPosition(null);
                                      setDropdownType(null);
                                      setDropdownColumnId(null);
                                      return;
                                    }
                                    
                                    // 새로 열기
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setDropdownPosition({ top: rect.bottom + 2, left: rect.left });
                                    setDropdownType('onDelete');
                                    setDropdownColumnId(fkColumn.id);
                                    setDropdownOpen('fk-options');
                                  }}
                                >
                                  <span>{fkColumn.onDelete || 'NO ACTION'}</span>
                                  <span style={{ fontSize: '8px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>▼</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        });
                      })()}
                      
                      {/* FK가 없는 경우 메시지 표시 */}
                      {columns.filter(col => col.fk && col.parentEntityId).length === 0 && (
                        <TableRow $selected={false} $darkMode={isDarkMode}>
                          <TableCell $darkMode={isDarkMode} colSpan={4} style={{ 
                            textAlign: 'center', 
                            color: isDarkMode ? '#9ca3af' : '#6b7280',
                            fontStyle: 'italic',
                            padding: '20px'
                          }}>
                            외래키가 없습니다. 엔티티 간 관계를 생성하면 여기에 표시됩니다.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableScrollContainer>
            </TableContainer>
          )}
          
          {/* 툴팁 렌더링 */}
          <Tooltip 
            visible={tooltip.visible} 
            x={tooltip.x} 
            y={tooltip.y} 
            content={tooltip.content} 
            darkMode={isDarkMode}
            position={tooltip.position}
          />
          
          {/* FK 옵션 드롭다운 */}
          {dropdownOpen === 'fk-options' && dropdownPosition && (
            <div data-dropdown="fk-options">
              <PortalDropdown
                isOpen={true}
                position={dropdownPosition}
                onClose={() => {
                  setDropdownOpen(null);
                  setDropdownPosition(null);
                  setDropdownType(null);
                  setDropdownColumnId(null);
                  setTooltip({ visible: false, x: -9999, y: -9999, content: '', position: 'top' });
                }}
                onSelect={(value) => {
                  
                  if (dropdownColumnId && dropdownType) {
                    updateColumnField(dropdownColumnId, dropdownType, value);
                  }
                  setDropdownOpen(null);
                  setDropdownPosition(null);
                  setDropdownType(null);
                  setDropdownColumnId(null);
                  setTooltip({ visible: false, x: -9999, y: -9999, content: '', position: 'top' });
                }}
                darkMode={isDarkMode}
                dropdownType={dropdownType || undefined}
                setTooltip={setTooltip}
              />
            </div>
          )}
          
          {/* 컬럼 탭일 때만 테이블 주석 표시 */}
          {activeTab === 'columns' && (
          <div style={{ 
            padding: '15px', 
            borderTop: `1px solid ${isDarkMode ? '#404040' : '#ddd'}`,
            backgroundColor: isDarkMode ? '#2d3748' : '#f8f9fa'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontSize: '12px',
                fontWeight: 'bold',
                color: isDarkMode ? '#e2e8f0' : '#333'
              }}>
                테이블 주석:
              </label>
              <TableCommentTextarea
                $darkMode={isDarkMode}
                value={nodes.find(n => n.id === (currentPanelNodeId || selectedNodeId))?.data?.comment || ''}
                onChange={(e) => {
                  const targetNodeId = currentPanelNodeId || selectedNodeId;
                  if (targetNodeId) {
                    const selectedNode = nodes.find(n => n.id === targetNodeId);
                    if (selectedNode) {
                      updateNodeData(targetNodeId, { 
                        ...selectedNode.data, 
                        comment: e.target.value 
                      });
                    }
                  }
                }}
                onBlur={() => {
                  // 테이블 주석 변경 히스토리 저장
                  const targetNodeId = currentPanelNodeId || selectedNodeId;
                  
                  useStore.getState().saveHistoryState(HISTORY_ACTIONS.CHANGE_COMMENT_TEXT, {
                    entityId: targetNodeId,
                    entityName: nodes.find(n => n.id === targetNodeId)?.data?.label
                  });
                }}
                placeholder="테이블에 대한 설명을 입력하세요..."
              />
            </div>
          </div>
          )}

          {/* 탭 바 - 항상 바닥에 고정 */}
          <TabBar $darkMode={isDarkMode}>
            <Tab 
              $darkMode={isDarkMode} 
              $active={activeTab === 'columns'}
              onClick={() => setActiveTab('columns')}
            >
              컬럼
            </Tab>
            <Tab 
              $darkMode={isDarkMode} 
              $active={activeTab === 'indexes'}
              onClick={() => setActiveTab('indexes')}
            >
              인덱스
            </Tab>
            <Tab 
              $darkMode={isDarkMode} 
              $active={activeTab === 'foreignKeys'}
              onClick={() => setActiveTab('foreignKeys')}
            >
              외래키
            </Tab>
          </TabBar>

        </BottomPanelContainer>
      )}
      </Container>
    </>
  );
};

export default ClassLayout;
