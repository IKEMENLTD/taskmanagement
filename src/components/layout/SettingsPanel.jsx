import React, { useState, useEffect } from 'react';
import { X, Bell, Database, Palette } from 'lucide-react';
import { DataManagementPanel } from './DataManagementPanel';
import { NotificationSettings } from '../settings/NotificationSettings';
import { LineNotifySettings } from '../settings/LineNotifySettings';
import { useAuth } from '../../contexts/AuthContext';
import { getAllThemes, updateUserTheme } from '../../utils/themeUtils';

/**
 * 設定パネルコンポーネント
 * @param {Function} onClose - パネルを閉じるハンドラー
 * @param {boolean} darkMode - ダークモードフラグ
 * @param {Array} projects - プロジェクト一覧
 * @param {Function} setProjects - プロジェクト更新関数
 * @param {Array} teamMembers - チームメンバー一覧
 * @param {Function} setTeamMembers - チームメンバー更新関数
 * @param {Object} routineTasks - ルーティンタスク一覧
 * @param {Function} setRoutineTasks - ルーティンタスク更新関数
 * @param {Array} routineCategories - ルーティンカテゴリー一覧
 * @param {Function} setRoutineCategories - ルーティンカテゴリー更新関数
 * @param {Date} currentTime - 現在時刻
 */
export const SettingsPanel = ({
  onClose,
  darkMode = false,
  projects = [],
  setProjects,
  teamMembers = [],
  setTeamMembers,
  routineTasks = {},
  setRoutineTasks,
  routineCategories = [],
  setRoutineCategories,
  currentTime = new Date()
}) => {
  // 認証情報
  const { user, theme, setTheme } = useAuth();

  // タブ管理
  const [activeTab, setActiveTab] = useState('data'); // data, settings, line

  // 通知設定
  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = localStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : {
      enabled: false,
      taskDueReminder: true,
      routineReminder: true,
      projectDeadline: true,
      reminderTime: 60 // 分前
    };
  });

  // 通知設定を保存
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  // テーマ変更ハンドラー
  const handleThemeChange = async (newThemeId) => {
    if (!user) return;

    // UIに即座に反映
    setTheme(newThemeId);

    // データベースに保存
    const { error } = await updateUserTheme(user.id, newThemeId);
    if (error) {
      console.error('テーマ保存エラー:', error);
      alert('テーマの保存に失敗しました');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`${cardBg} rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden border flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${textColor}`}>設定</h2>
            <button
              onClick={onClose}
              className={`${textSecondary} hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-2`}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* タブ */}
        <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} px-6 flex gap-1`}>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'data'
                ? 'border-theme-primary text-theme-primary'
                : `border-transparent ${textSecondary} hover:text-gray-700 dark:hover:text-gray-300`
            }`}
          >
            <Database size={18} className="inline mr-2" />
            データ管理
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'settings'
                ? 'border-theme-primary text-theme-primary'
                : `border-transparent ${textSecondary} hover:text-gray-700 dark:hover:text-gray-300`
            }`}
          >
            <Bell size={18} className="inline mr-2" />
            その他設定
          </button>
          <button
            onClick={() => setActiveTab('line')}
            className={`px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === 'line'
                ? 'border-theme-primary text-theme-primary'
                : `border-transparent ${textSecondary} hover:text-gray-700 dark:hover:text-gray-300`
            }`}
          >
            <Bell size={18} className="inline mr-2" />
            LINE通知
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'data' && (
            <DataManagementPanel
              projects={projects}
              setProjects={setProjects}
              teamMembers={teamMembers}
              setTeamMembers={setTeamMembers}
              routineTasks={routineTasks}
              setRoutineTasks={setRoutineTasks}
              routineCategories={routineCategories}
              setRoutineCategories={setRoutineCategories}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'settings' && (
            <>
              {/* 通知設定 */}
              <NotificationSettings
                settings={notificationSettings}
                onSettingsChange={setNotificationSettings}
                darkMode={darkMode}
              />

              {/* テーマ選択 */}
              <div>
                <h3 className={`text-lg font-semibold ${textColor} mb-4 flex items-center gap-2`}>
                  <Palette size={20} />
                  テーマ選択
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {getAllThemes().map((themeOption) => (
                    <button
                      key={themeOption.id}
                      onClick={() => handleThemeChange(themeOption.id)}
                      className={`${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg p-4 text-left transition-all border-2 ${
                        theme === themeOption.id
                          ? 'border-theme-primary'
                          : darkMode ? 'border-gray-600' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{themeOption.icon}</span>
                          <div>
                            <div className={`font-semibold ${textColor}`}>{themeOption.name}</div>
                            {theme === themeOption.id && (
                              <span className="text-xs px-2 py-0.5 rounded btn-primary text-white">
                                使用中
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`text-xs ${textSecondary} mb-2`}>
                        {themeOption.description}
                      </div>
                      <div className="flex gap-1">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: themeOption.colors.primary }}
                          title="Primary"
                        />
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: themeOption.colors.secondary }}
                          title="Secondary"
                        />
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: themeOption.colors.accent }}
                          title="Accent"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'line' && (
            <LineNotifySettings
              darkMode={darkMode}
              teamMembers={teamMembers}
              projects={projects}
              routineTasks={routineTasks}
            />
          )}
        </div>

        {/* フッター */}
        <div className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`w-full px-6 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} py-2 rounded-lg transition-colors font-medium`}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
