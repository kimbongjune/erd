import React, { useCallback, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaDownload, FaChevronDown, FaSave, FaFolderOpen, FaTrash, FaUpload, FaImage, FaPlus, FaHome, FaEdit, FaSearch, FaTimes, FaGlobe, FaEllipsisV } from 'react-icons/fa';
import { GrMysql } from "react-icons/gr";
import { useNavigate, useParams } from 'react-router-dom';
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

const Header = () => {
  const navigate = useNavigate();
  const { id: currentErdId } = useParams<{ id: string }>();
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [diagramName, setDiagramName] = useState('제목 없는 다이어그램');
  const [tempName, setTempName] = useState('');
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
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} style={{ backgroundColor: '#ffd700', color: '#000' }}>
          {part}
        </span>
      ) : part
    );
  };
  const navDropdownRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
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

  // Navigation 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target as Node)) {
        setIsNavDropdownOpen(false);
      }
    };

    if (isNavDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isNavDropdownOpen]);

  // 다이어그램 목록 로드
  useEffect(() => {
    const loadDiagrams = () => {
      const diagramsList = JSON.parse(localStorage.getItem('erd-diagrams-list') || '[]');
      setDiagrams(diagramsList.sort((a: any, b: any) => b.updatedAt - a.updatedAt));
    };
    
    loadDiagrams();
    // 드롭다운이 열릴 때마다 목록 새로고침
    if (isNavDropdownOpen) {
      loadDiagrams();
    }
  }, [isNavDropdownOpen]);

  // Navigation 메뉴 함수들
  const openDashboardModal = () => {
    setIsDashboardModalOpen(true);
    setIsNavDropdownOpen(false);
    // 모달 열 때 다이어그램 목록 새로고침
    const diagramsList = JSON.parse(localStorage.getItem('erd-diagrams-list') || '[]');
    setDiagrams(diagramsList.sort((a: any, b: any) => b.updatedAt - a.updatedAt));
  };

  const closeDashboardModal = () => {
    setIsDashboardModalOpen(false);
    setSearchTerm('');
  };

  const createNewDiagram = () => {
    const id = `erd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`/erd/${id}`);
    setIsNavDropdownOpen(false);
    closeDashboardModal();
  };

  const createSampleDiagram = () => {
    // 샘플 다이어그램 생성 로직 (나중에 구현)
    const id = `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`/erd/${id}`);
    setIsNavDropdownOpen(false);
  };

  const openDiagram = (id: string) => {
    navigate(`/erd/${id}`);
    setIsNavDropdownOpen(false);
    closeDashboardModal();
  };

  const deleteDiagram = (diagramId: string) => {
    const savedData = localStorage.getItem('erd-diagrams');
    const diagrams = savedData ? JSON.parse(savedData) : {};
    delete diagrams[diagramId];
    localStorage.setItem('erd-diagrams', JSON.stringify(diagrams));
    
    // 현재 다이어그램을 보고 있다면 홈으로 이동
    if (window.location.pathname === `/erd/${diagramId}`) {
      navigate('/home');
      closeDashboardModal();
    }
    
    // 강제로 리렌더링을 위해 상태 업데이트
    window.dispatchEvent(new Event('storage'));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const saveNameChange = () => {
    const newName = tempName.trim() || '제목 없는 다이어그램';
    setDiagramName(newName);
    setIsEditingName(false);
    
    // localStorage에 저장된 다이어그램 이름 업데이트
    const currentUrl = window.location.pathname;
    const erdIdMatch = currentUrl.match(/\/erd\/(.+)/);
    if (erdIdMatch) {
      const erdId = erdIdMatch[1];
      const diagramsList = JSON.parse(localStorage.getItem('erd-diagrams-list') || '[]');
      const diagramIndex = diagramsList.findIndex((d: any) => d.id === erdId);
      
      if (diagramIndex >= 0) {
        diagramsList[diagramIndex].name = newName;
        diagramsList[diagramIndex].updatedAt = Date.now();
        localStorage.setItem('erd-diagrams-list', JSON.stringify(diagramsList));
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

  // 현재 ERD ID에 따라 다이어그램 이름 로드
  useEffect(() => {
    if (currentErdId) {
      const diagramsList = JSON.parse(localStorage.getItem('erd-diagrams-list') || '[]');
      const diagram = diagramsList.find((d: any) => d.id === currentErdId);
      
      if (diagram) {
        setDiagramName(diagram.name);
      } else {
        // 새 다이어그램인 경우 목록에 추가
        const newDiagram = {
          id: currentErdId,
          name: '제목 없는 다이어그램',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        diagramsList.push(newDiagram);
        localStorage.setItem('erd-diagrams-list', JSON.stringify(diagramsList));
        setDiagramName('제목 없는 다이어그램');
      }
    }
  }, [currentErdId]);

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
      <LeftSection>
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
      </LeftSection>

      <RightSection>
        {/* Navigation 드롭다운 */}
        <NavDropdownContainer ref={navDropdownRef}>
          <DiagramNameContainer>
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
                onClick={startEditingName}
                title="클릭하여 다이어그램 이름 변경"
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

          <NavDropdownMenu $darkMode={theme === 'dark'} $isOpen={isNavDropdownOpen}>
            <NavDropdownItem $darkMode={theme === 'dark'} onClick={openDashboardModal}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaHome />
                대시보드
              </div>
            </NavDropdownItem>
            
            <NavDropdownItem $darkMode={theme === 'dark'} onClick={createNewDiagram}>
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
                  diagrams.map((diagram) => (
                    <SubMenuItem
                      key={diagram.id}
                      $darkMode={theme === 'dark'}
                      onClick={() => openDiagram(diagram.id)}
                    >
                      <FaEdit />
                      <div>
                        <div>{diagram.name}</div>
                        <DiagramMeta>{formatDate(diagram.updatedAt)}</DiagramMeta>
                      </div>
                    </SubMenuItem>
                  ))
                ) : (
                  <EmptySubmenu $darkMode={theme === 'dark'}>
                    생성된 다이어그램이 없습니다
                  </EmptySubmenu>
                )}
              </SubMenu>
            </NavDropdownItem>
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
            background: '#1a1a1a',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '1000px',
            height: '80%',
            maxHeight: '700px',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #333'
          }} onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ 
                margin: 0, 
                color: '#ffffff',
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
                  color: '#999',
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
              borderBottom: '1px solid #333'
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
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* 테이블 헤더 */}
            <div style={{
              padding: '0 20px',
              backgroundColor: '#2a2a2a',
              borderBottom: '1px solid #333'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 150px 150px 80px',
                gap: '16px',
                padding: '12px 0',
                fontSize: '12px',
                color: '#999',
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
              overflow: 'auto',
              padding: '0 20px'
            }}>
              {filteredDiagrams.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  color: '#666'
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
                      padding: '16px 0',
                      borderBottom: '1px solid #333',
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a2a2a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div
                      onClick={() => {
                        openDiagram(diagram.id);
                        closeDashboardModal();
                      }}
                      style={{
                        fontWeight: '500',
                        fontSize: '14px'
                      }}
                    >
                      {highlightSearchTerm(diagram.name, searchTerm)}
                    </div>
                    <div style={{
                      color: '#999',
                      fontSize: '13px'
                    }}>
                      {new Date(diagram.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                    <div style={{
                      color: '#999',
                      fontSize: '13px'
                    }}>
                      {new Date(diagram.updatedAt).toLocaleDateString('ko-KR')}
                    </div>
                    <div style={{
                      position: 'relative'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === diagram.id ? null : diagram.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#999',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          fontSize: '16px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        ⋯
                      </button>
                      
                      {activeDropdown === diagram.id && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: '0',
                          backgroundColor: '#333',
                          border: '1px solid #444',
                          borderRadius: '4px',
                          minWidth: '120px',
                          zIndex: 1000,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                        }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`"${diagram.name}" 다이어그램을 삭제하시겠습니까?`)) {
                                deleteDiagram(diagram.id);
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
                              e.currentTarget.style.backgroundColor = '#444';
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
