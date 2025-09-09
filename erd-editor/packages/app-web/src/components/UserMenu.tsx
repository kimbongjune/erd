import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { FaUser, FaCaretDown, FaSignInAlt, FaUserPlus, FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { normalizeGoogleImageUrl, hasImageFailed, recordImageFailure, recordImageSuccess } from '../utils/imageCache';

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
  const [retryCount, setRetryCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // 이미지 URL 메모이제이션 및 캐싱
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

  // 이미지 로딩 성공 시 재시도 카운터 리셋
  const handleImageLoad = useCallback(() => {
    if (profileImageUrl && profileImageUrl.includes('googleusercontent.com')) {
      recordImageSuccess(profileImageUrl);
    }
    setImageError(false);
    setRetryCount(0);
  }, [profileImageUrl]);

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

export default React.memo(UserMenu);
