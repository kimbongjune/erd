import { useState } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';
import axios from 'axios';

interface DiagramMetadata {
  id: string;
  title: string;
  description: string;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  entityCount: number;
  relationCount: number;
  commentCount: number;
  imageCount: number;
}

interface DiagramData {
  id: string;
  title: string;
  description: string;
  userEmail: string;
  erdData: any;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface FetchDiagramsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface FetchDiagramsResponse {
  diagrams: DiagramMetadata[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const useMongoDBDiagrams = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchDiagrams = async (params: FetchDiagramsParams = {}): Promise<FetchDiagramsResponse> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.search) searchParams.append('search', params.search);
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

      const response = await axios.get(`/api/diagrams?${searchParams.toString()}`);
      
      return response.data;

    } catch (error) {
      console.error('Error fetching diagrams:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDiagram = async (id: string): Promise<DiagramData> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`/api/diagrams/${id}`);
      
      return response.data.diagram;

    } catch (error) {
      console.error('Error fetching diagram:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const saveAsNew = async (
    title: string,
    description: string = '',
    isPublic: boolean = false,
    tags: string[] = [],
    erdData?: any
  ): Promise<{ diagram: DiagramData }> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    // 기본 ERD 데이터 생성
    const defaultErdData = erdData || {
      version: '1.0',
      timestamp: Date.now(),
      nodes: [],
      edges: [],
      nodeColors: {},
      edgeColors: {},
      commentColors: {},
      viewSettings: {
        entityView: 'logical',
        showKeys: true,
        showPhysicalName: true,
        showLogicalName: false,
        showDataType: true,
        showConstraints: false,
        showDefaults: false,
      },
      theme: 'light',
      showGrid: false,
      hiddenEntities: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      viewportRestoreTrigger: Date.now()
    };

    setIsLoading(true);
    try {
      const response = await axios.post('/api/diagrams', {
        title,
        description,
        isPublic,
        tags,
        erdData: defaultErdData
      });

      return response.data;

    } catch (error) {
      console.error('Error creating diagram:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDiagram = async (
    id: string,
    updates: {
      title?: string;
      description?: string;
      isPublic?: boolean;
      tags?: string[];
      erdData?: any;
    }
  ): Promise<{ diagram: DiagramData }> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      const response = await axios.put(`/api/diagrams/${id}`, updates);

      return response.data;

    } catch (error) {
      console.error('Error updating diagram:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDiagram = async (id: string): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      await axios.delete(`/api/diagrams/${id}`);

    } catch (error) {
      console.error('Error deleting diagram:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cloneDiagram = async (
    originalDiagram: any,
    newTitle?: string
  ): Promise<any> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      const clonedData = {
        title: newTitle || `${originalDiagram.title} - 복제`,
        description: originalDiagram.description || '',
        isPublic: false, // 복제본은 기본적으로 비공개
        tags: originalDiagram.tags || [],
        erdData: originalDiagram.erdData
      };

      const response = await axios.post('/api/diagrams', clonedData);
      return response.data;

    } catch (error) {
      console.error('Error cloning diagram:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    fetchDiagrams,
    fetchDiagram,
    saveAsNew,
    updateDiagram,
    deleteDiagram,
    cloneDiagram
  };
};
