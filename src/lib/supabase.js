import { createClient } from '@supabase/supabase-js';

/**
 * Supabaseクライアントの初期化
 *
 * 環境変数から接続情報を取得してSupabaseクライアントを作成します
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase接続情報が見つかりません');
  console.error('📝 .envファイルに以下を設定してください：');
  console.error('   VITE_SUPABASE_URL=your-project-url');
  console.error('   VITE_SUPABASE_ANON_KEY=your-anon-key');
}

/**
 * Supabaseクライアント
 * データベース操作や認証に使用します
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  }
});

/**
 * 接続テスト用関数
 * データベースに正常に接続できるかを確認します
 */
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Supabase接続エラー:', error.message);
      return false;
    }

    console.log('✅ Supabaseに正常に接続しました');
    return true;
  } catch (err) {
    console.error('❌ Supabase接続テストでエラー:', err);
    return false;
  }
};
