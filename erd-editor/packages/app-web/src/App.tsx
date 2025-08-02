import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ERDEditor from './pages/ERDEditor';
import NotFound from './pages/NotFound';
import { GlobalStyle } from './styles/GlobalStyle';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useStore from './store/useStore';

function App() {
  const saveToLocalStorage = useStore((state) => state.saveToLocalStorage);
  const checkAndAutoLoad = useStore((state) => state.checkAndAutoLoad);

  useEffect(() => {
    // 페이지 로드 시 저장된 데이터 자동 로딩 체크 (약간의 딜레이로 안전하게 실행)
    const autoLoadTimer = setTimeout(() => {
      checkAndAutoLoad();
    }, 50); // 50ms 후 실행으로 안정성 확보

    return () => clearTimeout(autoLoadTimer);
  }, [checkAndAutoLoad]);

  useEffect(() => {
    // Ctrl+S 키 이벤트 핸들러
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault(); // 브라우저 기본 저장 동작 방지
        saveToLocalStorage();
      }
    };

    // 키 이벤트 리스너 등록
    document.addEventListener('keydown', handleKeyDown);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveToLocalStorage]);

  return (
    <Router>
      <GlobalStyle />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/erd/:id" element={<ERDEditor />} />
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
      />
    </Router>
  )
}

export default App
