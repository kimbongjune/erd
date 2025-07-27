import ReactFlow, { Node, useReactFlow, Edge, MiniMap, useViewport, Panel, Background, BackgroundVariant, useUpdateNodeInternals, getRectOfNodes, getTransformForBounds } from 'reactflow';
import { toPng } from 'html-to-image';
import React, { useCallback, useRef, useState, MouseEvent, useEffect, useMemo } from 'react';
import 'reactflow/dist/style.css';
import throttle from 'lodash.throttle';
import useStore from '../store/useStore';
import EntityNode from './nodes/EntityNode';
import CommentNode from './nodes/CommentNode';
import TextNode from './nodes/TextNode';
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
};

const Canvas = () => {
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
  
  // viewport 관련
  const updateViewport = useStore((state) => state.updateViewport);
  const savedViewport = useStore((state) => state.viewport);
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
    type: 'node' as 'node' | 'edge',
    targetId: ''
  });

  // viewport 변경 핸들러 - 실시간 viewport 추적
  const handleViewportChange = useCallback((viewport: any) => {
    // 실시간으로 viewport 업데이트 (저장은 하지 않음)
    console.log('🔄 viewport 변경 중:', viewport);
  }, []);

  // viewport 변경 완료 핸들러 - 이동/줌이 끝난 후 저장
  const handleViewportChangeEnd = useCallback((viewport: any) => {
    console.log('✅ viewport 변경 완료:', viewport);
    updateViewport(viewport);
  }, [updateViewport]);

  // ReactFlow 초기화 완료 핸들러
  const handleReactFlowInit = useCallback((reactFlowInstance: any) => {
    console.log('🚀 ReactFlow 초기화 완료');
    
    // ReactFlow 인스턴스를 전역에서 접근 가능하도록 저장
    (window as any).reactFlowInstance = reactFlowInstance;
    
    // ReactFlow가 완전히 초기화된 후 저장된 viewport 복원
    if (savedViewport && (savedViewport.x !== 0 || savedViewport.y !== 0 || savedViewport.zoom !== 1)) {
      console.log('🔄 onInit에서 viewport 복원:', savedViewport);
      
      // 즉시 설정
      reactFlowInstance.setViewport(savedViewport);
      
      // 여러 번 재시도해서 확실하게 적용
      const timers = [
        setTimeout(() => {
          console.log('⏰ onInit viewport 재설정 (100ms)');
          reactFlowInstance.setViewport(savedViewport);
        }, 100),
        setTimeout(() => {
          console.log('⏰ onInit viewport 재설정 (300ms)');
          reactFlowInstance.setViewport(savedViewport);
        }, 300),
        setTimeout(() => {
          console.log('⏰ onInit viewport 재설정 (500ms)');
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

    if (event.key === 'Escape') {
      // 모든 동작 취소하고 선택 모드로 돌아가기
      cancelConnection();
      setTemporaryEdge(null);
      useStore.getState().setCreateMode(null);
      useStore.getState().setConnectionMode(null);
      useStore.getState().setConnectingNodeId(null);
      useStore.getState().setSelectMode(true);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
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
      try {
        const reactFlowWrapper = document.querySelector('.react-flow') as HTMLElement;
        if (!reactFlowWrapper) {
          return;
        }

        // 현재 상태 완전 저장
        const originalHiddenEntities = new Set(hiddenEntities);
        const originalConnectionMode = useStore.getState().connectionMode;
        const originalConnectingNodeId = useStore.getState().connectingNodeId;
        const originalCreateMode = useStore.getState().createMode;
        const originalSelectedNodeId = useStore.getState().selectedNodeId;
        const originalSelectedEdgeId = useStore.getState().selectedEdgeId;
        const originalSelectMode = useStore.getState().selectMode;
        
        // 모든 상태 초기화 (관계선 비활성화)
        useStore.getState().showAllEntities();
        useStore.getState().setConnectionMode(null);
        useStore.getState().setConnectingNodeId(null);
        useStore.getState().setCreateMode(null);
        useStore.getState().setSelectedNodeId(null);
        useStore.getState().setSelectedEdgeId(null);
        useStore.getState().setSelectMode(true);
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
        
        console.log('캔버스 크기 캡처:', { captureWidth, captureHeight });

        // 이미지 export - 실제 캔버스 크기로 캡처
        const dataUrl = await toPng(reactFlowWrapper, {
          backgroundColor: '#ffffff',
          width: captureWidth,
          height: captureHeight,
          pixelRatio: 2, // 고화질을 위해 픽셀 비율 증가
          quality: 0.95,
          filter: (node) => {
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
        
      } catch (error) {
        console.error('이미지 export 실패:', error);
        
        // 상태 초기화
        useStore.setState({ hiddenEntities: hiddenEntities });
        useStore.getState().setConnectionMode(null);
        useStore.getState().setConnectingNodeId(null);
        useStore.getState().setCreateMode(null);
        useStore.getState().setSelectedNodeId(null);
        useStore.getState().setSelectedEdgeId(null);
        useStore.getState().setSelectMode(true);
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
            // nodeOrigin=[0.5, 0.5]이므로 position이 이미 노드 중심점
            const nodeCenterFlow = {
              x: sourceNode.position.x,
              y: sourceNode.position.y
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
        // nodeOrigin=[0.5, 0.5]이므로 position이 이미 노드 중심점
        const nodeCenterFlow = {
          x: node.position.x,
          y: node.position.y
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
    
    // 색상 팔레트가 열려있을 때만 닫기
    const showColorPalette = useStore.getState().showColorPalette;
    if (showColorPalette) {
      const hidePalette = useStore.getState().hidePalette;
      hidePalette();
    }
    
    // 검색에서 선택된 엔티티 해제
    const setSelectedSearchEntity = useStore.getState().setSelectedSearchEntity;
    setSelectedSearchEntity(null);
    
    if (createMode) {
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
            label: 'New Entity',
            columns: [], // 기본 컬럼 제거
          },
        };
        useStore.getState().setNodes([...nodes, newNode]);
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
        useStore.getState().setNodes([...nodes, newNode]);
        // 생성 후 선택 모드로 돌아가기
        useStore.getState().setCreateMode(null);
        useStore.getState().setSelectMode(true);
      }
    } else {
      // 캔버스 빈 공간 클릭 시 모든 선택 해제
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setBottomPanelOpen(false);
    }
  }, [createMode, nodes, screenToFlowPosition, setSelectedNodeId, setSelectedEdgeId, setBottomPanelOpen, setShowAlignPopup, setShowViewPopup]);

  const handleNodeDoubleClick = useCallback((_: MouseEvent, node: Node) => {
    if (node.type === 'text') return;
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null); // Clear edge selection when node is selected
    setBottomPanelOpen(true);
  }, [setSelectedNodeId, setSelectedEdgeId, setBottomPanelOpen]);

  const handleEdgeClick = useCallback((_: MouseEvent, edge: Edge) => {
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
      targetId: node.id
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
      targetId: edge.id
    });
    setSelectedEdgeId(edge.id);
  }, [setSelectedEdgeId]);

  const handleContextMenuDelete = useCallback(() => {
    if (contextMenu.type === 'node') {
      useStore.getState().deleteNode(contextMenu.targetId);
    } else if (contextMenu.type === 'edge') {
      useStore.getState().deleteEdge(contextMenu.targetId);
    }
  }, [contextMenu]);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // 노드 클릭 핸들러 (기존)
  // 노드 드래그 이벤트 핸들러들
  const handleNodeDragStart = useCallback((event: any, node: any) => {
    // 모든 EntityNode에 드래그 시작 이벤트 전파
    window.dispatchEvent(new CustomEvent('nodeDragStart'));
    
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
          // X축 스냅 - nodeOrigin=[0.5, 0.5] 고려
          const nodeWidth = node.width || 280;
          const left = node.position.x - nodeWidth / 2;
          const right = node.position.x + nodeWidth / 2;
          const centerX = node.position.x;
          
          if (Math.abs(guide.position - left) <= threshold) {
            snappedPosition.x = guide.position + nodeWidth / 2;
            hasSnapped = true;
          } else if (Math.abs(guide.position - right) <= threshold) {
            snappedPosition.x = guide.position - nodeWidth / 2;
            hasSnapped = true;
          } else if (Math.abs(guide.position - centerX) <= threshold) {
            snappedPosition.x = guide.position;
            hasSnapped = true;
          }
        } else if (guide.type === 'horizontal') {
          // Y축 스냅 - nodeOrigin=[0.5, 0.5] 고려
          const nodeHeight = node.height || 120;
          const top = node.position.y - nodeHeight / 2;
          const bottom = node.position.y + nodeHeight / 2;
          const centerY = node.position.y;
          
          if (Math.abs(guide.position - top) <= threshold) {
            snappedPosition.y = guide.position + nodeHeight / 2;
            hasSnapped = true;
          } else if (Math.abs(guide.position - bottom) <= threshold) {
            snappedPosition.y = guide.position - nodeHeight / 2;
            hasSnapped = true;
          } else if (Math.abs(guide.position - centerY) <= threshold) {
            snappedPosition.y = guide.position;
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
    
  }, [setIsDragging, setDraggingNodeId, setSnapGuides, updateEdgeHandles, updateNodeInternals]);

  const handleNodeClick = useCallback((event: any, node: any) => {
    event.stopPropagation();
    // 팝업들 닫기
    setShowAlignPopup(false);
    setShowViewPopup(false);
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
          // nodeOrigin=[0.5, 0.5]이므로 position이 이미 노드 중심점
          const nodeCenterFlow = {
            x: sourceNode.position.x,
            y: sourceNode.position.y
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
        onPaneContextMenu={handleContextMenuClose}
        defaultEdgeOptions={{}}
        panOnDrag={!connectionMode && !createMode}
        selectionOnDrag={!connectionMode && !createMode}
        nodesDraggable={!connectionMode}
        connectionLineComponent={connectionMode ? CustomConnectionLine : undefined}
        elevateNodesOnSelect={false}
        elevateEdgesOnSelect={false}
        selectNodesOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={true}
        preventScrolling={true}
        zoomOnPinch={true}
        disableKeyboardA11y={false}
        nodeOrigin={[0.5, 0.5]}
        maxZoom={2}
        minZoom={0.1}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        onlyRenderVisibleElements={false}
        elementsSelectable={true}
        fitView={false}
        snapToGrid={false}
        snapGrid={[15, 15]}
      >
        <MiniMap 
          nodeColor={(node) => node.type === 'comment' ? 'transparent' : (isDarkMode ? '#4a5568' : '#e2e8f0')}
          nodeStrokeColor={(node) => node.type === 'comment' ? 'transparent' : (isDarkMode ? '#cbd5e0' : '#64748b')}
          nodeStrokeWidth={2}
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
      />
      
      {/* 검색 패널 */}
      <SearchPanel />
    </div>
  );
};

export default Canvas;
