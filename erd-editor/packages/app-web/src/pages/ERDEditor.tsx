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
  const { loadFromLocalStorage, clearLocalStorage, nodes, theme, setLoading } = useStore();

  useEffect(() => {
    if (id) {
      // ERD ID 유효성 검증 (영문, 숫자, _, - 만 허용)
      const validIdPattern = /^[a-zA-Z0-9_-]+$/;
      if (!validIdPattern.test(id)) {
        navigate('/404');
        return;
      }

      // localStorage에서 실제로 저장된 ERD 데이터가 있는지 확인
      const savedData = localStorage.getItem(`erd-${id}`);
      
      if (!savedData) {
        // 실제 데이터가 없는 경우 홈페이지로 리다이렉트
        navigate('/home');
        return;
      }

      // 데이터가 있는 경우 로딩바와 함께 로드
      try {
        const erdData = JSON.parse(savedData);
        // 빈 데이터가 아닌 경우에만 로딩바 표시
        const hasContent = (erdData.nodes && erdData.nodes.length > 0) || (erdData.edges && erdData.edges.length > 0);
        
        if (hasContent) {
          // 로딩바와 함께 데이터 로드
          loadFromLocalStorage();
        } else {
          // 빈 데이터인 경우 로딩바 없이 직접 설정
          useStore.setState({
            nodes: erdData.nodes || [],
            edges: erdData.edges || [],
            nodeColors: new Map(Array.isArray(erdData.nodeColors) ? erdData.nodeColors : Object.entries(erdData.nodeColors || {})),
            edgeColors: new Map(Array.isArray(erdData.edgeColors) ? erdData.edgeColors : Object.entries(erdData.edgeColors || {})),
            commentColors: new Map(Array.isArray(erdData.commentColors) ? erdData.commentColors : Object.entries(erdData.commentColors || {})),
            theme: erdData.theme || 'light',
            viewSettings: erdData.viewSettings || {}
          });
        }
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
