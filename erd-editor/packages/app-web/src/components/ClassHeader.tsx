import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { FaSave, FaUndo, FaRedo, FaTrash, FaChevronDown, FaImage, FaFilePdf, FaFileImage } from 'react-icons/fa';
import { GrMysql } from 'react-icons/gr';

const HeaderContainer = styled.header<{ $darkMode?: boolean }>`
  grid-area: header;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: ${props => props.$darkMode ? '#1a202c' : '#ffffff'};
  border-bottom: 1px solid ${props => props.$darkMode ? '#2d3748' : '#e2e8f0'};
  height: 50px;
  box-sizing: border-box;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ActionButton = styled.button<{ $disabled?: boolean; $darkMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: ${props => props.$disabled ? (props.$darkMode ? '#2d3748' : '#f7f7f7') : (props.$darkMode ? '#4a5568' : '#ffffff')};
  color: ${props => props.$disabled ? (props.$darkMode ? '#4a5568' : '#a0a0a0') : (props.$darkMode ? '#e2e8f0' : '#374151')};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#d1d5db'};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$disabled ? undefined : (props.$darkMode ? '#718096' : '#f3f4f6')};
    border-color: ${props => props.$disabled ? undefined : (props.$darkMode ? '#718096' : '#9ca3af')};
  }

  &:active {
    transform: ${props => props.$disabled ? 'none' : 'translateY(1px)'};
  }
`;

const DiagramName = styled.h1<{ $darkMode?: boolean }>`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#1f2937'};
`;

const NavDropdown = styled.div`
  position: relative;
`;

const DropdownButton = styled.button<{ $darkMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#d1d5db'};
  border-radius: 6px;
  background: ${props => props.$darkMode ? '#4a5568' : '#ffffff'};
  color: ${props => props.$darkMode ? '#e2e8f0' : '#374151'};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$darkMode ? '#718096' : '#f3f4f6'};
    border-color: ${props => props.$darkMode ? '#718096' : '#9ca3af'};
  }
`;

const DropdownMenu = styled.div<{ $show: boolean; $darkMode?: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: ${props => props.$darkMode ? '#2d3748' : '#ffffff'};
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e5e7eb'};
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 100;
  min-width: 160px;
  display: ${props => props.$show ? 'block' : 'none'};
`;

const DropdownItem = styled.button<{ $darkMode?: boolean }>`
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  border: none;
  background: none;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#374151'};
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;

  &:hover {
    background: ${props => props.$darkMode ? '#4a5568' : '#f3f4f6'};
  }

  &:first-child {
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }
`;

const DarkModeToggle = styled.button<{ $darkMode?: boolean }>`
  padding: 8px;
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#d1d5db'};
  border-radius: 6px;
  background: ${props => props.$darkMode ? '#4a5568' : '#ffffff'};
  color: ${props => props.$darkMode ? '#fbbf24' : '#6b7280'};
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => props.$darkMode ? '#718096' : '#f3f4f6'};
    border-color: ${props => props.$darkMode ? '#718096' : '#9ca3af'};
  }
`;

interface ClassHeaderProps {
  classId: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSave: () => void;
  onExportImage: () => void;
  onExportSQL: () => void;
  onDataDelete: () => void;
  hasData: boolean;
}

const ClassHeader: React.FC<ClassHeaderProps> = ({
  classId,
  darkMode,
  onToggleDarkMode,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSave,
  onExportImage,
  onExportSQL,
  onDataDelete,
  hasData
}) => {
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setExportDropdownOpen(false);
    };

    if (exportDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [exportDropdownOpen]);

  const handleExportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExportDropdownOpen(!exportDropdownOpen);
  };

  return (
    <HeaderContainer $darkMode={darkMode}>
      <LeftSection>
        <ActionButton onClick={onSave} $darkMode={darkMode}>
          <FaSave />
          저장
        </ActionButton>
        
        <ActionButton 
          onClick={onUndo} 
          $disabled={!canUndo}
          $darkMode={darkMode}
        >
          <FaUndo />
          실행취소
        </ActionButton>
        
        <ActionButton 
          onClick={onRedo} 
          $disabled={!canRedo}
          $darkMode={darkMode}
        >
          <FaRedo />
          다시실행
        </ActionButton>
        
        <ActionButton 
          onClick={onDataDelete}
          $disabled={!hasData}
          $darkMode={darkMode}
        >
          <FaTrash />
          데이터삭제
        </ActionButton>

        <NavDropdown>
          <DropdownButton onClick={handleExportClick} $darkMode={darkMode}>
            내보내기
            <FaChevronDown />
          </DropdownButton>
          <DropdownMenu $show={exportDropdownOpen} $darkMode={darkMode}>
            <DropdownItem onClick={onExportImage} $darkMode={darkMode}>
              <FaFileImage />
              이미지로 내보내기
            </DropdownItem>
            <DropdownItem onClick={onExportSQL} $darkMode={darkMode}>
              <GrMysql />
              SQL로 내보내기
            </DropdownItem>
          </DropdownMenu>
        </NavDropdown>
      </LeftSection>

      <RightSection>
        <DiagramName $darkMode={darkMode}>
          클래스 다이어그램
        </DiagramName>
        
        <DarkModeToggle onClick={onToggleDarkMode} $darkMode={darkMode}>
          {darkMode ? '🌙' : '☀️'}
        </DarkModeToggle>
      </RightSection>
    </HeaderContainer>
  );
};

export default ClassHeader;
