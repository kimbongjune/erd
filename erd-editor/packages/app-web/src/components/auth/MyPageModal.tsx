import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes, FaUser, FaEdit, FaTrash, FaSpinner, FaSignOutAlt } from 'react-icons/fa';
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
  
  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
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
