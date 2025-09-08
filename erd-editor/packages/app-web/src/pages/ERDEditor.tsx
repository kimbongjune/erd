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

    if (!isAuthenticated || !user) {
      // 로그인하지 않은 경우 즉시 홈페이지로 리다이렉트 (로딩 표시 안함)
      router.push('/home');
      return;
    }

    // MongoDB에서 다이어그램 로드 (로그인된 사용자만)
    const loadDiagram = async () => {
      try {
        setCurrentDiagramId(erdId);
        await loadFromMongoDB(erdId);
      } catch (error) {
        console.error('ERD 다이어그램 로드 실패:', error);
        // 로드 실패시 홈페이지로 리다이렉트
        router.push('/home');
      }
    };

    loadDiagram();
  }, [erdId, isAuthenticated, user, loading]); // 의존성 배열에 loading 추가

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
