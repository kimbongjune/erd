import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { FaTimes, FaUser, FaEdit, FaTrash, FaSpinner, FaSignOutAlt, FaCamera } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { normalizeGoogleImageUrl, hasImageFailed, recordImageFailure, recordImageSuccess } from '../../utils/imageCache';

interface MyPageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: #1f2937;
  border-radius: 16px;
  padding: 32px;
  width: 90%;
  max-width: 500px;
  border: 1px solid #374151;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h2 {
    margin: 0;
    color: #ffffff;
    font-size: 24px;
    font-weight: 600;
  }
  
  .close-button {
    background: none;
    border: none;
    color: #9ca3af;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    
    &:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid #374151;
`;

const UserAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .avatar-container {
    position: relative;
    width: 100%;
    height: 100%;
    
    .avatar-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 50%;
      cursor: pointer;
      
      &:hover {
        opacity: 1;
      }
      
      .upload-button {
        color: white;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px;
        border-radius: 50%;
        transition: background-color 0.3s ease;
        
        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }
  }
`;

const UserDetails = styled.div`
  flex: 1;
  
  .display-name {
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 4px;
  }
  
  .email {
    font-size: 14px;
    color: #9ca3af;
  }
`;

const EditButton = styled.button`
  background: none;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(96, 165, 250, 0.1);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  
  label {
    display: block;
    margin-bottom: 8px;
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
  }
  
  input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #374151;
    border-radius: 8px;
    color: #ffffff;
    font-size: 16px;
    transition: all 0.2s ease;
    box-sizing: border-box;
    
    &:focus {
      outline: none;
      border-color: #4f46e5;
      background: rgba(255, 255, 255, 0.08);
    }
    
    &::placeholder {
      color: #9ca3af;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'danger' | 'secondary' }>`
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #4f46e5;
          color: white;
          
          &:hover {
            background: #4338ca;
          }
          
          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `;
      case 'danger':
        return `
          background: #dc2626;
          color: white;
          
          &:hover {
            background: #b91c1c;
          }
          
          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `;
      case 'secondary':
        return `
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `;
    }
  }}
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  color: #f87171;
  font-size: 14px;
`;

const SuccessMessage = styled.div`
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  color: #22c55e;
  font-size: 14px;
`;

const DeleteConfirmModal = styled.div<{ $show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.$show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1100;
  backdrop-filter: blur(4px);
`;

const DeleteConfirmContent = styled.div`
  background: #1f2937;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  border: 1px solid #374151;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  
  h3 {
    margin: 0 0 16px 0;
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
  }
  
  p {
    margin: 0 0 24px 0;
    color: #9ca3af;
    line-height: 1.5;
  }
`;

const MyPageModal: React.FC<MyPageModalProps> = ({ isOpen, onClose }) => {
  const { user, updateDisplayName, updateProfileImage, deleteAccount, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // 프로필 이미지 URL 메모이제이션 및 캐싱
  const profileImageUrl = useMemo(() => {
    if (!user?.image || imageError) return null;
    
    // 이미지 URL 정규화
    const url = normalizeGoogleImageUrl(user.image);
    
    // Google 이미지가 아니거나 base64 이미지인 경우 캐시 로직 건너뛰기
    if (url.startsWith('data:image/') || !url.includes('googleusercontent.com')) {
      return url;
    }
    
    // 이전에 실패한 URL이라면 null 반환
    if (hasImageFailed(url)) {
      return null;
    }
    
    return url;
  }, [user?.image, imageError]);

  // 이미지 로딩 실패 시 처리 (재시도 방지)
  const handleImageError = useCallback(() => {
    if (profileImageUrl && profileImageUrl.includes('googleusercontent.com')) {
      recordImageFailure(profileImageUrl);
    }
    
    setRetryCount(prev => prev + 1);
    
    // Google 이미지가 아닌 경우나 base64 이미지인 경우 바로 에러 처리
    if (!profileImageUrl || !profileImageUrl.includes('googleusercontent.com')) {
      setImageError(true);
      return;
    }
    
    // 최대 1번만 재시도하고 그 이후엔 기본 아바타 사용
    if (retryCount < 1) {
      // 짧은 지연 후 재시도 (rate limit 회피)
      setTimeout(() => {
        setImageError(false);
      }, 2000);
    } else {
      setImageError(true);
    }
  }, [retryCount, profileImageUrl]);

  // 이미지 로딩 성공 시 처리
  const handleImageLoad = useCallback(() => {
    if (profileImageUrl && profileImageUrl.includes('googleusercontent.com')) {
      recordImageSuccess(profileImageUrl);
    }
    setImageError(false);
    setRetryCount(0);
  }, [profileImageUrl]);

  // 모달이 닫힐 때 편집 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setDisplayName(user?.name || '');
      setError('');
      setSuccess('');
    }
  }, [isOpen, user?.name]);

  // 사용자 정보가 업데이트될 때 displayName 상태도 업데이트
  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user?.name]);

  // 사용자 이미지가 변경될 때 이미지 에러 상태 리셋
  useEffect(() => {
    if (user?.image) {
      setImageError(false);
      setRetryCount(0);
    }
  }, [user?.image]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await updateDisplayName(displayName.trim());

    if (result.success) {
      setSuccess('닉네임이 성공적으로 업데이트되었습니다.');
      setIsEditing(false);
    } else {
      setError(result.error || '닉네임 업데이트에 실패했습니다.');
    }

    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError('');

    const result = await deleteAccount();

    if (result.success) {
      onClose();
    } else {
      setError(result.error || '계정 삭제에 실패했습니다.');
    }

    setLoading(false);
    setShowDeleteConfirm(false);
  };

  const handleLogout = async () => {
    setLoading(true);
    
    try {
      const result = await logout();
      
      if (result.success) {
        onClose();
      }
    } catch (error) {
      setError('로그아웃에 실패했습니다.');
    }
    
    setLoading(false);
  };

      const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 일단 프로필 이미지 업로드 비활성화
    setError('프로필 이미지 업로드는 현재 지원하지 않습니다.');
    return;
  };

  // 이미지 압축 함수 (Base64 반환)
  const compressImageToBase64 = (file: File, maxSize: number = 100, quality: number = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          let { width, height } = img;

          // 비율 유지하면서 최대 크기에 맞춤
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          // 낮은 품질로 압축
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };

        img.onerror = () => reject(new Error('이미지 로드 실패'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsDataURL(file);
    });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!user) return null;

  return (
    <>
      <ModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <h2>마이페이지</h2>
            <button className="close-button" onClick={onClose}>
              <FaTimes />
            </button>
          </ModalHeader>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <UserInfo>
            <UserAvatar>
              <div className="avatar-container">
                {profileImageUrl && !imageError ? (
                  <img 
                    src={profileImageUrl} 
                    alt="프로필" 
                    crossOrigin="anonymous"
                    loading="lazy"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                  />
                ) : (
                  <FaUser />
                )}
              </div>
            </UserAvatar>
            <UserDetails>
              <div className="display-name">
                {isEditing ? (
                  <FormGroup>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="닉네임을 입력하세요"
                      maxLength={20}
                    />
                  </FormGroup>
                ) : (
                  user.name || '닉네임 없음'
                )}
              </div>
              <div className="email">{user.email}</div>
            </UserDetails>
            {!isEditing && (
              <EditButton onClick={() => setIsEditing(true)}>
                <FaEdit />
              </EditButton>
            )}
          </UserInfo>

          {isEditing && (
            <ButtonGroup>
              <ActionButton
                $variant="primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : null}
                저장
              </ActionButton>
              <ActionButton
                $variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setDisplayName(user?.name || '');
                  setError('');
                }}
                disabled={loading}
              >
                취소
              </ActionButton>
            </ButtonGroup>
          )}

          {!isEditing && (
            <ButtonGroup>
              <ActionButton
                $variant="secondary"
                onClick={handleLogout}
                disabled={loading}
              >
                {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaSignOutAlt />}
                로그아웃
              </ActionButton>
              <ActionButton
                $variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                <FaTrash />
                회원탈퇴
              </ActionButton>
            </ButtonGroup>
          )}
        </ModalContent>
      </ModalOverlay>

      {/* 회원탈퇴 확인 모달 */}
      <DeleteConfirmModal $show={showDeleteConfirm}>
        <DeleteConfirmContent>
          <h3>회원탈퇴</h3>
          <p>
            정말로 계정을 삭제하시겠습니까?<br/>
            이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.
          </p>
          <ButtonGroup>
            <ActionButton
              $variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={loading}
            >
              취소
            </ActionButton>
            <ActionButton
              $variant="danger"
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaTrash />}
              삭제
            </ActionButton>
          </ButtonGroup>
        </DeleteConfirmContent>
      </DeleteConfirmModal>
    </>
  );
};

export default MyPageModal;
