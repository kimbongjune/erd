import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaUser, FaCaretDown, FaSignInAlt, FaUserPlus, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

interface UserMenuProps {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  onOpenMyPage: () => void;
}

const UserMenuContainer = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #374151;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: #60a5fa;
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  .user-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: white;
    
    img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
  }
  
  .caret {
    font-size: 12px;
    transition: transform 0.2s ease;
    
    &.open {
      transform: rotate(180deg);
    }
  }
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 100;
  min-width: 180px;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.2s ease;
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  color: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  
  &:hover {
    background: #374151;
  }
  
  &:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 8px 8px;
  }
  
  &:only-child {
    border-radius: 8px;
  }
  
  &.danger {
    color: #f87171;
    
    &:hover {
      background: rgba(248, 113, 113, 0.1);
    }
  }
`;

const UserInfo = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #374151;
  
  .display-name {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 2px;
  }
  
  .email {
    font-size: 12px;
    color: #9ca3af;
  }
`;

const UserMenu: React.FC<UserMenuProps> = ({ onOpenLogin, onOpenSignup, onOpenMyPage }) => {
  const { user, logout, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSize, setImageSize] = useState('s96-c');
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // 로딩 중일 때는 스켈레톤 UI 표시
  if (loading) {
    return (
      <UserMenuContainer ref={menuRef}>
        <UserButton disabled>
          <div className="user-avatar" style={{ backgroundColor: '#4a5568', color: '#9ca3af' }}>
            ...
          </div>
          <span style={{ color: '#9ca3af' }}>로딩 중...</span>
        </UserButton>
      </UserMenuContainer>
    );
  }

  if (!user) {
    return (
      <UserMenuContainer ref={menuRef}>
        <UserButton onClick={() => setIsOpen(!isOpen)}>
          <FaUser />
          로그인
          <FaCaretDown className={`caret ${isOpen ? 'open' : ''}`} />
        </UserButton>
        
        <DropdownMenu $isOpen={isOpen}>
          <MenuItem onClick={() => { onOpenLogin(); setIsOpen(false); }}>
            <FaSignInAlt />
            로그인
          </MenuItem>
          <MenuItem onClick={() => { onOpenSignup(); setIsOpen(false); }}>
            <FaUserPlus />
            회원가입
          </MenuItem>
        </DropdownMenu>
      </UserMenuContainer>
    );
  }

  return (
    <UserMenuContainer ref={menuRef}>
      <UserButton onClick={() => setIsOpen(!isOpen)}>
        <div className="user-avatar">
          {user.image && !imageError ? (
            <img 
              src={getModifiedPhotoURL(user.image, imageSize)} 
              alt="프로필" 
              crossOrigin="anonymous"
              onError={handleImageError}
              onLoad={() => setImageError(false)}
            />
          ) : (
            getInitials(user.name || user.email || 'U')
          )}
        </div>
        <span>{user.name || '사용자'}</span>
        <FaCaretDown className={`caret ${isOpen ? 'open' : ''}`} />
      </UserButton>
      
      <DropdownMenu $isOpen={isOpen}>
        <UserInfo>
          <div className="display-name">
            {user.name || '닉네임 없음'}
          </div>
          <div className="email">{user.email}</div>
        </UserInfo>
        
        <MenuItem onClick={() => { onOpenMyPage(); setIsOpen(false); }}>
          <FaUserCircle />
          마이페이지
        </MenuItem>
        
        <MenuItem onClick={handleLogout} className="danger">
          <FaSignInAlt />
          로그아웃
        </MenuItem>
      </DropdownMenu>
    </UserMenuContainer>
  );
};

export default UserMenu;
