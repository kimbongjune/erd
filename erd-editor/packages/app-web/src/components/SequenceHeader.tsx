import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import {
  FaHome, FaSave, FaDownload, FaMoon, FaSun, FaUndo, FaRedo, FaTrash,
  FaChevronDown, FaTachometerAlt, FaPlus, FaFolderOpen, FaEdit, FaCopy,
  FaImage, FaLock, FaUnlock, FaChevronUp, FaChevronRight
} from 'react-icons/fa';
import { GrMysql } from 'react-icons/gr';
import { useRouter } from 'next/navigation';

const HeaderContainer = styled.header<{ $darkMode?: boolean }>`
  grid-area: header;
  background-color: ${props => props.$darkMode ? '#2d3748' : '#f0f0f0'};
  color: ${props => props.$darkMode ? '#ffffff' : '#000000'};
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  transition: all 0.3s ease;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ThemeToggleButton = styled.button<{ $darkMode?: boolean }>`
  background: ${props => props.$darkMode ? '#4a5568' : '#ffffff'};
  border: 2px solid ${props => props.$darkMode ? '#718096' : '#e2e8f0'};
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: ${props => props.$darkMode ? '#718096' : '#f7fafc'};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ExportContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const ExportDropdown = styled.div<{ $darkMode?: boolean; $isOpen?: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background: ${props => props.$darkMode ? '#4a5568' : '#ffffff'};
  border: 1px solid ${props => props.$darkMode ? '#718096' : '#e2e8f0'};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  z-index: 1000;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(4px)' : 'translateY(-4px)'};
  transition: all 0.2s ease;
`;

const ExportOption = styled.button<{ $darkMode?: boolean }>`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;

  &:hover {
    background: ${props => props.$darkMode ? '#718096' : '#f7fafc'};
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
`;

const NavDropdownContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DiagramNameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DiagramNameButton = styled.button<{ $darkMode?: boolean }>`
  background: transparent;
  border: 1px solid transparent;
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.$darkMode ? '#4a5568' : '#f7fafc'};
    border-color: ${props => props.$darkMode ? '#718096' : '#e2e8f0'};
  }
`;

const DiagramNameInput = styled.input<{ $darkMode?: boolean }>`
  background: ${props => props.$darkMode ? '#4a5568' : '#ffffff'};
  border: 1px solid ${props => props.$darkMode ? '#718096' : '#e2e8f0'};
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #4299e1;
  }
`;

const NavButton = styled.button<{ $darkMode?: boolean }>`
  background: transparent;
  border: none;
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$darkMode ? '#4a5568' : '#f7fafc'};
  }
`;

const NavDropdownMenu = styled.div<{ $darkMode?: boolean; $isOpen?: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background: ${props => props.$darkMode ? '#2d3748' : '#ffffff'};
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  margin-top: 4px;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.$isOpen ? '0' : '-10px'});
  transition: all 0.2s ease;
  z-index: 1000;
`;

const NavDropdownItem = styled.div<{ $darkMode?: boolean }>`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#2d3748'};
  border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#f0f0f0'};

  &:hover {
    background: ${props => props.$darkMode ? '#4a5568' : '#f7fafc'};
  }

  &:last-child {
    border-bottom: none;
  }

  &:first-child {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  &:last-child {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }
`;

interface SequenceHeaderProps {
  sequenceId: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSave?: () => void;
  onExportImage?: () => void;
  onExportSQL?: () => void;
  onDataDelete?: () => void;
  hasData?: boolean;
}

const SequenceHeader: React.FC<SequenceHeaderProps> = ({
  sequenceId,
  darkMode,
  onToggleDarkMode,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onSave,
  onExportImage,
  onExportSQL,
  onDataDelete,
  hasData = false
}) => {
  const router = useRouter();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [diagramName, setDiagramName] = useState('제목 없는 시퀀스 다이어그램');
  const [tempName, setTempName] = useState('');

  const navDropdownRef = useRef<HTMLDivElement>(null);

  // Navigation 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navDropdownRef.current?.contains(event.target as Node)) {
        return;
      }
      setIsNavDropdownOpen(false);
    };

    if (isNavDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isNavDropdownOpen]);

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExportOpen) {
        setIsExportOpen(false);
      }
    };

    if (isExportOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isExportOpen]);

  const handleHomeClick = () => {
    router.push('/home');
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    } else {
      console.log('시퀀스 다이어그램 저장');
    }
  };

  const handleExportImage = () => {
    if (onExportImage) {
      onExportImage();
    } else {
      console.log('시퀀스 다이어그램 이미지 내보내기');
    }
    setIsExportOpen(false);
  };

  const handleExportSQL = () => {
    if (onExportSQL) {
      onExportSQL();
    } else {
      console.log('시퀀스 다이어그램 SQL 내보내기');
    }
    setIsExportOpen(false);
  };

  const handleDataDelete = () => {
    if (onDataDelete) {
      onDataDelete();
    } else {
      console.log('시퀀스 다이어그램 데이터 삭제');
    }
  };

  // ERD 이름 편집 관련 함수들
  const startEditingName = () => {
    setTempName(diagramName);
    setIsEditingName(true);
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (input) input.select();
    }, 0);
  };

  const saveNameChange = () => {
    const newName = tempName.trim() || '제목 없는 시퀀스 다이어그램';
    setDiagramName(newName);
    setIsEditingName(false);
  };

  const cancelNameEdit = () => {
    setIsEditingName(false);
    setTempName('');
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveNameChange();
    } else if (e.key === 'Escape') {
      cancelNameEdit();
    }
  };

  return (
    <HeaderContainer $darkMode={darkMode}>
      <LeftSection>
        {/* 저장 버튼 */}
        <ThemeToggleButton
          $darkMode={darkMode}
          onClick={handleSave}
        >
          <FaSave />
          저장
        </ThemeToggleButton>

        {/* Undo/Redo 버튼들 */}
        <ThemeToggleButton
          $darkMode={darkMode}
          onClick={onUndo}
          disabled={!canUndo}
          style={{
            opacity: canUndo ? 1 : 0.5,
            cursor: canUndo ? 'pointer' : 'not-allowed'
          }}
        >
          <FaUndo />
        </ThemeToggleButton>

        <ThemeToggleButton
          $darkMode={darkMode}
          onClick={onRedo}
          disabled={!canRedo}
          style={{
            opacity: canRedo ? 1 : 0.5,
            cursor: canRedo ? 'pointer' : 'not-allowed'
          }}
        >
          <FaRedo />
        </ThemeToggleButton>

        {/* 데이터 삭제 버튼 */}
        <ThemeToggleButton
          $darkMode={darkMode}
          onClick={handleDataDelete}
          disabled={!hasData}
          style={{
            opacity: hasData ? 1 : 0.5,
            cursor: hasData ? 'pointer' : 'not-allowed'
          }}
        >
          <FaTrash />
          데이터 삭제
        </ThemeToggleButton>

        {/* 내보내기 드롭다운 */}
        <ExportContainer>
          <ThemeToggleButton
            $darkMode={darkMode}
            onClick={(e) => {
              e.stopPropagation();
              setIsExportOpen(!isExportOpen);
            }}
            disabled={!hasData}
            style={{
              opacity: hasData ? 1 : 0.5,
              cursor: hasData ? 'pointer' : 'not-allowed'
            }}
          >
            <FaDownload />
            내보내기
            <FaChevronDown />
          </ThemeToggleButton>

          <ExportDropdown $darkMode={darkMode} $isOpen={isExportOpen && hasData}>
            <ExportOption
              $darkMode={darkMode}
              onClick={handleExportImage}
            >
              <FaImage style={{ marginRight: '8px' }} />
              이미지로 내보내기
            </ExportOption>
            <ExportOption
              $darkMode={darkMode}
              onClick={handleExportSQL}
            >
              <GrMysql style={{ marginRight: '8px' }} />
              SQL로 내보내기
            </ExportOption>
          </ExportDropdown>
        </ExportContainer>

        {/* 다크모드 토글 */}
        <ThemeToggleButton
          $darkMode={darkMode}
          onClick={onToggleDarkMode}
        >
          {darkMode ? '☀️ ' : '🌙 '}
          {darkMode ? 'Light' : 'Dark'}
        </ThemeToggleButton>
      </LeftSection>

      <RightSection>
        {/* Navigation 드롭다운 */}
        <NavDropdownContainer ref={navDropdownRef}>
          <DiagramNameContainer>
            {isEditingName ? (
              <DiagramNameInput
                $darkMode={darkMode}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={saveNameChange}
                onKeyDown={handleNameKeyDown}
              />
            ) : (
              <DiagramNameButton
                $darkMode={darkMode}
                onClick={startEditingName}
              >
                {diagramName}
              </DiagramNameButton>
            )}

            <NavButton
              $darkMode={darkMode}
              onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
            >
              <FaChevronDown />
            </NavButton>
          </DiagramNameContainer>

          <NavDropdownMenu $darkMode={darkMode} $isOpen={isNavDropdownOpen}>
            <NavDropdownItem $darkMode={darkMode} onClick={handleHomeClick}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaHome />
                홈으로 가기
              </div>
            </NavDropdownItem>

            <NavDropdownItem $darkMode={darkMode} onClick={() => {
              router.push('/sequence/new');
              setIsNavDropdownOpen(false);
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaPlus />
                새 시퀀스 다이어그램
              </div>
            </NavDropdownItem>
          </NavDropdownMenu>
        </NavDropdownContainer>
      </RightSection>
    </HeaderContainer>
  );
};

export default SequenceHeader;
