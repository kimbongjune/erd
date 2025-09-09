import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
import useStore from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import { useMongoDBDiagrams } from '../hooks/useMongoDBDiagrams';
import styled from 'styled-components';

const ERDContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

interface ERDEditorProps {
  erdId?: string;
}

const ERDEditor: React.FC<ERDEditorProps> = ({ erdId }) => {
  const router = useRouter();
  const { 
    loadFromMongoDB, 
    setCurrentDiagramId, 
    setIsAuthenticated, 
    setIsReadOnlyMode,
    setDiagramOwner,
    nodes, 
    theme, 
    setLoading, 
    currentDiagramId 
  } = useStore();
  const { isAuthenticated, user, loading } = useAuth();
  const { fetchDiagram } = useMongoDBDiagrams();

  useEffect(() => {
    // Store에 인증 상태 설정
    setIsAuthenticated(isAuthenticated);
    
    if (!erdId) return;
    
    // ERD ID 유효성 검증 (MongoDB ObjectId 또는 영문, 숫자, _, - 만 허용)
    const validIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validIdPattern.test(erdId)) {
      router.push('/404');
      return;
    }

    // 인증 로딩 중이면 대기
    if (loading) {
      return;
    }

    // 다이어그램 권한 확인 및 로드
    const checkPermissionAndLoad = async () => {
      try {
        // 다이어그램 정보 먼저 조회
        const response = await fetch(`/api/diagrams/${erdId}`);
        
        if (response.status === 401) {
          // 권한 없음 - 로그인이 필요하거나 비공개 다이어그램
          router.push('/home');
          return;
        }
        
        if (!response.ok) {
          throw new Error('다이어그램을 찾을 수 없습니다.');
        }
        
        const data = await response.json();
        const { diagram, isOwner, userEmail } = data;
        
        // 다이어그램 소유자 정보 설정
        setDiagramOwner(userEmail);
        
        // 읽기 전용 모드 설정 (소유자가 아닌 경우)
        setIsReadOnlyMode(!isOwner);
        
        // 다이어그램 로드
        setCurrentDiagramId(erdId);
        await loadFromMongoDB(erdId);
        
      } catch (error) {
        console.error('다이어그램 로드 실패:', error);
        router.push('/home');
      }
    };

    checkPermissionAndLoad();
  }, [erdId, loading]); // isAuthenticated와 user 의존성 제거

  if (!erdId) {
    return <div>잘못된 접근입니다.</div>;
  }

  return (
    <ERDContainer>
      <Layout erdId={erdId} />
    </ERDContainer>
  );
};

export default ERDEditor;
