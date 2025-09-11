import ClassEditor from '../../../views/ClassEditor';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '클래스 다이어그램 편집기',
  description: '클래스 다이어그램을 만들고 편집하세요.',
};

interface ClassPageProps {
  params: {
    id: string;
  };
}

export default function ClassPage({ params }: ClassPageProps) {
  return <ClassEditor classId={params.id} />;
}
