'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SequenceLayout from '../components/SequenceLayout';
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

  useEffect(() => {
    // 페이지 타이틀 설정
    document.title = '시퀀스 다이어그램 편집기';
  }, []);

  if (!sequenceId) {
    return <div>잘못된 접근입니다.</div>;
  }

  return (
    <SequenceContainer>
      <SequenceLayout sequenceId={sequenceId} />
    </SequenceContainer>
  );
};

export default SequenceEditor;
