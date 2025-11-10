import React, { useState, useEffect } from 'react';
import { Bell, Send, Check, X, Clock, Users, HelpCircle, Edit2, Lock } from 'lucide-react';
import {
  getLineSettings,
  saveLineSettings,
  sendTestMessage
} from '../../utils/lineMessagingApiUtils';

/**
 * LINE Messaging API設定コンポーネント
 */
export const LineNotifySettings = ({
  darkMode,
  teamMembers = [],
  projects = [],
  routineTasks = {}
}) => {
  const [settings, setSettings] = useState(getLineSettings());
  const [originalSettings, setOriginalSettings] = useState(getLineSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showHelp, setShowHelp] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);

  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';

  // トークンをマスク表示する関数
  const maskToken = (token) => {
    if (!token || token.length < 10) return '••••••••••••••••';
    return token.slice(0, 5) + '•'.repeat(token.length - 10) + token.slice(-5);
  };

  // 設定変更ハンドラー
  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setMessage({ type: '', text: '' });
  };

  // メンバー選択ハンドラー
  const handleMemberToggle = (memberName) => {
    setSettings(prev => {
      const selected = prev.selectedMembers.includes(memberName)
        ? prev.selectedMembers.filter(m => m !== memberName)
        : [...prev.selectedMembers, memberName];

      return {
        ...prev,
        selectedMembers: selected
      };
    });
  };

  // 全メンバー選択
  const handleSelectAllMembers = () => {
    setSettings(prev => ({
      ...prev,
      selectedMembers: teamMembers.map(m => m.name)
    }));
  };

  // 全メンバー解除
  const handleDeselectAllMembers = () => {
    setSettings(prev => ({
      ...prev,
      selectedMembers: []
    }));
  };

  // 認証情報の編集を開始
  const handleStartEditCredentials = () => {
    setOriginalSettings({ ...settings });
    setIsEditingCredentials(true);
  };

  // 認証情報の編集をキャンセル
  const handleCancelEditCredentials = () => {
    setSettings(originalSettings);
    setIsEditingCredentials(false);
    setMessage({ type: '', text: '' });
  };

  // 保存
  const handleSave = () => {
    setIsSaving(true);

    if (!settings.channelAccessToken.trim()) {
      setMessage({ type: 'error', text: 'Channel Access Tokenを入力してください' });
      setIsSaving(false);
      return;
    }

    if (!settings.groupId.trim()) {
      setMessage({ type: 'error', text: 'Group IDを入力してください' });
      setIsSaving(false);
      return;
    }

    // 認証情報が変更された場合は確認
    if (isEditingCredentials) {
      const confirmMessage = '認証情報を変更すると、現在の設定が上書きされます。よろしいですか？';
      if (!window.confirm(confirmMessage)) {
        setIsSaving(false);
        return;
      }
    }

    // メンバー未選択の場合は警告を出すが保存は許可
    let warningMessage = '';
    if (settings.enabled && settings.selectedMembers.length === 0) {
      warningMessage = '⚠️ 送信対象メンバーが未選択です。自動送信は実行されません。';
    }

    const success = saveLineSettings(settings);

    if (success) {
      setOriginalSettings({ ...settings });
      setIsEditingCredentials(false);
      if (warningMessage) {
        setMessage({ type: 'success', text: `設定を保存しました。${warningMessage}` });
      } else {
        setMessage({ type: 'success', text: '設定を保存しました' });
      }
    } else {
      setMessage({ type: 'error', text: '設定の保存に失敗しました' });
    }

    setIsSaving(false);

    // 5秒後にメッセージを消す
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  // テスト送信
  const handleTest = async () => {
    if (!settings.channelAccessToken.trim()) {
      setMessage({ type: 'error', text: 'Channel Access Tokenを入力してください' });
      return;
    }

    if (!settings.groupId.trim()) {
      setMessage({ type: 'error', text: 'Group IDを入力してください' });
      return;
    }

    setIsTesting(true);
    setMessage({ type: '', text: '' });

    const memberNames = settings.selectedMembers.length > 0
      ? settings.selectedMembers.join(', ')
      : '全メンバー';

    const result = await sendTestMessage(settings.channelAccessToken, settings.groupId, memberNames);

    if (result.success) {
      setMessage({ type: 'success', text: 'テスト送信に成功しました！LINEグループを確認してください。' });
    } else {
      setMessage({ type: 'error', text: `テスト送信に失敗しました: ${result.error}` });
    }

    setIsTesting(false);

    // 5秒後にメッセージを消す
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  // 手動で日報送信
  const handleManualSend = async () => {
    if (!settings.channelAccessToken.trim()) {
      setMessage({ type: 'error', text: 'Channel Access Tokenを入力してください' });
      return;
    }

    if (!settings.groupId.trim()) {
      setMessage({ type: 'error', text: 'Group IDを入力してください' });
      return;
    }

    if (settings.selectedMembers.length === 0) {
      setMessage({ type: 'error', text: '送信対象のメンバーを選択してください' });
      return;
    }

    setIsTesting(true);
    setMessage({ type: '', text: '' });

    // 日報を生成
    const { generateTeamReport, sendLineMessage } = await import('../../utils/lineMessagingApiUtils');
    const report = generateTeamReport(
      settings.selectedMembers,
      projects,
      routineTasks,
      null // 今日の日付
    );

    // LINE Messaging APIで送信
    const result = await sendLineMessage(settings.channelAccessToken, settings.groupId, report);

    if (result.success) {
      setMessage({ type: 'success', text: '日報を送信しました！LINEグループを確認してください。' });

      // 最終送信日時を更新
      const now = new Date();
      const dateTimeString = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const updatedSettings = {
        ...settings,
        lastSentDate: now.toISOString().split('T')[0],
        lastSentDateTime: dateTimeString
      };
      saveLineSettings(updatedSettings);
      setSettings(updatedSettings);
    } else {
      setMessage({ type: 'error', text: `日報送信に失敗しました: ${result.error}` });
    }

    setIsTesting(false);

    // 5秒後にメッセージを消す
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-500 bg-opacity-10 rounded-lg">
            <Bell size={24} className="text-green-500" />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${textColor}`}>LINE通知設定</h3>
            <p className={`text-sm ${textSecondary} mt-1`}>
              毎日指定時刻にメンバー別の日報をLINEグループに自動送信
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
        >
          <HelpCircle size={20} className={textSecondary} />
        </button>
      </div>

      {/* ヘルプ */}
      {showHelp && (
        <div className={`${cardBg} rounded-lg border p-4`}>
          <h4 className={`font-semibold ${textColor} mb-2`}>LINE Messaging APIの設定方法</h4>
          <ol className={`text-sm ${textSecondary} space-y-2 list-decimal list-inside`}>
            <li>LINE Developers（https://developers.line.biz/）にアクセスしてログイン</li>
            <li>新規プロバイダー作成 → Messaging APIチャネルを作成</li>
            <li>チャネル基本設定から「Channel Access Token」を発行（長期）</li>
            <li>Messaging API設定で「Webhook」を無効化（今回は使用しない）</li>
            <li>LINEアプリで作成したBotを友だち追加 → グループに招待</li>
            <li>Group IDを取得（LINE Developersのコンソールで確認可能）</li>
            <li>Channel Access TokenとGroup IDを下の入力欄に貼り付け</li>
            <li>テスト送信で動作を確認してから有効化してください</li>
            <li>⚠️ 無料枠: 月200通まで（それ以降は課金が発生します）</li>
          </ol>
        </div>
      )}

      {/* メッセージ表示 */}
      {message.text && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-500 bg-opacity-10 border border-green-500 text-green-500'
              : 'bg-red-500 bg-opacity-10 border border-red-500 text-red-500'
          }`}
        >
          {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 有効/無効トグル */}
      <div className={`${cardBg} rounded-lg border p-4`}>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className={`font-semibold ${textColor}`}>LINE通知を有効化</div>
            <div className={`text-sm ${textSecondary} mt-1`}>
              毎日自動で日報を送信します（ブラウザが開いている必要があります）
            </div>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-14 h-8 rounded-full transition-colors ${
                settings.enabled ? 'bg-green-500' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`}
              onClick={() => handleChange('enabled', !settings.enabled)}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.enabled ? 'translate-x-7 translate-y-1' : 'translate-x-1 translate-y-1'
                }`}
              />
            </div>
          </div>
        </label>
      </div>

      {/* 送信時刻 */}
      <div className={`${cardBg} rounded-lg border p-4`}>
        <label className={`block font-semibold ${textColor} mb-2 flex items-center gap-2`}>
          <Clock size={18} />
          送信時刻
        </label>
        <input
          type="time"
          value={settings.scheduledTime}
          onChange={(e) => handleChange('scheduledTime', e.target.value)}
          className={`px-4 py-3 rounded-lg border ${inputBg} ${textColor} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
        />
        <p className={`text-xs ${textSecondary} mt-2`}>
          毎日この時刻に日報が自動送信されます（デフォルト: 18:30）
        </p>
      </div>

      {/* 送信対象メンバー */}
      <div className={`${cardBg} rounded-lg border p-4`}>
        <div className="flex items-center justify-between mb-4">
          <label className={`font-semibold ${textColor} flex items-center gap-2`}>
            <Users size={18} />
            送信対象メンバー <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAllMembers}
              className={`text-sm px-3 py-1 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} transition-colors`}
            >
              全選択
            </button>
            <button
              onClick={handleDeselectAllMembers}
              className={`text-sm px-3 py-1 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} transition-colors`}
            >
              全解除
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {teamMembers.map((member) => (
            <label
              key={member.name}
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                settings.selectedMembers.includes(member.name)
                  ? 'bg-green-500 bg-opacity-10 border-green-500'
                  : darkMode
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
              }`}
            >
              <input
                type="checkbox"
                checked={settings.selectedMembers.includes(member.name)}
                onChange={() => handleMemberToggle(member.name)}
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className={textColor}>{member.name}</span>
            </label>
          ))}
        </div>

        {settings.selectedMembers.length > 0 && (
          <p className={`text-sm ${textSecondary} mt-3`}>
            {settings.selectedMembers.length}人のメンバーが選択されています
          </p>
        )}
      </div>

      {/* アクションボタン */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={isTesting || !settings.channelAccessToken || !settings.groupId}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 ${
              darkMode
                ? 'border-green-500 text-green-400 hover:bg-green-500 hover:bg-opacity-10'
                : 'border-green-500 text-green-600 hover:bg-green-50'
            } font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Send size={20} />
            {isTesting ? '送信中...' : 'テスト送信'}
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={20} />
            {isSaving ? '保存中...' : '設定を保存'}
          </button>
        </div>

        {/* 手動で日報送信ボタン */}
        <button
          onClick={handleManualSend}
          disabled={isTesting || !settings.channelAccessToken || !settings.groupId || settings.selectedMembers.length === 0}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 ${
            darkMode
              ? 'border-blue-500 text-blue-400 hover:bg-blue-500 hover:bg-opacity-10'
              : 'border-blue-500 text-blue-600 hover:bg-blue-50'
          } font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Send size={20} />
          {isTesting ? '送信中...' : '今すぐ日報を送信'}
        </button>
        <p className={`text-xs ${textSecondary} text-center`}>
          選択したメンバーの日報を今すぐLINEに送信します
        </p>
      </div>

      {/* 最終送信日時 */}
      {(settings.lastSentDateTime || settings.lastSentDate) && (
        <div className={`text-sm ${textSecondary} text-center`}>
          最終送信: {settings.lastSentDateTime || settings.lastSentDate}
        </div>
      )}

      {/* 認証情報セクション */}
      <div className={`${cardBg} rounded-lg border-2 ${isEditingCredentials ? 'border-yellow-500' : 'border-gray-300 dark:border-gray-600'} p-4`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock size={20} className={isEditingCredentials ? 'text-yellow-500' : 'text-gray-400'} />
            <h4 className={`font-bold ${textColor}`}>認証情報</h4>
            {!isEditingCredentials && settings.channelAccessToken && (
              <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                設定済み
              </span>
            )}
          </div>
          {!isEditingCredentials ? (
            <button
              onClick={handleStartEditCredentials}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} transition-colors`}
            >
              <Edit2 size={16} />
              編集
            </button>
          ) : (
            <button
              onClick={handleCancelEditCredentials}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-gray-500 hover:bg-gray-600 text-white transition-colors`}
            >
              <X size={16} />
              キャンセル
            </button>
          )}
        </div>

        {isEditingCredentials && (
          <div className="mb-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ 認証情報を変更する場合は、保存時に確認ダイアログが表示されます
            </p>
          </div>
        )}

        {/* Channel Access Token */}
        <div className="mb-4">
          <label className={`block font-semibold ${textColor} mb-2`}>
            Channel Access Token <span className="text-red-500">*</span>
          </label>
          {!isEditingCredentials && settings.channelAccessToken ? (
            <div className={`w-full px-4 py-3 rounded-lg border ${inputBg} ${textSecondary} font-mono text-sm flex items-center justify-between`}>
              <span>{maskToken(settings.channelAccessToken)}</span>
              <Lock size={16} className="text-gray-400" />
            </div>
          ) : (
            <input
              type="text"
              value={settings.channelAccessToken}
              onChange={(e) => handleChange('channelAccessToken', e.target.value)}
              placeholder="LINE Developersで発行した長期トークンを入力"
              className={`w-full px-4 py-3 rounded-lg border ${inputBg} ${textColor} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              disabled={!isEditingCredentials}
            />
          )}
          <p className={`text-xs ${textSecondary} mt-2`}>
            トークンは暗号化されて保存されます。外部に公開しないでください。
          </p>
        </div>

        {/* Group ID */}
        <div>
          <label className={`block font-semibold ${textColor} mb-2`}>
            Group ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={settings.groupId}
            onChange={(e) => handleChange('groupId', e.target.value)}
            placeholder="C1234567890abcdef1234567890abcdef (Cから始まる)"
            className={`w-full px-4 py-3 rounded-lg border ${inputBg} ${textColor} focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={!isEditingCredentials}
          />
          <p className={`text-xs ${textSecondary} mt-2`}>
            送信先のLINEグループのID。「C」から始まる英数字の文字列です。
          </p>
        </div>
      </div>
    </div>
  );
};
