import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges, addEdge, Connection, NodeChange, MarkerType } from 'reactflow';

type RFState = {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isBottomPanelOpen: boolean;
  connectionMode: string | null;
  connectingNodeId: string | null;
  createMode: string | null;
  selectMode: boolean;
  
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addNode: (type: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setBottomPanelOpen: (isOpen: boolean) => void;
  deleteNode: (id: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onConnect: (connection: Connection) => void;
  setConnectionMode: (mode: string | null) => void;
  setConnectingNodeId: (id: string | null) => void;
  finishConnection: (targetNodeId: string | null) => void;
  cancelConnection: () => void;
  updateSelectedEdgeType: (newType: string) => void;
  updateNodeData: (nodeId: string, newData: any) => void;
  setCreateMode: (mode: string | null) => void;
  setSelectMode: (mode: boolean) => void;
};

const useStore = create<RFState>((set, get) => ({
  nodes: [
    {
      id: '1',
      type: 'entity',
      position: { x: 100, y: 100 },
      data: {
        label: 'User',
        columns: [
          { name: 'id', type: 'INT', pk: true },
          { name: 'username', type: 'VARCHAR' },
        ],
      },
    },
    {
      id: '2',
      type: 'entity',
      position: { x: 400, y: 100 },
      data: {
        label: 'Post',
        columns: [
          { name: 'id', type: 'INT', pk: true },
          { name: 'title', type: 'VARCHAR' },
          { name: 'user_id', type: 'INT' },
        ],
      },
    },
  ],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  isBottomPanelOpen: false,
  connectionMode: null,
  connectingNodeId: null,
  createMode: null,
  selectMode: true,
  
  onNodesChange: (changes: NodeChange[]) => {
    set((state) => {
      const newNodes = applyNodeChanges(changes, state.nodes);
      
      // 노드가 이동했을 때 관계선의 핸들 위치를 자동으로 업데이트
      const hasPositionChange = changes.some(change => change.type === 'position');
      if (hasPositionChange) {
        const updatedEdges = state.edges.map(edge => {
          const sourceNode = newNodes.find(node => node.id === edge.source);
          const targetNode = newNodes.find(node => node.id === edge.target);
          
          if (sourceNode && targetNode) {
            const sourceX = sourceNode.position.x + (sourceNode.width || 200) / 2;
            const targetX = targetNode.position.x + (targetNode.width || 200) / 2;
            
            return {
              ...edge,
              sourceHandle: sourceX <= targetX ? 'right' : 'left',
              targetHandle: sourceX <= targetX ? 'left' : 'right',
            };
          }
          return edge;
        });
        
        // nodes와 edges를 한 번에 업데이트
        return { nodes: newNodes, edges: updatedEdges };
      }
      
      return { nodes: newNodes };
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  addNode: (type) => {
    const newNode = {
      id: `node_${Math.random()}`,
      type: type,
      position: { x: 100, y: 100 },
      data: { label: `New ${type}` },
    };
    set({ nodes: [...get().nodes, newNode] });
  },
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
  setBottomPanelOpen: (isOpen) => set({ isBottomPanelOpen: isOpen }),
  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  onConnect: (connection) => {
    set((state) => {
      let updatedNodes = state.nodes;
      const sourceNode = state.nodes.find((node) => node.id === connection.source);
      const targetNode = state.nodes.find((node) => node.id === connection.target);

      // Check if there's already an edge between these nodes
      const existingEdge = state.edges.find(edge => 
        (edge.source === connection.source && edge.target === connection.target) ||
        (edge.source === connection.target && edge.target === connection.source)
      );

      // 부모에는 세로선, 자식에는 관계 타입에 따른 마커 (1:1은 마커 없음, 1:N은 까마귀발)
      let sourceMarker = undefined; // markerStart용 - 자식 쪽
      let targetMarker = { type: MarkerType.ArrowClosed, id: 'marker-parent' }; // markerEnd용 (부모)

      // Determine markers based on connectionMode
      if (state.connectionMode?.includes('oneToMany')) {
        sourceMarker = { type: MarkerType.ArrowClosed, id: 'marker-crow-many' }; // N쪽 (자식)에 까마귀발
      }
      // 1:1 관계는 자식 쪽에 마커 없음 (sourceMarker = undefined)

      if (sourceNode && targetNode && sourceNode.type === 'entity' && targetNode.type === 'entity') {
        const sourcePkColumn = sourceNode.data.columns?.find((col: any) => col.pk);

        if (sourcePkColumn) {
          let newTargetColumns = [...(targetNode.data.columns || [])];
          const fkColumnName = `${sourceNode.data.label.toLowerCase()}_${sourcePkColumn.name}`;
          const existingFkIndex = newTargetColumns.findIndex(col => col.name === fkColumnName);

          const relationshipType = state.connectionMode;

          if (relationshipType === 'one-to-one-identifying' || relationshipType === 'one-to-many-identifying') {
            if (existingFkIndex === -1) {
              newTargetColumns.push({ name: fkColumnName, type: sourcePkColumn.type, pk: true, fk: true });
            } else {
              newTargetColumns[existingFkIndex] = { ...newTargetColumns[existingFkIndex], pk: true, fk: true };
            }
          } else {
            if (existingFkIndex === -1) {
              newTargetColumns.push({ name: fkColumnName, type: sourcePkColumn.type, pk: false, fk: true });
            } else {
              newTargetColumns[existingFkIndex] = { ...newTargetColumns[existingFkIndex], pk: false, fk: true };
            }
          }

          updatedNodes = state.nodes.map((node) =>
            node.id === targetNode.id
              ? { ...node, data: { ...node.data, columns: newTargetColumns } }
              : node
          );
        }
      }

      const sourceX = sourceNode?.position.x ? sourceNode.position.x + (sourceNode.width ?? 0) / 2 : 0;
      const targetX = targetNode?.position.x ? targetNode.position.x + (targetNode.width ?? 0) / 2 : 0;

      let updatedEdges;

      const getEdgeType = (connectionMode: string | null) => {
        if (!connectionMode) return 'one-to-many-non-identifying';
        switch (connectionMode) {
          case 'oneToOneIdentifying':
            return 'one-to-one-identifying';
          case 'oneToOneNonIdentifying':
            return 'one-to-one-non-identifying';
          case 'oneToManyIdentifying':
            return 'one-to-many-identifying';
          case 'oneToManyNonIdentifying':
            return 'one-to-many-non-identifying';
          default:
            return 'one-to-many-non-identifying';
        }
      };

      if (existingEdge) {
        // Update existing edge
        updatedEdges = state.edges.map(edge => {
          if (edge.id === existingEdge.id) {
            return {
              ...edge,
              type: getEdgeType(state.connectionMode),
              markerStart: sourceMarker,
              markerEnd: targetMarker,
              sourceHandle: sourceX < targetX ? 'right' : 'left',
              targetHandle: sourceX < targetX ? 'left' : 'right',
            };
          }
          return edge;
        });
      } else {
        // Create new edge
        const newEdge = {
          ...connection,
          sourceHandle: sourceX <= targetX ? 'right' : 'left',
          targetHandle: sourceX <= targetX ? 'left' : 'right',
          type: getEdgeType(state.connectionMode),
          markerStart: sourceMarker,
          markerEnd: targetMarker,
        };
        updatedEdges = addEdge(newEdge, state.edges);
      }

      return { nodes: updatedNodes, edges: updatedEdges };
    });
  },
  setConnectionMode: (mode) => {
    set({ connectionMode: mode });
  },
  setConnectingNodeId: (id) => set({ connectingNodeId: id }),
  finishConnection: (targetNodeId) => {
    const { connectingNodeId, connectionMode, onConnect } = get();
    if (targetNodeId && connectingNodeId && connectionMode) {
      onConnect({
        source: connectingNodeId,
        target: targetNodeId,
        sourceHandle: null,
        targetHandle: null,
      });
    }
    // 관계 생성 후 선택 모드로 돌아가기
    set({ 
      connectingNodeId: null, 
      connectionMode: null,
      createMode: null,
      selectMode: true 
    });
  },
  cancelConnection: () => {
    set({ connectingNodeId: null, connectionMode: null });
  },
  updateSelectedEdgeType: (newType: string) => {
    set((state) => {
      if (!state.selectedEdgeId) return state;
      
      const updatedEdges = state.edges.map(edge => {
        if (edge.id === state.selectedEdgeId) {
          // 부모에는 세로선, 자식에는 관계 타입에 따른 마커
          let sourceMarker = undefined; // markerStart용 - 자식 쪽
          let targetMarker = { type: MarkerType.ArrowClosed, id: 'marker-parent' }; // markerEnd용 (부모)

          if (newType.includes('one-to-many')) {
            sourceMarker = { type: MarkerType.ArrowClosed, id: 'marker-crow-many' }; // N쪽 (자식)
          }
          // 1:1 관계는 자식 쪽에 마커 없음

          return {
            ...edge,
            type: newType,
            markerStart: sourceMarker,
            markerEnd: targetMarker,
          };
        }
        return edge;
      });

      return { edges: updatedEdges };
    });
  },

  setCreateMode: (mode: string | null) => set({ createMode: mode }),
  setSelectMode: (mode: boolean) => set({ selectMode: mode }),
  
  updateNodeData: (nodeId: string, newData: any) => {
    set((state) => {
      const updatedNodes = state.nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, data: newData };
        }
        return node;
      });
      return { nodes: updatedNodes };
    });
  },
}));

export default useStore;
