/**
 * Google Sheets API 連携ユーティリティ
 * Google Apps Script経由でスプレッドシートと連携
 */

// 設定ファイルからURLをインポート
// GOOGLE_APPS_SCRIPT_URL を src/config.js で設定してください
let SCRIPT_URL = '';

/**
 * Google Apps Script のURLを設定
 * @param {string} url - ウェブアプリのURL
 */
export const setScriptUrl = (url) => {
  SCRIPT_URL = url;
};

/**
 * Google Apps Script のURLを取得
 */
export const getScriptUrl = () => {
  return SCRIPT_URL;
};

/**
 * タイムアウト付きfetch
 * @param {string} url - リクエストURL
 * @param {Object} options - fetchオプション
 * @param {number} timeout - タイムアウト（ミリ秒）
 * @returns {Promise} レスポンス
 */
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('リクエストがタイムアウトしました。ネットワーク接続を確認してください。');
    }
    throw error;
  }
};

/**
 * リトライ付きでGoogle Apps Scriptにリクエストを送信
 * @param {string} action - アクション名
 * @param {Object} params - パラメータ
 * @param {number} retries - リトライ回数
 * @returns {Promise} レスポンスデータ
 */
const callGoogleScript = async (action, params = {}, retries = 3) => {
  if (!SCRIPT_URL) {
    throw new Error('❌ Google Apps Script URL が設定されていません。\n\n設定パネルから「Google Sheets連携設定」でURLを設定してください。');
  }

  // ネットワーク接続チェック
  if (!navigator.onLine) {
    throw new Error('❌ ネットワーク接続がありません。\n\nインターネット接続を確認してください。');
  }

  let lastError;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // URLパラメータを構築
      const urlParams = new URLSearchParams({
        action,
        ...params
      });

      const url = `${SCRIPT_URL}?${urlParams.toString()}`;

      console.log(`Google Sheets API呼び出し (試行 ${attempt + 1}/${retries}):`, action);

      const response = await fetchWithTimeout(url, {
        method: 'GET',
        mode: 'cors',
      }, 10000);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('❌ Google Apps Script URLが見つかりません。\n\n設定パネルで正しいURLを確認してください。');
        } else if (response.status === 403) {
          throw new Error('❌ Google Sheets へのアクセスが拒否されました。\n\nGoogle Apps Script の共有設定を「リンクを知っている全員」に設定してください。');
        } else if (response.status >= 500) {
          throw new Error(`❌ Google のサーバーでエラーが発生しました（${response.status}）。\n\nしばらく待ってから再度お試しください。`);
        } else {
          throw new Error(`❌ HTTP エラー: ${response.status}`);
        }
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(`❌ Google Sheets API エラー: ${data.error || '不明なエラー'}`);
      }

      console.log(`✅ Google Sheets API成功:`, action);
      return data.data;

    } catch (error) {
      lastError = error;

      // リトライしない条件
      if (
        error.message.includes('URL が設定されていません') ||
        error.message.includes('URLが見つかりません') ||
        error.message.includes('アクセスが拒否されました') ||
        !navigator.onLine
      ) {
        console.error('Google Sheets API Error (リトライなし):', error.message);
        throw error;
      }

      // リトライする場合
      if (attempt < retries - 1) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000); // 指数バックオフ（最大5秒）
        console.warn(`Google Sheets API エラー（${attempt + 1}/${retries}回目）。${waitTime}ms後にリトライします...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error('Google Sheets API Error (リトライ回数超過):', error.message);
      }
    }
  }

  // すべてのリトライが失敗した場合
  throw new Error(`❌ Google Sheets API への接続に失敗しました（${retries}回試行）。\n\n${lastError.message}\n\nネットワーク接続とURLの設定を確認してください。`);
};

/**
 * 指定日付のルーティンデータを取得
 * @param {string} date - 日付（YYYY-MM-DD形式）
 * @returns {Promise<Array>} ルーティンデータ
 */
export const getRoutinesFromSheet = async (date) => {
  try {
    const routines = await callGoogleScript('getRoutines', { date });
    return routines || [];
  } catch (error) {
    console.error('Failed to get routines from sheet:', error);
    throw error;
  }
};

/**
 * 指定日付のルーティンデータを保存
 * @param {string} date - 日付（YYYY-MM-DD形式）
 * @param {Array} routines - ルーティンデータ
 * @returns {Promise<boolean>} 成功したかどうか
 */
export const saveRoutinesToSheet = async (date, routines) => {
  try {
    await callGoogleScript('saveRoutines', {
      date,
      data: JSON.stringify(routines)
    });
    return true;
  } catch (error) {
    console.error('Failed to save routines to sheet:', error);
    throw error;
  }
};

/**
 * 設定を取得
 * @returns {Promise<Object>} 設定データ
 */
export const getSettingsFromSheet = async () => {
  try {
    const settings = await callGoogleScript('getSettings');
    return settings || {};
  } catch (error) {
    console.error('Failed to get settings from sheet:', error);
    throw error;
  }
};

/**
 * 設定を保存
 * @param {Object} settings - 設定データ
 * @returns {Promise<boolean>} 成功したかどうか
 */
export const saveSettingsToSheet = async (settings) => {
  try {
    await callGoogleScript('saveSettings', {
      data: JSON.stringify(settings)
    });
    return true;
  } catch (error) {
    console.error('Failed to save settings to sheet:', error);
    throw error;
  }
};

/**
 * すべてのデータを取得（バックアップ用）
 * @returns {Promise<Object>} すべてのデータ
 */
export const getAllDataFromSheet = async () => {
  try {
    const data = await callGoogleScript('getAllData');
    return data;
  } catch (error) {
    console.error('Failed to get all data from sheet:', error);
    throw error;
  }
};

/**
 * LocalStorage から Googleスプレッドシート にデータを同期
 * @param {Object} localData - LocalStorageのデータ
 * @returns {Promise<boolean>} 成功したかどうか
 */
export const syncToGoogleSheets = async (localData) => {
  try {
    console.log('Syncing to Google Sheets...');

    // ルーティンデータを日付ごとに保存
    if (localData.routineTasks) {
      const dates = Object.keys(localData.routineTasks);
      for (const date of dates) {
        await saveRoutinesToSheet(date, localData.routineTasks[date]);
      }
    }

    // 設定を保存
    const settings = {
      darkMode: localData.darkMode,
      sidebarOpen: localData.sidebarOpen,
      selectedView: localData.selectedView,
      filterProject: localData.filterProject,
      filterMember: localData.filterMember,
      routineViewMode: localData.routineViewMode,
      projects: localData.projects,
      teamMembers: localData.teamMembers,
      routineCategories: localData.routineCategories,
      notificationSettings: localData.notificationSettings
    };
    await saveSettingsToSheet(settings);

    console.log('Sync to Google Sheets completed!');
    return true;
  } catch (error) {
    console.error('Failed to sync to Google Sheets:', error);
    throw error;
  }
};

/**
 * Googleスプレッドシート から LocalStorage にデータを同期
 * @returns {Promise<Object>} スプレッドシートのデータ
 */
export const syncFromGoogleSheets = async () => {
  try {
    console.log('Syncing from Google Sheets...');

    const allData = await getAllDataFromSheet();

    // ルーティンデータを日付ごとにグループ化
    const routineTasks = {};
    if (allData.routines) {
      allData.routines.forEach(routine => {
        const date = routine.date;
        if (!routineTasks[date]) {
          routineTasks[date] = [];
        }
        routineTasks[date].push(routine);
      });
    }

    const result = {
      routineTasks,
      ...allData.settings
    };

    console.log('Sync from Google Sheets completed!');
    return result;
  } catch (error) {
    console.error('Failed to sync from Google Sheets:', error);
    throw error;
  }
};

/**
 * 接続テスト
 * @returns {Promise<boolean>} 接続成功したかどうか
 */
export const testConnection = async () => {
  try {
    await callGoogleScript('getSettings');
    console.log('Google Sheets connection test: SUCCESS');
    return true;
  } catch (error) {
    console.error('Google Sheets connection test: FAILED', error);
    return false;
  }
};
