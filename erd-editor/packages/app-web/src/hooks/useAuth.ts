import { useSession, signIn, signOut } from 'next-auth/react';

export const useAuth = () => {
  const { data: session, status, update } = useSession();

  const signInWithGoogle = async () => {
    await signIn('google');
    return { success: true };
  };

  const signInWithGitHub = async () => {
    await signIn('github');
    return { success: true };
  };

  const logout = async () => {
    await signOut();
    return { success: true };
  };

  const updateDisplayName = async (displayName: string) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: displayName }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || '이름 변경에 실패했습니다.' };
      }

      const result = await response.json();
      
      // 세션 강제 업데이트
      await update({
        name: result.user.name,
        image: result.user.image
      });
      
      return { success: true };
    } catch (error) {
      console.error('이름 변경 오류:', error);
      return { success: false, error: '이름 변경 중 오류가 발생했습니다.' };
    }
  };

  const updateProfileImage = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || '프로필 이미지 변경에 실패했습니다.' };
      }

      const result = await response.json();
      
      // 세션 강제 업데이트
      await update({
        name: result.user.name,
        image: result.user.image
      });
      
      return { success: true };
    } catch (error) {
      console.error('프로필 이미지 변경 오류:', error);
      return { success: false, error: '프로필 이미지 변경 중 오류가 발생했습니다.' };
    }
  };

  const deleteAccount = async () => {
    // TODO: 계정 삭제 API 구현 필요
    return { success: false, error: '계정 삭제 기능은 아직 구현되지 않았습니다.' };
  };

  return {
    user: session?.user || null,
    loading: status === 'loading',
    signInWithGoogle,
    signInWithGitHub,
    logout,
    updateDisplayName,
    updateProfileImage,
    deleteAccount,
    isAuthenticated: !!session?.user,
    initialized: status !== 'loading'
  };
};
