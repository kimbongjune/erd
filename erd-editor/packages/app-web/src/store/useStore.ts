import { create } from 'zustand';
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges, addEdge, Connection, NodeChange, MarkerType } from 'reactflow';

type RFState = {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isBottomPanelOpen: boolean;
  connectionMode: string | null;
  connectingNodeId: string | null;
  
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  addNode: (type: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setBottomPanelOpen: (isOpen: boolean) => void;
  deleteNode: (id: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onConnect: (connection: Connection) => void;
  setConnectionMode: (mode: string | null) => void;
  setConnectingNodeId: (id: string | null) => void;
  finishConnection: (targetNodeId: string | null) => void;
  cancelConnection: () => void;
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
  edges: [{
    id: 'e1-2',
    source: '1',
    target: '2',
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'one-to-many-non-identifying', // Example type
    markerStart: { type: MarkerType.Custom, id: 'marker-one' },
    markerEnd: { type: MarkerType.Custom, id: 'marker-crow-many' },
  }],
  selectedNodeId: null,
  isBottomPanelOpen: false,
  connectionMode: null,
  connectingNodeId: null,
  
  onNodesChange: (changes: NodeChange[]) => {
    set((state) => {
      const updatedNodes = applyNodeChanges(changes, state.nodes);
      let updatedEdges = state.edges;

      const positionChange = changes.find((change) => change.type === 'position');

      if (positionChange && positionChange.type === 'position') {
        const changedNodeId = positionChange.id;
        updatedEdges = state.edges.map(edge => {
          if (edge.source === changedNodeId || edge.target === changedNodeId) {
            const sourceNode = updatedNodes.find(n => n.id === edge.source);
            const targetNode = updatedNodes.find(n => n.id === edge.target);

            if (sourceNode && targetNode) {
              const sourceX = sourceNode.position.x + (sourceNode.width ?? 0) / 2;
              const targetX = targetNode.position.x + (targetNode.width ?? 0) / 2;

              return {
                ...edge,
                sourceHandle: sourceX < targetX ? 'right' : 'left',
                targetHandle: sourceX < targetX ? 'left' : 'right',
              };
            }
          }
          return edge;
        });
      }

      return { nodes: updatedNodes, edges: updatedEdges };
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

      let sourceMarker = { type: MarkerType.Custom, id: 'marker-one' };
      let targetMarker = { type: MarkerType.Custom, id: 'marker-one' };

      // Determine markers based on connectionMode
      if (state.connectionMode?.includes('one-to-many')) {
        targetMarker = { type: MarkerType.Custom, id: 'marker-crow-many' };
      } else if (state.connectionMode?.includes('one-to-one')) {
        // Default to one-to-one markers (already set as marker-one)
      }

      if (sourceNode && targetNode && sourceNode.type === 'entity' && targetNode.type === 'entity') {
        const sourcePkColumn = sourceNode.data.columns?.find((col) => col.pk);

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

      const sourceX = sourceNode.position.x + (sourceNode.width ?? 0) / 2;
      const targetX = targetNode.position.x + (targetNode.width ?? 0) / 2;

      const newEdge = {
        ...connection,
        sourceHandle: sourceX < targetX ? 'right' : 'left',
        targetHandle: sourceX < targetX ? 'left' : 'right',
        type: state.connectionMode || 'one-to-many-non-identifying', // Default type
        markerStart: sourceMarker,
        markerEnd: targetMarker,
      };
      const updatedEdges = addEdge(newEdge, state.edges);

      console.log('[Store] New Edge created:', newEdge);

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
      });
    }
    set({ connectingNodeId: null, connectionMode: null });
  },
  cancelConnection: () => {
    set({ connectingNodeId: null, connectionMode: null });
  },
}));

export default useStore;
