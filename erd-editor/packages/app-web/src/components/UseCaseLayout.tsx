import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import UseCaseHeader from './UseCaseHeader';
import UseCaseToolbox from './UseCaseToolbox';
import UseCaseCanvas from './UseCaseCanvas';
import UseCaseCanvasToolbar from './UseCaseCanvasToolbar';

const Container = styled.div<{ $darkMode?: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: ${props => props.$darkMode ? '#1E1E1E' : '#FFFFFF'};
`;

const TopContainer = styled.div<{ $darkMode?: boolean }>`
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: 80px 1fr;
  grid-template-rows: 50px 1fr;
  grid-template-areas:
    'header header'
    'toolbox canvas';
  background-color: ${props => props.$darkMode ? '#1E1E1E' : '#FFFFFF'};
`;

const ToolboxContainer = styled.aside<{ $darkMode?: boolean }>`
  grid-area: toolbox;
  background-color: ${props => props.$darkMode ? '#2d3748' : '#f8f9fa'};
  border-right: 1px solid ${props => props.$darkMode ? '#404040' : '#ddd'};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
`;

const CanvasContainer = styled.main<{ $darkMode?: boolean }>`
  grid-area: canvas;
  background-color: ${props => props.$darkMode ? '#1E1E1E' : '#ffffff'};
  position: relative;
`;

interface UseCaseLayoutProps {
  usecaseId: string;
}

const UseCaseLayout: React.FC<UseCaseLayoutProps> = ({ usecaseId }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [searchActive, setSearchActive] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [copiedNode, setCopiedNode] = useState<any>(null);

  const handleUndo = useCallback(() => {
    // 실행 취소 로직 (나중에 구현)
    console.log('유즈케이스 다이어그램 실행 취소');
  }, []);

  const handleRedo = useCallback(() => {
    // 다시 실행 로직 (나중에 구현)
    console.log('유즈케이스 다이어그램 다시 실행');
  }, []);

  const handleSave = useCallback(() => {
    // 저장 로직 (나중에 구현)
    console.log('유즈케이스 다이어그램 저장');
  }, []);

  const handleExportImage = useCallback(() => {
    // 이미지 내보내기 로직 (나중에 구현)
    console.log('유즈케이스 다이어그램 이미지 내보내기');
  }, []);

  const handleExportSQL = useCallback(() => {
    // SQL 내보내기 로직 (나중에 구현)
    console.log('유즈케이스 다이어그램 SQL 내보내기');
  }, []);

  const handleDataDelete = useCallback(() => {
    // 데이터 삭제 로직 (나중에 구현)
    console.log('유즈케이스 다이어그램 데이터 삭제');
  }, []);

  const handleSearch = useCallback(() => {
    setSearchActive(!searchActive);
    // 검색 패널 토글 로직 (나중에 구현)
    console.log('유즈케이스 다이어그램 검색');
  }, [searchActive]);

  const handleZoomToFit = useCallback(() => {
    // 한눈에보기 로직 (나중에 구현)
    console.log('유즈케이스 다이어그램 한눈에보기');
  }, []);

  const handleCopy = useCallback(() => {
    // 복사 로직 (나중에 구현)
    console.log('유즈케이스 다이어그램 복사');
  }, []);

  const handlePaste = useCallback(() => {
    // 붙여넣기 로직 (나중에 구현)
    console.log('유즈케이스 다이어그램 붙여넣기');
  }, []);

  const handleGrid = useCallback(() => {
    setShowGrid(!showGrid);
    // 그리드 토글 로직 (나중에 구현)
    console.log('유즈케이스 다이어그램 그리드 토글');
  }, [showGrid]);

  const handleHistory = useCallback(() => {
    setShowHistoryPanel(!showHistoryPanel);
    // 히스토리 패널 토글 로직 (나중에 구현)
    console.log('유즈케이스 다이어그램 히스토리');
  }, [showHistoryPanel]);

  return (
    <Container $darkMode={darkMode}>
      <TopContainer $darkMode={darkMode}>
        <UseCaseHeader
          usecaseId={usecaseId}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onSave={handleSave}
          onExportImage={handleExportImage}
          onExportSQL={handleExportSQL}
          onDataDelete={handleDataDelete}
          hasData={hasData}
        />
        <ToolboxContainer $darkMode={darkMode}>
          <UseCaseToolbox darkMode={darkMode} />
        </ToolboxContainer>
        <CanvasContainer $darkMode={darkMode}>
          <UseCaseCanvas
            usecaseId={usecaseId}
            darkMode={darkMode}
            onZoomChange={setZoom}
          />
        </CanvasContainer>
      </TopContainer>

      <UseCaseCanvasToolbar
        zoom={zoom}
        darkMode={darkMode}
        onSearch={handleSearch}
        onZoomToFit={handleZoomToFit}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onGrid={handleGrid}
        onHistory={handleHistory}
        searchActive={searchActive}
        showGrid={showGrid}
        showHistoryPanel={showHistoryPanel}
        selectedNodeId={selectedNodeId}
        copiedNode={copiedNode}
      />
    </Container>
  );
};

export default UseCaseLayout;
