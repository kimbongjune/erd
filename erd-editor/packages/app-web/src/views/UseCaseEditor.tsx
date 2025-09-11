'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UseCaseLayout from '../components/UseCaseLayout';
import styled from 'styled-components';

const UseCaseContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

interface UseCaseEditorProps {
  usecaseId?: string;
}

const UseCaseEditor: React.FC<UseCaseEditorProps> = ({ usecaseId }) => {
  const router = useRouter();

  useEffect(() => {
    // 페이지 타이틀 설정
    document.title = '유즈케이스 다이어그램 편집기';
  }, []);

  if (!usecaseId) {
    return <div>잘못된 접근입니다.</div>;
  }

  return (
    <UseCaseContainer>
      <UseCaseLayout usecaseId={usecaseId} />
    </UseCaseContainer>
  );
};

export default UseCaseEditor;
