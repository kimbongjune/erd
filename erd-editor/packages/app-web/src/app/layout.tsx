'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import StyledComponentsRegistry from '../lib/registry';
import { ReactFlowProvider } from 'reactflow';
import { GlobalStyle } from '../styles/GlobalStyle';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'reactflow/dist/style.css';
import useStore from '../store/useStore';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, nodes, saveToLocalStorage } = useStore();
  const pathname = usePathname();

  // Ctrl+S 단축키로 저장
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToLocalStorage(true); // 수동 저장시에는 토스트 표시
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveToLocalStorage]);

  // 경로 변경시 자동 저장
  useEffect(() => {
    if (nodes.length > 0 && pathname?.includes('/erd/')) {
      saveToLocalStorage(false); // 자동 저장시에는 토스트 표시하지 않음
    }
  }, [saveToLocalStorage, pathname, nodes]);

  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <title>ERD Editor</title>
        <meta name="description" content="MySQL Workbench style ERD Editor" />
      </head>
      <body className="lang-ko">
        <SessionProvider>
          <StyledComponentsRegistry>
            <ReactFlowProvider>
              <GlobalStyle />
              {children}
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={theme === 'dark' ? 'dark' : 'light'}
              />
            </ReactFlowProvider>
          </StyledComponentsRegistry>
        </SessionProvider>
      </body>
    </html>
  );
}
