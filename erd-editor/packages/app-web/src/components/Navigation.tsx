import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaPlus, FaChevronDown, FaHome, FaEdit } from 'react-icons/fa';
import useStore from '../store/useStore';

const NavContainer = styled.div<{ $darkMode?: boolean }>`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const NavButton = styled.button<{ $darkMode?: boolean; $primary?: boolean }>`
  background: ${props => {
    if (props.$primary) return '#4CAF50';
    return props.$darkMode ? '#4a5568' : '#ffffff';
  }};
  border: 1px solid ${props => props.$darkMode ? '#718096' : '#e2e8f0'};
  color: ${props => {
    if (props.$primary) return 'white';
    return props.$darkMode ? '#ffffff' : '#2d3748';
  }};
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: ${props => {
      if (props.$primary) return '#45a049';
      return props.$darkMode ? '#718096' : '#f7fafc';
    }};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const DropdownContainer = styled.div`
  position: relative;
`;

const DropdownMenu = styled.div<{ $darkMode?: boolean; $isOpen?: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background: ${props => props.$darkMode ? '#2d3748' : '#ffffff'};
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 4px;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.$isOpen ? '0' : '-10px'});
  transition: all 0.2s ease;
`;

const DropdownItem = styled.div<{ $darkMode?: boolean }>`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
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
`;

const DiagramMeta = styled.div`
  font-size: 12px;
  color: #718096;
  margin-top: 2px;
`;

const EmptyMessage = styled.div<{ $darkMode?: boolean }>`
  padding: 20px 16px;
  text-align: center;
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
  font-size: 14px;
`;

interface Diagram {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

interface NavigationProps {
  currentDiagramId?: string;
}

const Navigation: React.FC<NavigationProps> = ({ currentDiagramId }) => {
  const navigate = useNavigate();
  const { theme } = useStore();
  const [isMyDiagramsOpen, setIsMyDiagramsOpen] = useState(false);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDiagrams();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMyDiagramsOpen(false);
      }
    };

    if (isMyDiagramsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMyDiagramsOpen]);

  const loadDiagrams = () => {
    // localStorage에서 실제 erd- 키로 저장된 모든 다이어그램 찾기
    const actualDiagrams: Diagram[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('erd-') && key !== 'erd-diagrams-list') {
        const erdId = key.replace('erd-', '');
        try {
          const erdData = JSON.parse(localStorage.getItem(key) || '{}');
          
          // 다이어그램 이름 결정 (우선순위: erd-diagrams-list > 기본값)
          let diagramName = '제목 없는 다이어그램';
          
          // erd-diagrams-list에서 해당 ID의 이름을 찾아보기
          try {
            const diagramsList = JSON.parse(localStorage.getItem('erd-diagrams-list') || '[]');
            const existingDiagram = diagramsList.find((d: any) => d.id === erdId);
            if (existingDiagram && existingDiagram.name) {
              diagramName = existingDiagram.name;
            }
          } catch (error) {
            // erd-diagrams-list 파싱 실패 시 기본값 사용
          }
          
          actualDiagrams.push({
            id: erdId,
            name: diagramName,
            createdAt: erdData.timestamp || Date.now(),
            updatedAt: erdData.timestamp || Date.now()
          });
        } catch (error) {
          // 파싱 에러 시 해당 키는 무시
          continue;
        }
      }
    }
    
    setDiagrams(actualDiagrams.sort((a: Diagram, b: Diagram) => b.updatedAt - a.updatedAt));
  };

  const createNewDiagram = () => {
    const id = `erd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 새 다이어그램을 다이어그램 목록에 추가
    const diagramsList = JSON.parse(localStorage.getItem('erd-diagrams-list') || '[]');
    const newDiagram = {
      id: id,
      name: '제목 없는 다이어그램',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    diagramsList.push(newDiagram);
    localStorage.setItem('erd-diagrams-list', JSON.stringify(diagramsList));
    
    // 새 다이어그램의 초기 ERD 데이터도 저장
    const initialERDData = {
      nodes: [],
      edges: [],
      nodeColors: [],
      edgeColors: [],
      commentColors: [],
      theme: 'light',
      viewSettings: {
        entityView: 'logical',
        showKeys: true,
        showPhysicalName: true,
        showLogicalName: false,
        showDataType: true,
        showConstraints: false,
        showDefaults: false,
      },
      timestamp: Date.now()
    };
    
    localStorage.setItem(`erd-${id}`, JSON.stringify(initialERDData));
    
    navigate(`/erd/${id}`);
  };

  const openDiagram = (id: string) => {
    navigate(`/erd/${id}`);
    setIsMyDiagramsOpen(false);
  };

  const goToDashboard = () => {
    navigate('/home');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const darkMode = theme === 'dark';

  return (
    <NavContainer $darkMode={darkMode}>
      <NavButton $darkMode={darkMode} onClick={goToDashboard}>
        <FaHome />
        Dashboard
      </NavButton>

      <NavButton $darkMode={darkMode} $primary onClick={createNewDiagram}>
        <FaPlus />
        New Diagram
      </NavButton>

      <DropdownContainer ref={dropdownRef}>
        <NavButton 
          $darkMode={darkMode} 
          onClick={() => {
            loadDiagrams();
            setIsMyDiagramsOpen(!isMyDiagramsOpen);
          }}
        >
          My Diagrams
          <FaChevronDown />
        </NavButton>

        <DropdownMenu $darkMode={darkMode} $isOpen={isMyDiagramsOpen}>
          {diagrams.length > 0 ? (
            diagrams.map((diagram) => (
              <DropdownItem
                key={diagram.id}
                $darkMode={darkMode}
                onClick={() => openDiagram(diagram.id)}
              >
                <FaEdit />
                <div>
                  <div>{diagram.name}</div>
                  <DiagramMeta>{formatDate(diagram.updatedAt)}</DiagramMeta>
                </div>
              </DropdownItem>
            ))
          ) : (
            <EmptyMessage $darkMode={darkMode}>
              생성된 다이어그램이 없습니다
            </EmptyMessage>
          )}
        </DropdownMenu>
      </DropdownContainer>
    </NavContainer>
  );
};

export default Navigation;
