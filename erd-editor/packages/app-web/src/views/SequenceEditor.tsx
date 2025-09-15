'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SequenceLayout from '../components/SequenceLayout';
import useStore from '../store/useStore';
import { useAuth } from '../hooks/useAuth';
import styled from 'styled-components';

const SequenceContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

interface SequenceEditorProps {
  sequenceId?: string;
}

const SequenceEditor: React.FC<SequenceEditorProps> = ({ sequenceId }) => {
  const router = useRouter();
  const { 
    setCurrentDiagramId, 
    setIsAuthenticated, 
    setIsReadOnlyMode,
    currentDiagramName
  } = useStore();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    // Store에 인증 상태 설정
    setIsAuthenticated(isAuthenticated);
    
    if (!sequenceId) return;
    
    // Sequence ID 유효성 검증 (MongoDB ObjectId 또는 영문, 숫자, _, - 만 허용)
    const validIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validIdPattern.test(sequenceId)) {
      router.push('/404');
      return;
    }

    // 간단히 다이어그램 ID만 설정 (DB 검사 없음)
    setCurrentDiagramId(sequenceId);
    setIsReadOnlyMode(false); // 편집 모드로 설정
    
  }, [sequenceId, isAuthenticated, setCurrentDiagramId, setIsAuthenticated, setIsReadOnlyMode, router]);

  // 다이어그램 이름이 로드되면 페이지 타이틀 설정
  useEffect(() => {
    if (currentDiagramName) {
      document.title = currentDiagramName;
    } else {
      document.title = '시퀀스 다이어그램 편집기';
    }
  }, [currentDiagramName]);

  if (!sequenceId) {
    return <div>잘못된 접근입니다.</div>;
  }

  return (
    <SequenceContainer>
      <SequenceLayout erdId={sequenceId} />
    </SequenceContainer>
  );
};

export default SequenceEditor;
