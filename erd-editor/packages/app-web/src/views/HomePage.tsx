'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { FaPlus, FaSearch, FaEllipsisV, FaGlobe, FaFolder, FaClock, FaEdit, FaDatabase, FaChartLine, FaUsers, FaCubes, FaProjectDiagram, FaSitemap, FaTable, FaTrash, FaComment, FaImage, FaLock, FaUnlock } from 'react-icons/fa';
import { FaNoteSticky } from "react-icons/fa6";
import { GrMysql } from "react-icons/gr";
import { BsFillDiagram3Fill } from "react-icons/bs";
import UserMenu from '../components/UserMenu';
import LoginModal from '../components/auth/LoginModal';
import SignupModal from '../components/auth/SignupModal';
import MyPageModal from '../components/auth/MyPageModal';
import { useAuth } from '../hooks/useAuth';
import { useMongoDBDiagrams } from '../hooks/useMongoDBDiagrams';
import { toast } from 'react-toastify';

// Skeleton Loading 컴포넌트들
const shimmerAnimation = `
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(90deg, #1f2937 25%, #374151 37%, #1f2937 63%);
  background-size: 400px 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
  
  ${shimmerAnimation}
`;

const SkeletonStatCard = styled.div`
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border: 1px solid #374151;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
`;

const SkeletonIcon = styled(SkeletonBase)`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  margin: 0 auto 16px;
`;

const SkeletonNumber = styled(SkeletonBase)`
  width: 60px;
  height: 32px;
  margin: 0 auto 8px;
`;

const SkeletonLabel = styled(SkeletonBase)`
  width: 80px;
  height: 14px;
  margin: 0 auto;
`;

const SkeletonDiagramCard = styled.div`
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border: 1px solid #374151;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
`;

const SkeletonDiagramIcon = styled(SkeletonBase)`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin-bottom: 16px;
`;

const SkeletonDiagramTitle = styled(SkeletonBase)`
  width: 80%;
  height: 20px;
  margin-bottom: 8px;
`;

const SkeletonDiagramMeta = styled(SkeletonBase)`
  width: 60%;
  height: 14px;
  margin-bottom: 16px;
`;

const SkeletonDiagramStats = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
`;

const SkeletonStat = styled(SkeletonBase)`
  width: 60px;
  height: 24px;
`;

const SkeletonDiagramTags = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const SkeletonTag = styled(SkeletonBase)`
  width: 50px;
  height: 20px;
  border-radius: 10px;
`;
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
  flex-wrap: wrap;
  gap: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
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
  flex-shrink: 0;
  
  input {
    width: 100%;
    padding: 12px 40px 12px 16px;
    padding-left: 40px !important;
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
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
    font-size: 14px;
    pointer-events: none;
    z-index: 2;
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
  
  .menu-button {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 6px;
    padding: 8px;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
    }
  }
`;

const MenuDropdown = styled.div<{ $show: boolean }>`
  position: absolute;
  top: 45px;
  right: 0;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 20;
  min-width: 120px;
  opacity: ${props => props.$show ? 1 : 0};
  visibility: ${props => props.$show ? 'visible' : 'hidden'};
  transform: ${props => props.$show ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.2s ease;
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  color: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #374151;
  }
  
  &.delete {
    color: #f87171;
    
    &:hover {
      background: rgba(248, 113, 113, 0.1);
    }
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

const DiagramStats = styled.div`
  display: flex;
  gap: 16px;
  margin: 16px 0;
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 13px;
  
  .icon {
    color: #60a5fa;
    font-size: 14px;
  }
  
  .count {
    font-weight: 500;
    color: #ffffff;
  }
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
  margin-top: 16px;
  flex-wrap: wrap;
  
  .tag {
    background: rgba(96, 165, 250, 0.1);
    color: #60a5fa;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid rgba(96, 165, 250, 0.2);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .status-tag {
    background: rgba(156, 163, 175, 0.1);
    color: #9ca3af;
    border-color: rgba(156, 163, 175, 0.2);
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

const HighlightedText = styled.span`
  background: #ffd700;
  color: #000000;
  padding: 1px 2px;
  border-radius: 2px;
  font-weight: 600;
`;

const DeleteModal = styled.div<{ $show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

const ModalContent = styled.div`
  background: #1f2937;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  border: 1px solid #374151;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  h3 {
    margin: 0 0 16px 0;
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
  }
  
  p {
    margin: 0 0 24px 0;
    color: #9ca3af;
    line-height: 1.5;
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const ModalButton = styled.button<{ $primary?: boolean }>`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
  
  ${props => props.$primary ? `
    background: #dc2626;
    color: white;
    
    &:hover {
      background: #b91c1c;
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `}
`;

interface Diagram {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  visibility?: 'public' | 'private' | 'team';
  isPublic?: boolean; // MongoDB의 isPublic 필드 추가
  entityCount?: number;
  relationCount?: number;
  commentCount?: number;
  imageCount?: number;
}

const HomePage: React.FC = () => {
  const router = useRouter();
  const [diagrams, setDiagrams] = useState<Diagram[] | null>(null); // null로 초기화
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; diagramId: string | null; diagramName: string }>({
    show: false,
    diagramId: null,
    diagramName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDiagramsLoading, setIsDiagramsLoading] = useState(false);
  
  // 모달 상태 관리
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [myPageModalOpen, setMyPageModalOpen] = useState(false);

  // 인증 및 MongoDB 훅
  const { user, isAuthenticated, loading } = useAuth();
  const { fetchDiagrams, saveAsNew, deleteDiagram: deleteMongoDBDiagram } = useMongoDBDiagrams();

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '홈 - No ERD';
  }, []);

  // Structured Data for Homepage SEO
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "No ERD",
      "applicationCategory": "DesignApplication",
      "operatingSystem": "Web Browser",
      "description": "직관적이고 강력한 Entity Relationship Diagram 도구로 데이터베이스 설계를 간편하게 시각화하세요.",
      "url": "https://erd-dusky.vercel.app",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "KRW"
      },
      "creator": {
        "@type": "Organization",
        "name": "No ERD Team"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "150"
      },
      "featureList": [
        "ERD 다이어그램 생성 및 편집",
        "MySQL 워크벤치 스타일 인터페이스", 
        "실시간 협업 기능",
        "무료 사용",
        "클라우드 저장소 지원",
        "다양한 데이터베이스 지원"
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // UserMenu 콜백 함수들을 useCallback으로 최적화
  const handleOpenLogin = useCallback(() => {
    setLoginModalOpen(true);
  }, []);

  const handleOpenSignup = useCallback(() => {
    setSignupModalOpen(true);
  }, []);

  const handleOpenMyPage = useCallback(() => {
    setMyPageModalOpen(true);
  }, []);

  // 초기 다이어그램 목록 로드 (NextAuth 세션이 로드된 후)
  useEffect(() => {
    if (!loading) {
      // 인증 상태가 확정된 후 짧은 지연 후 로드
      const timer = setTimeout(() => {
        loadDiagrams();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, isAuthenticated, user]); // 의존성 배열에 isAuthenticated, user 추가

  useEffect(() => {
    // 페이지가 다시 포커스될 때 다이어그램 목록 새로고침
    const handleFocus = () => {
      if (!loading && !isDiagramsLoading) {
        loadDiagrams();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    // 메뉴가 열려있을 때 외부 클릭으로 닫기
    const handleClickOutside = () => {
      setMenuOpenId(null);
    };
    
    if (menuOpenId) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpenId]); // loading 제거하고 초기 로드는 별도 useEffect로

  const loadDiagrams = async () => {
    setIsDiagramsLoading(true); // 다이어그램 로딩 상태 시작
    
    try {
      if (isAuthenticated && user) {
        // 로그인된 사용자: MongoDB에서 다이어그램 목록 가져오기
        const result = await fetchDiagrams({ limit: 50 });
        
        const mongoDBDiagrams: Diagram[] = result.diagrams.map(diagram => ({
          id: diagram.id,
          name: diagram.title,
          createdAt: new Date(diagram.createdAt).getTime(),
          updatedAt: new Date(diagram.updatedAt).getTime(),
          visibility: 'private', // 기본값
          isPublic: diagram.isPublic || false, // MongoDB의 isPublic 필드 추가
          entityCount: diagram.entityCount || 0,
          relationCount: diagram.relationCount || 0,
          commentCount: diagram.commentCount || 0,
          imageCount: diagram.imageCount || 0
        }));
        
        setDiagrams(mongoDBDiagrams);
      } else {
        // 로그인하지 않은 사용자: 빈 배열
        setDiagrams([]);
      }
    } catch (error) {
      console.error('MongoDB 다이어그램 로드 실패:', error);
      setDiagrams([]);
      toast.error('다이어그램을 불러오는데 실패했습니다.');
    } finally {
      setIsDiagramsLoading(false); // 다이어그램 로딩 상태 종료
    }
  };

  const createNewDiagram = async (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!isAuthenticated || !user) {
      setLoginModalOpen(true);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // 초기 ERD 데이터
      const initialErdData = {
        version: '1.0',
        timestamp: Date.now(),
        nodes: [],
        edges: [],
        nodeColors: {},
        edgeColors: {},
        commentColors: {},
        viewSettings: {
          entityView: 'logical',
          showKeys: true,
          showPhysicalName: true,
          showLogicalName: false,
          showDataType: true,
          showConstraints: false,
          showDefaults: false,
        },
        theme: 'light',
        showGrid: false,
        hiddenEntities: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        viewportRestoreTrigger: Date.now()
      };

      const result = await saveAsNew('제목 없는 다이어그램', '', false, [], initialErdData);
      // MongoDB에 저장 성공하면 해당 다이어그램으로 이동
      router.push(`/erd/${result.diagram.id}`);
    } catch (error) {
      console.error('다이어그램 생성 실패:', error);
      toast.error('다이어그램 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const openDiagram = (id: string) => {
    router.push(`/erd/${id}`);
  };

  const deleteDiagram = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const diagram = (diagrams || []).find(d => d.id === id);
    setDeleteModal({
      show: true,
      diagramId: id,
      diagramName: diagram?.name || '다이어그램'
    });
    setMenuOpenId(null);
  };

  const confirmDelete = async () => {
    if (deleteModal.diagramId) {
      try {
        setIsLoading(true);
        
        // MongoDB 다이어그램 삭제
        await deleteMongoDBDiagram(deleteModal.diagramId);
        
        // 다이어그램 목록 새로고침
        await loadDiagrams();
        toast.success('다이어그램이 삭제되었습니다.');
      } catch (error) {
        console.error('다이어그램 삭제 오류:', error);
        toast.error('다이어그램 삭제에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    
    // 모달을 먼저 숨기고, 트랜지션이 완료된 후에 상태 초기화
    setDeleteModal(prev => ({ ...prev, show: false }));
    setTimeout(() => {
      setDeleteModal({ show: false, diagramId: null, diagramName: '' });
    }, 300);
  };

  const cancelDelete = () => {
    // 모달을 먼저 숨기고, 트랜지션이 완료된 후에 상태 초기화
    setDeleteModal(prev => ({ ...prev, show: false }));
    setTimeout(() => {
      setDeleteModal({ show: false, diagramId: null, diagramName: '' });
    }, 300); // 트랜지션 시간과 동일하게 설정
  };

  const handleMenuClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const getDiagramStats = (diagramId: string) => {
    // MongoDB에서 로드된 diagrams 배열에서 해당 다이어그램 찾기
    const diagram = (diagrams || []).find(d => d.id === diagramId);
    if (diagram) {
      return {
        entityCount: diagram.entityCount || 0,
        relationCount: diagram.relationCount || 0,
        commentCount: diagram.commentCount || 0,
        imageCount: diagram.imageCount || 0
      };
    }
    
    // 다이어그램을 찾을 수 없는 경우 기본값
    return { entityCount: 0, relationCount: 0, commentCount: 0, imageCount: 0 };
  };

  // 검색어를 하이라이트 처리하는 함수
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    // 검색어를 정규표현식에서 안전하게 사용할 수 있도록 이스케이프
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // 대소문자 구분 없이 전역 검색
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
        <HighlightedText key={`${match.index}-${match[0]}`}>
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

  const filteredDiagrams = (diagrams || []).filter(diagram =>
    diagram.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // MongoDB에서 가져온 통계로 총계 계산
  const totalEntities = (diagrams || []).reduce((total, diagram) => total + (diagram.entityCount || 0), 0);
  const totalRelations = (diagrams || []).reduce((total, diagram) => total + (diagram.relationCount || 0), 0);

  return (
    <HomeContainer>
      <Header>
        <Logo>
          <FaDatabase className="icon" />
          <h1>No ERD</h1>
        </Logo>
        <UserInfo>
          <UserMenu
            onOpenLogin={handleOpenLogin}
            onOpenSignup={handleOpenSignup}
            onOpenMyPage={handleOpenMyPage}
          />
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
            {diagrams === null || loading || isDiagramsLoading ? (
              // 데이터가 아직 없거나 로딩 중일 때 스켈레톤 카드들 표시
              <>
                <SkeletonStatCard>
                  <SkeletonIcon />
                  <SkeletonNumber />
                  <SkeletonLabel />
                </SkeletonStatCard>
                <SkeletonStatCard>
                  <SkeletonIcon />
                  <SkeletonNumber />
                  <SkeletonLabel />
                </SkeletonStatCard>
                <SkeletonStatCard>
                  <SkeletonIcon />
                  <SkeletonNumber />
                  <SkeletonLabel />
                </SkeletonStatCard>
              </>
            ) : (
              // 로딩 완료 후 실제 데이터 표시
              <>
                <StatCard>
                  <div className="icon">
                    <BsFillDiagram3Fill />
                  </div>
                  <div className="number">{diagrams?.length || 0}</div>
                  <div className="label">다이어그램</div>
                </StatCard>
                <StatCard>
                  <div className="icon">
                    <FaTable />
                  </div>
                  <div className="number">{totalEntities}</div>
                  <div className="label">엔티티</div>
                </StatCard>
                <StatCard>
                  <div className="icon">
                    <FaProjectDiagram />
                  </div>
                  <div className="number">{totalRelations}</div>
                  <div className="label">관계</div>
                </StatCard>
              </>
            )}
          </StatsSection>
          
          <ButtonGroup>
            <ActionButton $primary onClick={createNewDiagram}>
              <FaPlus />
              새 다이어그램 만들기
            </ActionButton>
            {/* <ActionButton onClick={() => router.push('/templates')}>
              <FaFolder />
              템플릿 둘러보기
            </ActionButton> */}
          </ButtonGroup>
        </WelcomeSection>

        {/* 로그인한 경우에만 다이어그램 섹션 표시 */}
        {isAuthenticated && (
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

            {diagrams === null || loading || isDiagramsLoading ? (
              // 데이터가 아직 없거나 로딩 중일 때 스켈레톤 다이어그램 카드들 표시
              <DiagramsGrid>
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonDiagramCard key={`skeleton-${index}`}>
                    <SkeletonDiagramIcon />
                    <SkeletonDiagramTitle />
                    <SkeletonDiagramMeta />
                    <SkeletonDiagramStats>
                      <SkeletonStat />
                      <SkeletonStat />
                      <SkeletonStat />
                    </SkeletonDiagramStats>
                    <SkeletonDiagramTags>
                      <SkeletonTag />
                      <SkeletonTag />
                    </SkeletonDiagramTags>
                  </SkeletonDiagramCard>
                ))}
              </DiagramsGrid>
            ) : filteredDiagrams.length > 0 ? (
              <DiagramsGrid>
                {filteredDiagrams.map((diagram) => {
                  const { entityCount, relationCount, commentCount, imageCount } = getDiagramStats(diagram.id);
                  
                  // 상태에 따른 아이콘과 텍스트 정의
                  const getStatusInfo = () => {
                    if (diagram.isPublic) {
                      return { icon: <FaUnlock />, text: '공개' };
                    } else {
                      return { icon: <FaLock />, text: '비공개' };
                    }
                  };
                  
                  const statusInfo = getStatusInfo();
                  
                  return (
                    <DiagramCard key={diagram.id} onClick={() => openDiagram(diagram.id)}>
                      <button 
                        className="menu-button"
                        onClick={(e) => handleMenuClick(diagram.id, e)}
                        title="메뉴"
                      >
                        <FaEllipsisV />
                      </button>
                      <MenuDropdown $show={menuOpenId === diagram.id}>
                        <MenuItem 
                          className="delete"
                          onClick={(e) => deleteDiagram(diagram.id, e)}
                        >
                          <FaTrash />
                          삭제
                        </MenuItem>
                      </MenuDropdown>
                      <DiagramIcon>
                        {statusInfo.icon}
                      </DiagramIcon>
                      <DiagramName>
                        {highlightSearchTerm(diagram.name, searchTerm)}
                      </DiagramName>
                      <DiagramMeta>
                        <span>
                          <FaClock style={{ marginRight: '6px' }} />
                          수정: {formatTime(diagram.updatedAt)}
                        </span>
                        <span>
                          생성: {formatDate(diagram.createdAt)}
                        </span>
                      </DiagramMeta>
                      <DiagramStats>
                        {entityCount > 0 && (
                          <StatItem>
                            <FaTable className="icon" />
                            <span className="count">{entityCount}</span>
                            <span>엔티티</span>
                          </StatItem>
                        )}
                        {relationCount > 0 && (
                          <StatItem>
                            <FaProjectDiagram className="icon" />
                            <span className="count">{relationCount}</span>
                            <span>관계</span>
                          </StatItem>
                        )}
                        {commentCount > 0 && (
                          <StatItem>
                            <FaNoteSticky className="icon" />
                            <span className="count">{commentCount}</span>
                            <span>메모</span>
                          </StatItem>
                        )}
                        {imageCount > 0 && (
                          <StatItem>
                            <FaImage className="icon" />
                            <span className="count">{imageCount}</span>
                            <span>이미지</span>
                          </StatItem>
                        )}
                        {entityCount === 0 && relationCount === 0 && commentCount === 0 && imageCount === 0 && (
                          <StatItem>
                            <span style={{ color: '#6b7280' }}>(비어있음)</span>
                          </StatItem>
                        )}
                      </DiagramStats>
                      <DiagramTags>
                        <span className="tag">
                          <GrMysql style={{ marginRight: '4px' }} />
                          MySQL
                        </span>
                        <span className="tag status-tag">
                          {statusInfo.icon}
                          {statusInfo.text}
                        </span>
                      </DiagramTags>
                    </DiagramCard>
                  );
                })}
              </DiagramsGrid>
            ) : filteredDiagrams.length === 0 ? (
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
            ) : null
            }
          </DiagramsSection>
        )}
      </MainContent>
      
      {/* 삭제 확인 모달 */}
      {deleteModal.show && (
        <DeleteModal 
          $show={deleteModal.show} 
          onClick={(e) => {
            // 배경 클릭 시에만 닫기 (ConfirmModal과 동일한 방식)
            if (e.target === e.currentTarget) {
              setDeleteModal(prev => ({ ...prev, show: false }));
              setTimeout(() => {
                setDeleteModal({ show: false, diagramId: null, diagramName: '' });
              }, 300);
            }
          }}
        >
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h3>다이어그램 삭제</h3>
            <p>
              정말로 "<strong>{deleteModal.diagramName}</strong>" 다이어그램을 삭제하시겠습니까?<br/>
              이 작업은 되돌릴 수 없습니다.
            </p>
            <ModalButtons>
              <ModalButton onClick={cancelDelete}>
                취소
              </ModalButton>
              <ModalButton $primary onClick={confirmDelete}>
                삭제
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </DeleteModal>
      )}
      
      {/* 인증 모달들 */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToSignup={() => {
          setLoginModalOpen(false);
          setSignupModalOpen(true);
        }}
      />
      
      <SignupModal
        isOpen={signupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        onSwitchToLogin={() => {
          setSignupModalOpen(false);
          setLoginModalOpen(true);
        }}
      />
      
      <MyPageModal
        isOpen={myPageModalOpen}
        onClose={() => setMyPageModalOpen(false)}
      />
    </HomeContainer>
  );
};

export default HomePage;
