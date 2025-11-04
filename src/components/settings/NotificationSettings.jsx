import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, AlertCircle, Moon, Clock, Trash2 } from 'lucide-react';
import {
  requestNotificationPermission,
  getNotificationPermission,
  sendNotification,
  getNotificationHistory,
  clearNotificationHistory,
  defaultNotificationSettings
} from '../../utils/notificationUtils';

/**
 * 通知設定コンポーネント
 */
export const NotificationSettings = ({ settings, onSettingsChange, darkMode = false }) => {
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  const [permission, setPermission] = useState(getNotificationPermission());
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // 設定の初期化
  const currentSettings = {
    ...defaultNotificationSettings,
    ...settings
  };

  useEffect(() => {
    setHistory(getNotificationHistory());
  }, []);

  // 通知権限をリクエスト
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());

    if (granted) {
      onSettingsChange({ ...currentSettings, enabled: true });
    }
  };

  // テスト通知を送信
  const handleTestNotification = () => {
    sendNotification('🔔 テスト通知', {
      body: '通知が正常に動作しています！',
      tag: 'test-notification'
    });
  };

  // 通知履歴をクリア
  const handleClearHistory = () => {
    if (window.confirm('通知履歴を削除しますか？')) {
      clearNotificationHistory();
      setHistory([]);
    }
  };

  // 設定変更ハンドラー
  const updateSetting = (key, value) => {
    onSettingsChange({
      ...currentSettings,
      [key]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h3 className={`text-xl font-bold ${textColor} mb-2`}>通知設定</h3>
        <p className={textSecondary}>タスク期限やルーティンのリマインダーを設定します</p>
      </div>

      {/* 通知権限 */}
      <div className={`${cardBg} rounded-xl p-6 border`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <CheckCircle className="text-green-500" size={24} />
            ) : (
              <AlertCircle className="text-yellow-500" size={24} />
            )}
            <div>
              <h4 className={`font-semibold ${textColor}`}>ブラウザ通知権限</h4>
              <p className={`text-sm ${textSecondary}`}>
                {permission === 'granted' && '通知が有効です'}
                {permission === 'denied' && '通知が拒否されています（ブラウザ設定から変更してください）'}
                {permission === 'default' && '通知権限をリクエストしてください'}
                {permission === 'unsupported' && 'このブラウザは通知をサポートしていません'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {permission === 'default' && (
              <button
                onClick={handleRequestPermission}
                className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white text-sm transition-all`}
              >
                権限をリクエスト
              </button>
            )}
            {permission === 'granted' && (
              <button
                onClick={handleTestNotification}
                className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textColor} text-sm transition-all`}
              >
                テスト通知
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 通知の有効化 */}
      {permission === 'granted' && (
        <>
          <div className={`${cardBg} rounded-xl p-6 border`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentSettings.enabled ? (
                  <Bell className="text-blue-500" size={24} />
                ) : (
                  <BellOff className={textSecondary} size={24} />
                )}
                <div>
                  <h4 className={`font-semibold ${textColor}`}>通知を有効化</h4>
                  <p className={`text-sm ${textSecondary}`}>
                    リマインダー通知を受け取ります
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentSettings.enabled}
                  onChange={(e) => updateSetting('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600`}></div>
              </label>
            </div>
          </div>

          {/* 詳細設定 */}
          {currentSettings.enabled && (
            <div className={`${cardBg} rounded-xl p-6 border space-y-4`}>
              <h4 className={`font-semibold ${textColor} mb-4`}>詳細設定</h4>

              {/* タスクリマインダー */}
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${textColor}`}>タスク期限リマインダー</div>
                  <div className={`text-sm ${textSecondary}`}>タスクの期限を通知します</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSettings.enableTaskReminders}
                    onChange={(e) => updateSetting('enableTaskReminders', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600`}></div>
                </label>
              </div>

              {/* ルーティンリマインダー */}
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${textColor}`}>ルーティンリマインダー</div>
                  <div className={`text-sm ${textSecondary}`}>ルーティンの開始時刻を通知します</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSettings.enableRoutineReminders}
                    onChange={(e) => updateSetting('enableRoutineReminders', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600`}></div>
                </label>
              </div>

              {/* プロジェクトマイルストーン */}
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${textColor}`}>プロジェクトマイルストーン</div>
                  <div className={`text-sm ${textSecondary}`}>進捗が25%, 50%, 75%, 100%に達したら通知</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSettings.enableProjectMilestones}
                    onChange={(e) => updateSetting('enableProjectMilestones', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600`}></div>
                </label>
              </div>

              {/* タスクリマインダーのタイミング */}
              {currentSettings.enableTaskReminders && (
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-2`}>
                    タスクリマインダーのタイミング
                  </label>
                  <select
                    value={currentSettings.taskReminderTiming}
                    onChange={(e) => updateSetting('taskReminderTiming', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${textColor}`}
                  >
                    <option value="day-before">期限の1日前</option>
                    <option value="day-of">期限当日</option>
                    <option value="both">両方</option>
                  </select>
                </div>
              )}

              {/* サイレント時間帯 */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Moon size={20} className={textSecondary} />
                    <div>
                      <div className={`font-medium ${textColor}`}>サイレント時間帯</div>
                      <div className={`text-sm ${textSecondary}`}>指定時間帯は通知を送信しません</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentSettings.quietHoursEnabled}
                      onChange={(e) => updateSetting('quietHoursEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600`}></div>
                  </label>
                </div>

                {currentSettings.quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-2`}>
                        開始時刻
                      </label>
                      <input
                        type="time"
                        value={currentSettings.quietHoursStart}
                        onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${textColor}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textColor} mb-2`}>
                        終了時刻
                      </label>
                      <input
                        type="time"
                        value={currentSettings.quietHoursEnd}
                        onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} ${textColor}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 通知履歴 */}
          <div className={`${cardBg} rounded-xl p-6 border`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={20} className={textSecondary} />
                <h4 className={`font-semibold ${textColor}`}>通知履歴</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`px-3 py-1 rounded-lg text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${textColor} transition-all`}
                >
                  {showHistory ? '非表示' : '表示'}
                </button>
                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className={`p-2 rounded-lg ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-100'} transition-all`}
                    title="履歴をクリア"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {showHistory && (
              <div>
                {history.length === 0 ? (
                  <div className={`text-center py-8 ${textSecondary}`}>
                    通知履歴はありません
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {history.map((notif, index) => (
                      <div
                        key={notif.id || index}
                        className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      >
                        <div className={`font-medium ${textColor} text-sm`}>{notif.title}</div>
                        <div className={`text-xs ${textSecondary} mt-1`}>{notif.body}</div>
                        <div className={`text-xs ${textSecondary} mt-1`}>
                          {new Date(notif.timestamp).toLocaleString('ja-JP')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
