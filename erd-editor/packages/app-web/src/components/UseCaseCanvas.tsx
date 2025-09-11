import React, { useCallback, useRef, useState, useEffect } from 'react';
import styled from 'styled-components';

const CanvasContainer = styled.div<{ $darkMode?: boolean }>`
  width: 100%;
  height: 100%;
  background-color: ${props => props.$darkMode ? '#1E1E1E' : '#ffffff'};
  position: relative;
  overflow: hidden;
`;

const Canvas = styled.canvas<{ $darkMode?: boolean }>`
  background-color: ${props => props.$darkMode ? '#1E1E1E' : '#ffffff'};
  display: block;
`;

const CanvasWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

interface UseCaseCanvasProps {
  usecaseId: string;
  darkMode: boolean;
  onZoomChange?: (zoom: number) => void;
}

const UseCaseCanvas: React.FC<UseCaseCanvasProps> = ({ usecaseId, darkMode, onZoomChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // 클라이언트 사이드에서만 window 객체에 접근
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCanvasSize({
        width: window.innerWidth - 80, // 왼쪽 툴박스 너비 제외
        height: window.innerHeight - 50 // 헤더 높이 제외
      });
      
      // 기본 zoom 값 설정
      if (onZoomChange) {
        onZoomChange(1);
      }
    }
  }, [onZoomChange]);

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    // 캔버스 클릭 처리 (나중에 구현)
    console.log('캔버스 클릭:', event.clientX, event.clientY);
  }, []);

  return (
    <CanvasContainer $darkMode={darkMode}>
      <CanvasWrapper>
                <Canvas
          ref={canvasRef}
          $darkMode={darkMode}
          onClick={handleCanvasClick}
          width={canvasSize.width}
          height={canvasSize.height}
        />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: darkMode ? '#9ca3af' : '#6b7280',
          fontSize: '18px',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          유즈케이스 다이어그램 캔버스<br/>
          <small>좌측 툴박스에서 도구를 선택하여 다이어그램을 만들어보세요</small>
        </div>
      </CanvasWrapper>
    </CanvasContainer>
  );
};

export default UseCaseCanvas;
