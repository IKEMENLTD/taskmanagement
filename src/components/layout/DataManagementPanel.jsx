import React, { useState } from 'react';
import { Download, Upload, Database, CheckCircle, AlertCircle, X, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  exportAllData,
  importAllData,
  deleteAllUserData,
  backupToJSON,
  jsonToBackup,
  downloadFile
} from '../../utils/dataBackupUtils';
import { bulkUpdateTaskStartDates } from '../../utils/projectUtils';

/**
 * データ管理パネルコンポーネント（Supabaseバックアップ対応）
 */
export const DataManagementPanel = ({
  darkMode,
  onDataRefresh
}) => {
  const { user } = useAuth();
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  const [importMode, setImportMode] = useState('replace'); // replace, merge
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // バックアップのエクスポート
  const handleExportBackup = async () => {
    if (!user) {
      setImportStatus({ type: 'error', message: 'ログインしてください' });
      return;
    }

    setIsProcessing(true);
    setImportStatus({ type: 'info', message: 'データをエクスポート中...' });

    try {
      const { data, error } = await exportAllData(user.id);

      if (error) {
        throw new Error(error.message || 'エクスポートに失敗しました');
      }

      const jsonString = backupToJSON(data);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(jsonString, `backup_${timestamp}.json`, 'application/json');

      setImportStatus({
        type: 'success',
        message: `バックアップを作成しました（プロジェクト: ${data.projects?.length || 0}件、タスク: ${data.projects?.reduce((sum, p) => sum + (p.tasks?.length || 0), 0) || 0}件）`
      });
    } catch (error) {
      console.error('エクスポートエラー:', error);
      setImportStatus({ type: 'error', message: `エラー: ${error.message}` });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  // バックアップのインポート
  const handleImportFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const data = jsonToBackup(content);

        // バックアップデータの検証
        if (!data.version || !data.projects) {
          throw new Error('無効なバックアップファイルです');
        }

        setImportPreviewData(data);
        setShowImportPreview(true);
        setImportStatus({ type: 'success', message: 'ファイルを読み込みました。プレビューを確認してください。' });
      } catch (error) {
        setImportStatus({ type: 'error', message: `エラー: ${error.message}` });
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  // インポート実行
  const handleConfirmImport = async () => {
    if (!importPreviewData || !user) return;

    setIsProcessing(true);
    setShowImportPreview(false);
    setImportStatus({ type: 'info', message: 'データをインポート中...' });

    try {
      const { data: results, error } = await importAllData(user.id, importPreviewData, importMode);

      if (error) {
        throw new Error(error.message || 'インポートに失敗しました');
      }

      setImportStatus({
        type: 'success',
        message: `インポートが完了しました（プロジェクト: ${results.projects}件、タスク: ${results.tasks}件、チームメンバー: ${results.teamMembers}件、ルーティン: ${results.routines}件）`
      });

      setImportPreviewData(null);

      // データを再読み込み
      if (onDataRefresh) {
        setTimeout(() => {
          onDataRefresh();
        }, 1000);
      }
    } catch (error) {
      console.error('インポートエラー:', error);
      setImportStatus({ type: 'error', message: `エラー: ${error.message}` });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  // 全データ削除
  const handleDeleteAllData = async () => {
    if (!user) {
      setImportStatus({ type: 'error', message: 'ログインしてください' });
      return;
    }

    const password = window.prompt(
      '⚠️ 警告：全てのデータが完全に削除されます。\n\nこの操作は取り消せません。続行する場合はパスワードを入力してください。'
    );

    if (password !== 'Akutu4256') {
      setImportStatus({ type: 'error', message: 'パスワードが正しくありません' });
      setTimeout(() => setImportStatus(null), 3000);
      return;
    }

    setIsProcessing(true);
    setImportStatus({ type: 'info', message: 'データを削除中...' });

    try {
      const { error } = await deleteAllUserData(user.id);

      if (error) {
        throw new Error(error.message || '削除に失敗しました');
      }

      setImportStatus({ type: 'success', message: '全データを削除しました' });

      // データを再読み込み
      if (onDataRefresh) {
        setTimeout(() => {
          onDataRefresh();
        }, 1000);
      }
    } catch (error) {
      console.error('削除エラー:', error);
      setImportStatus({ type: 'error', message: `エラー: ${error.message}` });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  // 全タスクの開始日を一括更新
  const handleBulkUpdateStartDates = async () => {
    if (!user) {
      setImportStatus({ type: 'error', message: 'ログインしてください' });
      return;
    }

    const confirmed = window.confirm(
      '開始日が設定されていない全てのタスクの開始日を「2025-11-01」に設定します。\n\nよろしいですか？'
    );

    if (!confirmed) {
      return;
    }

    setIsProcessing(true);
    setImportStatus({ type: 'info', message: 'タスクの開始日を更新中...' });

    try {
      const { data, error } = await bulkUpdateTaskStartDates('2025-11-01');

      if (error) {
        throw new Error(error.message || '更新に失敗しました');
      }

      if (data.updated === 0) {
        setImportStatus({
          type: 'success',
          message: '全てのタスクに開始日が既に設定されています'
        });
      } else {
        setImportStatus({
          type: 'success',
          message: `${data.updated}個のタスクの開始日を2025-11-01に設定しました（全${data.total}個中）`
        });
      }

      // データを再読み込み
      if (onDataRefresh) {
        setTimeout(() => {
          onDataRefresh();
        }, 1000);
      }
    } catch (error) {
      console.error('一括更新エラー:', error);
      setImportStatus({ type: 'error', message: `エラー: ${error.message}` });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* ステータスメッセージ */}
      {importStatus && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          importStatus.type === 'success'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
            : importStatus.type === 'error'
            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
        }`}>
          {importStatus.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="flex-1">{importStatus.message}</span>
          <button
            onClick={() => setImportStatus(null)}
            className="hover:opacity-70"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* データベースバックアップセクション */}
      <div className={`${cardBg} rounded-xl p-6 border`}>
        <h3 className={`text-lg font-bold ${textColor} mb-4 flex items-center gap-2`}>
          <Database size={20} />
          データベースバックアップ
        </h3>
        <p className={`text-sm ${textSecondary} mb-4`}>
          Supabaseデータベースの全データをバックアップ・復元できます
        </p>

        {/* エクスポート */}
        <div className="space-y-4">
          <div>
            <h4 className={`text-sm font-semibold ${textColor} mb-2`}>📥 バックアップを作成</h4>
            <button
              onClick={handleExportBackup}
              disabled={isProcessing || !user}
              className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Download size={18} />
              全データをエクスポート
            </button>
            <p className={`text-xs ${textSecondary} mt-2`}>
              プロジェクト、タスク、チームメンバー、ルーティン、設定を含む全データをJSON形式でダウンロードします
            </p>
          </div>

          {/* インポート */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className={`text-sm font-semibold ${textColor} mb-2`}>📤 バックアップから復元</h4>

            {/* インポートモード選択 */}
            <div className="mb-3">
              <label className={`block text-sm font-medium ${textColor} mb-2`}>復元モード</label>
              <select
                value={importMode}
                onChange={(e) => setImportMode(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500`}
                disabled={isProcessing}
              >
                <option value="replace">🔄 置換（既存データを削除してから復元）</option>
                <option value="merge">🔀 マージ（既存データに追加・更新）</option>
              </select>
            </div>

            <label className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white transition-all flex items-center gap-2 cursor-pointer inline-flex ${isProcessing || !user ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Upload size={18} />
              バックアップファイルを選択
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
                disabled={isProcessing || !user}
              />
            </label>
            <p className={`text-xs ${textSecondary} mt-2`}>
              以前にエクスポートしたバックアップファイル（JSON）を選択して復元します
            </p>
          </div>
        </div>
      </div>

      {/* タスク一括更新セクション */}
      <div className={`${cardBg} rounded-xl p-6 border`}>
        <h3 className={`text-lg font-bold ${textColor} mb-4 flex items-center gap-2`}>
          <Calendar size={20} />
          タスク一括設定
        </h3>
        <p className={`text-sm ${textSecondary} mb-4`}>
          開始日が未設定のタスクに一括で開始日を設定できます
        </p>

        <button
          onClick={handleBulkUpdateStartDates}
          disabled={isProcessing || !user}
          className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Calendar size={18} />
          全タスクの開始日を2025-11-01に設定
        </button>
        <p className={`text-xs ${textSecondary} mt-2`}>
          開始日が未設定のタスクに対してのみ、開始日を2025年11月1日に設定します（既に設定済みのタスクは変更されません）
        </p>
      </div>

      {/* データ削除セクション */}
      <div className={`${cardBg} rounded-xl p-6 border border-red-300 dark:border-red-700`}>
        <h3 className={`text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2`}>
          <Trash2 size={20} />
          危険な操作
        </h3>
        <p className={`text-sm ${textSecondary} mb-4`}>
          ⚠️ 以下の操作は取り消すことができません。必ずバックアップを取ってから実行してください。
        </p>

        <button
          onClick={handleDeleteAllData}
          disabled={isProcessing || !user}
          className={`px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Trash2 size={18} />
          全データを削除
        </button>
        <p className={`text-xs text-red-600 dark:text-red-400 mt-2`}>
          プロジェクト、タスク、チームメンバー、ルーティンを含む全データが完全に削除されます
        </p>
      </div>

      {/* インポートプレビューモーダル */}
      {showImportPreview && importPreviewData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
          onClick={() => setShowImportPreview(false)}
        >
          <div
            className={`${cardBg} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <div>
                <h3 className={`text-2xl font-bold ${textColor}`}>インポートプレビュー</h3>
                <p className={`text-sm ${textSecondary} mt-1`}>
                  インポートする内容を確認してください
                </p>
              </div>
              <button onClick={() => setShowImportPreview(false)} className={`${textSecondary} hover:${textColor} transition-colors`}>
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* サマリー */}
              <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-4`}>
                <h4 className={`text-sm font-semibold ${textColor} mb-2`}>📊 データサマリー</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className={textSecondary}>バックアップ日時:</div>
                  <div className={textColor}>{new Date(importPreviewData.exportDate).toLocaleString('ja-JP')}</div>

                  <div className={textSecondary}>プロジェクト:</div>
                  <div className={textColor}>{importPreviewData.projects?.length || 0} 件</div>

                  <div className={textSecondary}>タスク:</div>
                  <div className={textColor}>
                    {importPreviewData.projects?.reduce((sum, p) => sum + (p.tasks?.length || 0), 0) || 0} 件
                  </div>

                  <div className={textSecondary}>チームメンバー:</div>
                  <div className={textColor}>{importPreviewData.teamMembers?.length || 0} 件</div>

                  <div className={textSecondary}>ルーティン:</div>
                  <div className={textColor}>{importPreviewData.routineTasks?.length || 0} 件</div>
                </div>
              </div>

              {/* 詳細データ */}
              <div>
                <h4 className={`text-sm font-semibold ${textColor} mb-2`}>📄 詳細データ</h4>
                <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-4 font-mono text-xs overflow-auto max-h-64`}>
                  <pre className={textColor}>{JSON.stringify(importPreviewData, null, 2)}</pre>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleConfirmImport}
                  disabled={isProcessing}
                  className={`flex-1 px-6 py-3 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  ✓ インポートを実行（{importMode === 'replace' ? '置換' : 'マージ'}）
                </button>
                <button
                  onClick={() => setShowImportPreview(false)}
                  disabled={isProcessing}
                  className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} font-semibold transition-all disabled:opacity-50`}
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
