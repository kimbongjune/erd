import ReactFlow, { Node, useReactFlow } from 'reactflow';
import React, { useCallback, useRef, useState } from 'react';
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

const nodeTypes = {
  entity: EntityNode,
  comment: CommentNode,
  text: TextNode,
};

const edgeTypes = {
  'one-to-one-identifying': OneToOneIdentifyingEdge,
  'one-to-one-non-identifying': OneToOneNonIdentifyingEdge,
  'one-to-many-identifying': OneToManyIdentifyingEdge,
  'one-to-many-non-identifying': OneToManyNonIdentifyingEdge,
  temporary: TemporaryEdge,
};

const Canvas = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, setSelectedNodeId, setBottomPanelOpen, onConnect, connectionMode, connectingNodeId, setConnectingNodeId, setConnectionMode } = useStore();
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const [temporaryEdge, setTemporaryEdge] = useState<Edge | null>(null);

  const defaultEdgeOptions = {
    type: 'smoothstep',
    animated: true,
  };

  const handleNodeDoubleClick = (event: React.MouseEvent, node: Node) => {
    if (node.type === 'text') {
      return; // Text 노드는 더블클릭 시 하단 패널을 열지 않음
    }
    setSelectedNodeId(node.id);
    setBottomPanelOpen(true);
  };

  const handleNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    console.log("handleNodeDragStart triggered! connectionMode:", connectionMode, "node:", node);
    if (connectionMode) {
      event.stopPropagation(); // Prevent node from being dragged (moved)
      setConnectingNodeId(node.id);
      const newTemporaryEdge = {
        id: 'reactflow__connecting',
        source: node.id,
        target: '',
        type: 'temporary',
        sourceX: node.positionAbsolute?.x || node.position.x,
        sourceY: node.positionAbsolute?.y || node.position.y,
        style: { stroke: '#007bff', strokeWidth: 2 },
      };
      setTemporaryEdge(newTemporaryEdge);
      console.log("After setTemporaryEdge in handleNodeDragStart:", newTemporaryEdge);
    }
  }, [connectionMode, setConnectingNodeId, setTemporaryEdge]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (connectionMode && temporaryEdge && reactFlowWrapper.current) {
      const projectedTarget = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      setTemporaryEdge({
        ...temporaryEdge,
        targetX: projectedTarget.x,
        targetY: projectedTarget.y,
      });
      console.log("handleMouseMove triggered! projectedTarget:", projectedTarget, "temporaryEdge:", temporaryEdge);
    }
  }, [connectionMode, screenToFlowPosition, temporaryEdge, setTemporaryEdge]);

  const handleNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    if (connectionMode && connectingNodeId) {
      const clientX = event.clientX;
      const clientY = event.clientY;

      // Convert client coordinates to React Flow coordinates
      const pointerPosition = screenToFlowPosition({ x: clientX, y: clientY });

      const currentNodes = getNodes(); // Get current nodes with updated positions and dimensions

      const targetNode = currentNodes.find((n) => {
        if (n.id === connectingNodeId) return false; // Don't connect to self

        // Check if pointer is within the bounds of the target node
        return (
          pointerPosition.x >= n.position.x &&
          pointerPosition.x <= n.position.x + (n.width || 0) &&
          pointerPosition.y >= n.position.y &&
          pointerPosition.y <= n.position.y + (n.height || 0)
        );
      });

      if (targetNode) {
        const connection = {
          source: connectingNodeId,
          target: targetNode.id,
          sourceHandle: null,
          targetHandle: null,
        };
        onConnect(connection);
      }

      setConnectingNodeId(null);
      setConnectionMode(null); // Reset connection mode after connection attempt
      setTemporaryEdge(null);
    }
  }, [connectionMode, connectingNodeId, getNodes, onConnect, screenToFlowPosition, setConnectingNodeId, setConnectionMode, setTemporaryEdge]);

  console.log("ReactFlow nodes prop:", nodes);
  console.log("ReactFlow edges prop:", temporaryEdge ? [...edges, temporaryEdge] : edges);

  return (
    <div style={{ width: '100%', height: '100%' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={temporaryEdge ? [...edges, temporaryEdge] : edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeDoubleClick={handleNodeDoubleClick}
        onConnect={onConnect}
        defaultEdgeOptions={defaultEdgeOptions}
        edgeTypes={edgeTypes}
        onNodeDragStart={handleNodeDragStart}
        onMouseMove={handleMouseMove}
        onNodeDragStop={handleNodeDragStop}
        panOnDrag={!connectionMode}
      />
    </div>
  );
};

export default Canvas;
