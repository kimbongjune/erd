import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import useStore from '../store/useStore';
import styled from 'styled-components';

const ERDContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const ERDEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadFromLocalStorage, clearLocalStorage, nodes, theme } = useStore();

  useEffect(() => {
    console.log('ERDEditor useEffect 실행, id:', id);
    if (id) {
      // ERD ID 유효성 검증 (영문, 숫자, _, - 만 허용)
      const validIdPattern = /^[a-zA-Z0-9_-]+$/;
      if (!validIdPattern.test(id)) {
        console.log('유효하지 않은 ID 패턴:', id);
        navigate('/404');
        return;
      }

      // localStorage에서 실제로 저장된 ERD 데이터가 있는지 확인
      const savedData = localStorage.getItem(`erd-${id}`);
      console.log('저장된 ERD 데이터 존재:', !!savedData);
      
      if (!savedData) {
        // 실제 데이터가 없는 경우 홈페이지로 리다이렉트
        console.log('ERD 데이터가 존재하지 않음, 홈으로 리다이렉트:', id);
        navigate('/home');
        return;
      }

      // 특정 ERD ID의 데이터 로드
      try {
        const erdData = JSON.parse(savedData);
        console.log('ERD 데이터 로드 성공:', erdData);
        // 기존 store에 데이터 로드
        useStore.setState({
          nodes: erdData.nodes || [],
          edges: erdData.edges || [],
          nodeColors: new Map(Array.isArray(erdData.nodeColors) ? erdData.nodeColors : Object.entries(erdData.nodeColors || {})),
          edgeColors: new Map(Array.isArray(erdData.edgeColors) ? erdData.edgeColors : Object.entries(erdData.edgeColors || {})),
          commentColors: new Map(Array.isArray(erdData.commentColors) ? erdData.commentColors : Object.entries(erdData.commentColors || {})),
          theme: erdData.theme || 'light',
          viewSettings: erdData.viewSettings || {}
        });
      } catch (error) {
        console.error('ERD 데이터 로드 실패:', error);
        // 파싱 에러인 경우 초기화
        useStore.setState({
          nodes: [],
          edges: [],
          nodeColors: new Map(),
          edgeColors: new Map(),
          commentColors: new Map(),
          viewSettings: {
            entityView: 'logical',
            showKeys: true,
            showPhysicalName: true,
            showLogicalName: false,
            showDataType: true,
            showConstraints: false,
            showDefaults: false,
          },
          selectedNodeId: null,
          selectedEdgeId: null,
          hoveredEdgeId: null,
          hoveredEntityId: null,
          highlightedEntities: [],
          highlightedEdges: [],
          highlightedColumns: new Map(),
          isBottomPanelOpen: false,
          connectionMode: null,
          connectingNodeId: null,
          createMode: null,
          selectMode: true,
        });
      }
    }
  }, [id, navigate]);

  const updateDiagramsList = (erdId: string) => {
    const diagramsList = JSON.parse(localStorage.getItem('erd-diagrams-list') || '[]');
    const existingIndex = diagramsList.findIndex((d: any) => d.id === erdId);
    
    const diagramInfo = {
      id: erdId,
      name: existingIndex === -1 ? '제목 없는 다이어그램' : diagramsList[existingIndex].name,
      createdAt: existingIndex === -1 ? Date.now() : diagramsList[existingIndex].createdAt,
      updatedAt: Date.now()
    };

    if (existingIndex === -1) {
      diagramsList.push(diagramInfo);
    } else {
      diagramsList[existingIndex] = diagramInfo;
    }

    localStorage.setItem('erd-diagrams-list', JSON.stringify(diagramsList));
  };

  if (!id) {
    return <div>잘못된 접근입니다.</div>;
  }

  return (
    <ERDContainer>
      <Layout />
    </ERDContainer>
  );
};

export default ERDEditor;
