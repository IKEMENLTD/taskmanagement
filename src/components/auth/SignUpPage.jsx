import React, { useState } from 'react';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { signUp } from '../../utils/authUtils';

/**
 * ユーザー登録画面コンポーネント
 */
export const SignUpPage = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /**
   * ユーザー登録処理
   */
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 入力チェック
    if (!name || !email || !password || !confirmPassword) {
      setError('すべての項目を入力してください');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      setLoading(false);
      return;
    }

    // ユーザー登録実行
    const { error: signUpError } = await signUp(email, password, {
      full_name: name
    });

    if (signUpError) {
      setError(signUpError.message || '登録に失敗しました');
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // 2秒後にログイン画面に戻る
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
    }
  };

  // 登録成功画面
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 via-blue-500 to-purple-500">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            登録完了！
          </h2>
          <p className="text-gray-600 mb-4">
            ユーザー登録が完了しました。<br />
            ログイン画面に移動します...
          </p>
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 via-blue-500 to-purple-500">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            新規登録
          </h1>
          <p className="text-gray-600">
            アカウントを作成
          </p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* 登録フォーム */}
        <form onSubmit={handleSignUp} className="space-y-5">
          {/* 名前 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              名前
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田 太郎"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                disabled={loading}
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
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
                placeholder="6文字以上"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                disabled={loading}
              />
            </div>
          </div>

          {/* パスワード確認 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード（確認）
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="もう一度入力"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                disabled={loading}
              />
            </div>
          </div>

          {/* 登録ボタン */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                登録中...
              </span>
            ) : (
              '登録する'
            )}
          </button>
        </form>

        {/* ログインリンク */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            既にアカウントをお持ちの方は
          </p>
          <button
            onClick={onSwitchToLogin}
            className="mt-2 text-green-600 font-semibold hover:text-green-700 transition"
          >
            ログインはこちら
          </button>
        </div>
      </div>
    </div>
  );
};
