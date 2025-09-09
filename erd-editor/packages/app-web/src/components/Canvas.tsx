import ReactFlow, { Node, useReactFlow, Edge, MiniMap, useViewport, Panel, Background, BackgroundVariant, useUpdateNodeInternals, getRectOfNodes, getTransformForBounds } from 'reactflow';
import React, { useCallback, useRef, useState, MouseEvent, useEffect, useMemo } from 'react';
import 'reactflow/dist/style.css';
import throttle from 'lodash.throttle';
import useStore from '../store/useStore';
import EntityNode from './nodes/EntityNode';
import CommentNode from './nodes/CommentNode';
import TextNode from './nodes/TextNode';
import ImageNode from './nodes/ImageNode';
import OneToOneIdentifyingEdge from './edges/OneToOneIdentifyingEdge';
import OneToOneNonIdentifyingEdge from './edges/OneToOneNonIdentifyingEdge';
import OneToManyIdentifyingEdge from './edges/OneToManyIdentifyingEdge';
import OneToManyNonIdentifyingEdge from './edges/OneToManyNonIdentifyingEdge';
import TemporaryEdge from './edges/TemporaryEdge';
import CustomConnectionLine from './CustomConnectionLine';
import ContextMenu from './ContextMenu';
import CanvasToolbar from './CanvasToolbar';
import SnapGuides from './SnapGuides';
import SearchPanel from './SearchPanel';

const edgeTypes = {
  'one-to-one-identifying': OneToOneIdentifyingEdge,
  'one-to-one-non-identifying': OneToOneNonIdentifyingEdge,
  'one-to-many-identifying': OneToManyIdentifyingEdge,
  'one-to-many-non-identifying': OneToManyNonIdentifyingEdge,
  'temporary': TemporaryEdge,
};

// Create a wrapper component for EntityNode to handle mouse events
const EntityNodeWrapper = React.memo(({ data, ...props }: any) => {
  const connectionMode = useStore((state) => state.connectionMode);
  const setConnectingNodeId = useStore((state) => state.setConnectingNodeId);
  const nodes = useStore((state) => state.nodes);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (connectionMode && props.id) {
      event.preventDefault();
      event.stopPropagation();
      setConnectingNodeId(props.id);
      
      // Trigger temporary edge creation through a custom event or callback
      const customEvent = new CustomEvent('createTemporaryEdge', {
        detail: { nodeId: props.id, nodes, connectionMode }
      });
      window.dispatchEvent(customEvent);
    }
  }, [connectionMode, setConnectingNodeId, nodes, props.id]);

  return <EntityNode {...props} data={data} onMouseDown={handleMouseDown} />;
});

// Define node types outside component to prevent recreation
const nodeTypes = {
  entity: EntityNodeWrapper,
  comment: CommentNode,
  text: TextNode,
  image: ImageNode,
};

const Canvas = React.memo(() => {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);
  const setSelectedEdgeId = useStore((state) => state.setSelectedEdgeId);
  const setHoveredEdgeId = useStore((state) => state.setHoveredEdgeId);
  const setBottomPanelOpen = useStore((state) => state.setBottomPanelOpen);
  const connectionMode = useStore((state) => state.connectionMode);
  const connectingNodeId = useStore((state) => state.connectingNodeId);
  const setConnectingNodeId = useStore((state) => state.setConnectingNodeId);
  const finishConnection = useStore((state) => state.finishConnection);
  const cancelConnection = useStore((state) => state.cancelConnection);
  const createMode = useStore((state) => state.createMode);
  const addNode = useStore((state) => state.addNode);
  const deleteSelected = useStore((state) => state.deleteSelected);
  const theme = useStore((state) => state.theme);
  const hiddenEntities = useStore((state) => state.hiddenEntities);
  const exportToImage = useStore((state) => state.exportToImage);
  const isReadOnlyMode = useStore((state) => state.isReadOnlyMode);
  
  // 복사-붙여넣기 관련
  const copyNode = useStore((state) => state.copyNode);
  const pasteNode = useStore((state) => state.pasteNode);
  const copiedNode = useStore((state) => state.copiedNode);
  
  // 스냅 기능 관련
  const setIsDragging = useStore((state) => state.setIsDragging);
  const setDraggingNodeId = useStore((state) => state.setDraggingNodeId);
  const setSnapGuides = useStore((state) => state.setSnapGuides);
  const calculateSnapGuides = useStore((state) => state.calculateSnapGuides);
  const updateEdgeHandles = useStore((state) => state.updateEdgeHandles);
  const clearRelationsHighlight = useStore((state) => state.clearRelationsHighlight);
  
  // 툴바 관련
  const showGrid = useStore((state) => state.showGrid);
  const setShowAlignPopup = useStore((state) => state.setShowAlignPopup);
  const setShowViewPopup = useStore((state) => state.setShowViewPopup);
  
  // 편집 상태 관련
  const editingCommentId = useStore((state) => state.editingCommentId);
  
  // viewport 관련
  const updateViewport = useStore((state) => state.updateViewport);
  const savedViewport = useStore((state) => state.viewport);
  
  // 드래그 시작 위치 저장
  const [dragStartPosition, setDragStartPosition] = useState<{x: number, y: number} | null>(null);
  const viewportRestoreTrigger = useStore((state) => state.viewportRestoreTrigger);

  const { screenToFlowPosition, flowToScreenPosition, fitView, getViewport, setViewport } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const { zoom } = useViewport();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [temporaryEdge, setTemporaryEdge] = useState<Edge | null>(null);
  
  const isDarkMode = theme === 'dark';
  
  // 숨겨진 엔티티와 연결된 엣지들을 필터링
  const visibleEdges = useMemo(() => {
    return edges.filter(edge => {
      return !hiddenEntities.has(edge.source) && !hiddenEntities.has(edge.target);
    });
  }, [edges, hiddenEntities]);
  
  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: 'node' as 'node' | 'edge' | 'pane',
    targetId: '',
    clickPosition: { x: 0, y: 0 } // 클릭 위치 저장
  });

  // viewport 변경 핸들러 - 실시간 viewport 추적
  const handleViewportChange = useCallback((viewport: any) => {
    // 실시간으로 viewport 업데이트 (저장은 하지 않음)
  }, []);

  // viewport 변경 완료 핸들러 - 이동/줌이 끝난 후 저장
  const handleViewportChangeEnd = useCallback((viewport: any) => {
    updateViewport(viewport);
  }, [updateViewport]);

  // ReactFlow 초기화 완료 핸들러
  const handleReactFlowInit = useCallback((reactFlowInstance: any) => {
    
    // ReactFlow 인스턴스를 전역에서 접근 가능하도록 저장
    (window as any).reactFlowInstance = reactFlowInstance;
    
    // ReactFlow가 완전히 초기화된 후 저장된 viewport 복원
    if (savedViewport && (savedViewport.x !== 0 || savedViewport.y !== 0 || savedViewport.zoom !== 1)) {
      
      // 즉시 설정
      reactFlowInstance.setViewport(savedViewport);
      
      // 여러 번 재시도해서 확실하게 적용
      const timers = [
        setTimeout(() => {
          reactFlowInstance.setViewport(savedViewport);
        }, 100),
        setTimeout(() => {
          reactFlowInstance.setViewport(savedViewport);
        }, 300),
        setTimeout(() => {
          reactFlowInstance.setViewport(savedViewport);
        }, 500),
      ];
    }
  }, [savedViewport]);

  // 데이터 불러오기 시 viewport 복원은 onInit에서만 처리
  // (기존 useEffect 제거됨)

  // 키보드 이벤트 핸들러  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // input, textarea 등에서 입력 중일 때는 무시
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    // Undo/Redo 단축키 처리
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z' || event.key === 'Z') {
        event.preventDefault();
        if (event.shiftKey) {
          // Ctrl+Shift+Z = Redo
          useStore.getState().redo();
        } else {
          // Ctrl+Z = Undo
          useStore.getState().undo();
        }
        return;
      }
      if (event.key === 'y' || event.key === 'Y') {
        // Ctrl+Y = Redo
        event.preventDefault();
        useStore.getState().redo();
        return;
      }
      if (event.key === 'c' || event.key === 'C') {
        // Ctrl+C = Copy
        event.preventDefault();
        if (isReadOnlyMode) return; // 읽기 전용 모드에서는 복사 차단
        const selectedNodeId = useStore.getState().selectedNodeId;
        if (selectedNodeId) {
          copyNode(selectedNodeId);
        }
        return;
      }
      if (event.key === 'v' || event.key === 'V') {
        // Ctrl+V = Paste (원본 노드 오른쪽 아래)
        event.preventDefault();
        if (isReadOnlyMode) return; // 읽기 전용 모드에서는 붙여넣기 차단
        pasteNode();
        return;
      }
    }

    if (event.key === 'Escape') {
      // 모든 동작 취소하고 선택 모드로 돌아가기
      cancelConnection();
      setTemporaryEdge(null);
      useStore.getState().setCreateMode(null);
      useStore.getState().setConnectionMode(null);
      useStore.getState().setConnectingNodeId(null);
      useStore.getState().setSelectMode(true);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      // 커멘트 편집 중일 때는 노드 삭제하지 않음
      const editingCommentId = useStore.getState().editingCommentId;
      if (editingCommentId) {
        return;
      }
      
      // 읽기 전용 모드에서는 삭제 차단
      if (isReadOnlyMode) {
        return;
      }
      
      // 선택된 노드나 엣지 삭제
      event.preventDefault();
      deleteSelected();
    }
  }, [cancelConnection, deleteSelected]);

  // 키보드 이벤트 리스너 등록
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 이미지 export 이벤트 리스너
  useEffect(() => {
    const handleExportImage = async () => {
      // 현재 상태 완전 저장 (try 블록 밖에서 선언)
      const originalHiddenEntities = new Set(hiddenEntities);
      const originalConnectionMode = useStore.getState().connectionMode;
      const originalConnectingNodeId = useStore.getState().connectingNodeId;
      const originalCreateMode = useStore.getState().createMode;
      const originalSelectedNodeId = useStore.getState().selectedNodeId;
      const originalSelectedEdgeId = useStore.getState().selectedEdgeId;
      const originalSelectMode = useStore.getState().selectMode;
      const originalHighlightedEntities = [...useStore.getState().highlightedEntities];
      const originalHighlightedEdges = [...useStore.getState().highlightedEdges];
      const originalHighlightedColumns = new Map(useStore.getState().highlightedColumns);
      const originalRelationsHighlight = useStore.getState().relationsHighlight;
      
      try {
        const reactFlowWrapper = document.querySelector('.react-flow') as HTMLElement;
        if (!reactFlowWrapper) {
          return;
        }

        // 모든 상태 초기화 (관계선 비활성화)
        useStore.getState().showAllEntities();
        useStore.getState().setConnectionMode(null);
        useStore.getState().setConnectingNodeId(null);
        useStore.getState().setCreateMode(null);
        useStore.getState().setSelectedNodeId(null);
        useStore.getState().setSelectedEdgeId(null);
        useStore.getState().setSelectMode(true);
        useStore.getState().setHighlightedEntities([]);
        useStore.getState().setHighlightedEdges([]);
        useStore.getState().setHighlightedColumns(new Map());
        useStore.getState().setRelationsHighlight(false);
        setTemporaryEdge(null);

        // DOM 업데이트 대기
        await new Promise(resolve => setTimeout(resolve, 200));

        // 모든 노드가 보이도록 fitView 실행
        fitView({ 
          padding: 0.2,
          includeHiddenNodes: false,
          duration: 0 
        });

        // fitView 완료 대기
        await new Promise(resolve => setTimeout(resolve, 500));

        // 실제 캔버스 영역 크기 계산
        const reactFlowBounds = reactFlowWrapper.getBoundingClientRect();
        const captureWidth = reactFlowBounds.width;
        const captureHeight = reactFlowBounds.height;
        
        // 다크모드인지 확인
        const isDarkMode = theme === 'dark';
        
        // 이미지 export - 실제 캔버스 크기로 캡처
        const { toPng } = await import('html-to-image');
        const dataUrl = await toPng(reactFlowWrapper, {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          width: captureWidth,
          height: captureHeight,
          pixelRatio: 3, // 고화질을 위해 픽셀 비율 증가 (2 → 3)
          quality: 1.0, // 최고 품질로 설정 (0.95 → 1.0)
          filter: (node: any) => {
            // 최소한의 필터링만
            if (node.classList) {
              return !node.classList.contains('react-flow__controls') &&
                     !node.classList.contains('react-flow__minimap');
            }
            return true;
          }
        });

        // 다운로드
        const link = document.createElement('a');
        link.download = 'erd-diagram.png';
        link.href = dataUrl;
        link.click();

        // 원래 상태 완전 복원
        useStore.setState({ hiddenEntities: originalHiddenEntities });
        useStore.getState().setConnectionMode(originalConnectionMode);
        useStore.getState().setConnectingNodeId(originalConnectingNodeId);
        useStore.getState().setCreateMode(originalCreateMode);
        useStore.getState().setSelectedNodeId(originalSelectedNodeId);
        useStore.getState().setSelectedEdgeId(originalSelectedEdgeId);
        useStore.getState().setSelectMode(originalSelectMode);
        useStore.getState().setHighlightedEntities(originalHighlightedEntities);
        useStore.getState().setHighlightedEdges(originalHighlightedEdges);
        useStore.getState().setHighlightedColumns(originalHighlightedColumns);
        useStore.getState().setRelationsHighlight(originalRelationsHighlight);
        
      } catch (error) {
        
        // 에러 발생 시에도 원래 상태로 복원
        useStore.setState({ hiddenEntities: originalHiddenEntities });
        useStore.getState().setConnectionMode(originalConnectionMode);
        useStore.getState().setConnectingNodeId(originalConnectingNodeId);
        useStore.getState().setCreateMode(originalCreateMode);
        useStore.getState().setSelectedNodeId(originalSelectedNodeId);
        useStore.getState().setSelectedEdgeId(originalSelectedEdgeId);
        useStore.getState().setSelectMode(originalSelectMode);
        useStore.getState().setHighlightedEntities(originalHighlightedEntities);
        useStore.getState().setHighlightedEdges(originalHighlightedEdges);
        useStore.getState().setHighlightedColumns(originalHighlightedColumns);
        useStore.getState().setRelationsHighlight(originalRelationsHighlight);
        setTemporaryEdge(null);
      }
    };

    const exportListener = () => {
      handleExportImage();
    };

    window.addEventListener('exportToImage', exportListener);
    return () => {
      window.removeEventListener('exportToImage', exportListener);
    };
  }, [nodes, hiddenEntities]);

  // Listen for temporary edge creation events
  React.useEffect(() => {
    const handleCreateTemporaryEdge = (event: any) => {
      const { nodeId, nodes: currentNodes, connectionMode: currentMode } = event.detail;
      if (currentMode && reactFlowWrapper.current) {
        // Get source node position
        const sourceNode = currentNodes.find((n: any) => n.id === nodeId);
        if (sourceNode) {
          // ReactFlow 컨테이너의 bounds 가져오기
          const reactFlowBounds = reactFlowWrapper.current.querySelector('.react-flow')?.getBoundingClientRect();
          if (reactFlowBounds) {
            // nodeOrigin=[0, 0]이므로 position이 노드 왼쪽 상단, 중심점 계산 필요
            const nodeCenterFlow = {
              x: sourceNode.position.x + (sourceNode.width || 280) / 2,
              y: sourceNode.position.y + (sourceNode.height || 120) / 2
            };
            const projected = flowToScreenPosition(nodeCenterFlow);
            const sourceX = projected.x - reactFlowBounds.left;
            const sourceY = projected.y - reactFlowBounds.top;
              
            const newTemporaryEdge = {
              id: 'temp-edge',
              source: nodeId,
              target: 'temp-target',
              sourceHandle: 'right',
              targetHandle: 'left',
              type: 'temporary',
              data: {
                sourceX,
                sourceY,
                targetX: sourceX,
                targetY: sourceY,
              },
              style: { strokeWidth: 2, stroke: '#007bff', strokeDasharray: '5, 5' }
            };
            setTemporaryEdge(newTemporaryEdge);
          }
        }
      }
    };

    window.addEventListener('createTemporaryEdge', handleCreateTemporaryEdge);
    return () => {
      window.removeEventListener('createTemporaryEdge', handleCreateTemporaryEdge);
    };
  }, []);

  const handleNodeMouseDown = useCallback((event: MouseEvent, node: Node) => {
    if (connectionMode && node.type === 'entity') {
      event.preventDefault();
      event.stopPropagation();
      
      // 새로운 관계선 그리기 시작 시 기존 활성화 상태 해제
      setSelectedEdgeId(null);
      setHoveredEdgeId(null);
      
      setConnectingNodeId(node.id);

      // ReactFlow 컨테이너의 bounds 가져오기
      const reactFlowBounds = reactFlowWrapper.current?.querySelector('.react-flow')?.getBoundingClientRect();
      if (reactFlowBounds) {
        // nodeOrigin=[0, 0]이므로 position이 노드 왼쪽 상단, 중심점 계산 필요
        const nodeCenterFlow = {
          x: node.position.x + (node.width || 280) / 2,
          y: node.position.y + (node.height || 120) / 2
        };
        const sourceScreenPos = flowToScreenPosition(nodeCenterFlow);
        
        // ReactFlow 컨테이너 기준으로 좌표 조정
        const sourceX = sourceScreenPos.x - reactFlowBounds.left;
        const sourceY = sourceScreenPos.y - reactFlowBounds.top;
        
        const newTemporaryEdge = {
          id: 'temp-edge',
          source: node.id,
          target: 'temp-target',
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'temporary',
          data: {
            sourceX: sourceX,
            sourceY: sourceY,
            targetX: sourceX,
            targetY: sourceY,
          },
          style: { strokeWidth: 2, stroke: '#007bff', strokeDasharray: '5, 5' }
        };
        setTemporaryEdge(newTemporaryEdge);
      }
    }
    // Don't prevent default if not in connection mode - allow double click to work
  }, [connectionMode, setConnectingNodeId, nodes, screenToFlowPosition]);

  const defaultEdgeOptions = {};

  // 기존 handleContextMenu 제거 (새로운 컨텍스트 메뉴 핸들러들로 대체)

  const handlePaneClick = useCallback((event: any) => {
    // 팝업들 닫기
    setShowAlignPopup(false);
    setShowViewPopup(false);
    
    // 콘텍스트 메뉴 닫기
    setContextMenu(prev => ({ ...prev, visible: false }));
    
    // 색상 팔레트가 열려있을 때만 닫기
    const showColorPalette = useStore.getState().showColorPalette;
    if (showColorPalette) {
      const hidePalette = useStore.getState().hidePalette;
      hidePalette();
    }
    
    // 검색에서 선택된 엔티티 해제
    const setSelectedSearchEntity = useStore.getState().setSelectedSearchEntity;
    setSelectedSearchEntity(null);
    
    // 읽기 전용 모드가 아닐 때만 노드 생성 처리
    if (!isReadOnlyMode && createMode) {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      if (createMode === 'entity') {
        const newNode = {
          id: `entity_${Date.now()}`,
          type: 'entity',
          position,
          data: {
            label: 'NewEntity',
            physicalName: 'NewEntity',
            logicalName: 'NewEntity',
            columns: [], // 기본 컬럼 제거
          },
        };
        // 노드 추가 및 히스토리 저장
        useStore.getState().setNodes([...nodes, newNode]);
        
        useStore.getState().saveHistoryState('CREATE_ENTITY', { name: newNode.data.label });
        
        // 생성 후 선택 모드로 돌아가기
        useStore.getState().setCreateMode(null);
        useStore.getState().setSelectMode(true);
      } else if (createMode === 'comment') {
        const newNode = {
          id: `comment_${Date.now()}`,
          type: 'comment',
          position,
          data: { label: 'New Comment' },
        };
        // 노드 추가 및 히스토리 저장
        useStore.getState().setNodes([...nodes, newNode]);
        
        useStore.getState().saveHistoryState('CREATE_COMMENT', { name: newNode.data.label });
        
        // 생성 후 선택 모드로 돌아가기
        useStore.getState().setCreateMode(null);
        useStore.getState().setSelectMode(true);
      } else if (createMode === 'image') {
        const newNode = {
          id: `image_${Date.now()}`,
          type: 'image',
          position,
          data: { 
            label: 'Image',
            imageUrl: '',
            width: 300,
            height: 200
          },
        };
        // 노드 추가 및 히스토리 저장
        useStore.getState().setNodes([...nodes, newNode]);
        
        useStore.getState().saveHistoryState('CREATE_IMAGE', { name: newNode.data.label });
        
        // 생성 후 선택 모드로 돌아가기
        useStore.getState().setCreateMode(null);
        useStore.getState().setSelectMode(true);
      }
    }
    
    // 노드 생성 모드가 아니거나 읽기 전용 모드일 때는 선택 해제
    if (!createMode || isReadOnlyMode) {
      // 캔버스 빈 공간 클릭 시 모든 선택 해제
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setBottomPanelOpen(false);
    }
  }, [createMode, nodes, screenToFlowPosition, setSelectedNodeId, setSelectedEdgeId, setBottomPanelOpen, setShowAlignPopup, setShowViewPopup]);

  const handleNodeDoubleClick = useCallback((_: MouseEvent, node: Node) => {
    if (node.type === 'text' || node.type === 'image') return; // 이미지 노드는 자체적으로 더블클릭 처리
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null); // Clear edge selection when node is selected
    setBottomPanelOpen(true);
  }, [setSelectedNodeId, setSelectedEdgeId, setBottomPanelOpen]);

  const handleEdgeClick = useCallback((_: MouseEvent, edge: Edge) => {
    // 콘텍스트 메뉴 닫기
    setContextMenu(prev => ({ ...prev, visible: false }));
    
    const currentSelectedEdgeId = useStore.getState().selectedEdgeId;
    setSelectedEdgeId(currentSelectedEdgeId === edge.id ? null : edge.id);
    setSelectedNodeId(null); // Clear node selection when edge is selected
    setBottomPanelOpen(false); // Close bottom panel when edge is selected
    
    // 관계선 클릭 시 관계선 하이라이트 해제
    clearRelationsHighlight();
  }, [setSelectedEdgeId, setSelectedNodeId, setBottomPanelOpen, clearRelationsHighlight]);

  const handleEdgeMouseEnter = useCallback((_: MouseEvent, edge: Edge) => {
    setHoveredEdgeId(edge.id);
  }, [setHoveredEdgeId]);

  const handleEdgeMouseLeave = useCallback(() => {
    setHoveredEdgeId(null);
  }, [setHoveredEdgeId]);

    // 컨텍스트 메뉴 핸들러들
  const handleNodeContextMenu = useCallback((event: MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type: 'node',
      targetId: node.id,
      clickPosition: { x: 0, y: 0 } // 노드 메뉴에서는 불필요
    });
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const handleEdgeContextMenu = useCallback((event: MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type: 'edge',
      targetId: edge.id,
      clickPosition: { x: 0, y: 0 } // 엣지 메뉴에서는 불필요
    });
    setSelectedEdgeId(edge.id);
  }, [setSelectedEdgeId]);

  // 캔버스 빈 공간 우클릭 핸들러
  const handlePaneContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
    
    // 복사된 노드가 있는 경우에만 메뉴 표시
    if (copiedNode) {
      // ReactFlow 인스턴스를 통해 화면 좌표를 플로우 좌표로 변환
      const reactFlowInstance = (window as any).reactFlowInstance;
      let flowPosition = { x: event.clientX, y: event.clientY };
      
      if (reactFlowInstance && reactFlowInstance.screenToFlowPosition) {
        flowPosition = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
      }
      
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        type: 'pane',
        targetId: '',
        clickPosition: flowPosition
      });
    } else {
      // 복사된 노드가 없으면 메뉴 닫기
      setContextMenu(prev => ({ ...prev, visible: false }));
    }
  }, [copiedNode]);

  const handleContextMenuDelete = useCallback(() => {
    if (isReadOnlyMode) return; // 읽기 전용 모드에서는 삭제 차단
    if (contextMenu.type === 'node') {
      useStore.getState().deleteNode(contextMenu.targetId);
    } else if (contextMenu.type === 'edge') {
      useStore.getState().deleteEdge(contextMenu.targetId);
    }
  }, [contextMenu, isReadOnlyMode]);

  const handleContextMenuCopy = useCallback(() => {
    if (isReadOnlyMode) return; // 읽기 전용 모드에서는 복사 차단
    if (contextMenu.type === 'node') {
      copyNode(contextMenu.targetId);
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, [contextMenu, copyNode, isReadOnlyMode]);

  const handleContextMenuPaste = useCallback(() => {
    if (isReadOnlyMode) return; // 읽기 전용 모드에서는 붙여넣기 차단
    if (contextMenu.type === 'pane' && contextMenu.clickPosition) {
      pasteNode(contextMenu.clickPosition);
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, [contextMenu, pasteNode, isReadOnlyMode]);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // 노드 클릭 핸들러 (기존)
  // 노드 드래그 이벤트 핸들러들
  const handleNodeDragStart = useCallback((event: any, node: any) => {
    // 모든 EntityNode에 드래그 시작 이벤트 전파
    window.dispatchEvent(new CustomEvent('nodeDragStart'));
    
    // 드래그 시작 위치 저장
    setDragStartPosition({ x: node.position.x, y: node.position.y });
    
    // 스냅 기능 활성화
    setIsDragging(true);
    setDraggingNodeId(node.id);
  }, [setIsDragging, setDraggingNodeId]);

  const handleNodeDrag = useCallback(throttle((event: any, node: any) => {
    if (!node) return;
    
    // 스냅 가이드라인 계산
    const guides = calculateSnapGuides(node.id, node.position);
    setSnapGuides(guides);
    
    // 실시간 스냅 적용
    if (guides.length > 0) {
      const threshold = 5;
      let snappedPosition = { ...node.position };
      let hasSnapped = false;
      
      guides.forEach(guide => {
        if (guide.type === 'vertical') {
          // X축 스냅 - nodeOrigin=[0, 0] 고려
          const nodeWidth = node.width || 280;
          const left = node.position.x;
          const right = node.position.x + nodeWidth;
          const centerX = node.position.x + nodeWidth / 2;
          
          if (Math.abs(guide.position - left) <= threshold) {
            snappedPosition.x = guide.position;
            hasSnapped = true;
          } else if (Math.abs(guide.position - right) <= threshold) {
            snappedPosition.x = guide.position - nodeWidth;
            hasSnapped = true;
          } else if (Math.abs(guide.position - centerX) <= threshold) {
            snappedPosition.x = guide.position - nodeWidth / 2;
            hasSnapped = true;
          }
        } else if (guide.type === 'horizontal') {
          // Y축 스냅 - nodeOrigin=[0, 0] 고려
          const nodeHeight = node.height || 120;
          const top = node.position.y;
          const bottom = node.position.y + nodeHeight;
          const centerY = node.position.y + nodeHeight / 2;
          
          if (Math.abs(guide.position - top) <= threshold) {
            snappedPosition.y = guide.position;
            hasSnapped = true;
          } else if (Math.abs(guide.position - bottom) <= threshold) {
            snappedPosition.y = guide.position - nodeHeight;
            hasSnapped = true;
          } else if (Math.abs(guide.position - centerY) <= threshold) {
            snappedPosition.y = guide.position - nodeHeight / 2;
            hasSnapped = true;
          }
        }
      });
      
      // 스냅된 위치로 노드 업데이트 (실시간 "탁탁" 스냅)
      if (hasSnapped && (snappedPosition.x !== node.position.x || snappedPosition.y !== node.position.y)) {
        const updatedNodes = nodes.map(n => 
          n.id === node.id ? { ...n, position: snappedPosition } : n
        );
        useStore.getState().setNodes(updatedNodes);
      }
    }
    
    // 드래그 중에도 Handle 위치 업데이트 (성능 최적화를 위해 throttle 증가)
    updateEdgeHandles();
  }, 100), [calculateSnapGuides, setSnapGuides, nodes, updateEdgeHandles]); // 100ms throttle로 성능 개선

  const handleNodeDragStop = useCallback((event: any, node: any) => {
    // 모든 EntityNode에 드래그 종료 이벤트 전파
    window.dispatchEvent(new CustomEvent('nodeDragStop'));
    
    // 스냅 기능 비활성화
    setIsDragging(false);
    setDraggingNodeId(null);
    setSnapGuides([]);
    
    // 실제 이동이 있었는지 확인 (5픽셀 이상 이동 시에만 히스토리 저장)
    if (dragStartPosition) {
      const deltaX = Math.abs(node.position.x - dragStartPosition.x);
      const deltaY = Math.abs(node.position.y - dragStartPosition.y);
      const threshold = 5; // 5픽셀 이상 이동 시에만 히스토리 저장
      
      if (deltaX > threshold || deltaY > threshold) {
        
        useStore.getState().saveHistoryState('MOVE_NODE');
      }
      
      // 드래그 시작 위치 초기화
      setDragStartPosition(null);
    }
    
    // 드래그 완료 후 Handle 재계산 (한 번만 호출)
    setTimeout(() => {
      updateEdgeHandles();
      
      // 연결된 노드들의 internals 업데이트
      const edges = useStore.getState().edges;
      const connectedNodeIds = new Set<string>();
      edges.forEach(edge => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });
      
      connectedNodeIds.forEach(nodeId => {
        updateNodeInternals(nodeId);
      });
    }, 50); // 빠른 응답을 위해 지연 시간 단축
    
  }, [setIsDragging, setDraggingNodeId, setSnapGuides, updateEdgeHandles, updateNodeInternals, dragStartPosition]);

  const handleNodeClick = useCallback((event: any, node: any) => {
    event.stopPropagation();
    // 팝업들 닫기
    setShowAlignPopup(false);
    setShowViewPopup(false);
    // 콘텍스트 메뉴 닫기
    setContextMenu(prev => ({ ...prev, visible: false }));
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId, setShowAlignPopup, setShowViewPopup]);

  const handleMouseMove = useCallback(throttle((event: MouseEvent) => {
    if (connectingNodeId && temporaryEdge) {
      // Get source node position 
      const sourceNode = nodes.find(n => n.id === connectingNodeId);
      if (sourceNode && reactFlowWrapper.current) {
        // ReactFlow 컨테이너의 bounds 가져오기
        const reactFlowBounds = reactFlowWrapper.current.querySelector('.react-flow')?.getBoundingClientRect();
        if (reactFlowBounds) {
          // nodeOrigin=[0, 0]이므로 position이 노드 왼쪽 상단, 중심점 계산 필요
          const nodeCenterFlow = {
            x: sourceNode.position.x + (sourceNode.width || 280) / 2,
            y: sourceNode.position.y + (sourceNode.height || 120) / 2
          };
          const sourceScreenPos = flowToScreenPosition(nodeCenterFlow);
          
          // 마우스 위치를 ReactFlow 컨테이너 기준으로 계산
          const targetX = event.clientX - reactFlowBounds.left;
          const targetY = event.clientY - reactFlowBounds.top;
          
          setTemporaryEdge(prev => prev ? { 
            ...prev, 
            data: {
              ...prev.data,
              sourceX: sourceScreenPos.x - reactFlowBounds.left,
              sourceY: sourceScreenPos.y - reactFlowBounds.top,
              targetX: targetX,
              targetY: targetY,
            }
          } : null);
        }
      }
    }
  }, 32), [connectingNodeId, temporaryEdge, flowToScreenPosition, nodes, reactFlowWrapper]); // 32ms = ~30fps로 성능 개선

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (connectingNodeId && temporaryEdge) {
      const targetEl = (event.target as HTMLElement).closest('.react-flow__node');
      let targetNodeId: string | null = null;
      if (targetEl) {
        targetNodeId = targetEl.getAttribute('data-id');
      }

      if (targetNodeId) {
        finishConnection(targetNodeId);
        // 관계선 연결 완료 후 활성화 상태 해제
        setSelectedEdgeId(null);
        setHoveredEdgeId(null);
      } else {
        cancelConnection();
      }
      setTemporaryEdge(null);
    }
  }, [connectingNodeId, temporaryEdge, finishConnection, cancelConnection, setSelectedEdgeId, setHoveredEdgeId]);

  return (
    <div 
      style={{ width: '100%', height: '100%' }} 
      ref={reactFlowWrapper}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (connectingNodeId) {
          cancelConnection();
          setTemporaryEdge(null);
        }
      }}
    >
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="marker-crow-many"
            markerWidth="10"
            markerHeight="10"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M 0 5 L 10 0 M 0 5 L 10 5 M 0 5 L 10 10" stroke={isDarkMode ? "#e2e8f0" : "#333333"} strokeWidth="1" fill="none" />
          </marker>
          <marker
            id="marker-crow-many-active"
            markerWidth="10"
            markerHeight="10"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M 0 5 L 10 0 M 0 5 L 10 5 M 0 5 L 10 10" stroke="#3b82f6" strokeWidth="1" fill="none" />
          </marker>
          <marker
            id="marker-parent"
            markerWidth="12"
            markerHeight="12"
            viewBox="-6 -6 12 12"
            refX="-8"
            refY="0"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M-2,-6 L-2,6" stroke={isDarkMode ? "#e2e8f0" : "#333333"} strokeWidth="1" fill="none" />
          </marker>
          <marker
            id="marker-parent-active"
            markerWidth="12"
            markerHeight="12"
            viewBox="-6 -6 12 12"
            refX="-8"
            refY="0"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M-2,-6 L-2,6" stroke="#3b82f6" strokeWidth="1" fill="none" />
          </marker>
          <marker
            id="marker-one"
            markerWidth="10"
            markerHeight="10"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            {/* 1:1 관계 자식쪽은 아무것도 표시하지 않음 */}
          </marker>
          <marker
            id="marker-one-active"
            markerWidth="10"
            markerHeight="10"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            {/* 1:1 관계 자식쪽은 아무것도 표시하지 않음 */}
          </marker>
        </defs>
      </svg>
      
      {/* Temporary Edge Overlay - ReactFlow 앞에 배치해서 뒤에서 나오도록 */}
      {temporaryEdge && temporaryEdge.data && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1 // ReactFlow보다 뒤에 배치
          }}
        >
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          >
            <defs>
              <marker
                id="temp-arrow"
                markerWidth="8"
                markerHeight="8"
                viewBox="0 0 8 8"
                refX="6"
                refY="4"
                markerUnits="strokeWidth"
                orient="auto"
              >
                <path d="M 0 0 L 8 4 L 0 8 z" fill={isDarkMode ? "#5dade2" : "#87CEEB"} opacity="0.4" />
              </marker>
            </defs>
            {(() => {
              const { sourceX, sourceY, targetX, targetY } = temporaryEdge.data;
              // 직선으로 변경 (곡선 제거)
              const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
              return (
                <path
                  d={path}
                  stroke="#0066cc"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#temp-arrow)"
                  opacity="0.8"
                />
              );
            })()}
            <circle
              cx={temporaryEdge.data.targetX}
              cy={temporaryEdge.data.targetY}
              r="4"
              fill="#87CEEB"
              stroke="#ffffff"
              strokeWidth="2"
              opacity="0.4"
            />
          </svg>
        </div>
      )}
      
      <ReactFlow
        nodes={nodes}
        edges={temporaryEdge ? [...visibleEdges, temporaryEdge] : visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onMove={handleViewportChange}
        onMoveEnd={handleViewportChangeEnd}
        onInit={handleReactFlowInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeContextMenu={handleNodeContextMenu}
        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onEdgeClick={handleEdgeClick}
        onEdgeMouseEnter={handleEdgeMouseEnter}
        onEdgeMouseLeave={handleEdgeMouseLeave}
        onEdgeContextMenu={handleEdgeContextMenu}
        onPaneClick={handlePaneClick}
        onPaneContextMenu={handlePaneContextMenu}
        defaultEdgeOptions={{}}
        panOnDrag={!connectionMode && !createMode && !editingCommentId}
        selectionOnDrag={!connectionMode && !createMode && !editingCommentId && !isReadOnlyMode}
        nodesDraggable={!connectionMode && !editingCommentId && !isReadOnlyMode}
        nodesConnectable={!isReadOnlyMode}
        edgesFocusable={!isReadOnlyMode}
        edgesUpdatable={!isReadOnlyMode}
        elementsSelectable={!isReadOnlyMode}
        connectionLineComponent={connectionMode ? CustomConnectionLine : undefined}
        elevateNodesOnSelect={false}
        elevateEdgesOnSelect={false}
        selectNodesOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={!editingCommentId}
        preventScrolling={true}
        zoomOnPinch={!editingCommentId}
        disableKeyboardA11y={false}
        nodeOrigin={[0, 0]}
        maxZoom={2}
        minZoom={0.1}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={editingCommentId || isReadOnlyMode ? null : undefined}
        multiSelectionKeyCode={editingCommentId || isReadOnlyMode ? null : undefined}
        onlyRenderVisibleElements={false}
        fitView={false}
        snapToGrid={false}
        snapGrid={[15, 15]}
      >
        <MiniMap 
          nodeColor={(node) => {
            // 노드 타입별로 캔버스와 완전히 분리된 고유 색상 적용
            if (node.type === 'comment') {
              // 커멘트 노드: 형광 노란색 - 캔버스에서 절대 안쓰는 색
              return isDarkMode ? '#ffff00' : '#ffd700';
            } else if (node.type === 'image') {
              // 이미지 노드: 형광 시안색 - 캔버스에서 절대 안쓰는 색
              return isDarkMode ? '#00ffff' : '#00bfff';
            } else if (node.type === 'text') {
              // 텍스트 노드: 형광 마젠타색 - 캔버스에서 절대 안쓰는 색
              return isDarkMode ? '#ff00ff' : '#ff1493';
            } else if (node.type === 'entity') {
              // 엔티티 노드: 기존대로 실제 노드 색상 사용
              const getNodeColor = useStore.getState().getNodeColor;
              return getNodeColor(node.id);
            }
            // 기타 노드: 기본 색상
            return isDarkMode ? '#4a5568' : '#a0aec0';
          }}
          nodeStrokeColor={(node) => {
            // 노드 타입별로 진한 형광 색상 테두리
            if (node.type === 'comment') {
              // 커멘트 노드: 진한 금색 테두리
              return isDarkMode ? '#ffcc00' : '#b8860b';
            } else if (node.type === 'image') {
              // 이미지 노드: 진한 청색 테두리
              return isDarkMode ? '#0099cc' : '#006699';
            } else if (node.type === 'text') {
              // 텍스트 노드: 진한 자주색 테두리
              return isDarkMode ? '#cc0099' : '#990066';
            } else if (node.type === 'entity') {
              // 엔티티 노드: 실제 노드 색상의 어두운 버전을 stroke 색상으로 사용
              const getNodeColor = useStore.getState().getNodeColor;
              const nodeColor = getNodeColor(node.id);
              // 색상을 어둡게 만드는 함수
              const darkenColor = (color: string) => {
                return color.replace(/^#/, '').match(/.{2}/g)?.map(hex => {
                  const num = Math.max(0, parseInt(hex, 16) - 40);
                  return num.toString(16).padStart(2, '0');
                }).join('') || color;
              };
              return `#${darkenColor(nodeColor)}`;
            }
            // 기타 노드: 기본 테두리 색상
            return isDarkMode ? '#6b7280' : '#9ca3af';
          }}
          nodeStrokeWidth={1.5}
          maskColor={isDarkMode ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.2)"}
          pannable={true}
          zoomable={true}
          ariaLabel="Mini map"
          style={{ 
            backgroundColor: isDarkMode ? '#2d3748' : '#f8fafc',
            border: `2px solid ${isDarkMode ? '#4a5568' : '#e2e8f0'}`,
            borderRadius: '8px'
          }}
        />
        
        {/* 배경 그리드 */}
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={2}
            color={isDarkMode ? '#4a5568' : '#e0e0e0'}
          />
        )}
        
        {/* 스냅 가이드라인을 ReactFlow 내부에 렌더링 */}
        <Panel position="top-left" style={{ pointerEvents: 'none', zIndex: 1000 }}>
          <SnapGuides />
        </Panel>
      </ReactFlow>
      
      {/* 캔버스 툴바 */}
      <CanvasToolbar zoom={zoom} />
      
      {/* 컨텍스트 메뉴 */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        type={contextMenu.type}
        onDelete={handleContextMenuDelete}
        onClose={handleContextMenuClose}
        onCopy={handleContextMenuCopy}
        onPaste={handleContextMenuPaste}
        canCopy={contextMenu.type === 'node' && !isReadOnlyMode}
        canPaste={contextMenu.type === 'pane' && !!copiedNode && !isReadOnlyMode}
        canDelete={!isReadOnlyMode}
      />
      
      {/* 검색 패널 */}
      <SearchPanel />
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
