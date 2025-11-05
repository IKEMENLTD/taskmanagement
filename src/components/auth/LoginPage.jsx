import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { signIn } from '../../utils/authUtils';

/**
 * ログイン画面コンポーネント
 */
export const LoginPage = ({ onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * ログイン処理
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 入力チェック
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      setLoading(false);
      return;
    }

    // ログイン実行
    const { error: loginError } = await signIn(email, password);

    if (loginError) {
      setError(loginError.message || 'ログインに失敗しました');
      setLoading(false);
    } else {
      // ログイン成功（認証状態が変わるので自動的にダッシュボードに遷移）
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ログイン
          </h1>
          <p className="text-gray-600">
            4次元プロジェクト管理システム
          </p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* ログインフォーム */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* メールアドレス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={loading}
              />
            </div>
          </div>

          {/* パスワード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={loading}
              />
            </div>
          </div>

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ログイン中...
              </span>
            ) : (
              'ログイン'
            )}
          </button>
        </form>

        {/* ユーザー登録リンク */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            アカウントをお持ちでない方は
          </p>
          <button
            onClick={onSwitchToSignUp}
            className="mt-2 text-blue-600 font-semibold hover:text-blue-700 transition"
          >
            新規登録はこちら
          </button>
        </div>
      </div>
    </div>
  );
};
