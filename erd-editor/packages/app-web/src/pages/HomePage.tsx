import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaPlus, FaSearch, FaEllipsisV, FaGlobe, FaFolder, FaClock, FaEdit, FaDatabase, FaChartLine, FaUsers, FaCubes, FaProjectDiagram, FaSitemap } from 'react-icons/fa';

const HomeContainer = styled.div`
  min-height: 100vh;
  background: #0f1419;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
`;

const Header = styled.header`
  padding: 24px 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid #1f2937;
  backdrop-filter: blur(20px);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  h1 {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .icon {
    font-size: 28px;
    color: #60a5fa;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #9ca3af;
  font-size: 14px;
  
  .login-link {
    color: #60a5fa;
    text-decoration: none;
    padding: 8px 16px;
    border: 1px solid #374151;
    border-radius: 8px;
    transition: all 0.3s ease;
    
    &:hover {
      color: #ffffff;
      border-color: #60a5fa;
      background: rgba(96, 165, 250, 0.1);
    }
  }
`;

const MainContent = styled.main`
  padding: 80px 48px;
  max-width: 1400px;
  margin: 0 auto;
`;

const WelcomeSection = styled.section`
  text-align: center;
  margin-bottom: 80px;
`;

const Title = styled.h2`
  font-size: 56px;
  font-weight: 800;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #ffffff, #9ca3af);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: #9ca3af;
  margin-bottom: 48px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border: 1px solid #374151;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    border-color: #4f46e5;
    box-shadow: 0 20px 40px rgba(79, 70, 229, 0.1);
  }
  
  .icon {
    font-size: 32px;
    color: #60a5fa;
    margin-bottom: 16px;
  }
  
  .number {
    font-size: 32px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 8px;
  }
  
  .label {
    color: #9ca3af;
    font-size: 14px;
    font-weight: 500;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 80px;
  flex-wrap: wrap;
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
  gap: 12px;
  transition: all 0.3s ease;
  min-width: 180px;
  
  ${props => props.$primary ? `
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    color: white;
    
    &:hover {
      background: linear-gradient(135deg, #4338ca, #6d28d9);
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(79, 70, 229, 0.3);
    }
  ` : `
    background: rgba(255, 255, 255, 0.05);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
  `}
`;

const DiagramsSection = styled.section`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid #374151;
  border-radius: 24px;
  padding: 48px;
  backdrop-filter: blur(20px);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
`;

const SectionTitle = styled.h3`
  font-size: 28px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  
  .icon {
    color: #60a5fa;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  width: 320px;
  
  input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #374151;
    border-radius: 12px;
    color: white;
    font-size: 14px;
    transition: all 0.3s ease;
    box-sizing: border-box;
    
    &::placeholder {
      color: #9ca3af;
    }
    
    &:focus {
      outline: none;
      border-color: #4f46e5;
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
  }
  
  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    font-size: 14px;
    pointer-events: none;
  }
`;

const DiagramsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
`;

const DiagramCard = styled.div`
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border: 1px solid #374151;
  border-radius: 16px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
    transform: translateY(-4px);
    border-color: #4f46e5;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
  
  .status-indicator {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
  }
`;

const DiagramIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: white;
  font-size: 20px;
`;

const DiagramName = styled.h4`
  font-size: 20px;
  margin-bottom: 12px;
  color: white;
  font-weight: 600;
  line-height: 1.3;
`;

const DiagramMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 16px;
`;

const DiagramTags = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  
  .tag {
    background: rgba(79, 70, 229, 0.2);
    color: #a78bfa;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: #9ca3af;
  
  .icon {
    font-size: 64px;
    margin-bottom: 24px;
    opacity: 0.5;
  }
  
  h3 {
    font-size: 24px;
    margin-bottom: 12px;
    color: #ffffff;
  }
  
  p {
    font-size: 16px;
    margin-bottom: 32px;
    line-height: 1.5;
  }
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
    
    // 새 다이어그램을 다이어그램 목록에 즉시 추가
    const diagramsList = JSON.parse(localStorage.getItem('erd-diagrams-list') || '[]');
    const newDiagram = {
      id: id,
      name: '제목 없는 다이어그램',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    diagramsList.push(newDiagram);
    localStorage.setItem('erd-diagrams-list', JSON.stringify(diagramsList));
    
    navigate(`/erd/${id}`);
  };

  const openDiagram = (id: string) => {
    navigate(`/erd/${id}`);
  };

  const formatDate = (timestamp: number) => {
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
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        if (diffMins === 0) {
          return '방금 전';
        }
        return `${diffMins}분 전`;
      }
      return `${diffHours}시간 전`;
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return formatDate(timestamp);
    }
  };

  const filteredDiagrams = diagrams.filter(diagram =>
    diagram.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 실제 엔티티와 관계 수 계산
  const totalEntities = diagrams.reduce((total, diagram) => {
    const savedData = localStorage.getItem(`erd-${diagram.id}`);
    if (savedData) {
      try {
        const erdData = JSON.parse(savedData);
        const entityCount = erdData.nodes?.filter((node: any) => node.type === 'entity').length || 0;
        return total + entityCount;
      } catch (error) {
        return total;
      }
    }
    return total;
  }, 0);

  const totalRelations = diagrams.reduce((total, diagram) => {
    const savedData = localStorage.getItem(`erd-${diagram.id}`);
    if (savedData) {
      try {
        const erdData = JSON.parse(savedData);
        const relationCount = erdData.edges?.length || 0;
        return total + relationCount;
      } catch (error) {
        return total;
      }
    }
    return total;
  }, 0);

  return (
    <HomeContainer>
      <Header>
        <Logo>
          <FaDatabase className="icon" />
          <h1>ERD Studio</h1>
        </Logo>
        <UserInfo>
          <a href="#" className="login-link">로그인</a>
        </UserInfo>
      </Header>

      <MainContent>
        <WelcomeSection>
          <Title>ERD 다이어그램 편집기</Title>
          <Subtitle>
            직관적이고 강력한 Entity Relationship Diagram 도구로 
            데이터베이스 설계를 간편하게 시각화하세요
          </Subtitle>

          <StatsSection>
            <StatCard>
              <div className="icon">
                <FaProjectDiagram />
              </div>
              <div className="number">{diagrams.length}</div>
              <div className="label">다이어그램</div>
            </StatCard>
            <StatCard>
              <div className="icon">
                <FaCubes />
              </div>
              <div className="number">{totalEntities}</div>
              <div className="label">엔티티</div>
            </StatCard>
            <StatCard>
              <div className="icon">
                <FaSitemap />
              </div>
              <div className="number">{totalRelations}</div>
              <div className="label">관계</div>
            </StatCard>
          </StatsSection>
          
          <ButtonGroup>
            <ActionButton $primary onClick={createNewDiagram}>
              <FaPlus />
              새 다이어그램 만들기
            </ActionButton>
            {/* <ActionButton onClick={() => navigate('/templates')}>
              <FaFolder />
              템플릿 둘러보기
            </ActionButton> */}
          </ButtonGroup>
        </WelcomeSection>

        <DiagramsSection>
          <SectionHeader>
            <SectionTitle>
              <FaFolder className="icon" />
              내 다이어그램
            </SectionTitle>
            <SearchContainer>
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="다이어그램 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>
          </SectionHeader>

          {filteredDiagrams.length > 0 ? (
            <DiagramsGrid>
              {filteredDiagrams.map((diagram) => (
                <DiagramCard key={diagram.id} onClick={() => openDiagram(diagram.id)}>
                  <div className="status-indicator"></div>
                  <DiagramIcon>
                    <FaDatabase />
                  </DiagramIcon>
                  <DiagramName>{diagram.name}</DiagramName>
                  <DiagramMeta>
                    <span>
                      <FaClock style={{ marginRight: '6px' }} />
                      수정: {formatTime(diagram.updatedAt)}
                    </span>
                    <span>
                      생성: {formatDate(diagram.createdAt)}
                    </span>
                  </DiagramMeta>
                  <DiagramTags>
                    <span className="tag">MySQL</span>
                    <span className="tag">최신</span>
                  </DiagramTags>
                </DiagramCard>
              ))}
            </DiagramsGrid>
          ) : (
            <EmptyState>
              <div className="icon">
                {searchTerm ? <FaSearch /> : <FaDatabase />}
              </div>
              <h3>
                {searchTerm 
                  ? `"${searchTerm}"에 대한 검색 결과가 없습니다`
                  : '아직 생성된 다이어그램이 없습니다'
                }
              </h3>
              <p>
                {searchTerm
                  ? '다른 검색어를 시도해보거나 새 다이어그램을 만들어보세요'
                  : '새 다이어그램을 만들어 데이터베이스 설계를 시작해보세요!'
                }
              </p>
              <ActionButton $primary onClick={createNewDiagram}>
                <FaPlus />
                새 다이어그램 만들기
              </ActionButton>
            </EmptyState>
          )}
        </DiagramsSection>
      </MainContent>
    </HomeContainer>
  );
};

export default HomePage;
