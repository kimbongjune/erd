import ReactFlow, { Node, useReactFlow, Edge, MarkerType } from 'reactflow';
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

  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [temporaryEdge, setTemporaryEdge] = useState<Edge | null>(null);

  // Debug log for edges
  useEffect(() => {
    if (temporaryEdge) {
      console.log('TemporaryEdge active with data:', temporaryEdge.data);
    }
  }, [temporaryEdge]);

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
          console.log('Created temporary edge via event:', newTemporaryEdge);
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
        console.log('Created temporary edge with click position:', { 
          clientX, 
          clientY, 
          flowX: flowPosition.x, 
          flowY: flowPosition.y 
        });
      }
    }
    // Don't prevent default if not in connection mode - allow double click to work
  }, [connectionMode, setConnectingNodeId, nodes, screenToFlowPosition]);

  const defaultEdgeOptions = {};

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
        
        console.log('Coords:', { 
          sourceScreen: sourceScreenPos, 
          targetScreen: targetScreenPos,
          mouseClient: { x: event.clientX, y: event.clientY }
        });
        
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
            id="marker-one"
            markerWidth="10"
            markerHeight="10"
            viewBox="-5 -5 10 10"
            refX="0"
            refY="0"
            markerUnits="strokeWidth"
            orient="auto"
          >
            <path d="M-5,-5 L-5,5" stroke="#000" strokeWidth="1.5" fill="none" />
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
        onNodeDoubleClick={handleNodeDoubleClick}
        onEdgeClick={handleEdgeClick}
        defaultEdgeOptions={{}}
        panOnDrag={!connectionMode}
        selectionOnDrag={!connectionMode}
        nodesDraggable={!connectionMode}
        connectionLineComponent={connectionMode ? CustomConnectionLine : undefined}
      />
      
      {temporaryEdge && (
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'yellow', padding: '5px', zIndex: 1000 }}>
          Temporary Edge Active: {temporaryEdge.id}, Type: {temporaryEdge.type}, Edges Count: {edges.length}
        </div>
      )}
    </div>
  );
};

export default Canvas;
