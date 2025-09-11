import SequenceEditor from '../../../views/SequenceEditor';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '시퀀스 다이어그램 편집기',
  description: '시퀀스 다이어그램을 만들고 편집하세요.',
};

interface SequencePageProps {
  params: {
    id: string;
  };
}

export default function SequencePage({ params }: SequencePageProps) {
  return <SequenceEditor sequenceId={params.id} />;
}
