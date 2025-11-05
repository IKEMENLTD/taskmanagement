import { supabase } from '../lib/supabase';

/**
 * ダッシュボード設定のデフォルト値
 */
export const defaultDashboardSettings = {
  widgets: {
    statsCards: true,
    teamStats: true,
    routineList: true,
    filters: true
  },
  defaultView: 'routine',
  defaultMember: 'team'
};

/**
 * ダッシュボード設定を取得
 * @param {string} userId - ユーザーID
 * @returns {Promise<{data: Object, error: any}>}
 */
export const getDashboardSettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('dashboard_settings')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('ダッシュボード設定取得エラー:', error);
      return { data: defaultDashboardSettings, error: null };
    }

    return {
      data: data?.dashboard_settings || defaultDashboardSettings,
      error: null
    };
  } catch (err) {
    console.error('ダッシュボード設定取得エラー:', err);
    return { data: defaultDashboardSettings, error: err };
  }
};

/**
 * ダッシュボード設定を保存
 * @param {string} userId - ユーザーID
 * @param {Object} settings - ダッシュボード設定
 * @returns {Promise<{data: any, error: any}>}
 */
export const saveDashboardSettings = async (userId, settings) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .update({
        dashboard_settings: settings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('ダッシュボード設定保存エラー:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('ダッシュボード設定保存エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * ウィジェット表示設定を更新
 * @param {string} userId - ユーザーID
 * @param {string} widgetName - ウィジェット名
 * @param {boolean} visible - 表示するかどうか
 * @returns {Promise<{data: any, error: any}>}
 */
export const updateWidgetVisibility = async (userId, widgetName, visible) => {
  try {
    // 現在の設定を取得
    const { data: currentSettings } = await getDashboardSettings(userId);

    // ウィジェット設定を更新
    const updatedSettings = {
      ...currentSettings,
      widgets: {
        ...currentSettings.widgets,
        [widgetName]: visible
      }
    };

    // 保存
    return await saveDashboardSettings(userId, updatedSettings);
  } catch (err) {
    console.error('ウィジェット表示設定更新エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * デフォルトビュー設定を更新
 * @param {string} userId - ユーザーID
 * @param {string} viewName - ビュー名
 * @returns {Promise<{data: any, error: any}>}
 */
export const updateDefaultView = async (userId, viewName) => {
  try {
    const { data: currentSettings } = await getDashboardSettings(userId);

    const updatedSettings = {
      ...currentSettings,
      defaultView: viewName
    };

    return await saveDashboardSettings(userId, updatedSettings);
  } catch (err) {
    console.error('デフォルトビュー設定更新エラー:', err);
    return { data: null, error: err };
  }
};

/**
 * デフォルトメンバー設定を更新
 * @param {string} userId - ユーザーID
 * @param {string} memberName - メンバー名
 * @returns {Promise<{data: any, error: any}>}
 */
export const updateDefaultMember = async (userId, memberName) => {
  try {
    const { data: currentSettings } = await getDashboardSettings(userId);

    const updatedSettings = {
      ...currentSettings,
      defaultMember: memberName
    };

    return await saveDashboardSettings(userId, updatedSettings);
  } catch (err) {
    console.error('デフォルトメンバー設定更新エラー:', err);
    return { data: null, error: err };
  }
};
