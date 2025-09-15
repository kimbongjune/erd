import { use } from 'react';
import SequenceEditor from '../../../views/SequenceEditor';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  // 실제로는 API에서 다이어그램 정보를 가져와야 하지만, 
  // 일단 기본값으로 설정
  const diagramTitle = `시퀀스 다이어그램 ${id}`;
  
  return {
    title: `${diagramTitle} - No ERD 편집기`,
    description: `${diagramTitle}을(를) No ERD 편집기에서 편집하고 있습니다. 실시간으로 시퀀스 다이어그램을 생성하고 수정할 수 있습니다.`,
    keywords: [
      '시퀀스 편집', `${diagramTitle}`, '상호작용 다이어그램', 'Sequence Diagram',
      'UML 다이어그램', '온라인 시퀀스 편집기', 'Interaction Diagram', 'Message Flow'
    ],
    openGraph: {
      title: `${diagramTitle} - No ERD 편집기`,
      description: `${diagramTitle}을(를) No ERD 편집기에서 편집하고 있습니다.`,
      url: `https://erd-dusky.vercel.app/sequence/${id}`,
      images: [
        {
          url: `/api/sequence/${id}/og-image`, // 나중에 구현할 동적 OG 이미지
          width: 1200,
          height: 630,
          alt: `${diagramTitle} 시퀀스 다이어그램`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${diagramTitle} - No ERD 편집기`,
      description: `${diagramTitle}을(를) No ERD 편집기에서 편집하고 있습니다.`,
    },
    robots: {
      index: false, // 다이어그램 편집 페이지는 인덱싱하지 않음
      follow: true,
    },
    alternates: {
      canonical: `/sequence/${id}`,
    },
  };
}

export default function SequenceEditorRoute({ params }: PageProps) {
  const { id } = use(params);
  return <SequenceEditor sequenceId={id} />;
}
