import UseCaseEditor from '../../../views/UseCaseEditor';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '유즈케이스 다이어그램 편집기',
  description: '유즈케이스 다이어그램을 만들고 편집하세요.',
};

interface UseCasePageProps {
  params: {
    id: string;
  };
}

export default function UseCasePage({ params }: UseCasePageProps) {
  return <UseCaseEditor usecaseId={params.id} />;
}
