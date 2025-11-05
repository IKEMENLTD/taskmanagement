import React, { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import { testConnection } from './lib/supabase';

/**
 * アプリケーションのルートコンポーネント
 */
function App() {
  const [connectionStatus, setConnectionStatus] = useState('🔄 Supabase接続テスト中...');
  const [showDashboard, setShowDashboard] = useState(false);

  // Supabase接続テスト
  useEffect(() => {
    console.log('=== Supabase接続テスト開始 ===');
    alert('接続テスト開始します！');

    const runTest = async () => {
      const result = await testConnection();
      if (result) {
        setConnectionStatus('✅ Supabase接続成功！');
        console.log('✅ 接続成功');
        alert('✅ Supabase接続成功！');
        // 3秒後にダッシュボードを表示
        setTimeout(() => setShowDashboard(true), 3000);
      } else {
        setConnectionStatus('❌ Supabase接続失敗');
        console.log('❌ 接続失敗');
        alert('❌ Supabase接続失敗');
      }
    };
    runTest();
  }, []);

  // テスト中の画面を表示
  if (!showDashboard) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1f2937',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        {connectionStatus}
      </div>
    );
  }

  return <Dashboard />;
}

export default App;
