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
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
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

      let sourceMarker = { type: MarkerType.ArrowClosed, id: 'marker-one' };
      let targetMarker = { type: MarkerType.ArrowClosed, id: 'marker-one' };

      // Determine markers based on connectionMode
      if (state.connectionMode?.includes('oneToMany')) {
        targetMarker = { type: MarkerType.ArrowClosed, id: 'marker-crow-many' };
      } else if (state.connectionMode?.includes('oneToOne')) {
        // Default to one-to-one markers (already set as marker-one)
      }

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
          sourceHandle: sourceX < targetX ? 'right' : 'left',
          targetHandle: sourceX < targetX ? 'left' : 'right',
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
    set({ connectingNodeId: null, connectionMode: null });
  },
  cancelConnection: () => {
    set({ connectingNodeId: null, connectionMode: null });
  },
  updateSelectedEdgeType: (newType: string) => {
    set((state) => {
      if (!state.selectedEdgeId) return state;
      
      const updatedEdges = state.edges.map(edge => {
        if (edge.id === state.selectedEdgeId) {
          // Update markers based on new type
          let sourceMarker = { type: MarkerType.ArrowClosed, id: 'marker-one' };
          let targetMarker = { type: MarkerType.ArrowClosed, id: 'marker-one' };

          if (newType.includes('one-to-many')) {
            targetMarker = { type: MarkerType.ArrowClosed, id: 'marker-crow-many' };
          }

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
}));

export default useStore;
