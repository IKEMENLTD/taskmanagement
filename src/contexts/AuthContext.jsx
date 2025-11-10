import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChange, getCurrentUser } from '../utils/authUtils';
import { getUserTheme, applyThemeColors } from '../utils/themeUtils';

/**
 * 認証コンテキスト
 */
const AuthContext = createContext({});

/**
 * 認証コンテキストを使用するカスタムフック
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * 認証プロバイダーコンポーネント
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [theme, setTheme] = useState('default');
  const [loading, setLoading] = useState(true);

  // ユーザーのテーマを取得して適用
  const fetchUserTheme = async (userId) => {
    if (!userId) {
      setTheme('default');
      applyThemeColors('default');
      return;
    }

    const userTheme = await getUserTheme(userId);
    setTheme(userTheme);
    applyThemeColors(userTheme);
    console.log('🎨 ユーザーテーマ:', userTheme);
  };

  // 初回読み込み時に認証状態を確認
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔐 認証状態を確認中...');
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        console.log('✅ ログイン済み:', currentUser.email);
        await fetchUserTheme(currentUser.id);
      } else {
        console.log('⚠️ 未ログイン');
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // 認証状態の変化を監視
  useEffect(() => {
    console.log('👀 認証状態の監視を開始');

    const unsubscribe = onAuthStateChange(async (event, newSession) => {
      console.log('🔄 認証イベント:', event);

      if (event === 'SIGNED_IN') {
        console.log('✅ ログインしました:', newSession?.user?.email);
        setUser(newSession?.user || null);
        setSession(newSession);

        // テーマを取得
        if (newSession?.user) {
          await fetchUserTheme(newSession.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 ログアウトしました');
        setUser(null);
        setSession(null);
        setTheme('default');
        applyThemeColors('default');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 トークンを更新しました');
        setSession(newSession);
      } else if (event === 'USER_UPDATED') {
        console.log('🔄 ユーザー情報を更新しました');
        setUser(newSession?.user || null);
      }
    });

    // クリーンアップ
    return () => {
      console.log('🛑 認証状態の監視を停止');
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    theme,
    setTheme: (newTheme) => {
      setTheme(newTheme);
      applyThemeColors(newTheme);
    },
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
