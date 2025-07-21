import ReactFlow, { Node, useReactFlow, Edge, MarkerType } from 'reactflow';
import React, { useCallback, useRef, useState, MouseEvent, useMemo } from 'react';
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

const edgeTypes = {
  'one-to-one-identifying': OneToOneIdentifyingEdge,
  'one-to-one-non-identifying': OneToOneNonIdentifyingEdge,
  'one-to-many-identifying': OneToManyIdentifyingEdge,
  'one-to-many-non-identifying': OneToManyNonIdentifyingEdge,
  'temporary': TemporaryEdge,
};

const Canvas = () => {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);
  const setBottomPanelOpen = useStore((state) => state.setBottomPanelOpen);
  const connectionMode = useStore((state) => state.connectionMode);
  const connectingNodeId = useStore((state) => state.connectingNodeId);
  const setConnectingNodeId = useStore((state) => state.setConnectingNodeId);
  const finishConnection = useStore((state) => state.finishConnection);
  const cancelConnection = useStore((state) => state.cancelConnection);

  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [temporaryEdge, setTemporaryEdge] = useState<Edge | null>(null);

  const handleNodeMouseDown = useCallback((event: MouseEvent, node: Node) => {
    if (connectionMode && node.type === 'entity') {
      event.preventDefault();
      event.stopPropagation();
      setConnectingNodeId(node.id);

      const newTemporaryEdge = {
        id: 'reactflow__edge-temporary',
        source: node.id,
        target: node.id,
        sourceHandle: null,
        targetHandle: null,
        type: 'temporary',
      };
      setTemporaryEdge(newTemporaryEdge);
    }
  }, [connectionMode, setConnectingNodeId, screenToFlowPosition]);

  const nodeTypes = useMemo(() => ({
    entity: (props) => <EntityNode {...props} onMouseDown={(e) => handleNodeMouseDown(e, props)} />,
    comment: CommentNode,
    text: TextNode,
  }), [connectionMode]);

  const defaultEdgeOptions = {};

  const handleNodeDoubleClick = useCallback((_: MouseEvent, node: Node) => {
    if (node.type === 'text') return;
    setSelectedNodeId(node.id);
    setBottomPanelOpen(true);
  }, [setSelectedNodeId, setBottomPanelOpen]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (connectingNodeId && temporaryEdge) {
      const { x, y } = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      setTemporaryEdge(prev => prev ? { ...prev, targetX: x, targetY: y } : null);
    }
  }, [connectingNodeId, temporaryEdge, screenToFlowPosition]);

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
      <ReactFlow
        nodes={nodes}
        edges={temporaryEdge ? [...edges, temporaryEdge] : edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDoubleClick={handleNodeDoubleClick}
        defaultEdgeOptions={defaultEdgeOptions}
        panOnDrag={!connectionMode}
        selectionOnDrag={!connectionMode}
        nodesDraggable={!connectionMode}
      />
    </div>
  );
};

export default Canvas;
