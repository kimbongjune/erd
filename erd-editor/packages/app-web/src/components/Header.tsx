import React, { useCallback, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaDownload, FaChevronDown, FaSave, FaFolderOpen, FaTrash, FaUpload, FaImage, FaPlus, FaHome, FaEdit, FaSearch, FaTimes, FaGlobe, FaEllipsisV, FaTachometerAlt, FaUndo, FaRedo, FaLock, FaUnlock } from 'react-icons/fa';
import { GrMysql } from "react-icons/gr";
import { useRouter } from 'next/navigation';
import useStore from '../store/useStore';
import { toast } from 'react-toastify';
import { customConfirm } from '../utils/confirmUtils';
import { useMongoDBDiagrams } from '../hooks/useMongoDBDiagrams';
import { useAuth } from '../hooks/useAuth';

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

const NavDropdownContainer = styled.div`
  position: relative;
`;

const NavButton = styled.button<{ $darkMode?: boolean }>`
  background: ${props => props.$darkMode ? '#4a5568' : '#ffffff'};
  border: 1px solid ${props => props.$darkMode ? '#718096' : '#e2e8f0'};
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: ${props => props.$darkMode ? '#718096' : '#f7fafc'};
  }
`;

const DiagramNameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToggleSwitch = styled.label<{ $darkMode?: boolean }>`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  margin-right: 8px;
`;

const ToggleSlider = styled.span<{ $darkMode?: boolean; $isPublic?: boolean }>`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.$isPublic ? '#48BB78' : '#CBD5E0'};
  transition: .4s;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: ${props => props.$isPublic ? 'flex-start' : 'flex-end'};
  padding: 0 6px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: ${props => props.$isPublic ? '29px' : '3px'};
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
    z-index: 2;
  }
`;

const ToggleIcon = styled.span<{ $isPublic?: boolean }>`
  font-size: 10px;
  color: white;
  z-index: 1;
  margin: ${props => props.$isPublic ? '0 0 0 4px' : '0 4px 0 0'};
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;

const ToggleLabel = styled.span<{ $darkMode?: boolean; $isPublic?: boolean }>`
  font-size: 12px;
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  margin-left: 4px;
  font-weight: 500;
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

const PublicToggleButton = styled.button<{ $darkMode?: boolean; $isPublic?: boolean }>`
  background: transparent;
  border: none;
  color: ${props => props.$isPublic 
    ? '#38a169'  // Public: 초록색
    : '#a0aec0'  // Private: 회색
  };
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  
  &:hover {
    background: ${props => props.$darkMode ? '#4a5568' : '#f7fafc'};
    color: ${props => props.$isPublic 
      ? '#2f855a'  // Public hover: 더 진한 초록색
      : '#718096'  // Private hover: 더 진한 회색
    };
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

const NavDropdownItem = styled.div<{ $darkMode?: boolean; $hasSubmenu?: boolean }>`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#2d3748'};
  border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#f0f0f0'};
  position: relative;
  
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

const SubMenu = styled.div<{ $darkMode?: boolean }>`
  position: absolute;
  right: 100%;
  top: 0;
  background: ${props => props.$darkMode ? '#2d3748' : '#ffffff'};
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  min-width: 250px;
  max-height: 300px;
  overflow-y: auto;
  margin-right: 4px;
  opacity: 0;
  visibility: hidden;
  transform: translateX(10px);
  transition: all 0.2s ease;
  z-index: 1001;

  ${NavDropdownItem}:hover & {
    opacity: 1;
    visibility: visible;
    transform: translateX(0);
  }
`;

const SubMenuItem = styled.div<{ $darkMode?: boolean }>`
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#2d3748'};
  border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#f0f0f0'};
  
  &:hover {
    background: ${props => props.$darkMode ? '#4a5568' : '#f7fafc'};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const DiagramMeta = styled.div`
  font-size: 11px;
  color: #718096;
  margin-top: 2px;
`;

const EmptySubmenu = styled.div<{ $darkMode?: boolean }>`
  padding: 16px;
  text-align: center;
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
  font-size: 13px;
`;

// 대시보드 모달 스타일
const ModalOverlay = styled.div<{ $isOpen?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
`;

const ModalContent = styled.div<{ $darkMode?: boolean }>`
  background: ${props => props.$darkMode ? '#2d3748' : '#ffffff'};
  border-radius: 12px;
  width: 90vw;
  max-width: 900px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div<{ $darkMode?: boolean }>`
  background: ${props => props.$darkMode ? '#1a202c' : '#f7fafc'};
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2<{ $darkMode?: boolean }>`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
`;

const CloseButton = styled.button<{ $darkMode?: boolean }>`
  background: none;
  border: none;
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  }
`;

const ModalTopBar = styled.div<{ $darkMode?: boolean }>`
  background: ${props => props.$darkMode ? '#1a202c' : '#f7fafc'};
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
`;

const ModalSearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 400px;
`;

const ModalSearchInput = styled.input<{ $darkMode?: boolean }>`
  background: ${props => props.$darkMode ? '#4a5568' : '#ffffff'};
  border: 1px solid ${props => props.$darkMode ? '#718096' : '#e2e8f0'};
  border-radius: 6px;
  padding: 8px 16px 8px 40px;
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  font-size: 14px;
  width: 100%;
  
  &::placeholder {
    color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
  }
  
  &:focus {
    outline: none;
    border-color: #4299e1;
  }
`;

const ModalSearchIcon = styled(FaSearch)`
  position: absolute;
  left: 12px;
  color: #a0aec0;
  font-size: 14px;
`;

const ModalPlanInfo = styled.div<{ $darkMode?: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#2d3748'};
`;

const ModalPlanBadge = styled.span<{ $darkMode?: boolean }>`
  background: ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  color: ${props => props.$darkMode ? '#e2e8f0' : '#2d3748'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: uppercase;
`;

const ModalBody = styled.div`
  padding: 24px;
  max-height: 50vh;
  overflow-y: auto;
`;

const ModalTable = styled.table<{ $darkMode?: boolean }>`
  width: 100%;
  border-collapse: collapse;
  background: ${props => props.$darkMode ? '#1a202c' : '#ffffff'};
  border-radius: 8px;
  overflow: hidden;
`;

const ModalTableHeader = styled.thead<{ $darkMode?: boolean }>`
  background: ${props => props.$darkMode ? '#2d3748' : '#f7fafc'};
`;

const ModalTableHeaderCell = styled.th<{ $darkMode?: boolean }>`
  text-align: left;
  padding: 16px 20px;
  font-weight: 500;
  font-size: 14px;
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
  border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
`;

const ModalTableRow = styled.tr<{ $darkMode?: boolean }>`
  &:hover {
    background: ${props => props.$darkMode ? '#2d3748' : '#f7fafc'};
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  }
`;

const ModalTableCell = styled.td<{ $darkMode?: boolean }>`
  padding: 16px 20px;
  font-size: 14px;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#2d3748'};
`;

const ModalDiagramIcon = styled.div<{ $darkMode?: boolean }>`
  width: 20px;
  height: 20px;
  background: ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
`;

const ModalDiagramName = styled.div<{ $darkMode?: boolean }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#2d3748'};
  
  &:hover {
    color: #4299e1;
  }
`;

const ModalDateText = styled.span<{ $darkMode?: boolean }>`
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
`;

const ModalMoreButton = styled.button<{ $darkMode?: boolean }>`
  background: none;
  border: none;
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
    color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  }
`;

const ModalEmptyState = styled.div<{ $darkMode?: boolean }>`
  text-align: center;
  padding: 60px 20px;
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
`;

const SearchSection = styled.div`
  position: relative;
  margin: 1rem 0;
  
  svg {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 40px 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #0066cc;
  }
`;

const PlanInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 14px;
  color: #666;
  
  svg {
    color: #28a745;
  }
`;

const TableContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #e5e5e5;
  }
  
  th {
    background: #f8f9fa;
    font-weight: 500;
    font-size: 14px;
    color: #666;
  }
  
  tbody tr:hover {
    background: #f8f9fa;
  }
  
  td:last-child {
    width: 40px;
    text-align: center;
  }
`;

const DiagramName = styled.button`
  background: none;
  border: none;
  color: #0066cc;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  padding: 0;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
  
  &:hover {
    background: #e5e5e5;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  
  p {
    margin: 0;
  }
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

interface HeaderProps {
  erdId?: string;
}

const Header: React.FC<HeaderProps> = ({ erdId }) => {
  const router = useRouter();
  const currentErdId = erdId;
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [diagramName, setDiagramName] = useState('제목 없는 다이어그램');
  const [tempName, setTempName] = useState('');
  const [isPublic, setIsPublic] = useState(false); // public/private 상태 추가

  const [diagrams, setDiagrams] = useState<Array<{
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
  }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const filteredDiagrams = diagrams.filter(diagram =>
    diagram.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 검색어 하이라이트 함수
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <span key={index} style={{ backgroundColor: '#ffd700', color: '#000', padding: '0' }}>
              {part}
            </span>
          ) : (
            <span key={`text-${index}`}>{part}</span>
          )
        )}
      </>
    );
  };
  const navDropdownRef = useRef<HTMLDivElement>(null);
  const diagramNameRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const { 
    theme, 
    toggleTheme, 
    exportToImage, 
    exportToSQL,
    importFromSQL,
    nodes,
    undo,
    redo,
    canUndo,
    canRedo,
    hasSavedData,
    setHasSavedData,
    checkSavedData,
    saveToMongoDB,
    currentDiagramId,
    isAuthenticated,
    isReadOnlyMode,
    clearLocalStorage // 데이터 삭제를 위해 추가
  } = useStore();
  
  const { user } = useAuth();
  const { 
    fetchDiagrams,
    saveAsNew,
    updateDiagram,
    deleteDiagram: deleteDiagramFromMongoDB
  } = useMongoDBDiagrams();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 컴포넌트 마운트 시 저장된 데이터 상태 확인
  useEffect(() => {
    checkSavedData();
  }, [checkSavedData]);

  // Navigation 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // 드롭다운 메뉴 내부 클릭은 무시 (NavDropdownMenu만)
      if (navDropdownRef.current?.querySelector('[role="menu"]')?.contains(target)) {
        return;
      }
      
      // 드롭다운 닫기
      setIsNavDropdownOpen(false);
    };

    if (isNavDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isNavDropdownOpen]);

  // 대시보드 모달 내 삭제 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDashboardModalOpen && activeDropdown) {
        const target = event.target as Element;
        // 삭제 버튼이나 삭제 메뉴 내부가 아닌 곳을 클릭했을 때만 닫기
        if (!target.closest('[data-dropdown-menu]') && !target.closest('[data-dropdown-button]')) {
          setActiveDropdown(null);
        }
      }
    };

    if (isDashboardModalOpen && activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDashboardModalOpen, activeDropdown]);

  // 다이어그램 목록 로드
  useEffect(() => {
    const loadDiagrams = async () => {
      if (!isAuthenticated || !user) {
        setDiagrams([]);
        return;
      }

      try {
        const response = await fetchDiagrams();
        const formattedDiagrams = response.diagrams.map((diagram: any) => ({
          id: diagram.id, // MongoDB 스키마의 toJSON 변환에 의해 id로 제공됨
          name: diagram.title || '제목 없는 다이어그램',
          createdAt: new Date(diagram.createdAt).getTime(),
          updatedAt: new Date(diagram.updatedAt).getTime(),
          description: diagram.description || '',
          isPublic: diagram.isPublic || false,
          tags: diagram.tags || []
        }));
        setDiagrams(formattedDiagrams);
      } catch (error) {
        console.error('다이어그램 목록 로드 실패:', error);
        setDiagrams([]);
      }
    };
    
    loadDiagrams();
    // 드롭다운이 열릴 때마다 목록 새로고침
    if (isNavDropdownOpen) {
      loadDiagrams();
    }
  }, [isNavDropdownOpen, isAuthenticated, user]); // fetchDiagrams 제거

  // 현재 다이어그램 이름 로드
  useEffect(() => {
    const loadCurrentDiagramName = async () => {
      if (!currentDiagramId || !isAuthenticated || !user) {
        setDiagramName('제목 없는 다이어그램');
        setIsPublic(false);
        return;
      }

      try {
        const response = await fetch(`/api/diagrams/${currentDiagramId}`);
        if (response.ok) {
          const { diagram } = await response.json();
          setDiagramName(diagram.title || '제목 없는 다이어그램');
          setIsPublic(diagram.isPublic || false); // isPublic 상태도 로드
        } else {
          setDiagramName('제목 없는 다이어그램');
          setIsPublic(false);
        }
      } catch (error) {
        console.error('다이어그램 이름 로드 실패:', error);
        setDiagramName('제목 없는 다이어그램');
        setIsPublic(false);
      }
    };

    loadCurrentDiagramName();
  }, [currentDiagramId, isAuthenticated, user]);

  // Navigation 메뉴 함수들
  const openDashboardModal = async () => {
    setIsDashboardModalOpen(true);
    setIsNavDropdownOpen(false);
    
    // 모달 열 때 다이어그램 목록 새로고침
    if (isAuthenticated && user) {
      try {
        const response = await fetchDiagrams();
        const formattedDiagrams = response.diagrams.map((diagram: any) => ({
          id: diagram.id, // MongoDB 스키마의 toJSON 변환에 의해 id로 제공됨
          name: diagram.title || '제목 없는 다이어그램',
          createdAt: new Date(diagram.createdAt).getTime(),
          updatedAt: new Date(diagram.updatedAt).getTime(),
          description: diagram.description || '',
          isPublic: diagram.isPublic || false,
          tags: diagram.tags || []
        }));
        setDiagrams(formattedDiagrams);
      } catch (error) {
        console.error('다이어그램 목록 로드 실패:', error);
      }
    }
  };

  const closeDashboardModal = () => {
    setIsDashboardModalOpen(false);
    setSearchTerm('');
    setActiveDropdown(null); // 삭제 버튼 상태 리셋
  };

  const createNewDiagram = async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const initialERDData = {
        version: '1.0', // MongoDB 스키마에서 필수 필드
        timestamp: Date.now(),
        nodes: [],
        edges: [],
        nodeColors: {}, // 배열이 아닌 객체여야 함
        edgeColors: {}, // 배열이 아닌 객체여야 함
        commentColors: {}, // 배열이 아닌 객체여야 함
        theme: 'light',
        showGrid: false, // 누락된 필드 추가
        hiddenEntities: [], // 누락된 필드 추가
        viewport: { x: 0, y: 0, zoom: 1 }, // 누락된 필드 추가
        viewportRestoreTrigger: Date.now(), // 누락된 필드 추가
        viewSettings: {
          entityView: 'logical',
          showKeys: true,
          showPhysicalName: true,
          showLogicalName: false,
          showDataType: true,
          showConstraints: false,
          showDefaults: false,
        }
      };

      const response = await saveAsNew('제목 없는 다이어그램', '', false, [], initialERDData);
      
      if (response.diagram && response.diagram.id) {
        router.push(`/erd/${response.diagram.id}`);
        setIsNavDropdownOpen(false);
        closeDashboardModal();
        toast.success('새 다이어그램이 생성되었습니다.');
      } else {
        throw new Error('다이어그램 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('새 다이어그램 생성 실패:', error);
      toast.error('다이어그램 생성에 실패했습니다.');
    }
  };

  const createSampleDiagram = async () => {
    // 샘플 다이어그램 생성 로직 (나중에 구현)
    const id = `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    router.push(`/erd/${id}`);
    setIsNavDropdownOpen(false);
  };

  const openDiagram = async (id: string) => {
    // 다이어그램 이름은 ERDEditor에서 로드될 때 자동으로 설정됨
    router.push(`/erd/${id}`);
    setIsNavDropdownOpen(false);
    closeDashboardModal();
  };

  const deleteDiagram = async (diagramId: string) => {
    if (!isAuthenticated || !user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      await deleteDiagramFromMongoDB(diagramId);
      
      // 현재 다이어그램을 보고 있다면 홈으로 이동
      if (window.location.pathname === `/erd/${diagramId}`) {
        router.push('/home');
        closeDashboardModal();
      } else {
        // 목록 새로고침
        const response = await fetchDiagrams();
        const formattedDiagrams = response.diagrams.map((diagram: any) => ({
          id: diagram.id, // MongoDB 스키마의 toJSON 변환에 의해 id로 제공됨
          name: diagram.title || '제목 없는 다이어그램',
          createdAt: new Date(diagram.createdAt).getTime(),
          updatedAt: new Date(diagram.updatedAt).getTime(),
          description: diagram.description || '',
          isPublic: diagram.isPublic || false,
          tags: diagram.tags || []
        }));
        setDiagrams(formattedDiagrams);
      }
      
      toast.success('다이어그램이 삭제되었습니다.');
    } catch (error) {
      console.error('다이어그램 삭제 실패:', error);
      toast.error('다이어그램 삭제에 실패했습니다.');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 대시보드용 시분초 포함 날짜 포맷
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatTime = (timestamp: number) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else {
      return formatDate(timestamp);
    }
  };

  // ERD 이름 편집 관련 함수들
  const startEditingName = () => {
    setTempName(diagramName);
    setIsEditingName(true);
    setTimeout(() => {
      nameInputRef.current?.select();
    }, 0);
  };

  const saveNameChange = async () => {
    const newName = tempName.trim() || '제목 없는 다이어그램';
    setDiagramName(newName);
    setIsEditingName(false);
    
    // MongoDB에 저장된 다이어그램 이름 업데이트
    const currentUrl = window.location.pathname;
    const erdIdMatch = currentUrl.match(/\/erd\/(.+)/);
    if (erdIdMatch && isAuthenticated && user) {
      const erdId = erdIdMatch[1];
      try {
        await updateDiagram(erdId, { 
          title: newName
        });
        toast.success('다이어그램 이름이 변경되었습니다.');
      } catch (error) {
        console.error('다이어그램 이름 업데이트 실패:', error);
        toast.error('이름 변경에 실패했습니다.');
      }
    }
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

  // 현재 ERD ID에 따라 다이어그램 이름 로드 (MongoDB에서 자동 처리됨)
  useEffect(() => {
    if (currentErdId && !isAuthenticated) {
      // 로그인하지 않은 경우 기본 이름 설정
      setDiagramName('제목 없는 다이어그램');
    }
  }, [currentErdId, isAuthenticated]);

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

    const confirmed = await customConfirm('저장된 모든 데이터를 삭제하시겠습니까?\n\n⚠️ 경고: 삭제된 데이터는 복구할 수 없으며, 캔버스가 완전히 초기화됩니다.', {
      title: '데이터 삭제',
      confirmText: '삭제',
      cancelText: '취소',
      type: 'danger',
      darkMode: theme === 'dark'
    });
    if (confirmed) {
      // MongoDB 환경에서는 다이어그램을 삭제하지 않고 데이터만 비움
      if (currentDiagramId && isAuthenticated) {
        try {
          // 먼저 로컬 상태를 클리어 (이미 토스트 메시지 포함)
          clearLocalStorage();
          
          // 클리어된 상태를 MongoDB에 저장
          await saveToMongoDB(false); // 토스트 없이 저장
          
        } catch (error) {
          console.error('데이터 삭제 실패:', error);
          toast.error('데이터 삭제에 실패했습니다.');
        }
      } else {
        // 로그인하지 않은 경우 로컬 데이터만 클리어
        clearLocalStorage();
      }
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

  // Public/Private 상태 토글 함수
  const togglePublicStatus = async () => {
    if (!currentDiagramId || !isAuthenticated || !user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      const newIsPublic = !isPublic;
      const response = await fetch(`/api/diagrams/${currentDiagramId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublic: newIsPublic
        }),
      });

      if (response.ok) {
        setIsPublic(newIsPublic);
        // 토스트 메시지 제거
      } else {
        throw new Error('상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Public/Private 상태 변경 실패:', error);
      toast.error('상태 변경에 실패했습니다.');
    }
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
      <LeftSection>
        {/* MongoDB 저장 버튼 */}
        <ThemeToggleButton 
          $darkMode={theme === 'dark'} 
          onClick={async (e) => {
            e.stopPropagation();
            if (isReadOnlyMode) return;
            if (isAuthenticated && currentDiagramId) {
              try {
                await saveToMongoDB(true); // 수동 저장시에는 토스트 표시
              } catch (error) {
                console.error('저장 실패:', error);
                toast.error('저장에 실패했습니다.');
              }
            }
          }}
          title={isReadOnlyMode ? "읽기 전용 모드에서는 저장할 수 없습니다" : "Ctrl+S로도 저장할 수 있습니다"}
          disabled={!isAuthenticated || !currentDiagramId || isReadOnlyMode}
          style={{ 
            opacity: (isAuthenticated && currentDiagramId && !isReadOnlyMode) ? 1 : 0.5,
            cursor: (isAuthenticated && currentDiagramId && !isReadOnlyMode) ? 'pointer' : 'not-allowed'
          }}
        >
          <FaSave />
          저장
        </ThemeToggleButton>

        {/* Undo/Redo 버튼들 */}
        {/* 실행 취소/다시 실행 버튼 (읽기 전용 모드에서는 비활성화) */}
        <ThemeToggleButton 
          $darkMode={theme === 'dark'} 
          onClick={(e) => {
            e.stopPropagation();
            if (!isReadOnlyMode) undo();
          }}
          disabled={!canUndo || isReadOnlyMode}
          title={isReadOnlyMode ? "읽기 전용 모드에서는 사용할 수 없습니다" : "실행 취소 (Ctrl+Z)"}
          style={{ 
            opacity: (canUndo && !isReadOnlyMode) ? 1 : 0.5, 
            cursor: (canUndo && !isReadOnlyMode) ? 'pointer' : 'not-allowed' 
          }}
        >
          <FaUndo />
        </ThemeToggleButton>

        <ThemeToggleButton 
          $darkMode={theme === 'dark'} 
          onClick={(e) => {
            e.stopPropagation();
            if (!isReadOnlyMode) redo();
          }}
          disabled={!canRedo || isReadOnlyMode}
          title={isReadOnlyMode ? "읽기 전용 모드에서는 사용할 수 없습니다" : "다시 실행 (Ctrl+Y)"}
          style={{ 
            opacity: (canRedo && !isReadOnlyMode) ? 1 : 0.5, 
            cursor: (canRedo && !isReadOnlyMode) ? 'pointer' : 'not-allowed' 
          }}
        >
          <FaRedo />
        </ThemeToggleButton>
      
      {/* 불러오기 버튼 제거 - MongoDB에서 자동 로드됨 */}
      
      {/* 데이터 삭제 버튼 */}
      <ThemeToggleButton 
        $darkMode={theme === 'dark'} 
        onClick={isReadOnlyMode ? undefined : handleDataDelete}
        disabled={isReadOnlyMode}
        title={isReadOnlyMode ? "읽기 전용 모드에서는 삭제할 수 없습니다" : "저장된 모든 데이터를 삭제합니다"}
        style={{ 
          opacity: isReadOnlyMode ? 0.5 : 1,
          cursor: isReadOnlyMode ? 'not-allowed' : 'pointer'
        }}
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
            if (!isReadOnlyMode) {
              setIsExportOpen(!isExportOpen);
            }
          }}
          disabled={isReadOnlyMode}
          title={isReadOnlyMode ? "읽기 전용 모드에서는 내보내기를 사용할 수 없습니다" : "파일로 내보내기"}
          style={{ 
            opacity: isReadOnlyMode ? 0.5 : 1,
            cursor: isReadOnlyMode ? 'not-allowed' : 'pointer'
          }}
        >
          <FaDownload />
          내보내기
          <FaChevronDown />
        </ThemeToggleButton>
        
        <ExportDropdown $darkMode={theme === 'dark'} $isOpen={isExportOpen && !isReadOnlyMode}>
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
      </LeftSection>

      <RightSection>
        {/* Navigation 드롭다운 */}
        <NavDropdownContainer ref={navDropdownRef}>
          <DiagramNameContainer>
            {/* Public/Private 토글 스위치 (로그인되고 다이어그램이 있고 소유자일 때만 표시) */}
            {isAuthenticated && currentDiagramId && !isReadOnlyMode && (
              <ToggleSwitch $darkMode={theme === 'dark'}>
                <ToggleInput
                  type="checkbox"
                  checked={isPublic}
                  onChange={togglePublicStatus}
                />
                <ToggleSlider 
                  $darkMode={theme === 'dark'} 
                  $isPublic={isPublic}
                >
                  <ToggleIcon $isPublic={isPublic}>
                    {isPublic ? <FaUnlock /> : <FaLock />}
                  </ToggleIcon>
                </ToggleSlider>
              </ToggleSwitch>
            )}
            
            {isEditingName ? (
              <DiagramNameInput
                ref={nameInputRef}
                $darkMode={theme === 'dark'}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={saveNameChange}
                onKeyDown={handleNameKeyDown}
              />
            ) : (
              <DiagramNameButton
                $darkMode={theme === 'dark'}
                onClick={isReadOnlyMode ? undefined : startEditingName}
                title={isReadOnlyMode ? "읽기 전용 모드에서는 이름을 변경할 수 없습니다" : "클릭하여 다이어그램 이름 변경"}
                disabled={isReadOnlyMode}
                style={{ 
                  opacity: isReadOnlyMode ? 0.7 : 1,
                  cursor: isReadOnlyMode ? 'not-allowed' : 'pointer'
                }}
              >
                {diagramName}
              </DiagramNameButton>
            )}
            
            <NavButton 
              $darkMode={theme === 'dark'}
              onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
            >
              <FaChevronDown />
            </NavButton>
          </DiagramNameContainer>

          <NavDropdownMenu $darkMode={theme === 'dark'} $isOpen={isNavDropdownOpen} role="menu">
            <NavDropdownItem $darkMode={theme === 'dark'} onClick={() => router.push('/home')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaHome />
                홈으로 가기
              </div>
            </NavDropdownItem>
            
            {/* 읽기 전용 모드가 아닐 때만 표시 (본인 다이어그램일 때) */}
            {!isReadOnlyMode && (
              <>
                <NavDropdownItem $darkMode={theme === 'dark'} onClick={openDashboardModal}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaTachometerAlt />
                    대시보드
                  </div>
                </NavDropdownItem>
                
                <NavDropdownItem $darkMode={theme === 'dark'} onClick={async () => await createNewDiagram()}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaPlus />
                    새 다이어그램
                  </div>
                </NavDropdownItem>
                
                <NavDropdownItem $darkMode={theme === 'dark'} $hasSubmenu>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaFolderOpen />
                    내 다이어그램
                  </div>
                  <FaChevronDown style={{ fontSize: '10px' }} />
                  
                  <SubMenu $darkMode={theme === 'dark'}>
                    {diagrams.length > 0 ? (
                      diagrams.map((diagram, index) => (
                        <SubMenuItem
                          key={`${diagram.id}-${index}`}
                          $darkMode={theme === 'dark'}
                          onClick={async () => await openDiagram(diagram.id)}
                          style={{
                            backgroundColor: currentErdId === diagram.id 
                              ? (theme === 'dark' ? '#4a5568' : '#e6fffa') 
                              : 'transparent'
                          }}
                        >
                          <div>
                            {currentErdId === diagram.id ? (
                              <div style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: '#4ade80',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#000',
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}>
                                ●
                              </div>
                            ) : (
                              <div style={{
                                width: '16px',
                                height: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px'
                              }}>
                                <FaEdit />
                              </div>
                            )}
                          </div>
                          <div>
                            <div>{diagram.name}</div>
                            <DiagramMeta>{formatDate(diagram.updatedAt)}</DiagramMeta>
                          </div>
                        </SubMenuItem>
                      ))
                    ) : (
                      <EmptySubmenu key="empty-submenu" $darkMode={theme === 'dark'}>
                        생성된 다이어그램이 없습니다
                      </EmptySubmenu>
                    )}
                  </SubMenu>
                </NavDropdownItem>
              </>
            )}
          </NavDropdownMenu>
        </NavDropdownContainer>
      </RightSection>
      {/* 대시보드 모달 */}
      {isDashboardModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={closeDashboardModal}>
          <div style={{
            background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '1000px',
            height: '80%',
            maxHeight: '700px',
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${theme === 'dark' ? '#333' : '#e2e8f0'}`
          }} onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <div style={{
              padding: '20px',
              borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#e2e8f0'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ 
                margin: 0, 
                color: theme === 'dark' ? '#ffffff' : '#2d3748',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                내 다이어그램
              </h2>
              <button
                onClick={closeDashboardModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme === 'dark' ? '#999' : '#718096',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* 검색바 */}
            <div style={{
              padding: '20px',
              borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#e2e8f0'}`
            }}>
              <div style={{
                position: 'relative',
                width: '100%'
              }}>
                <input
                  type="text"
                  placeholder="다이어그램 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? '#444' : '#e2e8f0'}`,
                    borderRadius: '4px',
                    color: theme === 'dark' ? '#ffffff' : '#2d3748',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* 테이블 헤더 */}
            <div style={{
              padding: '0 20px',
              backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f7fafc',
              borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#e2e8f0'}`
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 150px 150px 80px',
                gap: '16px',
                padding: '12px 0',
                fontSize: '12px',
                color: theme === 'dark' ? '#999' : '#718096',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                <div>이름</div>
                <div>생성일</div>
                <div>수정일</div>
                <div></div>
              </div>
            </div>

            {/* 다이어그램 목록 */}
            <div style={{
              flex: 1,
              overflow: 'auto'
            }}>
              {filteredDiagrams.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  color: theme === 'dark' ? '#666' : '#a0aec0'
                }}>
                  <div style={{ fontSize: '18px', marginBottom: '8px' }}>
                    {searchTerm ? '🔍' : '📊'}
                  </div>
                  <div>
                    {searchTerm 
                      ? `"${searchTerm}"에 대한 검색 결과가 없습니다`
                      : '아직 다이어그램이 없습니다'
                    }
                  </div>
                </div>
              ) : (
                filteredDiagrams.map((diagram) => (
                  <div
                    key={diagram.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 150px 150px 80px',
                      gap: '16px',
                      padding: '16px 20px',
                      borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#e2e8f0'}`,
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: theme === 'dark' ? '#ffffff' : '#2d3748',
                      backgroundColor: currentErdId === diagram.id ? (theme === 'dark' ? '#2a2a2a' : '#f7fafc') : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (currentErdId !== diagram.id) {
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2a2a2a' : '#f7fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentErdId !== diagram.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div
                      onClick={() => {
                        openDiagram(diagram.id);
                        closeDashboardModal();
                      }}
                      style={{
                        fontWeight: '500',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {highlightSearchTerm(diagram.name, searchTerm)}
                      {currentErdId === diagram.id && (
                        <span style={{
                          background: '#4ade80',
                          color: '#000',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          현재 보고 있음
                        </span>
                      )}
                    </div>
                    <div style={{
                      color: theme === 'dark' ? '#999' : '#a0aec0',
                      fontSize: '13px'
                    }}>
                      {formatDateTime(diagram.createdAt)}
                    </div>
                    <div style={{
                      color: theme === 'dark' ? '#999' : '#a0aec0',
                      fontSize: '13px'
                    }}>
                      {formatDateTime(diagram.updatedAt)}
                    </div>
                    <div style={{
                      position: 'relative'
                    }}>
                      <button
                        data-dropdown-button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === diagram.id ? null : diagram.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: theme === 'dark' ? '#999' : '#718096',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          fontSize: '16px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#444' : '#e2e8f0';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        ⋯
                      </button>
                      
                      {activeDropdown === diagram.id && (
                        <div 
                          data-dropdown-menu
                          style={{
                          position: 'absolute',
                          top: '100%',
                          right: '0',
                          backgroundColor: theme === 'dark' ? '#333' : '#ffffff',
                          border: `1px solid ${theme === 'dark' ? '#444' : '#e2e8f0'}`,
                          borderRadius: '4px',
                          minWidth: '120px',
                          zIndex: 1000,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                        }}>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const confirmed = await customConfirm(`"${diagram.name}" 다이어그램을 삭제하시겠습니까?`, {
                                title: '다이어그램 삭제',
                                confirmText: '삭제',
                                cancelText: '취소',
                                type: 'danger',
                                darkMode: theme === 'dark'
                              });
                              if (confirmed) {
                                await deleteDiagram(diagram.id);
                                setActiveDropdown(null);
                              }
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '8px 12px',
                              background: 'none',
                              border: 'none',
                              color: '#ff6b6b',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '14px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#444' : '#f7fafc';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </HeaderContainer>
  );
};

export default Header;
