/**
 * アプリケーション設定ファイル
 */

// Google Apps Script のウェブアプリURL
// GOOGLE_SHEETS_SETUP.md の手順に従って取得したURLを設定してください
export const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbww5b5r1XqHjzju3rXug9fnIIwHAyMGczIcGcmT1efY_kgmGRHpO0omrlLSeLYxykk/exec';

// 例:
// export const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbww5b5r1XqHjzju3rXug9fnIIwHAyMGczIcGcmT1efY_kgmGRHpO0omrlLSeLYxykk/exec';

// 使用方法:
// 1. GOOGLE_SHEETS_SETUP.md の手順でGoogle Apps Scriptを設定
// 2. デプロイして取得したウェブアプリURLを上記に貼り付け
// 3. ダッシュボードを再起動（npm run dev）

/**
 * Google Sheets連携が有効かどうかを判定
 * @returns {boolean}
 */
export const isGoogleSheetsEnabled = () => {
  return GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL.length > 0;
};
