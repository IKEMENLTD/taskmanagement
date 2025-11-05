import { supabase } from '../lib/supabase';

/**
 * 認証ユーティリティ関数
 *
 * Supabase Authを使用したユーザー認証機能
 */

/**
 * メールアドレスとパスワードでユーザー登録
 * @param {string} email - メールアドレス
 * @param {string} password - パスワード
 * @param {object} metadata - ユーザーのメタデータ（名前など）
 */
export const signUp = async (email, password, metadata = {}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata // 名前などの追加情報
      }
    });

    if (error) throw error;

    console.log('✅ ユーザー登録成功:', data.user?.email);
    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('❌ ユーザー登録エラー:', error.message);
    return { user: null, session: null, error };
  }
};

/**
 * メールアドレスとパスワードでログイン
 * @param {string} email - メールアドレス
 * @param {string} password - パスワード
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    console.log('✅ ログイン成功:', data.user?.email);
    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('❌ ログインエラー:', error.message);
    return { user: null, session: null, error };
  }
};

/**
 * ログアウト
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    console.log('✅ ログアウト成功');
    return { error: null };
  } catch (error) {
    console.error('❌ ログアウトエラー:', error.message);
    return { error };
  }
};

/**
 * 現在のユーザー情報を取得
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;

    return { user, error: null };
  } catch (error) {
    console.error('❌ ユーザー情報取得エラー:', error.message);
    return { user: null, error };
  }
};

/**
 * 現在のセッション情報を取得
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;

    return { session, error: null };
  } catch (error) {
    console.error('❌ セッション情報取得エラー:', error.message);
    return { session: null, error };
  }
};

/**
 * パスワードリセットメールを送信
 * @param {string} email - メールアドレス
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) throw error;

    console.log('✅ パスワードリセットメール送信成功');
    return { error: null };
  } catch (error) {
    console.error('❌ パスワードリセットエラー:', error.message);
    return { error };
  }
};

/**
 * パスワードを更新
 * @param {string} newPassword - 新しいパスワード
 */
export const updatePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    console.log('✅ パスワード更新成功');
    return { error: null };
  } catch (error) {
    console.error('❌ パスワード更新エラー:', error.message);
    return { error };
  }
};

/**
 * ユーザー情報を更新
 * @param {object} updates - 更新内容
 */
export const updateUserMetadata = async (updates) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });

    if (error) throw error;

    console.log('✅ ユーザー情報更新成功');
    return { user: data.user, error: null };
  } catch (error) {
    console.error('❌ ユーザー情報更新エラー:', error.message);
    return { user: null, error };
  }
};

/**
 * 認証状態の変化を監視
 * @param {Function} callback - 認証状態が変化した時に呼ばれる関数
 */
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('🔄 認証状態変化:', event, session?.user?.email);
      callback(event, session);
    }
  );

  // 監視を停止する関数を返す
  return () => {
    subscription?.unsubscribe();
  };
};
