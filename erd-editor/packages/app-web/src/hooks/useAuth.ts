import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // 초기 로딩 상태를 더 빠르게 처리하기 위해 즉시 현재 사용자 상태 확인
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  };

  const signInWithGitHub = async () => {
    const result = await signInWithPopup(auth, githubProvider);
    return { success: true, user: result.user };
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      //console.error('로그아웃 실패:', error);
      return { success: false, error: error.message };
    }
  };

  const updateDisplayName = async (displayName: string) => {
    if (!user) return { success: false, error: '사용자가 로그인되지 않았습니다.' };
    
    try {
      await updateProfile(user, { displayName });
      return { success: true };
    } catch (error: any) {
      //console.error('닉네임 업데이트 실패:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteAccount = async () => {
    if (!user) return { success: false, error: '사용자가 로그인되지 않았습니다.' };
    
    try {
      await user.delete();
      return { success: true };
    } catch (error: any) {
      //console.error('계정 삭제 실패:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    loading: loading && !initialized,
    signInWithGoogle,
    signInWithGitHub,
    logout,
    updateDisplayName,
    deleteAccount,
    isAuthenticated: !!user,
    initialized
  };
};
