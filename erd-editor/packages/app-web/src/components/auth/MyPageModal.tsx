import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaUser, FaEdit, FaTrash, FaSpinner, FaSignOutAlt, FaCamera } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';

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
  const { user, updateDisplayName, deleteAccount, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSize, setImageSize] = useState('s96-c');

  // 이미지 URL에서 크기 부분을 변경하는 함수
  const getModifiedPhotoURL = (originalURL: string, size: string) => {
    if (!originalURL) return originalURL;
    // Google 프로필 이미지 URL에서 크기 부분 변경
    return originalURL.replace(/=s\d+(-c)?$/, `=${size}`);
  };

  // 이미지 로딩 실패 시 다른 크기로 시도
  const handleImageError = () => {
    if (imageSize === 's96-c') {
      setImageSize('s128-c');
    } else if (imageSize === 's128-c') {
      setImageSize('s64-c');
    } else {
      setImageError(true);
    }
  };

  // 모달이 닫힐 때 편집 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setDisplayName(user?.displayName || '');
      setError('');
      setSuccess('');
    }
  }, [isOpen, user?.displayName]);

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
    
    const result = await logout();
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error || '로그아웃에 실패했습니다.');
    }
    
    setLoading(false);
  };

      const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 이미지를 Base64로 변환 (더 작은 크기로)
      const base64String = await compressImageToBase64(file, 80, 0.5); // 80x80, 품질 0.5

      if (!user) {
        setError('사용자 정보를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      // Firebase Auth 프로필 업데이트
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(user, {
        photoURL: base64String
      });

      setSuccess('프로필 사진이 성공적으로 업데이트되었습니다!');
      setTimeout(() => setSuccess(''), 3000);

      // 입력 필드 초기화
      event.target.value = '';
      setLoading(false);

    } catch (error: any) {
      console.error('Profile image upload error:', error);

      if (error.message?.includes('too long') || error.code === 'auth/invalid-profile-attribute') {
        setError('이미지가 너무 큽니다. 더 작은 이미지를 선택해주세요.');
      } else {
        setError('프로필 사진 업로드에 실패했습니다. 다시 시도해주세요.');
      }
      setLoading(false);
    }
  };

  // 이미지 압축 함수 (Base64 반환, 더 작은 크기)
  const compressImageToBase64 = (file: File, maxSize: number = 80, quality: number = 0.5): Promise<string> => {
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
            <UserAvatar onClick={() => document.getElementById('profile-upload')?.click()}>
              <div className="avatar-container">
                {user.photoURL && !imageError ? (
                  <img 
                    src={getModifiedPhotoURL(user.photoURL, imageSize)} 
                    alt="프로필" 
                    crossOrigin="anonymous"
                    onError={handleImageError}
                    onLoad={() => setImageError(false)}
                  />
                ) : (
                  <FaUser />
                )}
                <div className="avatar-overlay">
                  <FaCamera />
                </div>
              </div>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleProfileImageUpload}
                style={{ display: 'none' }}
              />
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
                  user.displayName || '닉네임 없음'
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
                  setDisplayName(user.displayName || '');
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
