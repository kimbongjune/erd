import React from 'react';
import ClientLayout from './ClientLayout';
import type { Metadata, Viewport } from 'next';

// SEO 최적화된 메타데이터
export const metadata: Metadata = {
  title: {
    template: '%s | No ERD',
    default: 'No ERD - 무료 온라인 ERD 다이어그램 편집기'
  },
  description: '직관적이고 강력한 Entity Relationship Diagram 도구로 데이터베이스 설계를 간편하게 시각화하세요. MySQL Workbench 스타일의 무료 온라인 ERD 편집기.',
  keywords: [
    'ERD', 'Entity Relationship Diagram', '데이터베이스 설계', 'MySQL', 
    '데이터베이스 다이어그램', 'DB 모델링', '온라인 ERD', '무료 ERD',
    'Database Design', 'ER Diagram', 'Data Modeling'
  ],
  authors: [{ name: 'No ERD Team' }],
  creator: 'No ERD',
  publisher: 'No ERD',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://erd-dusky.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'No ERD - 무료 온라인 ERD 다이어그램 편집기',
    description: '직관적이고 강력한 Entity Relationship Diagram 도구로 데이터베이스 설계를 간편하게 시각화하세요.',
    url: 'https://erd-dusky.vercel.app',
    siteName: 'No ERD',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'No ERD - ERD 다이어그램 편집기',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'No ERD - 무료 온라인 ERD 다이어그램 편집기',
    description: '직관적이고 강력한 Entity Relationship Diagram 도구로 데이터베이스 설계를 간편하게 시각화하세요.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // 나중에 Google Search Console 등록 후 추가
    // google: 'google-verification-code',
  },
  category: 'technology',
  classification: 'Database Design Tool',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1419' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "No ERD",
              "description": "직관적이고 강력한 Entity Relationship Diagram 도구로 데이터베이스 설계를 간편하게 시각화하세요.",
              "url": "https://erd-dusky.vercel.app",
              "applicationCategory": "DesignApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "KRW"
              },
              "creator": {
                "@type": "Organization",
                "name": "No ERD Team"
              },
              "featureList": [
                "ERD 다이어그램 생성 및 편집",
                "MySQL 워크벤치 스타일 인터페이스",
                "실시간 협업",
                "무료 사용"
              ]
            })
          }}
        />
      </head>
      <body className="lang-ko">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
