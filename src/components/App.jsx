import React, { useEffect, useState } from 'react';
import Dashboard from './Dashboard';
import { LoginPage } from './auth/LoginPage';
import { SignUpPage } from './auth/SignUpPage';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { testConnection } from '../lib/supabase';

/**
 * 認証チェック付きアプリコンポーネント
 */
const AppContent = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  // Supabase接続テスト（起動時に1回だけ実行）
  useEffect(() => {
    testConnection();
  }, []);

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未ログイン → ログイン画面または登録画面を表示
  if (!isAuthenticated) {
    if (showSignUp) {
      return <SignUpPage onSwitchToLogin={() => setShowSignUp(false)} />;
    }
    return <LoginPage onSwitchToSignUp={() => setShowSignUp(true)} />;
  }

  // ログイン済み → ダッシュボードを表示
  return <Dashboard />;
};

/**
 * ルートアプリケーションコンポーネント
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
