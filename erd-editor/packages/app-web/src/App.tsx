import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ERDEditor from './pages/ERDEditor';
import NotFound from './pages/NotFound';
import Test from './pages/Test';
import { GlobalStyle } from './styles/GlobalStyle';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useStore from './store/useStore';

// App 내부의 컴포넌트로 분리하여 useLocation 사용 가능하게 함
function AppContent() {
  const location = useLocation();
  const saveToLocalStorage = useStore((state) => state.saveToLocalStorage);
  const checkAndAutoLoad = useStore((state) => state.checkAndAutoLoad);

  useEffect(() => {
    // ERD 에디터 페이지에서만 자동 로딩 실행
    if (location.pathname.startsWith('/erd/')) {
      const autoLoadTimer = setTimeout(() => {
        checkAndAutoLoad();
      }, 50); // 50ms 후 실행으로 안정성 확보

      return () => clearTimeout(autoLoadTimer);
    }
  }, [checkAndAutoLoad, location.pathname]);

  useEffect(() => {
    // Ctrl+S 키 이벤트 핸들러
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault(); // 브라우저 기본 저장 동작 방지
        
        // 홈페이지에서는 저장 기능을 실행하지 않음
        if (location.pathname === '/home' || location.pathname === '/') {
          return;
        }
        
        saveToLocalStorage();
      }
    };

    // 키 이벤트 리스너 등록
    document.addEventListener('keydown', handleKeyDown);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveToLocalStorage, location.pathname]);

  return (
    <>
      <GlobalStyle />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/erd/:id" element={<ERDEditor />} />
        <Route path="/test" element={<Test />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
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
        theme="dark"
      />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
