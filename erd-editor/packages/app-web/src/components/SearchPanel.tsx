import React, { useMemo } from 'react';
import styled from 'styled-components';
import { FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import { useReactFlow } from 'reactflow';
import useStore from '../store/useStore';

const PanelContainer = styled.div<{ $darkMode: boolean }>`
  position: fixed;
  top: 60px;
  right: 20px;
  width: 300px;
  max-height: calc(100vh - 80px);
  background: ${props => props.$darkMode ? '#2d3748' : '#ffffff'};
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PanelHeader = styled.div<{ $darkMode: boolean }>`
  padding: 16px;
  border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  background: ${props => props.$darkMode ? '#4a5568' : '#f7fafc'};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3<{ $darkMode: boolean }>`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
`;

const CloseButton = styled.button<{ $darkMode: boolean }>`
  background: none;
  border: none;
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: ${props => props.$darkMode ? '#718096' : '#e2e8f0'};
  }
`;

const SearchInput = styled.input<{ $darkMode: boolean }>`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  border-radius: 8px;
  font-size: 14px;
  background: ${props => props.$darkMode ? '#4a5568' : '#ffffff'};
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  margin-bottom: 16px;
  
  &:focus {
    outline: none;
    border-color: #007acc;
    box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.1);
  }
  
  &::placeholder {
    color: ${props => props.$darkMode ? '#a0aec0' : '#a0adb8'};
  }
`;

const ControlButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const ControlButton = styled.button<{ $darkMode: boolean }>`
  flex: 1;
  padding: 8px 12px;
  background: ${props => props.$darkMode ? '#4a5568' : '#f7fafc'};
  border: 1px solid ${props => props.$darkMode ? '#718096' : '#e2e8f0'};
  border-radius: 6px;
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$darkMode ? '#718096' : '#edf2f7'};
  }
`;

const EntityList = styled.div<{ $darkMode: boolean }>`
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
  
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
`;

const EntityItem = styled.div<{ 
  $darkMode: boolean; 
  $isHidden: boolean;
  $isSelected: boolean;
  $isClickable: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#f1f5f9'};
  cursor: ${props => props.$isClickable ? 'pointer' : 'default'};
  opacity: ${props => props.$isHidden ? 0.5 : 1};
  background: ${props => {
    if (props.$isSelected) return props.$darkMode ? '#4299e1' : '#bee3f8';
    return 'transparent';
  }};
  
  &:hover {
    background: ${props => {
      if (!props.$isClickable) return 'transparent';
      if (props.$isSelected) return props.$darkMode ? '#4299e1' : '#bee3f8';
      return props.$darkMode ? '#4a5568' : '#f7fafc';
    }};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const EntityName = styled.div<{ $darkMode: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PhysicalName = styled.span<{ $darkMode: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.$darkMode ? '#ffffff' : '#2d3748'};
`;

const LogicalName = styled.span<{ $darkMode: boolean }>`
  font-size: 12px;
  font-weight: 400;
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
  font-style: italic;
`;

const HighlightedText = styled.span<{ $darkMode: boolean }>`
  background-color: ${props => props.$darkMode ? '#fbbf24' : '#fbbf24'};
  color: ${props => props.$darkMode ? '#000000' : '#000000'};
  padding: 1px 3px;
  border-radius: 3px;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const EyeButton = styled.button<{ $darkMode: boolean; $isHidden: boolean }>`
  background: none;
  border: none;
  color: ${props => props.$isHidden 
    ? (props.$darkMode ? '#718096' : '#a0adb8')
    : (props.$darkMode ? '#a0aec0' : '#4a5568')};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: ${props => props.$darkMode ? '#718096' : '#e2e8f0'};
  }
`;

const SearchPanel: React.FC = () => {
  const { 
    theme,
    nodes,
    isSearchPanelOpen,
    searchQuery,
    hiddenEntities,
    selectedSearchEntity,
    setSearchQuery,
    hideEntity,
    showEntity,
    hideAllEntities,
    showAllEntities,
    setSelectedSearchEntity,
    setSelectedNodeId,
    closeSearchPanel
  } = useStore();

  const { fitView, getNode } = useReactFlow();
  const darkMode = theme === 'dark';

  // 검색어를 하이라이트 처리하는 함수
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    // 검색어를 정규표현식에서 안전하게 사용할 수 있도록 이스케이프
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // 대소문자 구분 없이 전역 검색하되, 중복 하이라이트 방지
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    let lastIndex = 0;
    const parts: React.ReactNode[] = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // 매치 전 텍스트 추가
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // 하이라이트된 텍스트 추가
      parts.push(
        <HighlightedText key={`${match.index}-${match[0]}`} $darkMode={darkMode}>
          {match[0]}
        </HighlightedText>
      );
      
      lastIndex = regex.lastIndex;
      
      // 무한 루프 방지
      if (match[0].length === 0) {
        regex.lastIndex++;
      }
    }
    
    // 마지막 매치 후 남은 텍스트 추가
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  // 엔티티 노드들만 필터링
  const entityNodes = useMemo(() => {
    return nodes.filter(node => node.type === 'entity');
  }, [nodes]);

  // 검색 필터링된 엔티티들
  const filteredEntities = useMemo(() => {
    if (!searchQuery) return entityNodes;
    
    return entityNodes.filter(entity => {
      const physicalName = entity.data.label?.toLowerCase() || '';
      const logicalName = entity.data.logicalName?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      
      return physicalName.includes(query) || logicalName.includes(query);
    });
  }, [entityNodes, searchQuery]);

  const handleEntityClick = (entityId: string) => {
    if (hiddenEntities.has(entityId)) {
      return; // 숨겨진 엔티티는 클릭 무시
    }
    
    // 엔티티로 포커스 이동
    const entity = getNode(entityId);
    if (entity) {
      setSelectedNodeId(entityId);
      setSelectedSearchEntity(entityId);
      
      // 해당 엔티티 중심으로 뷰 이동
      fitView({
        nodes: [entity],
        duration: 500,
        padding: 0.3,
      });
    }
  };

  const handleEyeToggle = (entityId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (hiddenEntities.has(entityId)) {
      showEntity(entityId);
    } else {
      hideEntity(entityId);
    }
  };

  if (!isSearchPanelOpen) return null;

  return (
    <PanelContainer $darkMode={darkMode}>
      <PanelHeader $darkMode={darkMode}>
        <Title $darkMode={darkMode}>엔티티 검색</Title>
        <CloseButton $darkMode={darkMode} onClick={closeSearchPanel}>
          <FaTimes size={14} />
        </CloseButton>
      </PanelHeader>
      
      <div style={{ padding: '16px' }}>
        <SearchInput
          $darkMode={darkMode}
          type="text"
          placeholder="엔티티 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <ControlButtons>
          <ControlButton $darkMode={darkMode} onClick={showAllEntities}>
            Show All
          </ControlButton>
          <ControlButton $darkMode={darkMode} onClick={hideAllEntities}>
            Hide All
          </ControlButton>
        </ControlButtons>
      </div>
      
      <EntityList $darkMode={darkMode}>
        {filteredEntities.map(entity => {
          const isHidden = hiddenEntities.has(entity.id);
          const isSelected = selectedSearchEntity === entity.id;
          const isClickable = !isHidden;
          
          return (
            <EntityItem
              key={entity.id}
              $darkMode={darkMode}
              $isHidden={isHidden}
              $isSelected={isSelected}
              $isClickable={isClickable}
              onClick={() => handleEntityClick(entity.id)}
            >
              <EntityName $darkMode={darkMode}>
                <PhysicalName $darkMode={darkMode}>
                  {highlightSearchTerm(entity.data.label, searchQuery)}
                </PhysicalName>
                {entity.data.logicalName && (
                  <LogicalName $darkMode={darkMode}>
                    {highlightSearchTerm(entity.data.logicalName, searchQuery)}
                  </LogicalName>
                )}
              </EntityName>
              <EyeButton
                $darkMode={darkMode}
                $isHidden={isHidden}
                onClick={(e) => handleEyeToggle(entity.id, e)}
              >
                {isHidden ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </EyeButton>
            </EntityItem>
          );
        })}
      </EntityList>
    </PanelContainer>
  );
};

export default SearchPanel;
