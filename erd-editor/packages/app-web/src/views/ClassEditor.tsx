'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClassLayout from '../components/ClassLayout';
import styled from 'styled-components';

const ClassContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

interface ClassEditorProps {
  classId?: string;
}

const ClassEditor: React.FC<ClassEditorProps> = ({ classId }) => {
  const router = useRouter();

  useEffect(() => {
    // 페이지 타이틀 설정
    document.title = '클래스 다이어그램 편집기';
  }, []);

  if (!classId) {
    return <div>잘못된 접근입니다.</div>;
  }

  return (
    <ClassContainer>
      <ClassLayout classId={classId} />
    </ClassContainer>
  );
};

export default ClassEditor;
