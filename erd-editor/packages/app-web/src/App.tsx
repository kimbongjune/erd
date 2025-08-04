import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ERDEditor from './pages/ERDEditor';
import NotFound from './pages/NotFound';
import Test from './pages/Test';
import { GlobalStyle } from './styles/GlobalStyle';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useStore from './store/useStore';
import { customConfirm } from './utils/confirmUtils';

// App 내부의 컴포넌트로 분리하여 useLocation 사용 가능하게 함
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const saveToLocalStorage = useStore((state) => state.saveToLocalStorage);
  const checkAndAutoLoad = useStore((state) => state.checkAndAutoLoad);
  const checkSavedData = useStore((state) => state.checkSavedData);
  const hasUnsavedChanges = useStore((state) => state.hasUnsavedChanges);
  const theme = useStore((state) => state.theme);
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const nodeColors = useStore((state) => state.nodeColors);
  const edgeColors = useStore((state) => state.edgeColors);
  const commentColors = useStore((state) => state.commentColors);
  const viewSettings = useStore((state) => state.viewSettings);
  const showGrid = useStore((state) => state.showGrid);
  const hiddenEntities = useStore((state) => state.hiddenEntities);
  const viewport = useStore((state) => state.viewport);

  // 네비게이션 확인 함수
  const checkBeforeNavigation = useCallback(async (targetPath: string) => {
    // ERD 에디터 페이지에서 다른 페이지로 이동할 때 항상 체크
    if (location.pathname.startsWith('/erd/') && location.pathname !== targetPath) {
      if (hasUnsavedChanges()) {
        const confirmed = await customConfirm('저장하지 않은 변경사항이 있습니다. 정말 페이지를 떠나시겠습니까?', {
          title: '페이지 이동 확인',
          confirmText: '떠나기',
          cancelText: '취소',
          type: 'warning',
          darkMode: theme === 'dark'
        });
        return confirmed;
      }
    }
    return true; // 기본적으로 이동 허용
  }, [location.pathname, hasUnsavedChanges, theme]);

  // 글로벌 네비게이션 함수를 window에 등록
  useEffect(() => {
    const originalNavigate = navigate;
    
    // 커스텀 네비게이션 함수
    const customNavigate = async (to: string | number, options?: any) => {
      if (typeof to === 'string') {
        const canNavigate = await checkBeforeNavigation(to);
        if (canNavigate) {
          originalNavigate(to, options);
        }
      } else {
        // 숫자인 경우 (뒤로가기/앞으로가기)
        const canNavigate = await checkBeforeNavigation(location.pathname);
        if (canNavigate) {
          originalNavigate(to);
        }
      }
    };

    // 전역에서 사용할 수 있도록 등록
    (window as any).customNavigate = customNavigate;

    return () => {
      delete (window as any).customNavigate;
    };
  }, [navigate, checkBeforeNavigation, location.pathname]);

  useEffect(() => {
    // 앱 시작 시 저장된 데이터 상태 확인
    checkSavedData();
  }, [checkSavedData]);

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
  }, [saveToLocalStorage, location.pathname, nodes]);

  // 변경사항 체크 및 페이지 이탈 방지
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // ERD 에디터 페이지에서만 체크
      if (location.pathname.startsWith('/erd/') && hasUnsavedChanges()) {
        event.preventDefault();
        event.returnValue = '저장하지 않은 변경사항이 있습니다. 정말 페이지를 떠나시겠습니까?';
        return event.returnValue;
      }
    };

    // beforeunload 이벤트 리스너 등록
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname, hasUnsavedChanges]);

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
        theme={theme === 'dark' ? 'dark' : 'light'}
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
