import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import Header from './Header';
import Toolbox from './Toolbox';
import Canvas from './Canvas';
import useStore from '../store/useStore';
import { toast } from 'react-toastify';
import { MYSQL_DATATYPES, validateEnglishOnly, validateDataType } from '../utils/mysqlTypes';

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

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: #2d3748;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
`;

const ProgressBar = styled.div`
  position: relative;
  width: 240px;
  height: 6px;
  background-color: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #3182ce 0%, #4299e1 100%);
  border-radius: 3px;
  width: ${props => props.progress}%;
  transition: width 0.3s ease-in-out;
`;

const ProgressPercentage = styled.div`
  position: absolute;
  top: -20px;
  right: 0;
  font-size: 12px;
  font-weight: 500;
  color: #2d3748;
`;

const BottomPanelContainer = styled.div<{ $height: number; $darkMode?: boolean }>`
  background-color: ${props => props.$darkMode ? '#2d3748' : '#ffffff'};
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
  background-color: ${props => props.$darkMode ? '#1E1E1E' : '#f5f5f5'};
  border-bottom: 1px solid ${props => props.$darkMode ? '#404040' : '#d0d0d0'};
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

const TableContainer = styled.div<{ $darkMode?: boolean }>`
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  background-color: ${props => props.$darkMode ? '#1E1E1E' : '#ffffff'};
  position: relative;
  
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
  top: 0;
  z-index: 1;
`;

const HeaderRow = styled.tr<{ $darkMode?: boolean }>`
  border-bottom: 1px solid ${props => props.$darkMode ? '#404040' : '#d0d0d0'};
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

// Portal로 렌더링되는 드롭다운 컴포넌트
const PortalDropdown: React.FC<{
  isOpen: boolean;
  position: { top: number; left: number } | null;
  onClose: () => void;
  onSelect: (type: string) => void;
  darkMode: boolean;
}> = ({ isOpen, position, onClose, onSelect, darkMode }) => {
  if (!isOpen || !position) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: '120px',
        maxHeight: '150px',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: darkMode ? '#374151' : 'white',
        border: `1px solid ${darkMode ? '#4a5568' : '#ccc'}`,
        borderRadius: '4px',
        boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.4)',
        zIndex: 2147483647, // 최대 z-index 값
      }}
      data-dropdown="true"
    >
      {MYSQL_DATATYPES.map(type => (
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
      ))}
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

const BottomSection = styled.div<{ $darkMode?: boolean }>`
  padding: 12px 16px 16px 16px;
  background-color: ${props => props.$darkMode ? '#2d3748' : '#f8f8f8'};
  border-top: 1px solid ${props => props.$darkMode ? '#404040' : '#d0d0d0'};
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  font-size: 11px;
  flex-shrink: 0;
  margin-bottom: 8px;
`;

const BottomField = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BottomLabel = styled.label<{ $darkMode?: boolean }>`
  color: ${props => props.$darkMode ? '#cbd5e0' : '#666'};
  min-width: 100px;
`;

const BottomInput = styled.input<{ $darkMode?: boolean }>`
  flex: 1;
  padding: 4px 6px;
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#d0d0d0'};
  font-size: 11px;
  height: 22px;
  border-radius: 2px;
  background-color: ${props => props.$darkMode ? '#374151' : 'white'};
  color: ${props => props.$darkMode ? '#e2e8f0' : 'inherit'};
  
  &::placeholder {
    color: ${props => props.$darkMode ? '#9ca3af' : '#999'};
  }
  
  &:hover {
    border-color: ${props => props.$darkMode ? '#007acc' : '#999'};
  }
  
  &:focus {
    border-color: #007acc;
    outline: none;
    box-shadow: 0 0 2px rgba(0,122,204,0.3);
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

const Layout = () => {
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [initialRender, setInitialRender] = useState(true);
  const { 
    isBottomPanelOpen, 
    setBottomPanelOpen, 
    selectedNodeId, 
    nodes,
    setNodes,
    updateNodeData,
    updateEdgeHandles,
    theme,
    isLoading,
    loadingMessage,
    loadingProgress
  } = useStore();
  const [bottomPanelHeight, setBottomPanelHeight] = useState(250);
  const [isDragging, setIsDragging] = useState(false);
  const [tableName, setTableName] = useState('');
  const [tableLogicalName, setTableLogicalName] = useState('');
  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const [isEditingLogicalName, setIsEditingLogicalName] = useState(false);
  const [columns, setColumns] = useState<any[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<any>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
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
      if (!target.closest('[data-dropdown]') && !target.closest('[data-dropdown-button]') && !target.closest('[data-editing]')) {
        setDropdownOpen(null);
        setDropdownPosition(null);
        // editing 상태도 해제하여 border 제거
        setEditingCell(null);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [dropdownOpen]);

  // 선택된 엔티티의 데이터를 가져오기
  React.useEffect(() => {
    if (selectedNodeId && isBottomPanelOpen) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode && selectedNode.type === 'entity') {
        setTableName(selectedNode.data.physicalName || selectedNode.data.label || 'table1');
        setTableLogicalName(selectedNode.data.logicalName || 'Table');
        const nodeColumns = selectedNode.data.columns || [];
        // 컬럼이 없으면 빈 배열로 시작
        // id가 없는 컬럼에 고유 id 부여하고 dataType과 type 동기화
        const columnsWithIds = nodeColumns.map((col: any, index: number) => {
          // ID가 없거나 유효하지 않은 경우 새로 생성
          const hasValidId = col.id && typeof col.id === 'string' && col.id.trim() !== '';
          return {
            ...col,
            id: hasValidId ? col.id : `col-${selectedNodeId}-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            dataType: col.dataType || col.type || 'VARCHAR', // dataType이 없으면 type으로 설정
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
  }, [selectedNodeId, isBottomPanelOpen, nodes]);

  // columns 변경 시 selectedColumn 동기화
  React.useEffect(() => {
    if (selectedColumn && columns.length > 0) {
      const updatedSelectedColumn = columns.find(col => col.id === selectedColumn.id);
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
    
    // 전역 스타일 적용
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';
  }, [bottomPanelHeight]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    const deltaY = dragRef.current.startY - e.clientY;
    const newHeight = Math.max(150, Math.min(600, dragRef.current.startHeight + deltaY));
    setBottomPanelHeight(newHeight);
  }, [isDragging]);

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
    
    const newColumn = {
      id: `col-${selectedNodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
  };

  const deleteColumn = (columnId: string) => {
    const columnToDelete = columns.find(col => col.id === columnId);
    
    if (columnToDelete) {
      console.log(`🗑️ 컬럼 삭제 시작: ${columnToDelete.name}, PK: ${columnToDelete.pk}, FK: ${columnToDelete.fk}`);
      
      const currentEntity = useStore.getState().nodes.find(n => n.id === selectedNodeId);
      if (currentEntity?.type === 'entity') {
        const allEdges = useStore.getState().edges;
        const allNodes = useStore.getState().nodes;
        
        // 1. FK 컬럼인지 먼저 확인 (이름 패턴으로)
        const columnName = columnToDelete.name;
        const parts = columnName.split('_');
        
        if (parts.length >= 2) {
          const potentialParentName = parts[0];
          
          // 2. 해당 이름의 부모 엔티티 찾기
          const parentEntity = allNodes.find(node => 
            node.type === 'entity' && 
            node.data.label.toLowerCase() === potentialParentName
          );
          
          if (parentEntity) {
            // 3. 부모 엔티티와의 관계선 찾기
            const relationEdge = allEdges.find(edge => 
              edge.source === parentEntity.id && edge.target === selectedNodeId
            );
            
            if (relationEdge) {
              // 4. 부모의 PK 개수 확인 (복합키인지)
              const parentPkColumns = parentEntity.data.columns?.filter((col: any) => col.pk) || [];
              const isCompositeKey = parentPkColumns.length > 1;
              
              if (isCompositeKey) {
                // 5. 복합키 관계: 모든 관련 FK 삭제 + 관계 삭제
                console.log('🔥 복합키 관계 - FK 하나 삭제로 모든 관련 FK와 관계 삭제');
                const fkPrefix = `${potentialParentName}_`;
                const finalColumns = columns.filter(col => !col.name.startsWith(fkPrefix));

                setColumns(finalColumns);
                if (selectedNodeId) {
                  const selectedNode = nodes.find(node => node.id === selectedNodeId);
                  if (selectedNode) {
                    updateNodeData(selectedNodeId, {
                      ...selectedNode.data,
                      columns: finalColumns
                    });
                  }
                }
                // FK가 모두 사라졌으면 selectedColumn도 안전하게 처리
                if (!finalColumns.find(col => col.id === selectedColumn?.id)) {
                  setSelectedColumn(finalColumns[0] || null);
                }
                // 관계선 삭제
                useStore.getState().deleteEdge(relationEdge.id);
                toast.error(`복합키 관계에서 FK 삭제로 인해 ${parentEntity.data.label}과의 모든 관련 FK와 관계가 해제되었습니다.`);
                setTimeout(() => {
                  updateEdgeHandles();
                }, 200);
                return; // 여기서 종료
              } else {
                // 6. 단일키 관계: 해당 FK만 삭제 + 관계 삭제
                console.log('🔗 단일키 관계 - FK 삭제로 관계 해제');
                
                const newColumns = columns.filter(col => col.id !== columnId);
                setColumns(newColumns);
                
                // 노드 데이터 직접 업데이트
                if (selectedNodeId) {
                  const selectedNode = nodes.find(node => node.id === selectedNodeId);
                  if (selectedNode) {
                    updateNodeData(selectedNodeId, {
                      ...selectedNode.data,
                      columns: newColumns
                    });
                  }
                }
                
                if (selectedColumn?.id === columnId) {
                  setSelectedColumn(newColumns[0] || null);
                }
                
                // 관계선 삭제
                useStore.getState().deleteEdge(relationEdge.id);
                
                toast.info(`단일키 관계에서 FK 삭제로 인해 ${parentEntity.data.label}과의 관계가 해제되었습니다.`);
                
                // Handle 업데이트
                setTimeout(() => {
                  updateEdgeHandles();
                }, 200);
                
                return; // 여기서 종료
              }
            }
          }
        }
        
        // 7. PK 컬럼을 삭제한 경우 - 자식 엔티티들의 관련 FK 처리
        if (columnToDelete.pk) {
          console.log(`� PK 컬럼 삭제: ${columnToDelete.name}`);
          
          // 먼저 해당 컬럼 삭제
          const newColumns = columns.filter(col => col.id !== columnId);
          setColumns(newColumns);
          updateNodeColumns(newColumns);
          
          if (selectedColumn?.id === columnId) {
            setSelectedColumn(newColumns[0] || null);
          }
          
          // 삭제 후 남은 PK 개수 확인 (삭제 후 상태)
          const remainingPkColumns = newColumns.filter(col => col.pk);
          
          console.log(`남은 PK 개수: ${remainingPkColumns.length}`);
          
          // 현재 엔티티를 부모로 하는 모든 관계 찾기
          const childEdges = allEdges.filter(edge => edge.source === selectedNodeId);
          
          childEdges.forEach(edge => {
            const targetNode = allNodes.find(n => n.id === edge.target);
            if (targetNode?.type === 'entity') {
              const fkColumnName = `${currentEntity.data.label.toLowerCase()}_${columnToDelete.name}`;
              const targetColumns = targetNode.data.columns || [];
              
              // 해당 FK 컬럼 제거
              const updatedTargetColumns = targetColumns.filter((col: any) => col.name !== fkColumnName);
              
              // 타겟 노드 업데이트
              const updatedNodes = useStore.getState().nodes.map(node => 
                node.id === edge.target 
                  ? { ...node, data: { ...node.data, columns: updatedTargetColumns } }
                  : node
              );
              useStore.getState().setNodes(updatedNodes);
              
              // 남은 PK가 없으면 관계 끊기
              if (remainingPkColumns.length === 0) {
                useStore.getState().deleteEdge(edge.id);
                console.log(`모든 PK 삭제로 관계 끊기: ${edge.id}`);
                toast.warning(`PK가 모두 삭제되어 ${targetNode.data.label}과의 관계가 해제되었습니다.`);
              } else {
                // 남은 PK가 있으면 관계 유지하고 Handle만 업데이트
                console.log(`PK 일부 삭제, 관계 유지 (남은 PK: ${remainingPkColumns.length}개)`);
                toast.info(`${targetNode.data.label}에서 ${fkColumnName} FK가 제거되었습니다. (관계 유지)`);
              }
            }
          });
          
          // Handle 업데이트
          setTimeout(() => {
            updateEdgeHandles();
          }, 200);
          
          return; // 여기서 종료
        }
        
        // 8. 일반 컬럼 삭제
        const newColumns = columns.filter(col => col.id !== columnId);
        setColumns(newColumns);
        
        // 노드 데이터 직접 업데이트
        if (selectedNodeId) {
          const selectedNode = nodes.find(node => node.id === selectedNodeId);
          if (selectedNode) {
            updateNodeData(selectedNodeId, {
              ...selectedNode.data,
              columns: newColumns
            });
          }
        }
        
        if (selectedColumn?.id === columnId) {
          setSelectedColumn(newColumns[0] || null);
        }
        
        // Handle 업데이트
        setTimeout(() => {
          updateEdgeHandles();
        }, 200);
      }
    }
  };

  const updateNodeColumns = (newColumns: any[]) => {
    if (selectedNodeId) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode) {
        updateNodeData(selectedNodeId, {
          ...selectedNode.data,
          columns: newColumns,
          label: tableName
        });
      }
    }
  };

  const updateColumnField = (columnId: string, field: string, value: any) => {
    // 물리명과 데이터타입은 한국어만 차단
    if ((field === 'name' || field === 'dataType') && typeof value === 'string') {
      if (value && /[ㄱ-ㅎ가-힣]/.test(value)) {
        toast.error(field === 'name' ? 
          '물리명에는 한국어를 사용할 수 없습니다.' : 
          '데이터타입에는 한국어를 사용할 수 없습니다.'
        );
        return;
      }
    }
    
    // 컬럼명 중복 체크
    if (field === 'name' && value && value.trim() !== '') {
      const existingColumn = columns.find(col => col.id !== columnId && col.name === value.trim());
      if (existingColumn) {
        toast.error(`컬럼명 "${value}"은(는) 이미 존재합니다.`);
        return;
      }
    }

    const newColumns = columns.map(col => {
      if (col.id === columnId) {
        let updatedCol = { ...col, [field]: value };
        
        // PK 설정 시 NN도 자동으로 체크
        if (field === 'pk' && value === true) {
          updatedCol.nn = true;
          updatedCol.uq = false; // PK 체크하면 UQ 해제
          
          // PK 추가 시 자식 엔티티에 FK 컬럼 추가 (기존 로직 유지, 문제 6 해결용 개선)
          const currentEntity = useStore.getState().nodes.find(n => n.id === selectedNodeId);
          if (currentEntity?.type === 'entity') {
            const allEdges = useStore.getState().edges;
            const childEdges = allEdges.filter(edge => edge.source === selectedNodeId);
            
            if (childEdges.length > 0) {
              let addedFkCount = 0;
              
              childEdges.forEach(edge => {
                const targetNode = useStore.getState().nodes.find(n => n.id === edge.target);
                if (targetNode?.type === 'entity') {
                  const fkColumnName = `${currentEntity.data.label.toLowerCase()}_${updatedCol.name}`;
                  const targetColumns = targetNode.data.columns || [];
                  
                  // 이미 해당 FK 컬럼이 존재하는지 확인
                  const existingFkIndex = targetColumns.findIndex((col: any) => col.name === fkColumnName);
                  
                  if (existingFkIndex === -1) {
                    // 관계 타입에 따라 PK 여부 결정
                    const isIdentifyingRelationship = edge.type === 'one-to-one-identifying' || edge.type === 'one-to-many-identifying';
                    
                    const newFkColumn = {
                      id: `fk-${edge.target}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      name: fkColumnName,
                      type: updatedCol.dataType || updatedCol.type,
                      dataType: updatedCol.dataType || updatedCol.type,
                      pk: isIdentifyingRelationship, // 식별관계면 PK, 비식별관계면 일반 컬럼
                      fk: true,
                      nn: isIdentifyingRelationship, // 식별관계면 NN 필수
                      uq: false,
                      ai: false,
                      comment: `Foreign key from ${currentEntity.data.label}.${updatedCol.name}`,
                      defaultValue: '',
                      // 문제 6 해결을 위한 관계 추적 메타데이터 추가
                      parentEntityId: selectedNodeId,
                      parentColumnId: updatedCol.id || updatedCol.name
                    };
                    
                    const updatedTargetColumns = [...targetColumns, newFkColumn];
                    
                    // 타겟 노드 업데이트
                    const updatedNodes = useStore.getState().nodes.map(node => 
                      node.id === edge.target 
                        ? { ...node, data: { ...node.data, columns: updatedTargetColumns } }
                        : node
                    );
                    useStore.getState().setNodes(updatedNodes);
                    addedFkCount++;
                  }
                }
              });
              
              if (addedFkCount > 0) {
                toast.info(`PK 추가로 인해 ${addedFkCount}개의 자식 엔티티에 FK 컬럼이 추가되었습니다.`);
                
                // FK 추가 후 즉시 Handle 강제 업데이트 - 더 긴 지연시간
                setTimeout(() => {
                  updateEdgeHandles();
                }, 250);
              }
            }
          }
        } else if (field === 'pk' && value === false) {
          // PK 해제 시 NN도 해제
          updatedCol.nn = false;
          
          // FK 컬럼의 PK 해제인지 확인
          const isFkColumn = updatedCol.fk || updatedCol.name.includes('_');
          
          if (!isFkColumn) {
            // 일반 PK 컬럼의 PK 해제 시: 복합키 고려하여 개별 FK만 삭제 (관계는 유지)
            const currentEntity = useStore.getState().nodes.find(n => n.id === selectedNodeId);
            if (currentEntity?.type === 'entity') {
              const relatedEdges = useStore.getState().edges.filter(edge => edge.source === selectedNodeId);
              
              // 각 관계에서 해당 PK에 연결된 FK만 제거
              relatedEdges.forEach(edge => {
                const targetNode = useStore.getState().nodes.find(n => n.id === edge.target);
                if (targetNode?.type === 'entity') {
                  const fkColumnName = `${currentEntity.data.label.toLowerCase()}_${updatedCol.name}`;
                  const targetColumns = targetNode.data.columns || [];
                  
                  // 해당 FK 컬럼이 존재하는지 확인
                  const fkColumnExists = targetColumns.some((col: any) => col.name === fkColumnName);
                  
                  if (fkColumnExists) {
                    // 해당 FK 컬럼만 제거
                    const updatedTargetColumns = targetColumns.filter((col: any) => col.name !== fkColumnName);
                    
                    // 타겟 노드 업데이트
                    const updatedNodes = useStore.getState().nodes.map(node => 
                      node.id === edge.target 
                        ? { ...node, data: { ...node.data, columns: updatedTargetColumns } }
                        : node
                    );
                    useStore.getState().setNodes(updatedNodes);
                    
                    // 부모 엔티티의 PK 개수 확인 (해제하기 전 상태로 판단)
                    const currentPkColumns = currentEntity.data.columns?.filter((col: any) => col.pk) || [];
                    const isCompositeKey = currentPkColumns.length > 1; // 해제하기 전에 2개 이상이면 복합키
                    
                    if (isCompositeKey) {
                      // 복합키인 경우: 관계는 유지하고 FK만 제거
                      toast.info(`${targetNode.data.label}에서 ${fkColumnName} FK가 제거되었습니다. (복합키 관계 유지)`);
                    } else {
                      // 단일키인 경우: 모든 FK가 삭제되면 관계도 삭제
                      const remainingFKs = updatedTargetColumns.filter((col: any) => 
                        col.fk && col.name.startsWith(`${currentEntity.data.label.toLowerCase()}_`)
                      );
                      
                      if (remainingFKs.length === 0) {
                        useStore.getState().deleteEdge(edge.id);
                        toast.warning(`단일키 관계에서 마지막 FK가 제거되어 ${currentEntity.data.label}과 ${targetNode.data.label} 간의 관계가 해제되었습니다.`);
                      } else {
                        toast.info(`${targetNode.data.label}에서 ${fkColumnName} FK가 제거되었습니다. (관계 유지)`);
                      }
                    }
                    
                    // FK 제거 후 Handle 업데이트
                    setTimeout(() => {
                      updateEdgeHandles();
                    }, 150);
                  }
                }
              });
              // PK 해제 후 관계선 Handle 업데이트
              setTimeout(() => {
                updateEdgeHandles();
              }, 200);
            }
          }
        } else if (field === 'uq' && value === true && col.pk === true) {
          updatedCol.pk = false; // UQ 체크하면 PK 해제
          updatedCol.nn = false; // PK 해제 시 NN도 해제 가능하게
          
          // PK를 UQ로 변경했을 때 PK 삭제처럼 동작 (해당 FK만 삭제, 관계 유지)
          const currentEntity = useStore.getState().nodes.find(n => n.id === selectedNodeId);
          if (currentEntity?.type === 'entity') {
            const relatedEdges = useStore.getState().edges.filter(edge => edge.source === selectedNodeId);
            
            // 각 관계에서 해당 PK에 연결된 FK만 제거
            relatedEdges.forEach(edge => {
              const targetNode = useStore.getState().nodes.find(n => n.id === edge.target);
              if (targetNode?.type === 'entity') {
                const fkColumnName = `${currentEntity.data.label.toLowerCase()}_${updatedCol.name}`;
                const targetColumns = targetNode.data.columns || [];
                
                // parentEntityId와 parentColumnId 기반으로 해당 FK 컬럼 찾기
                const targetFkColumn = targetColumns.find((fkCol: any) => 
                  fkCol.fk && fkCol.parentEntityId === selectedNodeId && 
                  (fkCol.parentColumnId === updatedCol.id || fkCol.parentColumnId === updatedCol.name || fkCol.name === fkColumnName)
                );
                
                if (targetFkColumn) {
                  // 해당 FK 컬럼 삭제
                  const updatedTargetColumns = targetColumns.filter((fkCol: any) => fkCol.id !== targetFkColumn.id);
                  
                  // 타겟 노드 업데이트
                  const updatedNodes = useStore.getState().nodes.map(node => 
                    node.id === edge.target 
                      ? { ...node, data: { ...node.data, columns: updatedTargetColumns } }
                      : node
                  );
                  useStore.getState().setNodes(updatedNodes);
                  
                  // 남은 FK가 있는지 확인하여 관계 유지 여부 결정
                  const remainingFKsFromThisParent = updatedTargetColumns.filter((fkCol: any) => 
                    fkCol.fk && fkCol.parentEntityId === selectedNodeId
                  );
                  
                  if (remainingFKsFromThisParent.length === 0) {
                    // 남은 FK가 없으면 관계 제거
                    useStore.getState().deleteEdge(edge.id);
                    toast.info(`PK를 UQ로 변경하여 ${targetNode.data.label}과의 관계가 제거되었습니다.`);
                  } else {
                    toast.info(`PK를 UQ로 변경하여 ${targetNode.data.label}에서 ${targetFkColumn.name} FK가 제거되었습니다. (관계 유지)`);
                  }
                }
              }
            });
            
            // FK 제거 후 Handle 업데이트
            setTimeout(() => {
              updateEdgeHandles();
            }, 150);
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
      if (columnToUpdate && (columnToUpdate.fk || columnToUpdate.name.includes('_'))) {
        const columnName = columnToUpdate.name;
        const parts = columnName.split('_');
        
        if (parts.length >= 2) {
          const parentEntityNameLower = parts[0];
          
          // 같은 관계의 다른 FK 컬럼들 찾기
          const otherFkColumns = columns.filter(col => 
            col.fk && col.name.startsWith(`${parentEntityNameLower}_`) && col.id !== columnId
          );
          
          // 복합키 관계인지 확인 (같은 부모에서 온 FK가 2개 이상)
          const isCompositeKeyRelation = otherFkColumns.length > 0;
          
          if (isCompositeKeyRelation) {
            // 복합키 관계에서 FK PK 설정/해제 시: 모든 FK의 PK를 동일하게 설정/해제
            otherFkColumns.forEach((fkCol, index) => {
              const fkIndex = newColumns.findIndex(c => c.id === fkCol.id);
              if (fkIndex !== -1) {
                newColumns[fkIndex] = { 
                  ...newColumns[fkIndex], 
                  pk: value, 
                  nn: value 
                };
              }
            });
            const actionText = value ? '설정' : '해제';
            const relationshipText = value ? '식별자' : '비식별자';
            toast.info(`복합키 관계에서 모든 FK의 PK가 ${actionText}되었습니다. (컬럼 유지, ${relationshipText} 관계로 변경)`);
          }
          
          // 관계 타입 변경
          const currentEntity = useStore.getState().nodes.find(n => n.id === selectedNodeId);
          if (currentEntity?.type === 'entity') {
            const allEdges = useStore.getState().edges;
            const parentEntity = useStore.getState().nodes.find(node => 
              node.type === 'entity' && node.data.label.toLowerCase() === parentEntityNameLower
            );
            
            if (parentEntity) {
              const relatedEdges = allEdges.filter(edge => 
                edge.source === parentEntity.id && edge.target === selectedNodeId
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
                  const updatedEdges = useStore.getState().edges.map(e => 
                    e.id === edge.id ? { ...e, type: newType } : e
                  );
                  useStore.getState().setEdges(updatedEdges);
                  
                  const actionText = value ? '식별자' : '비식별자';
                  const relationshipDescription = isCompositeKeyRelation ? '복합키 ' : '';
                  toast.info(`${relationshipDescription}FK 컬럼의 PK ${value ? '설정' : '해제'}로 인해 관계가 ${actionText} 관계로 변경되었습니다.`);
                  
                  // 관계 타입 변경 후 즉시 Handle 강제 업데이트 - 더 긴 지연시간
                  setTimeout(() => {
                    updateEdgeHandles();
                  }, 200);
                }
              });
            }
          }
        }
      }
    }
    
    setColumns(newColumns);
    
    // 선택된 컬럼도 즉시 업데이트 (newColumns 배열에서 직접 가져와서 동기화 확실히)
    if (selectedColumn?.id === columnId) {
      const updatedSelectedColumn = newColumns.find(col => col.id === columnId);
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
  };

  const updateTableName = (newName: string) => {
    // 한국어만 차단 (영어, 숫자, 기호는 허용)
    if (newName && /[ㄱ-ㅎ가-힣]/.test(newName)) {
      toast.error('물리명에는 한국어를 사용할 수 없습니다.');
      return;
    }
    
    setTableName(newName);
    if (selectedNodeId) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode) {
        updateNodeData(selectedNodeId, {
          ...selectedNode.data,
          label: newName,
          physicalName: newName
        });
      }
    }
  };

  const updateTableLogicalName = (newName: string) => {
    setTableLogicalName(newName);
    if (selectedNodeId) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode) {
        updateNodeData(selectedNodeId, {
          ...selectedNode.data,
          logicalName: newName
        });
      }
    }
  };

  const handleTableNameDoubleClick = () => {
    setIsEditingTableName(true);
  };

  const handleLogicalNameDoubleClick = () => {
    setIsEditingLogicalName(true);
  };

  const handleTableNameBlur = () => {
    setIsEditingTableName(false);
  };

  const handleLogicalNameBlur = () => {
    setIsEditingLogicalName(false);
  };

  const handleTableNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditingTableName(false);
    }
    if (e.key === 'Escape') {
      setIsEditingTableName(false);
    }
  };

  const handleLogicalNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditingLogicalName(false);
    }
    if (e.key === 'Escape') {
      setIsEditingLogicalName(false);
    }
  };

  const handleCellDoubleClick = (columnId: string, field: string) => {
    setEditingCell(`${columnId}-${field}`);
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
    setEditingCell(null);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      e.stopPropagation();
      setEditingCell(null);
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setEditingCell(null);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
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
    if (selectedNodeId) {
      const selectedNode = nodes.find(node => node.id === selectedNodeId);
      if (selectedNode && selectedNode.type === 'entity') {
        updateNodeData(selectedNodeId, {
          ...selectedNode.data,
          columns: newColumns,
          label: tableName
        });
        
        // 컬럼 순서 변경 후 관계선 Handle 업데이트
        setTimeout(() => {
          updateEdgeHandles();
        }, 50);
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
          <LoadingOverlay>
            <LoadingContainer>
              <Spinner />
              <LoadingText>{loadingMessage}</LoadingText>
              <ProgressBar>
                <ProgressFill progress={loadingProgress} />
                <ProgressPercentage>{loadingProgress}%</ProgressPercentage>
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
          <Header />
          <ToolboxContainer $darkMode={isDarkMode}>
            <Toolbox />
          </ToolboxContainer>
          <CanvasContainer $darkMode={isDarkMode}>
            {!isLoading && <Canvas />}
          </CanvasContainer>
        </TopContainer>
      {isBottomPanelOpen && (
        <BottomPanelContainer $height={bottomPanelHeight} $darkMode={isDarkMode}>
          <ResizeHandle onMouseDown={handleMouseDown} $darkMode={isDarkMode} />
          <BottomPanelHeader $darkMode={isDarkMode}>
            <TableTitle>
              <TableIcon />
              <span style={{ fontSize: '10px', color: isDarkMode ? '#cbd5e0' : '#666', marginRight: '4px' }}>물리명:</span>
              {isEditingTableName ? (
                <TableNameInput 
                  $darkMode={isDarkMode}
                  value={tableName} 
                  onChange={(e) => updateTableName(e.target.value)}
                  onBlur={handleTableNameBlur}
                  onKeyDown={handleTableNameKeyPress}
                  autoFocus
                  placeholder="물리명"
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
          <TableContainer $darkMode={isDarkMode}>
            <Table $darkMode={isDarkMode}>
              <TableHeader $darkMode={isDarkMode}>
                <HeaderRow $darkMode={isDarkMode}>
                  <HeaderCell $darkMode={isDarkMode} key="order" style={{ width: '60px' }}>순서</HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="column-name">Column Name (물리명)</HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="logical-name">Logical Name (논리명)</HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="datatype">Datatype</HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="pk">PK</HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="nn">NN</HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="uq">UQ</HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="ai">AI</HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="default">Default/Expression</HeaderCell>
                  <HeaderCell $darkMode={isDarkMode} key="delete">Delete</HeaderCell>
                </HeaderRow>
              </TableHeader>
              <TableBody>
                {columns.map((column, index) => (
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
                        value={column.name || ''}
                        onChange={(e) => updateColumnField(column.id, 'name', e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleCellKeyDown}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        readOnly={editingCell !== `${column.id}-name`}
                      />
                    </TableCell>
                    <TableCell $darkMode={isDarkMode} key={`${column.id}-logical`} onDoubleClick={() => handleCellDoubleClick(column.id, 'logicalName')}>
                      <EditableCell 
                        $darkMode={isDarkMode}
                        className={editingCell === `${column.id}-logicalName` ? 'editing' : ''}
                        data-editing={editingCell === `${column.id}-logicalName` ? `${column.id}-logicalName` : ''}
                        value={column.logicalName || ''}
                        onChange={(e) => updateColumnField(column.id, 'logicalName', e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleCellKeyDown}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        readOnly={editingCell !== `${column.id}-logicalName`}
                      />
                    </TableCell>
                    <TableCell $darkMode={isDarkMode} key={`${column.id}-datatype`} onDoubleClick={() => handleCellDoubleClick(column.id, 'dataType')}>
                      <DataTypeInputContainer $isOpen={dropdownOpen === `${column.id}-datatype`}>
                        <DataTypeInput 
                          $darkMode={isDarkMode}
                          className={editingCell === `${column.id}-dataType` ? 'editing' : ''}
                          data-editing={editingCell === `${column.id}-dataType` ? `${column.id}-dataType` : ''}
                          value={column.dataType || ''}
                          onChange={(e) => updateColumnField(column.id, 'dataType', e.target.value.toUpperCase())}
                          onBlur={(e) => {
                            // 드롭다운 아이템 클릭이나 버튼 클릭이 아닌 경우에만 blur 처리
                            const relatedTarget = e.relatedTarget as HTMLElement;
                            if (!relatedTarget || (!relatedTarget.closest('[data-dropdown]') && !relatedTarget.closest('[data-dropdown-button]'))) {
                              handleCellBlur(e);
                              setDropdownOpen(null);
                            }
                          }}
                          onKeyDown={handleCellKeyDown}
                          onCompositionStart={handleCompositionStart}
                          onCompositionEnd={handleCompositionEnd}
                          readOnly={editingCell !== `${column.id}-dataType`}
                          placeholder="데이터타입 선택 또는 입력"
                        />
                        <DropdownButton 
                          $darkMode={isDarkMode} 
                          $visible={editingCell === `${column.id}-dataType`}
                          data-dropdown-button="true"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (editingCell === `${column.id}-dataType`) {
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
                        {dropdownOpen === `${column.id}-datatype` && editingCell === `${column.id}-dataType` && dropdownPosition && (
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
                          />
                        )}
                      </DataTypeInputContainer>
                    </TableCell>
                    <CheckboxCell $darkMode={isDarkMode} key={`${column.id}-pk`}>
                      <Checkbox 
                        type="checkbox" 
                        checked={column.pk || false} 
                        onChange={(e) => updateColumnField(column.id, 'pk', e.target.checked)}
                      />
                    </CheckboxCell>
                    <CheckboxCell $darkMode={isDarkMode} key={`${column.id}-nn`}>
                      <Checkbox 
                        type="checkbox" 
                        checked={column.nn || column.pk || false} 
                        disabled={column.pk}
                        onChange={(e) => updateColumnField(column.id, 'nn', e.target.checked)}
                      />
                    </CheckboxCell>
                    <CheckboxCell $darkMode={isDarkMode} key={`${column.id}-uq`}>
                      <Checkbox 
                        type="checkbox" 
                        checked={column.uq || false} 
                        onChange={(e) => updateColumnField(column.id, 'uq', e.target.checked)}
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
                        onChange={(e) => updateColumnField(column.id, 'ai', e.target.checked)}
                      />
                    </CheckboxCell>
                    <TableCell $darkMode={isDarkMode} key={`${column.id}-default`} onDoubleClick={() => handleCellDoubleClick(column.id, 'defaultValue')}>
                      <EditableCell 
                        $darkMode={isDarkMode}
                        className={editingCell === `${column.id}-defaultValue` ? 'editing' : ''}
                        data-editing={editingCell === `${column.id}-defaultValue` ? `${column.id}-defaultValue` : ''}
                        value={column.defaultValue || ''}
                        onChange={(e) => updateColumnField(column.id, 'defaultValue', e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleCellKeyDown}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        readOnly={editingCell !== `${column.id}-defaultValue`}
                        placeholder="Default value"
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
                  <AddColumnCell $darkMode={isDarkMode} colSpan={10} onClick={addColumn}>
                    + Add Column
                  </AddColumnCell>
                </AddColumnRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* 테이블 커멘트 입력 영역 */}
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
                Table Comment:
              </label>
              <TableCommentTextarea
                $darkMode={isDarkMode}
                value={nodes.find(n => n.id === selectedNodeId)?.data?.comment || ''}
                onChange={(e) => {
                  if (selectedNodeId) {
                    const selectedNode = nodes.find(n => n.id === selectedNodeId);
                    if (selectedNode) {
                      updateNodeData(selectedNodeId, { 
                        ...selectedNode.data, 
                        comment: e.target.value 
                      });
                    }
                  }
                }}
                placeholder="테이블에 대한 설명을 입력하세요..."
              />
            </div>
          </div>
          
          <BottomSection $darkMode={isDarkMode}>
            <BottomField>
              <BottomLabel $darkMode={isDarkMode}>Column Name:</BottomLabel>
              <BottomInput 
                $darkMode={isDarkMode}
                type="text" 
                value={selectedColumn?.name || ''} 
                onChange={(e) => selectedColumn && updateColumnField(selectedColumn.id, 'name', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isComposing) {
                    e.preventDefault();
                    e.stopPropagation();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
              />
            </BottomField>
            <BottomField>
              <BottomLabel $darkMode={isDarkMode}>Data Type:</BottomLabel>
              <DataTypeInputContainer $isOpen={dropdownOpen === 'bottom-datatype'}>
                <BottomInput 
                  $darkMode={isDarkMode}
                  type="text" 
                  value={selectedColumn?.dataType || ''} 
                  onChange={(e) => selectedColumn && updateColumnField(selectedColumn.id, 'dataType', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isComposing) {
                      e.preventDefault();
                      e.stopPropagation();
                      (e.target as HTMLInputElement).blur();
                      setDropdownOpen(null);
                    }
                  }}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  onBlur={(e) => {
                    const relatedTarget = e.relatedTarget as HTMLElement;
                    if (!relatedTarget || (!relatedTarget.closest('[data-dropdown]') && !relatedTarget.closest('[data-dropdown-button]'))) {
                      setDropdownOpen(null);
                    }
                  }}
                  placeholder="데이터타입 선택 또는 입력"
                />
                <DropdownButton 
                  $darkMode={isDarkMode} 
                  $visible={true}
                  data-dropdown-button="true"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dropdownOpen === 'bottom-datatype') {
                      setDropdownOpen(null);
                      setDropdownPosition(null);
                    } else {
                      calculateDropdownPosition(e.currentTarget);
                      setDropdownOpen('bottom-datatype');
                    }
                  }}
                >
                  ▼
                </DropdownButton>
                {dropdownOpen === 'bottom-datatype' && dropdownPosition && (
                  <PortalDropdown
                    isOpen={true}
                    position={dropdownPosition}
                    onClose={() => {
                      setDropdownOpen(null);
                      setDropdownPosition(null);
                    }}
                    onSelect={(type) => {
                      if (selectedColumn) {
                        updateColumnField(selectedColumn.id, 'dataType', type);
                      }
                      setDropdownOpen(null);
                      setDropdownPosition(null);
                    }}
                    darkMode={isDarkMode}
                  />
                )}
              </DataTypeInputContainer>
            </BottomField>
            <BottomField>
              <BottomLabel $darkMode={isDarkMode}>Default:</BottomLabel>
              <BottomInput 
                $darkMode={isDarkMode}
                type="text" 
                value={selectedColumn?.defaultValue || ''} 
                onChange={(e) => selectedColumn && updateColumnField(selectedColumn.id, 'defaultValue', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isComposing) {
                    e.preventDefault();
                    e.stopPropagation();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                placeholder="Default value"
              />
            </BottomField>
            <BottomField>
              <BottomLabel $darkMode={isDarkMode}>Comments:</BottomLabel>
              <BottomInput 
                $darkMode={isDarkMode}
                type="text" 
                value={selectedColumn?.comment || ''} 
                onChange={(e) => selectedColumn && updateColumnField(selectedColumn.id, 'comment', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isComposing) {
                    e.preventDefault();
                    e.stopPropagation();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
              />
            </BottomField>
          </BottomSection>
        </BottomPanelContainer>
      )}
      </Container>
    </>
  );
};

export default Layout;
