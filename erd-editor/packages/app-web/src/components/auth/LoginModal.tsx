import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaGoogle, FaGithub, FaTimes, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
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
  max-width: 400px;
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

const LoginButton = styled.button<{ $provider: 'google' | 'github' }>`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #374151;
  border-radius: 8px;
  background: ${props => props.$provider === 'google' ? '#4285f4' : '#24292e'};
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.2s ease;
  margin-bottom: 12px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .icon {
    font-size: 18px;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: #9ca3af;
  font-size: 14px;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #374151;
  }
  
  span {
    padding: 0 16px;
  }
`;

const SwitchText = styled.p`
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  margin: 24px 0 0 0;
  
  .switch-link {
    color: #60a5fa;
    cursor: pointer;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
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

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToSignup }) => {
  const { signInWithGoogle, signInWithGitHub } = useAuth();
  const [loading, setLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState<string>('');

  // 팝업이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setLoading(null);
      setError('');
    }
  }, [isOpen]);

  // 팝업 닫기 함수 래핑
  const handleClose = () => {
    setLoading(null);
    setError('');
    onClose();
  };

  const handleGoogleLogin = async () => {
    setLoading('google');
    setError('');
    
    try {
      await signInWithGoogle();
      handleClose();
    } catch (error: any) {
      setError('로그인에 실패했습니다.');
      setLoading(null);
    }
  };

  const handleGitHubLogin = async () => {
    setLoading('github');
    setError('');
    
    try {
      await signInWithGitHub();
      handleClose();
    } catch (error: any) {
      setError('로그인에 실패했습니다.');
      setLoading(null);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>로그인</h2>
          <button className="close-button" onClick={handleClose}>
            <FaTimes />
          </button>
        </ModalHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <LoginButton 
          $provider="google" 
          onClick={handleGoogleLogin}
          disabled={loading !== null}
        >
          {loading === 'google' ? (
            <FaSpinner className="icon" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <FaGoogle className="icon" />
          )}
          Google로 로그인
        </LoginButton>

        <LoginButton 
          $provider="github" 
          onClick={handleGitHubLogin}
          disabled={loading !== null}
        >
          {loading === 'github' ? (
            <FaSpinner className="icon" style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <FaGithub className="icon" />
          )}
          GitHub로 로그인
        </LoginButton>

        <Divider>
          <span>또는</span>
        </Divider>

        <SwitchText>
          계정이 없으신가요?{' '}
          <span className="switch-link" onClick={onSwitchToSignup}>
            회원가입
          </span>
        </SwitchText>
      </ModalContent>
    </ModalOverlay>
  );
};

export default LoginModal;
