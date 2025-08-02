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
    if (id) {
      // ERD ID 유효성 검증 (영문, 숫자, _, - 만 허용)
      const validIdPattern = /^[a-zA-Z0-9_-]+$/;
      if (!validIdPattern.test(id)) {
        navigate('/404');
        return;
      }

      // 특정 ERD ID의 데이터 로드
      const savedData = localStorage.getItem(`erd-${id}`);
      if (savedData) {
        try {
          const erdData = JSON.parse(savedData);
          // 기존 store에 데이터 로드
          useStore.setState({
            nodes: erdData.nodes || [],
            edges: erdData.edges || [],
            nodeColors: new Map(erdData.nodeColors || []),
            edgeColors: new Map(erdData.edgeColors || []),
            commentColors: new Map(erdData.commentColors || []),
            theme: erdData.theme || 'light',
            viewSettings: erdData.viewSettings || {}
          });
        } catch (error) {
          console.error('ERD 데이터 로드 실패:', error);
          navigate('/home');
        }
      } else {
        // 새로운 ERD인 경우 빈 상태로 시작 (토스트 없이)
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

  // ERD 자동 저장
  useEffect(() => {
    if (id && nodes) {
      const saveData = () => {
        const state = useStore.getState();
        const erdData = {
          nodes: state.nodes,
          edges: state.edges,
          nodeColors: Array.from(state.nodeColors.entries()),
          edgeColors: Array.from(state.edgeColors.entries()),
          commentColors: Array.from(state.commentColors.entries()),
          theme: state.theme,
          viewSettings: state.viewSettings,
          updatedAt: Date.now()
        };
        localStorage.setItem(`erd-${id}`, JSON.stringify(erdData));
        
        // 다이어그램 목록도 업데이트
        updateDiagramsList(id);
      };

      const debounceTimer = setTimeout(saveData, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [id, nodes]);

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
