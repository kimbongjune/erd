import HomePage from '../../views/HomePage';
import type { Metadata } from 'next';

// 홈페이지 전용 SEO 메타데이터
export const metadata: Metadata = {
  title: '홈 - 무료 온라인 ERD 다이어그램 편집기',
  description: '직관적이고 강력한 Entity Relationship Diagram 도구로 데이터베이스 설계를 간편하게 시각화하세요. MySQL Workbench 스타일의 무료 온라인 ERD 편집기로 지금 바로 시작하세요.',
  keywords: [
    'ERD 편집기', 'ERD 다이어그램', '데이터베이스 설계', 'MySQL ERD', 
    '온라인 ERD', '무료 ERD', 'Entity Relationship Diagram', 'Database Design',
    'ER Diagram Tool', 'Data Modeling', 'MySQL Workbench', 'ERD 생성기'
  ],
  openGraph: {
    title: 'No ERD - 무료 온라인 ERD 다이어그램 편집기',
    description: '직관적이고 강력한 Entity Relationship Diagram 도구로 데이터베이스 설계를 간편하게 시각화하세요.',
    url: 'https://erd-dusky.vercel.app/home',
    images: [
      {
        url: '/og-home.png',
        width: 1200,
        height: 630,
        alt: 'No ERD 홈페이지 - ERD 다이어그램 편집기',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'No ERD - 무료 온라인 ERD 다이어그램 편집기',
    description: '직관적이고 강력한 Entity Relationship Diagram 도구로 데이터베이스 설계를 간편하게 시각화하세요.',
    images: ['/og-home.png'],
  },
  alternates: {
    canonical: '/home',
  },
};

export default function HomePageRoute() {
  return <HomePage />;
}
