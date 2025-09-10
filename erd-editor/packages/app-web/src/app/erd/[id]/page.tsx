import { use } from 'react';
import ERDEditor from '../../../views/ERDEditor';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  // 실제로는 API에서 다이어그램 정보를 가져와야 하지만, 
  // 일단 기본값으로 설정
  const diagramTitle = `ERD 다이어그램 ${id}`;
  
  return {
    title: `${diagramTitle} - No ERD 편집기`,
    description: `${diagramTitle}을(를) No ERD 편집기에서 편집하고 있습니다. 실시간으로 Entity Relationship Diagram을 생성하고 수정할 수 있습니다.`,
    keywords: [
      'ERD 편집', `${diagramTitle}`, '데이터베이스 다이어그램', 'Entity Relationship',
      'MySQL ERD', '온라인 ERD 편집기', 'Database Design', 'ER Diagram'
    ],
    openGraph: {
      title: `${diagramTitle} - No ERD 편집기`,
      description: `${diagramTitle}을(를) No ERD 편집기에서 편집하고 있습니다.`,
      url: `https://erd-dusky.vercel.app/erd/${id}`,
      images: [
        {
          url: `/api/erd/${id}/og-image`, // 나중에 구현할 동적 OG 이미지
          width: 1200,
          height: 630,
          alt: `${diagramTitle} ERD 다이어그램`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${diagramTitle} - No ERD 편집기`,
      description: `${diagramTitle}을(를) No ERD 편집기에서 편집하고 있습니다.`,
    },
    robots: {
      index: false, // ERD 편집 페이지는 인덱싱하지 않음
      follow: true,
    },
    alternates: {
      canonical: `/erd/${id}`,
    },
  };
}

export default function ERDEditorRoute({ params }: PageProps) {
  const { id } = use(params);
  return <ERDEditor erdId={id} />;
}
