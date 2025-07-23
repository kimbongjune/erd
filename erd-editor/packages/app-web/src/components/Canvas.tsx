import ReactFlow, { Node, useReactFlow, Edge, MarkerType, MiniMap } from 'reactflow';
import React, { useCallback, useRef, useState, MouseEvent, useEffect } from 'react';
import 'reactflow/dist/style.css';
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
  const setBottomPanelOpen = useStore((state) => state.setBottomPanelOpen);
  const connectionMode = useStore((state) => state.connectionMode);
  const connectingNodeId = useStore((state) => state.connectingNodeId);
  const setConnectingNodeId = useStore((state) => state.setConnectingNodeId);
  const finishConnection = useStore((state) => state.finishConnection);
  const cancelConnection = useStore((state) => state.cancelConnection);
  const createMode = useStore((state) => state.createMode);
  const addNode = useStore((state) => state.addNode);
  const deleteSelected = useStore((state) => state.deleteSelected);

  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [temporaryEdge, setTemporaryEdge] = useState<Edge | null>(null);
  
  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: 'node' as 'node' | 'edge',
    targetId: ''
  });

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

  // Listen for temporary edge creation events
  React.useEffect(() => {
    const handleCreateTemporaryEdge = (event: any) => {
      const { nodeId, nodes: currentNodes, connectionMode: currentMode } = event.detail;
      if (currentMode) {
      // Get source node position
      const sourceNode = currentNodes.find((n: any) => n.id === nodeId);
      if (sourceNode) {
        // Convert ReactFlow coordinates to screen coordinates
        const nodeCenterFlow = {
          x: sourceNode.position.x + (sourceNode.width ?? 200) / 2,
          y: sourceNode.position.y + (sourceNode.height ?? 100) / 2
        };
        const projected = flowToScreenPosition(nodeCenterFlow);
        const sourceX = projected.x;
        const sourceY = projected.y;
          
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
      setConnectingNodeId(node.id);

      // ReactFlow의 screenToFlowPosition 함수를 사용해서 정확한 좌표 계산
      const reactFlowBounds = reactFlowWrapper.current?.querySelector('.react-flow')?.getBoundingClientRect();
      if (reactFlowBounds) {
        // 화면 좌표를 ReactFlow Canvas 좌표로 변환
        const clientX = event.clientX - reactFlowBounds.left;
        const clientY = event.clientY - reactFlowBounds.top;
        
        // ReactFlow의 screenToFlowPosition 함수로 변환된 좌표 계산 (zoom, pan 고려)
        const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });
        
        const newTemporaryEdge = {
          id: 'temp-edge',
          source: node.id,
          target: 'temp-target',
          sourceHandle: 'right',
          targetHandle: 'left',
          type: 'temporary',
          data: {
            sourceX: flowPosition.x,
            sourceY: flowPosition.y,
            targetX: flowPosition.x,
            targetY: flowPosition.y,
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
    }
  }, [createMode, nodes, screenToFlowPosition]);

  const handleNodeDoubleClick = useCallback((_: MouseEvent, node: Node) => {
    if (node.type === 'text') return;
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null); // Clear edge selection when node is selected
    setBottomPanelOpen(true);
  }, [setSelectedNodeId, setSelectedEdgeId, setBottomPanelOpen]);

  const handleEdgeClick = useCallback((_: MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null); // Clear node selection when edge is selected
    setBottomPanelOpen(false); // Close bottom panel when edge is selected
  }, [setSelectedEdgeId, setSelectedNodeId, setBottomPanelOpen]);

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
    console.log('Edge context menu triggered:', edge.id);
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
  const handleNodeClick = useCallback((event: any, node: any) => {
    event.stopPropagation();
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (connectingNodeId && temporaryEdge) {
      // Get source node position using flowToScreenPosition 
      const sourceNode = nodes.find(n => n.id === connectingNodeId);
      if (sourceNode) {
        // Convert ReactFlow coordinates to screen coordinates for both source and target
        const nodeCenterFlow = {
          x: sourceNode.position.x + (sourceNode.width ?? 200) / 2,
          y: sourceNode.position.y + (sourceNode.height ?? 100) / 2
        };
        const sourceScreenPos = flowToScreenPosition(nodeCenterFlow);
        
        // Convert mouse position to flow coordinates first, then back to screen coordinates
        // This ensures both coordinates are in the same coordinate system
        const mouseFlowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const targetScreenPos = flowToScreenPosition(mouseFlowPos);
        
        setTemporaryEdge(prev => prev ? { 
          ...prev, 
          data: {
            ...prev.data,
            sourceX: sourceScreenPos.x,
            sourceY: sourceScreenPos.y,
            targetX: targetScreenPos.x,
            targetY: targetScreenPos.y,
          }
        } : null);
      }
    }
  }, [connectingNodeId, temporaryEdge, flowToScreenPosition, screenToFlowPosition, nodes]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (connectingNodeId && temporaryEdge) {
      const targetEl = (event.target as HTMLElement).closest('.react-flow__node');
      let targetNodeId: string | null = null;
      if (targetEl) {
        targetNodeId = targetEl.getAttribute('data-id');
      }

      if (targetNodeId && targetNodeId !== connectingNodeId) {
        finishConnection(targetNodeId);
      } else {
        cancelConnection();
      }
      setTemporaryEdge(null);
    }
  }, [connectingNodeId, temporaryEdge, finishConnection, cancelConnection]);

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
            markerUnits="strokeWidth"
            orient="auto"
          >
            <path d="M 0 5 L 10 0 M 0 5 L 10 5 M 0 5 L 10 10" stroke="#000" strokeWidth="1" fill="none" />
          </marker>
          <marker
            id="marker-parent"
            markerWidth="12"
            markerHeight="12"
            viewBox="-6 -6 12 12"
            refX="-8"
            refY="0"
            markerUnits="strokeWidth"
            orient="auto"
          >
            <path d="M-2,-6 L-2,6" stroke="#000" strokeWidth="1" fill="none" />
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
                <path d="M 0 0 L 8 4 L 0 8 z" fill="#87CEEB" opacity="0.4" />
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
        edges={edges} // temporaryEdge 제거
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeClick={handleEdgeClick}
        onEdgeContextMenu={handleEdgeContextMenu}
        onPaneClick={handlePaneClick}
        onPaneContextMenu={handleContextMenuClose}
        defaultEdgeOptions={{}}
        panOnDrag={!connectionMode && !createMode}
        selectionOnDrag={!connectionMode && !createMode}
        nodesDraggable={!connectionMode}
        connectionLineComponent={connectionMode ? CustomConnectionLine : undefined}
      >
        <MiniMap 
          nodeColor={(node) => node.type === 'comment' ? 'transparent' : '#e2e8f0'}
          nodeStrokeColor={(node) => node.type === 'comment' ? 'transparent' : '#64748b'}
          nodeStrokeWidth={2}
          maskColor="rgba(0, 0, 0, 0.2)"
          pannable={true}
          zoomable={true}
          ariaLabel="Mini map"
          style={{ 
            backgroundColor: '#f8fafc',
            border: '2px solid #e2e8f0',
            borderRadius: '8px'
          }}
        />
      </ReactFlow>
      
      {/* 컨텍스트 메뉴 */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        type={contextMenu.type}
        onDelete={handleContextMenuDelete}
        onClose={handleContextMenuClose}
      />
    </div>
  );
};

export default Canvas;
