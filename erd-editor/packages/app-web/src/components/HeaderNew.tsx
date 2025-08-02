import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaDownload, FaChevronDown, FaSave, FaFolderOpen, FaTrash, FaUpload, FaImage, FaPlus, FaHome, FaEdit, FaSearch, FaTimes, FaGlobe, FaEllipsisV } from 'react-icons/fa';
import { GrMysql } from "react-icons/gr";
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { toast } from 'react-toastify';
import { customConfirm } from '../utils/confirmUtils';

// 스타일 컴포넌트들
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
    background: ${props => props.$darkMode ? '#4a5568' : '#f7fafc'};
    border-color: ${props => props.$darkMode ? '#a0aec0' : '#cbd5e0'};
  }
`;

const NavDropdown = styled.div<{ $isOpen: boolean; $darkMode?: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  background: ${props => props.$darkMode ? '#2d3748' : '#ffffff'};
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1000;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(4px)' : 'translateY(-4px)'};
  transition: all 0.2s ease;
`;

const DropdownItem = styled.button<{ $darkMode?: boolean }>`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${props => props.$darkMode ? '#4a5568' : '#f7fafc'};
  }

  &:first-child {
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }
`;

const SubMenuContainer = styled.div`
  position: relative;
`;

const SubMenu = styled.div<{ $isOpen: boolean; $darkMode?: boolean }>`
  position: absolute;
  top: 0;
  left: -200px;
  background: ${props => props.$darkMode ? '#2d3748' : '#ffffff'};
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  z-index: 1000;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-4px)'};
  transition: all 0.2s ease;
`;

const DiagramNameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DiagramNameDisplay = styled.span<{ $darkMode?: boolean }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  
  &:hover {
    background: ${props => props.$darkMode ? '#4a5568' : '#f7fafc'};
  }
`;

const DiagramNameInput = styled.input<{ $darkMode?: boolean }>`
  font-size: 16px;
  font-weight: 600;
  background: ${props => props.$darkMode ? '#4a5568' : '#ffffff'};
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  border: 2px solid ${props => props.$darkMode ? '#718096' : '#4299e1'};
  border-radius: 4px;
  padding: 4px 8px;
  outline: none;
  min-width: 200px;
`;

// 모달 스타일 컴포넌트들
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e5e5;
  
  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1a202c;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #666;
  border-radius: 6px;
  
  &:hover {
    background: #f0f0f0;
  }
`;

const SearchSection = styled.div`
  position: relative;
  margin: 1rem 1.5rem;
  
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
  margin: 0 1.5rem 1rem;
  font-size: 14px;
  color: #666;
  
  svg {
    color: #28a745;
  }
`;

const TableContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
  margin: 0 1.5rem 1.5rem;
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

const Header = () => {
  const navigate = useNavigate();
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
  const [isMyDiagramsOpen, setIsMyDiagramsOpen] = useState(false);
  
  const navDropdownRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    theme, 
    toggleTheme, 
    exportToImage, 
    exportToSQL,
    saveToLocalStorage,
    clearLocalStorage,
    importFromSQL,
    nodes
  } = useStore();

  const filteredDiagrams = diagrams.filter(diagram =>
    diagram.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Navigation 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target as Node)) {
        setIsNavDropdownOpen(false);
        setIsMyDiagramsOpen(false);
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
    if (isNavDropdownOpen) {
      loadDiagrams();
    }
  }, [isNavDropdownOpen]);

  // 현재 다이어그램 이름 로드
  useEffect(() => {
    const currentPath = window.location.pathname;
    const erdIdMatch = currentPath.match(/\/erd\/(.+)/);
    
    if (erdIdMatch) {
      const erdId = erdIdMatch[1];
      const savedData = localStorage.getItem(`erd-diagram-${erdId}`);
      if (savedData) {
        try {
          const diagram = JSON.parse(savedData);
          setDiagramName(diagram.name || '제목 없는 다이어그램');
        } catch (error) {
          console.error('다이어그램 로드 실패:', error);
          setDiagramName('제목 없는 다이어그램');
        }
      } else {
        setDiagramName('제목 없는 다이어그램');
      }
    }
  }, []);

  // 모달 관련 함수들
  const openDashboardModal = () => {
    setIsDashboardModalOpen(true);
    setIsNavDropdownOpen(false);
    const diagramsList = JSON.parse(localStorage.getItem('erd-diagrams-list') || '[]');
    setDiagrams(diagramsList.sort((a: any, b: any) => b.updatedAt - a.updatedAt));
  };

  const closeDashboardModal = () => {
    setIsDashboardModalOpen(false);
    setSearchTerm('');
  };

  const openDiagram = (id: string) => {
    navigate(`/erd/${id}`);
    setIsNavDropdownOpen(false);
    closeDashboardModal();
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
      return new Date(timestamp).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // 다이어그램 이름 편집 함수들
  const startEditingName = () => {
    setTempName(diagramName);
    setIsEditingName(true);
    setTimeout(() => {
      nameInputRef.current?.select();
    }, 0);
  };

  const saveNameEdit = () => {
    const newName = tempName.trim() || '제목 없는 다이어그램';
    setDiagramName(newName);
    setIsEditingName(false);
    
    // 현재 다이어그램 ID 가져오기
    const currentPath = window.location.pathname;
    const erdIdMatch = currentPath.match(/\/erd\/(.+)/);
    
    if (erdIdMatch) {
      const erdId = erdIdMatch[1];
      
      // 개별 다이어그램 데이터 업데이트
      const savedData = localStorage.getItem(`erd-diagram-${erdId}`);
      if (savedData) {
        try {
          const diagram = JSON.parse(savedData);
          diagram.name = newName;
          diagram.updatedAt = Date.now();
          localStorage.setItem(`erd-diagram-${erdId}`, JSON.stringify(diagram));
        } catch (error) {
          console.error('다이어그램 저장 실패:', error);
        }
      }
      
      // 다이어그램 목록 업데이트
      const diagramsList = JSON.parse(localStorage.getItem('erd-diagrams-list') || '[]');
      const diagramIndex = diagramsList.findIndex((d: any) => d.id === erdId);
      if (diagramIndex !== -1) {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveNameEdit();
    } else if (e.key === 'Escape') {
      cancelNameEdit();
    }
  };

  const hasEntities = nodes.some(node => node.type === 'entity');

  return (
    <HeaderContainer $darkMode={theme === 'dark'}>
      <LeftSection>
        <NavDropdownContainer ref={navDropdownRef}>
          <NavButton
            $darkMode={theme === 'dark'}
            onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
          >
            네비게이션 <FaChevronDown />
          </NavButton>
          
          <NavDropdown $isOpen={isNavDropdownOpen} $darkMode={theme === 'dark'}>
            <DropdownItem
              $darkMode={theme === 'dark'}
              onClick={() => navigate('/home')}
            >
              <FaHome /> 홈
            </DropdownItem>
            
            <DropdownItem
              $darkMode={theme === 'dark'}
              onClick={openDashboardModal}
            >
              <FaFolderOpen /> 대시보드
            </DropdownItem>
            
            <SubMenuContainer
              onMouseEnter={() => setIsMyDiagramsOpen(true)}
              onMouseLeave={() => setIsMyDiagramsOpen(false)}
            >
              <DropdownItem $darkMode={theme === 'dark'}>
                <FaEdit /> 내 다이어그램
              </DropdownItem>
              
              <SubMenu $isOpen={isMyDiagramsOpen} $darkMode={theme === 'dark'}>
                {diagrams.slice(0, 5).map((diagram) => (
                  <DropdownItem
                    key={diagram.id}
                    $darkMode={theme === 'dark'}
                    onClick={() => openDiagram(diagram.id)}
                  >
                    {diagram.name}
                  </DropdownItem>
                ))}
                {diagrams.length === 0 && (
                  <DropdownItem $darkMode={theme === 'dark'}>
                    다이어그램이 없습니다
                  </DropdownItem>
                )}
              </SubMenu>
            </SubMenuContainer>
          </NavDropdown>
        </NavDropdownContainer>

        <DiagramNameContainer>
          {isEditingName ? (
            <DiagramNameInput
              ref={nameInputRef}
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={saveNameEdit}
              onKeyDown={handleKeyPress}
              $darkMode={theme === 'dark'}
            />
          ) : (
            <DiagramNameDisplay
              onClick={startEditingName}
              $darkMode={theme === 'dark'}
            >
              {diagramName}
            </DiagramNameDisplay>
          )}
        </DiagramNameContainer>
      </LeftSection>

      <RightSection>
        <NavButton
          $darkMode={theme === 'dark'}
          onClick={() => saveToLocalStorage()}
          title="저장"
        >
          <FaSave />
        </NavButton>

        <NavButton
          $darkMode={theme === 'dark'}
          onClick={async () => {
            const confirmed = await customConfirm('현재 작업 내용이 모두 삭제됩니다. 계속하시겠습니까?');
            if (confirmed) {
              clearLocalStorage();
            }
          }}
          title="새 다이어그램"
        >
          <FaPlus />
        </NavButton>

        <NavButton
          $darkMode={theme === 'dark'}
          onClick={exportToImage}
          disabled={!hasEntities}
          title="이미지로 내보내기"
        >
          <FaImage />
        </NavButton>

        <NavButton
          $darkMode={theme === 'dark'}
          onClick={exportToSQL}
          disabled={!hasEntities}
          title="SQL로 내보내기"
        >
          <GrMysql />
        </NavButton>

        <NavButton
          $darkMode={theme === 'dark'}
          onClick={toggleTheme}
          title="테마 변경"
        >
          {theme === 'dark' ? '🌞' : '🌙'}
        </NavButton>
      </RightSection>

      {/* 대시보드 모달 */}
      {isDashboardModalOpen && (
        <ModalOverlay onClick={closeDashboardModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>내 다이어그램</h2>
              <CloseButton onClick={closeDashboardModal}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            
            <SearchSection>
              <SearchInput
                type="text"
                placeholder="다이어그램 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch />
            </SearchSection>

            <PlanInfo>
              <FaGlobe />
              <span>공개 다이어그램 무제한</span>
            </PlanInfo>

            <TableContainer>
              <Table>
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>마지막 수정</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiagrams.map((diagram) => (
                    <tr key={diagram.id}>
                      <td>
                        <DiagramName onClick={() => openDiagram(diagram.id)}>
                          {diagram.name}
                        </DiagramName>
                      </td>
                      <td>{formatTime(diagram.updatedAt)}</td>
                      <td>
                        <ActionButton onClick={(e) => e.stopPropagation()}>
                          <FaEllipsisV />
                        </ActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {filteredDiagrams.length === 0 && (
                <EmptyState>
                  <p>다이어그램이 없습니다.</p>
                </EmptyState>
              )}
            </TableContainer>
          </ModalContent>
        </ModalOverlay>
      )}
    </HeaderContainer>
  );
};

export default Header;
