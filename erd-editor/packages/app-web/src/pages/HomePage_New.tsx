import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaPlus, FaSearch, FaEllipsisV, FaGlobe } from 'react-icons/fa';

const HomeContainer = styled.div`
  min-height: 100vh;
  background: #2d3748;
  color: white;
`;

const TopBar = styled.div`
  background: #1a202c;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #4a5568;
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 400px;
`;

const SearchInput = styled.input`
  background: #4a5568;
  border: 1px solid #718096;
  border-radius: 6px;
  padding: 8px 16px 8px 40px;
  color: white;
  font-size: 14px;
  width: 100%;
  
  &::placeholder {
    color: #a0aec0;
  }
  
  &:focus {
    outline: none;
    border-color: #4299e1;
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 12px;
  color: #a0aec0;
  font-size: 14px;
`;

const PlanInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
`;

const PlanBadge = styled.span`
  background: #4a5568;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: uppercase;
`;

const DiagramCount = styled.span`
  color: #a0aec0;
`;

const MainContent = styled.div`
  padding: 24px;
`;

const ActionsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const NewButton = styled.button`
  background: #4299e1;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.3s ease;
  
  &:hover {
    background: #3182ce;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #1a202c;
  border-radius: 8px;
  overflow: hidden;
`;

const TableHeader = styled.thead`
  background: #2d3748;
`;

const TableHeaderCell = styled.th`
  text-align: left;
  padding: 16px 20px;
  font-weight: 500;
  font-size: 14px;
  color: #a0aec0;
  border-bottom: 1px solid #4a5568;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:hover {
    background: #2d3748;
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #4a5568;
  }
`;

const TableCell = styled.td`
  padding: 16px 20px;
  font-size: 14px;
`;

const DiagramIcon = styled.div`
  width: 20px;
  height: 20px;
  background: #4a5568;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
`;

const DiagramName = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  
  &:hover {
    color: #4299e1;
  }
`;

const DateText = styled.span`
  color: #a0aec0;
`;

const MoreButton = styled.button`
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: #4a5568;
    color: white;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #a0aec0;
`;

interface Diagram {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDiagrams();
  }, []);

  const loadDiagrams = () => {
    const diagramsList = JSON.parse(localStorage.getItem('erd-diagrams-list') || '[]');
    setDiagrams(diagramsList.sort((a: Diagram, b: Diagram) => b.updatedAt - a.updatedAt));
  };

  const createNewDiagram = () => {
    const id = `erd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`/erd/${id}`);
  };

  const openDiagram = (id: string) => {
    navigate(`/erd/${id}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
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

  const filteredDiagrams = diagrams.filter(diagram =>
    diagram.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <HomeContainer>
      <TopBar>
        <SearchContainer>
          <SearchIcon />
          <SearchInput
            type="text"
            placeholder="search diagrams"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>
        
        <PlanInfo>
          <PlanBadge>Free</PlanBadge>
          <span>plan</span>
          <DiagramCount>Diagrams: {diagrams.length} / 10</DiagramCount>
        </PlanInfo>
      </TopBar>

      <MainContent>
        <ActionsBar>
          <NewButton onClick={createNewDiagram}>
            <FaPlus />
            New Diagram
          </NewButton>
        </ActionsBar>

        {filteredDiagrams.length > 0 ? (
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Date Modified</TableHeaderCell>
                <TableHeaderCell>Date Created</TableHeaderCell>
                <TableHeaderCell style={{ width: '50px' }}></TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredDiagrams.map((diagram) => (
                <TableRow key={diagram.id}>
                  <TableCell>
                    <DiagramName onClick={() => openDiagram(diagram.id)}>
                      <DiagramIcon>
                        <FaGlobe size={12} />
                      </DiagramIcon>
                      {diagram.name}
                    </DiagramName>
                  </TableCell>
                  <TableCell>
                    <DateText>{formatTime(diagram.updatedAt)}</DateText>
                  </TableCell>
                  <TableCell>
                    <DateText>{formatDate(diagram.createdAt)}</DateText>
                  </TableCell>
                  <TableCell>
                    <MoreButton>
                      <FaEllipsisV />
                    </MoreButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState>
            {searchTerm ? (
              <div>
                <p>검색 결과가 없습니다</p>
                <p>"{searchTerm}"와 일치하는 다이어그램을 찾을 수 없습니다</p>
              </div>
            ) : (
              <div>
                <p>아직 생성된 다이어그램이 없습니다</p>
                <p>새 다이어그램을 만들어 시작해보세요</p>
              </div>
            )}
          </EmptyState>
        )}
      </MainContent>
    </HomeContainer>
  );
};

export default HomePage;
