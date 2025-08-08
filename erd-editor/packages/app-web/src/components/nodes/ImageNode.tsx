import { Handle, Position } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import styled from 'styled-components';
import { useState, useCallback, useRef, useEffect } from 'react';
import { FaImage, FaUpload, FaLink, FaTimes } from 'react-icons/fa';
import { Resizable } from 'react-resizable';
import useStore from '../../store/useStore';
import { HISTORY_ACTIONS } from '../../utils/historyManager';

const NodeContainer = styled.div<{ 
  selected?: boolean; 
  $darkMode?: boolean;
  $hasImage?: boolean;
}>`
  position: relative;
  background: ${props => props.$darkMode ? '#2d3748' : '#ffffff'};
  border: 2px solid ${props => 
    props.selected 
      ? (props.$darkMode ? '#4a90e2' : '#3182ce')
      : (props.$darkMode ? '#4a5568' : '#e2e8f0')
  };
  border-radius: 8px;
  width: 100%;
  height: 100%;
  box-shadow: ${props => 
    props.selected 
      ? (props.$darkMode 
          ? '0 4px 12px rgba(74, 144, 226, 0.3), 0 0 0 2px rgba(74, 144, 226, 0.2)'
          : '0 4px 12px rgba(49, 130, 206, 0.3), 0 0 0 2px rgba(49, 130, 206, 0.2)')
      : '0 2px 8px rgba(0, 0, 0, 0.1)'
  };
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  z-index: 1;
  
  &:hover {
    box-shadow: ${props => 
      props.$darkMode 
        ? '0 3px 10px rgba(74, 144, 226, 0.15)'
        : '0 3px 10px rgba(49, 130, 206, 0.15)'
    };
    border-color: ${props => props.$darkMode ? '#4a90e2' : '#3182ce'};
  }
`;

const ImageDisplay = styled.img<{ $darkMode?: boolean }>`
  width: 100%;
  height: 100%;
  object-fit: fill;
  object-position: center;
  display: block;
  position: relative;
  z-index: 1;
  pointer-events: auto; /* 이미지 클릭 가능하도록 */
`;

const PlaceholderContent = styled.div<{ $darkMode?: boolean }>`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
  font-size: 14px;
  gap: 8px;
  padding: 20px;
  box-sizing: border-box;
  text-align: center;
  
  svg {
    font-size: 32px;
    opacity: 0.6;
  }
`;

const Modal = styled.div<{ $darkMode?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  pointer-events: auto;
`;

const ModalContent = styled.div<{ $darkMode?: boolean }>`
  background: ${props => props.$darkMode ? '#2d3748' : '#ffffff'};
  border-radius: 12px;
  width: 480px;
  min-width: 400px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div<{ $darkMode?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0 24px;
  border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
`;

const ModalTitle = styled.h3<{ $darkMode?: boolean }>`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.$darkMode ? '#e2e8f0' : '#2d3748'};
`;

const CloseButton = styled.button<{ $darkMode?: boolean }>`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 6px;
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$darkMode ? '#4a5568' : '#f7fafc'};
    color: ${props => props.$darkMode ? '#e2e8f0' : '#2d3748'};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const TabContainer = styled.div<{ $darkMode?: boolean }>`
  display: flex;
  border-bottom: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
`;

const Tab = styled.button<{ $active: boolean; $darkMode?: boolean }>`
  flex: 1;
  padding: 16px 24px;
  margin: 0;
  border: none;
  background: ${props => {
    if (props.$active) {
      return props.$darkMode ? '#4a5568' : '#e2e8f0';
    }
    return 'transparent';
  }};
  color: ${props => {
    if (props.$active) {
      return props.$darkMode ? '#e2e8f0' : '#2d3748';
    }
    return props.$darkMode ? '#a0aec0' : '#718096';
  }};
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.$darkMode ? '#4a5568' : '#f1f5f9'};
    color: ${props => props.$darkMode ? '#e2e8f0' : '#2d3748'};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const TabContent = styled.div`
  padding: 24px;
`;

const FileUploadArea = styled.div<{ $darkMode?: boolean; $isDragOver?: boolean }>`
  border: 2px dashed ${props => {
    if (props.$isDragOver) {
      return props.$darkMode ? '#4a90e2' : '#3182ce';
    }
    return props.$darkMode ? '#4a5568' : '#e2e8f0';
  }};
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  background: ${props => {
    if (props.$isDragOver) {
      return props.$darkMode ? 'rgba(74, 144, 226, 0.1)' : 'rgba(49, 130, 206, 0.1)';
    }
    return props.$darkMode ? '#1a202c' : '#f7fafc';
  }};
  color: ${props => props.$darkMode ? '#a0aec0' : '#718096'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.$darkMode ? '#4a90e2' : '#3182ce'};
    background: ${props => props.$darkMode ? 'rgba(74, 144, 226, 0.05)' : 'rgba(49, 130, 206, 0.05)'};
  }
  
  svg {
    font-size: 32px;
    margin-bottom: 12px;
    opacity: 0.6;
  }
`;

const UrlInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Input = styled.input<{ $darkMode?: boolean }>`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${props => props.$darkMode ? '#4a5568' : '#e2e8f0'};
  border-radius: 6px;
  background: ${props => props.$darkMode ? '#1a202c' : '#ffffff'};
  color: ${props => props.$darkMode ? '#e2e8f0' : '#2d3748'};
  font-size: 14px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${props => props.$darkMode ? '#4a90e2' : '#3182ce'};
    box-shadow: 0 0 0 3px ${props => props.$darkMode ? 'rgba(74, 144, 226, 0.1)' : 'rgba(49, 130, 206, 0.1)'};
  }
  
  &::placeholder {
    color: ${props => props.$darkMode ? '#718096' : '#a0aec0'};
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary'; $darkMode?: boolean }>`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  
  ${props => props.$variant === 'primary' ? `
    background: ${props.$darkMode ? '#4a90e2' : '#3182ce'};
    color: white;
    border-color: ${props.$darkMode ? '#4a90e2' : '#3182ce'};
    
    &:hover {
      background: ${props.$darkMode ? '#357abd' : '#2c5aa0'};
      border-color: ${props.$darkMode ? '#357abd' : '#2c5aa0'};
    }
  ` : `
    background: transparent;
    color: ${props.$darkMode ? '#a0aec0' : '#718096'};
    border-color: ${props.$darkMode ? '#4a5568' : '#e2e8f0'};
    
    &:hover {
      background: ${props.$darkMode ? '#4a5568' : '#f7fafc'};
      color: ${props.$darkMode ? '#e2e8f0' : '#2d3748'};
    }
  `}
`;

const ModalErrorMessage = styled.div<{ $darkMode?: boolean }>`
  color: ${props => props.$darkMode ? '#fc8181' : '#e53e3e'};
  font-size: 13px;
  text-align: left;
  margin-top: 4px;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

interface ImageNodeProps {
  data: {
    label?: string;
    imageUrl?: string;
    width?: number;
    height?: number;
  };
  selected?: boolean;
  id: string;
}

const ImageNode = ({ data, selected, id }: ImageNodeProps) => {
  const theme = useStore((state) => state.theme);
  const isDarkMode = theme === 'dark';
  const updateNodeData = useStore((state) => state.updateNodeData);
  const saveHistoryState = useStore((state) => state.saveHistoryState);
  const saveToLocalStorage = useStore((state) => state.saveToLocalStorage);

  const [imageUrl, setImageUrl] = useState(data.imageUrl || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInputValue, setUrlInputValue] = useState('');
  const [modalError, setModalError] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // 디버깅용: modalError 상태 변화 감지
  useEffect(() => {
    console.log('modalError 상태 변화:', modalError);
  }, [modalError]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const resizeTimerRef = useRef<number | null>(null);
  const initialSizeRef = useRef<{ width: number; height: number } | null>(null);

  // data.imageUrl이 변경될 때 local state 동기화 (undo/redo 대응)
  useEffect(() => {
    setImageUrl(data.imageUrl || '');
  }, [data.imageUrl, id]);

  // Shift 키 상태 감지 (종횡비 유지를 위한)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    // 전역 키보드 이벤트 리스너 등록
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 컴포넌트 unmount 시 리사이즈 타이머 정리
  useEffect(() => {
    return () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
    };
  }, []);

  // 이미지 유효성 검증
  const validateImageUrl = useCallback((url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // URL 형식 검증
      try {
        const urlObj = new URL(url);
        // HTTP/HTTPS 프로토콜만 허용
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          resolve(false);
          return;
        }
      } catch {
        resolve(false);
        return;
      }

      const img = new Image();
      
      // CORS 이슈를 피하기 위해 crossOrigin 설정
      img.crossOrigin = 'anonymous';
      
      let timeoutId: number;
      
      img.onload = () => {
        clearTimeout(timeoutId);
        // 실제 이미지인지 확인 (최소 크기 체크)
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve(false);
      };
      
      // 3초 타임아웃
      timeoutId = window.setTimeout(() => {
        resolve(false);
      }, 3000);
      
      img.src = url;
    });
  }, []);

  // 파일을 Base64로 변환
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // ESC 키와 외부 클릭으로 모달 닫기
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        setModalError(''); // ESC로 모달 닫을 때 에러 메시지 초기화
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      // 모달이 열려있고, 클릭된 요소가 모달 외부라면 닫기
      const target = event.target as HTMLElement;
      if (!target.closest('[data-modal-content]') && !target.closest('button')) {
        setIsModalOpen(false);
        setModalError(''); // 모달 닫을 때 에러 메시지 초기화
      }
    };

    // 짧은 지연 후 이벤트 리스너 추가 (모달이 완전히 렌더링된 후)
    const timeoutId = setTimeout(() => {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isModalOpen]);

  // 파일 처리 (업로드 또는 드래그앤드롭)
  const handleFile = useCallback(async (file: File) => {
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      setModalError('이미지 파일만 업로드할 수 있습니다.');
      setTimeout(() => setModalError(''), 3000);
      return;
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setModalError('파일 크기는 5MB 이하여야 합니다.');
      setTimeout(() => setModalError(''), 3000);
      return;
    }

    try {
      setIsImageLoading(true);
      const base64 = await fileToBase64(file);
      
      // 이미지 데이터 업데이트 먼저 실행
      const oldImageUrl = imageUrl;
      setImageUrl(base64);
      updateNodeData(id, { ...data, imageUrl: base64 });
      
      // 업데이트 후 히스토리 저장 (변경된 상태가 반영됨)
      setTimeout(() => {
        saveHistoryState(HISTORY_ACTIONS.CHANGE_IMAGE_SOURCE, {
          nodeId: id,
          oldImageUrl,
          newImageUrl: base64
        });
      }, 50); // 짧은 지연으로 상태 업데이트 완료 보장
      
      setModalError('');
      setIsModalOpen(false);
      
      // 이미지 변경 시 자동저장
      setTimeout(() => {
        saveToLocalStorage(false);
      }, 500);
    } catch (err) {
      setModalError('파일을 읽는 중 오류가 발생했습니다.');
      setTimeout(() => setModalError(''), 3000);
    } finally {
      setIsImageLoading(false);
    }
  }, [id, data, updateNodeData, fileToBase64, imageUrl, saveHistoryState]);

  // 파일 선택 처리
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  // URL 제출 처리
  const handleUrlSubmit = useCallback(async () => {
    const url = urlInputValue.trim();
    
    if (!url) {
      // 빈 URL인 경우 이미지 제거
      const oldImageUrl = imageUrl;
      if (oldImageUrl) {
        // 이미지 데이터 업데이트 먼저 실행
        setImageUrl('');
        updateNodeData(id, { ...data, imageUrl: '' });
        
        // 업데이트 후 히스토리 저장
        setTimeout(() => {
          saveHistoryState(HISTORY_ACTIONS.CHANGE_IMAGE_SOURCE, {
            nodeId: id,
            oldImageUrl,
            newImageUrl: ''
          });
        }, 50);
      } else {
        // 원래 이미지가 없는 경우 히스토리 저장 없이 처리
        setImageUrl('');
        updateNodeData(id, { ...data, imageUrl: '' });
      }
      setIsModalOpen(false);
      
      // 이미지 제거 시 자동저장
      setTimeout(() => {
        saveToLocalStorage(false);
      }, 500);
      return;
    }

    // URL 형식 기본 검증
    try {
      new URL(url);
    } catch {
      setModalError('올바른 URL 형식이 아닙니다.');
      return;
    }

    try {
      setIsImageLoading(true);
      setModalError('이미지를 확인하는 중...');
      
      const isValid = await validateImageUrl(url);
      
      if (isValid) {
        // 이미지 데이터 업데이트 먼저 실행
        const oldImageUrl = imageUrl;
        setImageUrl(url);
        updateNodeData(id, { ...data, imageUrl: url });
        
        // 업데이트 후 히스토리 저장 (변경된 상태가 반영됨)
        setTimeout(() => {
          saveHistoryState(HISTORY_ACTIONS.CHANGE_IMAGE_SOURCE, {
            nodeId: id,
            oldImageUrl,
            newImageUrl: url
          });
        }, 50); // 짧은 지연으로 상태 업데이트 완료 보장
        
        setModalError('');
        setIsModalOpen(false);
        
        // 이미지 URL 변경 시 자동저장
        setTimeout(() => {
          saveToLocalStorage(false);
        }, 500);
      } else {
        setModalError('유효하지 않은 이미지 URL입니다. 이미지 파일을 직접 가리키는 URL을 입력해주세요.');
      }
    } catch (err) {
      setModalError('이미지를 로드할 수 없습니다.');
    } finally {
      setIsImageLoading(false);
    }
  }, [urlInputValue, id, data, updateNodeData, validateImageUrl, imageUrl, saveHistoryState]);

  // 더블클릭 처리 (이미지 설정 모달 열기)
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // 이미지가 있는 경우 URL 입력값 설정
    if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
      setUrlInputValue(imageUrl);
    } else {
      setUrlInputValue('');
    }
    
    // 모달 에러 상태 초기화
    setModalError('');
    setIsModalOpen(true);
  }, [imageUrl, setUrlInputValue, setIsModalOpen]);

  // 이미지 영역 클릭 처리 (모달 열기)
  const handleImageAreaClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
      setUrlInputValue(imageUrl);
    } else {
      setUrlInputValue('');
    }
    setIsModalOpen(true);
  }, [imageUrl]);

  // 리사이즈 debounced 히스토리 저장
  const saveResizeHistory = useCallback((newWidth: number, newHeight: number) => {
    const initialSize = initialSizeRef.current;
    
    if (!initialSize) {
      return;
    }
    
    // 크기가 실제로 변경된 경우에만 히스토리 저장
    if (initialSize.width !== newWidth || initialSize.height !== newHeight) {
      saveHistoryState(HISTORY_ACTIONS.RESIZE_NODE, {
        nodeId: id,
        oldSize: initialSize,
        newSize: { width: newWidth, height: newHeight }
      });
      
      // 리사이즈 완료 시 자동저장
      setTimeout(() => {
        saveToLocalStorage(false);
      }, 500);
    }
    
    // 상태 초기화
    setIsResizing(false);
    
    // 다음 리사이즈를 위해 현재 크기를 초기 크기로 업데이트
    initialSizeRef.current = { width: newWidth, height: newHeight };
  }, [id, saveHistoryState, saveToLocalStorage]);

  // 드래그앤드롭 처리
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <>
      <NodeResizer
        color="#3182ce"
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        keepAspectRatio={isShiftPressed}
        onResize={(event, params) => {
          // 리사이즈 시작 시 초기 크기 저장
          if (!isResizing) {
            setIsResizing(true);
            initialSizeRef.current = { width: data.width || 300, height: data.height || 200 };
          }
          
          // 실시간 UI 업데이트만 (히스토리는 onResizeEnd에서 저장)
          updateNodeData(id, { 
            ...data, 
            width: params.width, 
            height: params.height 
          });
        }}
        onResizeEnd={(event, params) => {
          // 히스토리 저장
          saveResizeHistory(params.width, params.height);
        }}
        handleStyle={{
          width: '8px',
          height: '8px',
          border: '1px solid #3182ce',
          backgroundColor: '#ffffff',
          borderRadius: '1px',
          zIndex: 1000
        }}
      />
      <NodeContainer
        ref={nodeRef}
        selected={selected}
        $darkMode={isDarkMode}
        $hasImage={!!imageUrl}
        onDoubleClick={handleDoubleClick}
      >

        {imageUrl ? (
          <>
            <ImageDisplay 
              src={imageUrl} 
              alt="User uploaded image"
              $darkMode={isDarkMode}
            />
          </>
        ) : (
          <PlaceholderContent 
            $darkMode={isDarkMode}
          >
            <FaImage />
            <div>
              이미지를 추가하려면<br />
              더블클릭하세요
            </div>
          </PlaceholderContent>
        )}

        <HiddenFileInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
        />
        </NodeContainer>

      {isModalOpen && (
        <Modal 
          $darkMode={isDarkMode}
          onClick={() => {
            setIsModalOpen(false);
            setModalError(''); // 배경 클릭으로 모달 닫을 때 에러 메시지 초기화
          }}
        >
          <ModalContent 
            $darkMode={isDarkMode} 
            data-modal-content
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <ModalHeader $darkMode={isDarkMode}>
              <ModalTitle $darkMode={isDarkMode}>이미지 추가</ModalTitle>
              <CloseButton $darkMode={isDarkMode} onClick={() => {
                setIsModalOpen(false);
                setModalError(''); // X 버튼으로 모달 닫을 때 에러 메시지 초기화
              }}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>

            <TabContainer $darkMode={isDarkMode}>
              <Tab
                $active={activeTab === 'upload'}
                $darkMode={isDarkMode}
                onClick={() => {
                  setActiveTab('upload');
                  setModalError(''); // 탭 변경 시 에러 메시지 초기화
                }}
              >
                <FaUpload />
                파일 업로드
              </Tab>
              <Tab
                $active={activeTab === 'url'}
                $darkMode={isDarkMode}
                onClick={() => {
                  setActiveTab('url');
                  setModalError(''); // 탭 변경 시 에러 메시지 초기화
                }}
              >
                <FaLink />
                URL 입력
              </Tab>
            </TabContainer>

            <TabContent>
              {activeTab === 'upload' ? (
                <FileUploadArea
                  $darkMode={isDarkMode}
                  $isDragOver={isDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <FaUpload />
                  <div>
                    <strong>클릭하여 파일 선택</strong> 또는 드래그앤드롭
                  </div>
                  <small>이미지 파일만 지원 (최대 5MB)</small>
                  {modalError && (
                    <ModalErrorMessage $darkMode={isDarkMode}>
                      {modalError}
                    </ModalErrorMessage>
                  )}
                </FileUploadArea>
              ) : (
                <UrlInputContainer>
                  <Input
                    $darkMode={isDarkMode}
                    type="text"
                    placeholder="이미지 URL을 입력하세요..."
                    value={urlInputValue}
                    onChange={(e) => setUrlInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleUrlSubmit();
                      }
                    }}
                    autoComplete="off"
                    required={false}
                    pattern=""
                    title=""
                    data-form-type="other"
                  />
                  {modalError && (
                    <ModalErrorMessage $darkMode={isDarkMode}>
                      {modalError}
                    </ModalErrorMessage>
                  )}
                  <ButtonContainer>
                    <Button $variant="primary" $darkMode={isDarkMode} onClick={handleUrlSubmit}>
                      적용
                    </Button>
                  </ButtonContainer>
                </UrlInputContainer>
              )}
            </TabContent>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

ImageNode.displayName = 'ImageNode';

export default ImageNode;
