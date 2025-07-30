import React, { useCallback, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaDownload, FaChevronDown, FaSave, FaFolderOpen, FaTrash, FaUpload, FaImage} from 'react-icons/fa';
import { GrMysql } from "react-icons/gr";
import useStore from '../store/useStore';
import { toast } from 'react-toastify';
import { customConfirm } from '../utils/confirmUtils';

const HeaderContainer = styled.header<{ $darkMode?: boolean }>`
  grid-area: header;
  background-color: ${props => props.$darkMode ? '#2d3748' : '#f0f0f0'};
  color: ${props => props.$darkMode ? '#ffffff' : '#000000'};
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
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

const Header = () => {
  const { 
    theme, 
    toggleTheme, 
    exportToImage, 
    exportToSQL,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    importFromSQL,
    nodes
  } = useStore();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 엔티티 존재 여부 확인
  const hasEntities = nodes.some(node => node.type === 'entity');

  // 엔티티가 없을 때 경고 메시지 표시
  const showNoEntitiesWarning = () => {
    toast.warning('내보낼 엔티티가 없습니다. 먼저 엔티티를 생성해주세요.');
  };

  // 데이터 삭제 함수 (엔티티 존재 여부 체크)
  const handleDataDelete = async () => {
    if (!hasEntities) {
      toast.warning('삭제할 데이터가 없습니다.');
      return;
    }

    const confirmed = await customConfirm('저장된 모든 데이터를 삭제하시겠습니까?', {
      title: '데이터 삭제',
      confirmText: '삭제',
      cancelText: '취소',
      type: 'danger',
      darkMode: theme === 'dark'
    });
    if (confirmed) {
      clearLocalStorage();
    }
  };

  // 이미지 내보내기 함수 (엔티티 존재 여부 체크)
  const handleImageExport = () => {
    if (!hasEntities) {
      showNoEntitiesWarning();
      return;
    }
    exportToImage();
  };

  // SQL 내보내기 함수 (엔티티 존재 여부 체크)
  const handleSQLExport = () => {
    if (!hasEntities) {
      showNoEntitiesWarning();
      return;
    }
    exportToSQL();
  };

  // JSON 관련 함수들 제거

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.sql')) {
      toast.error('SQL 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        importFromSQL(content);
      }
    };
    reader.readAsText(file);
    
    // 파일 input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <HeaderContainer $darkMode={theme === 'dark'}>
      {/* localStorage 버튼들 */}
      <ThemeToggleButton 
        $darkMode={theme === 'dark'} 
        onClick={(e) => {
          e.stopPropagation();
          saveToLocalStorage();
        }}
        title="Ctrl+S로도 저장할 수 있습니다"
      >
        <FaSave />
        저장
      </ThemeToggleButton>
      
      <ThemeToggleButton 
        $darkMode={theme === 'dark'} 
        onClick={(e) => {
          e.stopPropagation();
          loadFromLocalStorage();
        }}
      >
        <FaFolderOpen />
        불러오기
      </ThemeToggleButton>
      
      <ThemeToggleButton 
        $darkMode={theme === 'dark'} 
        onClick={handleDataDelete}
      >
        <FaTrash />
        데이터 삭제
      </ThemeToggleButton>
      
      {/* SQL 파일 업로드 버튼 */}
      {/* <ThemeToggleButton 
        $darkMode={theme === 'dark'} 
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        title="SQL 파일을 업로드하여 엔티티를 생성합니다"
      >
        <FaUpload />
        SQL 불러오기
      </ThemeToggleButton> */}
      
      {/* 숨겨진 파일 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".sql"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      
      <ExportContainer>
        <ThemeToggleButton 
          $darkMode={theme === 'dark'} 
          onClick={(e) => {
            e.stopPropagation();
            setIsExportOpen(!isExportOpen);
          }}
        >
          <FaDownload />
          내보내기
          <FaChevronDown />
        </ThemeToggleButton>
        
        <ExportDropdown $darkMode={theme === 'dark'} $isOpen={isExportOpen}>
          <ExportOption 
            $darkMode={theme === 'dark'}
            onClick={(e) => {
              e.stopPropagation();
              handleImageExport();
              setIsExportOpen(false);
            }}
          >
            <FaImage style={{ marginRight: '8px' }} />
            이미지로 내보내기
          </ExportOption>
          <ExportOption 
            $darkMode={theme === 'dark'}
            onClick={(e) => {
              e.stopPropagation();
              handleSQLExport();
              setIsExportOpen(false);
            }}
          >
            <GrMysql style={{ marginRight: '8px' }} />
            SQL로 내보내기
          </ExportOption>
        </ExportDropdown>
      </ExportContainer>
      
      <ThemeToggleButton 
        $darkMode={theme === 'dark'} 
        onClick={(e) => {
          e.stopPropagation();
          toggleTheme();
        }}
      >
        {theme === 'dark' ? '☀️ ' : '🌙 '}
        {theme === 'dark' ? 'Light' : 'Dark'}
      </ThemeToggleButton>
    </HeaderContainer>
  );
};

export default Header;
