import { supabase } from '../lib/supabase';

/**
 * テーマ管理ユーティリティ
 */

/**
 * 利用可能なテーマプリセット
 */
export const themePresets = {
  default: {
    id: 'default',
    name: 'デフォルト',
    description: '標準の青ベースのテーマ',
    colors: {
      primary: '#3b82f6',      // blue-500
      primaryHover: '#2563eb', // blue-600
      primaryLight: '#60a5fa', // blue-400
      secondary: '#8b5cf6',    // violet-500
      accent: '#06b6d4',       // cyan-500
      success: '#10b981',      // green-500
      warning: '#f59e0b',      // amber-500
      error: '#ef4444',        // red-500
      gradient: 'from-blue-500 via-purple-500 to-pink-500'
    },
    icon: '💙'
  },
  green: {
    id: 'green',
    name: 'グリーン',
    description: '自然で落ち着いた緑ベースのテーマ',
    colors: {
      primary: '#10b981',      // green-500
      primaryHover: '#059669', // green-600
      primaryLight: '#34d399', // green-400
      secondary: '#14b8a6',    // teal-500
      accent: '#22c55e',       // green-500
      success: '#84cc16',      // lime-500
      warning: '#f59e0b',      // amber-500
      error: '#ef4444',        // red-500
      gradient: 'from-green-500 via-teal-500 to-cyan-500'
    },
    icon: '💚'
  },
  purple: {
    id: 'purple',
    name: 'パープル',
    description: 'エレガントな紫ベースのテーマ',
    colors: {
      primary: '#8b5cf6',      // violet-500
      primaryHover: '#7c3aed', // violet-600
      primaryLight: '#a78bfa', // violet-400
      secondary: '#a855f7',    // purple-500
      accent: '#d946ef',       // fuchsia-500
      success: '#10b981',      // green-500
      warning: '#f59e0b',      // amber-500
      error: '#ef4444',        // red-500
      gradient: 'from-purple-500 via-pink-500 to-rose-500'
    },
    icon: '💜'
  },
  orange: {
    id: 'orange',
    name: 'オレンジ',
    description: 'エネルギッシュなオレンジベースのテーマ',
    colors: {
      primary: '#f97316',      // orange-500
      primaryHover: '#ea580c', // orange-600
      primaryLight: '#fb923c', // orange-400
      secondary: '#f59e0b',    // amber-500
      accent: '#fbbf24',       // amber-400
      success: '#10b981',      // green-500
      warning: '#f59e0b',      // amber-500
      error: '#ef4444',        // red-500
      gradient: 'from-orange-500 via-amber-500 to-yellow-500'
    },
    icon: '🧡'
  },
  pink: {
    id: 'pink',
    name: 'ピンク',
    description: '優しいピンクベースのテーマ',
    colors: {
      primary: '#ec4899',      // pink-500
      primaryHover: '#db2777', // pink-600
      primaryLight: '#f472b6', // pink-400
      secondary: '#f43f5e',    // rose-500
      accent: '#fb7185',       // rose-400
      success: '#10b981',      // green-500
      warning: '#f59e0b',      // amber-500
      error: '#ef4444',        // red-500
      gradient: 'from-pink-500 via-rose-500 to-red-500'
    },
    icon: '💗'
  },
  red: {
    id: 'red',
    name: 'レッド',
    description: '情熱的な赤ベースのテーマ',
    colors: {
      primary: '#ef4444',      // red-500
      primaryHover: '#dc2626', // red-600
      primaryLight: '#f87171', // red-400
      secondary: '#f43f5e',    // rose-500
      accent: '#fb7185',       // rose-400
      success: '#10b981',      // green-500
      warning: '#f59e0b',      // amber-500
      error: '#dc2626',        // red-600
      gradient: 'from-red-500 via-orange-500 to-yellow-500'
    },
    icon: '❤️'
  }
};

/**
 * テーマIDからテーマオブジェクトを取得
 * @param {string} themeId - テーマID
 * @returns {object} テーマオブジェクト
 */
export const getTheme = (themeId) => {
  return themePresets[themeId] || themePresets.default;
};

/**
 * すべてのテーマを配列で取得
 * @returns {Array} テーマの配列
 */
export const getAllThemes = () => {
  return Object.values(themePresets);
};

/**
 * テーマカラーをCSSカスタムプロパティとして適用
 * @param {string} themeId - テーマID
 */
export const applyThemeColors = (themeId) => {
  const theme = getTheme(themeId);
  const root = document.documentElement;

  // CSSカスタムプロパティとして色を設定
  Object.entries(theme.colors).forEach(([key, value]) => {
    if (key !== 'gradient') {
      root.style.setProperty(`--theme-${key}`, value);
    }
  });

  console.log(`🎨 テーマを適用しました: ${theme.name}`);
};

/**
 * テーマIDが有効かチェック
 * @param {string} themeId - テーマID
 * @returns {boolean}
 */
export const isValidTheme = (themeId) => {
  return themeId in themePresets;
};

/**
 * ユーザーのテーマを取得
 * @param {string} userId - ユーザーID
 * @returns {Promise<string>} - テーマID
 */
export const getUserTheme = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('theme')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('テーマ取得エラー:', error);
      return 'default';
    }

    const themeId = data?.theme || 'default';
    return isValidTheme(themeId) ? themeId : 'default';
  } catch (err) {
    console.error('テーマ取得エラー:', err);
    return 'default';
  }
};

/**
 * ユーザーのテーマを更新
 * @param {string} userId - ユーザーID
 * @param {string} themeId - テーマID
 * @returns {Promise<{data: any, error: any}>}
 */
export const updateUserTheme = async (userId, themeId) => {
  try {
    // テーマIDの検証
    if (!isValidTheme(themeId)) {
      return {
        data: null,
        error: new Error(`無効なテーマID: ${themeId}`)
      };
    }

    const { data, error } = await supabase
      .from('user_settings')
      .update({ theme: themeId })
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('テーマ更新エラー:', error);
      return { data: null, error };
    }

    console.log(`🎨 テーマを更新しました: ${themeId}`);
    return { data, error: null };
  } catch (err) {
    console.error('テーマ更新エラー:', err);
    return { data: null, error: err };
  }
};
