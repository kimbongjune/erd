import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { FaPlus, FaSearch, FaEllipsisV, FaGlobe, FaFolder, FaClock, FaEdit } from 'react-icons/fa';

const HomeContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const Header = styled.header`
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const Logo = styled.h1`
  font-size: 28px;
  font-weight: bold;
  margin: 0;
`;

const MainContent = styled.main`
  padding: 60px 40px;
  max-width: 1200px;
  margin: 0 auto;
`;

const WelcomeSection = styled.section`
  text-align: center;
  margin-bottom: 80px;
`;

const Title = styled.h2`
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const Subtitle = styled.p`
  font-size: 20px;
  opacity: 0.9;
  margin-bottom: 40px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 60px;
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  
  ${props => props.$primary ? `
    background: #4CAF50;
    color: white;
    
    &:hover {
      background: #45a049;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
    }
  ` : `
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
  `}
`;

const DiagramsSection = styled.section`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 40px;
  backdrop-filter: blur(10px);
`;

const SectionTitle = styled.h3`
  font-size: 24px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DiagramsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const DiagramCard = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-4px);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
  }
`;

const DiagramName = styled.h4`
  font-size: 18px;
  margin-bottom: 8px;
  color: white;
`;

const DiagramMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  opacity: 0.8;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  opacity: 0.7;
`;

interface Diagram {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

const HomePage: React.FC = () => {
  const router = useRouter();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);

  useEffect(() => {
    loadDiagrams();
  }, []);

  const loadDiagrams = () => {
    const diagramsList = JSON.parse(localStorage.getItem('erd-diagrams-list') || '[]');
    setDiagrams(diagramsList.sort((a: Diagram, b: Diagram) => b.updatedAt - a.updatedAt));
  };

  const createNewDiagram = () => {
    const id = `erd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    router.push(`/erd/${id}`);
  };

  const openDiagram = (id: string) => {
    router.push(`/erd/${id}`);
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

  return (
    <HomeContainer>
      <Header>
        <Logo>ERD Editor</Logo>
      </Header>

      <MainContent>
        <WelcomeSection>
          <Title>ERD 다이어그램 편집기</Title>
          <Subtitle>직관적이고 강력한 Entity Relationship Diagram 도구</Subtitle>
          
          <ButtonGroup>
            <ActionButton $primary onClick={createNewDiagram}>
              <FaPlus />
              새 다이어그램 만들기
            </ActionButton>
          </ButtonGroup>
        </WelcomeSection>

        <DiagramsSection>
          <SectionTitle>
            <FaFolder />
            내 다이어그램 ({diagrams.length})
          </SectionTitle>

          {diagrams.length > 0 ? (
            <DiagramsGrid>
              {diagrams.map((diagram) => (
                <DiagramCard key={diagram.id} onClick={() => openDiagram(diagram.id)}>
                  <DiagramName>{diagram.name}</DiagramName>
                  <DiagramMeta>
                    <span>
                      <FaClock style={{ marginRight: '4px' }} />
                      {formatDate(diagram.updatedAt)}
                    </span>
                    <FaEdit />
                  </DiagramMeta>
                </DiagramCard>
              ))}
            </DiagramsGrid>
          ) : (
            <EmptyState>
              <FaFolder size={64} style={{ marginBottom: '20px', opacity: 0.5 }} />
              <p>아직 생성된 다이어그램이 없습니다.</p>
              <p>새 다이어그램을 만들어 시작해보세요!</p>
            </EmptyState>
          )}
        </DiagramsSection>
      </MainContent>
    </HomeContainer>
  );
};

export default HomePage;
