import { useSession, signIn, signOut } from 'next-auth/react';
import axios from 'axios';

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
      const response = await axios.put('/api/user/profile', { name: displayName });
      
      // 세션 강제 업데이트
      await update({
        name: response.data.user.name,
        image: response.data.user.image
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('이름 변경 오류:', error);
      return { success: false, error: error.response?.data?.error || '이름 변경에 실패했습니다.' };
    }
  };

  const updateProfileImage = async (imageUrl: string) => {
    try {
      const response = await axios.put('/api/user/profile', { image: imageUrl });
      
      // 세션 강제 업데이트
      await update({
        name: response.data.user.name,
        image: response.data.user.image
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('프로필 이미지 변경 오류:', error);
      return { success: false, error: error.response?.data?.error || '프로필 이미지 변경에 실패했습니다.' };
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
