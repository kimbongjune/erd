import { useCallback, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import { FaDownload, FaChevronDown } from 'react-icons/fa';
import useStore from '../store/useStore';

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
  const { nodes, edges, setNodes, setEdges, theme, toggleTheme, exportToImage, exportToSQL } = useStore();
  const [isExportOpen, setIsExportOpen] = useState(false);

  const onDrop = useCallback((acceptedFiles: any[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = () => {
      const { nodes, edges } = JSON.parse(reader.result as string);
      setNodes(nodes);
      setEdges(edges);
    };
    reader.readAsText(file);
  }, [setNodes, setEdges]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, noClick: true });

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

  const saveData = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erd.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <HeaderContainer $darkMode={theme === 'dark'} {...getRootProps()}>
      <input {...getInputProps()} />
      <button onClick={saveData}>Save</button>
      <button onClick={() => getRootProps().onClick?.(undefined as any)}>Load</button>
      
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
              exportToImage();
              setIsExportOpen(false);
            }}
          >
            이미지로 내보내기
          </ExportOption>
          <ExportOption 
            $darkMode={theme === 'dark'}
            onClick={(e) => {
              e.stopPropagation();
              exportToSQL();
              setIsExportOpen(false);
            }}
          >
            MySQL SQL 내보내기
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
        {theme === 'dark' ? '☀️' : '🌙'}
        {theme === 'dark' ? 'Light' : 'Dark'}
      </ThemeToggleButton>
    </HeaderContainer>
  );
};

export default Header;
